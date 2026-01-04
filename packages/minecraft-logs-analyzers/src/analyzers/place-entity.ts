import { BaseAnalyzer } from '../base-analyzer.ts';
import type { Direction, LogEntry, AnalyzerConfig, PacketParams, PacketParamsMap } from '../types.ts';

// Entity placement related packets
const PACKETS_TO_LOG = [
  'inventory_transaction', // Entity placement via item_use
  'add_entity', // Entity spawned (boats, minecarts, armor stands)
  'add_item_actor', // Item entity spawned
  'remove_entity', // Entity removed
  'set_entity_data', // Entity metadata updates
  'set_entity_motion', // Entity velocity
  'move_entity', // Entity position
  'move_entity_delta', // Entity position delta
  'player_action', // Interact actions
  'interact', // Entity interaction
  'entity_event', // Entity state events
  'level_sound_event', // Entity sounds
  'text', // Scenario markers
] as const satisfies readonly (keyof PacketParamsMap)[];

/** Union type of all place-entity-related packet names */
export type PlaceEntityPacketName = (typeof PACKETS_TO_LOG)[number];

/** Placeable entity types (partial match - checks if entity_type contains any of these) */
const PLACEABLE_ENTITIES = [
  'boat',
  'minecart',
  'armor_stand',
  'painting',
  'item_frame', // Java naming
  'frame', // Bedrock naming (minecraft:frame, minecraft:glow_frame)
  'ender_crystal',
  'end_crystal',
] as const;

/**
 * Analyzer for entity placement packets.
 *
 * Packets captured:
 * | Direction     | Packet                | Purpose              | Key Fields                                        |
 * |---------------|-----------------------|----------------------|---------------------------------------------------|
 * | Client→Server | inventory_transaction | Place entity         | item_use, click_block (boat/minecart/armor_stand) |
 * | Server→Client | add_entity            | Entity spawned       | entity_type, runtime_id, unique_id, pos           |
 * | Server→Client | add_item_actor        | Item entity spawned  | runtime_id, item, pos                             |
 * | Server→Client | remove_entity         | Entity removed       | entity_id_self (unique_id)                        |
 * | Server→Client | set_entity_data       | Entity metadata      | runtime_entity_id, metadata                       |
 * | Client→Server | interact              | Player interaction   | target_entity_id, action_id                       |
 *
 * Entity placement cycle:
 *   C→S: inventory_transaction {type: "item_use", action: "click_block", item: boat/minecart}
 *   S→C: add_entity {entity_type: "minecraft:boat", pos, runtime_id, unique_id}
 *   S→C: set_entity_data {runtime_entity_id, metadata}
 *
 * Armor stand placement:
 *   C→S: inventory_transaction {type: "item_use", item: armor_stand}
 *   S→C: add_entity {entity_type: "minecraft:armor_stand", pos}
 *   S→C: set_entity_data {pose, equipment slots}
 *
 * Painting/Item Frame placement:
 *   C→S: inventory_transaction {type: "item_use", action: "click_block", face}
 *   S→C: add_entity {entity_type: "minecraft:painting/item_frame", pos}
 *
 * Entity interaction:
 *   C→S: interact {target_entity_id, action_id: "interact"}
 *   S→C: entity_event {runtime_id, event_id}
 *   S→C: set_entity_data {updated metadata}
 */
export class PlaceEntityAnalyzer extends BaseAnalyzer {
  readonly config: AnalyzerConfig<PlaceEntityPacketName> = {
    name: 'place-entity',
    packets: PACKETS_TO_LOG,
  };

  // Track placed entity IDs to filter relevant packets
  private trackedRuntimeIds: Set<string> = new Set();
  private trackedUniqueIds: Set<string> = new Set();

  constructor(basePath: string, registry?: any) {
    super(basePath);
    if (registry) {
      this.registry = registry;
    }
    this.init();
  }

  protected shouldLog(name: string, packet: unknown): boolean {
    if (!this.config.packets.includes(name as PlaceEntityPacketName)) return false;

    // Filter inventory_transaction to only item_use
    if (name === 'inventory_transaction') {
      const p = packet as PacketParams<'inventory_transaction'>;
      return p.transaction?.transaction_type === 'item_use';
    }

    // Filter add_entity to placeable types
    if (name === 'add_entity') {
      const p = packet as PacketParams<'add_entity'>;
      const entityType = String(p.entity_type || '');
      const isPlaceable = PLACEABLE_ENTITIES.some((e) => entityType.includes(e.replace('minecraft:', '')));
      if (isPlaceable) {
        // Track this entity for future packets
        this.trackedRuntimeIds.add(String(p.runtime_id));
        this.trackedUniqueIds.add(String(p.unique_id));
        return true;
      }
      return false;
    }

    // Filter remove_entity to tracked entities
    if (name === 'remove_entity') {
      const entityIdSelf = String((packet as any).entity_id_self);
      if (this.trackedUniqueIds.has(entityIdSelf)) {
        this.trackedUniqueIds.delete(entityIdSelf);
        return true;
      }
      return false;
    }

    // Filter entity_event to tracked entities
    if (name === 'entity_event') {
      const p = packet as PacketParams<'entity_event'>;
      return this.trackedRuntimeIds.has(String(p.runtime_id));
    }

    // Filter set_entity_data to tracked entities
    if (name === 'set_entity_data') {
      const p = packet as PacketParams<'set_entity_data'>;
      return this.trackedRuntimeIds.has(String(p.runtime_entity_id));
    }

    // Filter set_entity_motion to tracked entities
    if (name === 'set_entity_motion') {
      const p = packet as PacketParams<'set_entity_motion'>;
      return this.trackedRuntimeIds.has(String(p.runtime_id));
    }

    // Filter move_entity to tracked entities
    if (name === 'move_entity') {
      const p = packet as any;
      return this.trackedRuntimeIds.has(String(p.runtime_entity_id));
    }

    // Filter move_entity_delta to tracked entities
    if (name === 'move_entity_delta') {
      const p = packet as any;
      return this.trackedRuntimeIds.has(String(p.runtime_entity_id));
    }

    // Filter interact to entity interactions
    if (name === 'interact') {
      const p = packet as any;
      // Log all interactions - target may be a placed entity
      return true;
    }

    // Filter player_action to interaction-related
    if (name === 'player_action') {
      const p = packet as PacketParams<'player_action'>;
      const interactionActions = ['start_item_use_on', 'stop_item_use_on', 'interact_block'];
      return interactionActions.includes(p.action);
    }

    // Filter level_sound_event to entity-related sounds
    if (name === 'level_sound_event') {
      const p = packet as PacketParams<'level_sound_event'>;
      const soundName = String(p.sound_id || '');
      return (
        soundName.includes('boat') ||
        soundName.includes('minecart') ||
        soundName.includes('armor') ||
        soundName.includes('painting') ||
        soundName.includes('frame') ||
        soundName.includes('place') ||
        soundName.includes('break')
      );
    }

    // Log all add_item_actor (dropped items from breaking entities)
    if (name === 'add_item_actor') {
      return true;
    }

    return true;
  }

  protected extractFields(direction: Direction, name: string, packet: unknown): LogEntry | null {
    const base = this.createBaseEntry(direction, name);
    const handler = this.handlers[name as PlaceEntityPacketName];

    if (handler) {
      return handler(base, packet);
    }
    return null;
  }

  // ============================================================================
  // Typed Packet Handlers
  // ============================================================================

  private handlers: {
    [K in PlaceEntityPacketName]: (base: LogEntry, packet: unknown) => LogEntry | null;
  } = {
    player_action: (base, packet) => {
      const p = packet as PacketParams<'player_action'>;
      return {
        ...base,
        action: p.action,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        face: p.face,
      };
    },

    inventory_transaction: (base, packet) => {
      const p = packet as PacketParams<'inventory_transaction'>;

      type TransactionData = {
        action_type?: string;
        trigger_type?: string;
        hotbar_slot?: number;
        held_item?: { network_id?: number; count?: number };
        block_position?: { x: number; y: number; z: number };
        player_pos?: { x: number; y: number; z: number };
        click_pos?: { x: number; y: number; z: number };
        face?: number;
      };
      const txData = p.transaction?.transaction_data as unknown as TransactionData | undefined;

      return {
        ...base,
        type: p.transaction?.transaction_type,
        action: txData?.action_type,
        triggerType: txData?.trigger_type,
        slot: txData?.hotbar_slot,
        item: txData?.held_item ? this.itemName(txData.held_item) : undefined,
        itemCount: txData?.held_item?.count,
        blockPos: txData?.block_position ? [txData.block_position.x, txData.block_position.y, txData.block_position.z] : undefined,
        playerPos: txData?.player_pos
          ? [Math.round(txData.player_pos.x * 100) / 100, Math.round(txData.player_pos.y * 100) / 100, Math.round(txData.player_pos.z * 100) / 100]
          : undefined,
        face: txData?.face,
      };
    },

    add_entity: (base, packet) => {
      const p = packet as PacketParams<'add_entity'>;
      return {
        ...base,
        entityType: p.entity_type,
        runtimeId: p.runtime_id,
        uniqueId: p.unique_id,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        velocity: p.velocity ? [p.velocity.x, p.velocity.y, p.velocity.z] : undefined,
        pitch: p.pitch,
        yaw: p.yaw,
        headYaw: p.head_yaw,
      };
    },

    add_item_actor: (base, packet) => {
      const p = packet as any;
      return {
        ...base,
        runtimeId: p.runtime_id,
        uniqueId: p.unique_id,
        item: this.itemName(p.item),
        itemCount: p.item?.count,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        velocity: p.velocity ? [p.velocity.x, p.velocity.y, p.velocity.z] : undefined,
        isFromFishing: p.is_from_fishing,
      };
    },

    remove_entity: (base, packet) => {
      const entityIdSelf = (packet as any).entity_id_self;
      return {
        ...base,
        uniqueId: entityIdSelf,
      };
    },

    set_entity_data: (base, packet) => {
      const p = packet as PacketParams<'set_entity_data'>;
      type MetadataEntry = { key: string; type: string; value: unknown };
      const metadata = p.metadata as MetadataEntry[] | undefined;

      // Simplify metadata output
      const simplifiedMetadata = metadata?.map((m) => {
        const val = m.value as Record<string, unknown> | null;
        if (val && typeof val === 'object' && 'x' in val) {
          return { key: m.key, type: m.type, value: [val.x, val.y, val.z] };
        }
        if (m.type === 'long' && val && typeof val === 'object' && '_value' in val) {
          return { key: m.key, type: m.type, value: val._value };
        }
        return { key: m.key, type: m.type, value: m.value };
      });

      return {
        ...base,
        entityId: p.runtime_entity_id,
        metadata: simplifiedMetadata,
      };
    },

    set_entity_motion: (base, packet) => {
      const p = packet as PacketParams<'set_entity_motion'>;
      return {
        ...base,
        entityId: p.runtime_id,
        velocity: p.velocity ? [p.velocity.x, p.velocity.y, p.velocity.z] : undefined,
      };
    },

    move_entity: (base, packet) => {
      const p = packet as any;
      return {
        ...base,
        entityId: p.runtime_entity_id,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        pitch: p.pitch,
        yaw: p.yaw,
        headYaw: p.head_yaw,
        onGround: p.on_ground,
        teleported: p.teleported,
      };
    },

    move_entity_delta: (base, packet) => {
      const p = packet as any;
      return {
        ...base,
        entityId: p.runtime_entity_id,
        flags: p.flags,
        x: p.x,
        y: p.y,
        z: p.z,
        pitch: p.pitch,
        yaw: p.yaw,
        headYaw: p.head_yaw,
      };
    },

    interact: (base, packet) => {
      const p = packet as any;
      return {
        ...base,
        targetEntityId: p.target_entity_id,
        actionId: p.action_id,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
      };
    },

    entity_event: (base, packet) => {
      const p = packet as PacketParams<'entity_event'>;
      return {
        ...base,
        entityId: p.runtime_id,
        eventId: p.event_id,
        data: p.data,
      };
    },

    level_sound_event: (base, packet) => {
      const p = packet as PacketParams<'level_sound_event'>;
      return {
        ...base,
        sound: p.sound_id,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        extraData: p.extra_data,
        entityType: p.entity_type,
      };
    },

    text: (base, packet) => {
      const p = packet as PacketParams<'text'>;

      let message = p.message;
      if (message && message.startsWith('{')) {
        try {
          const parsed = JSON.parse(message);
          if (parsed.rawtext?.[0]?.text) {
            message = parsed.rawtext[0].text;
          } else if (parsed.rawtext?.[0]?.translate) {
            message = parsed.rawtext[0].translate;
          }
        } catch {
          // Keep original message
        }
      }

      return {
        ...base,
        type: p.type,
        message: message?.trim(),
        source: p.source_name,
      };
    },
  };
}
