import { BaseAnalyzer } from '../base-analyzer.ts';
import type { Direction, LogEntry, AnalyzerConfig, PacketParams, PacketParamsMap } from '../types.ts';

// Fishing-related packets
const PACKETS_TO_LOG = [
  'inventory_transaction', // Cast rod, reel in
  'player_action', // Item use actions
  'add_entity', // Fishing bobber spawned
  'remove_entity', // Bobber removed
  'entity_event', // Bobber splash when fish bites
  'set_entity_motion', // Bobber motion
  'set_entity_data', // Bobber state changes
  'inventory_slot', // Fish added to inventory
  'level_sound_event', // Splash sounds
  'text', // Scenario markers
] as const satisfies readonly (keyof PacketParamsMap)[];

/** Union type of all fishing-related packet names */
export type FishingPacketName = (typeof PACKETS_TO_LOG)[number];

/**
 * Analyzer for fishing-related packets.
 *
 * Packets captured:
 * | Direction     | Packet                | Purpose              | Key Fields                                        |
 * |---------------|-----------------------|----------------------|---------------------------------------------------|
 * | Client→Server | inventory_transaction | Cast/reel fishing rod| item_use, action: "click_air", item: fishing_rod  |
 * | Server→Client | add_entity            | Bobber spawned       | entity_type="minecraft:fishing_hook", runtime_id, unique_id |
 * | Server→Client | set_entity_data       | Bobber state         | fish_x, fish_z, fish_angle (approaching fish)     |
 * | Server→Client | entity_event          | Fish events          | fish_hook_tease, fish_hook_position, fish_hook_hook |
 * | Server→Client | remove_entity         | Bobber removed       | entity_id_self (matches unique_id from add_entity) |
 * | Server→Client | inventory_slot        | Fish received        | slot, item                                        |
 *
 * Entity events for fishing hook:
 *   - fish_hook_tease: Fish approaching bobber (sent multiple times as fish gets closer)
 *   - fish_hook_position: Position updates
 *   - fish_hook_hook: Fish caught! Player should reel in now
 *
 * Bobber metadata (set_entity_data):
 *   - fish_x, fish_z: Position of approaching fish (gets closer to 0,0)
 *   - fish_angle: Angle to fish (large values, approaches target)
 *   - owner_eid: Player who cast the rod
 *
 * Entity ID mapping:
 *   - add_entity uses runtime_id (for entity_event, set_entity_data tracking)
 *   - add_entity uses unique_id (for remove_entity matching via entity_id_self)
 *
 * Fishing cycle:
 *
 * Cast rod:
 *   C→S: inventory_transaction {type: "item_use", action: "click_air"}
 *   S→C: add_entity {entity_type: "minecraft:fishing_hook", runtime_id, unique_id}
 *
 * Fish approaching:
 *   S→C: entity_event {event_id: "fish_hook_tease"} (multiple times)
 *   S→C: set_entity_data {fish_x, fish_z approaching 0}
 *
 * Fish bites:
 *   S→C: entity_event {event_id: "fish_hook_hook"}
 *
 * Reel in (success):
 *   C→S: inventory_transaction {type: "item_use", action: "click_air"}
 *   S→C: remove_entity {entity_id_self: unique_id}
 *   S→C: inventory_slot {item: fish/treasure/junk}
 */
export class FishingAnalyzer extends BaseAnalyzer {
  readonly config: AnalyzerConfig<FishingPacketName> = {
    name: 'fishing',
    packets: PACKETS_TO_LOG,
  };

  // Track bobber entity IDs to filter relevant packets
  // We need both runtime_id (for entity_event, set_entity_data) and unique_id (for remove_entity)
  private bobberRuntimeIds: Set<string> = new Set();
  private bobberUniqueIds: Set<string> = new Set();

  constructor(basePath: string, registry?: any) {
    super(basePath);
    if (registry) {
      this.registry = registry;
    }
    this.init();
  }

  protected shouldLog(name: string, packet: unknown): boolean {
    if (!this.config.packets.includes(name as FishingPacketName)) return false;

    // Filter inventory_transaction to only item_use with fishing rod
    if (name === 'inventory_transaction') {
      const p = packet as PacketParams<'inventory_transaction'>;
      if (p.transaction?.transaction_type !== 'item_use') return false;
      // Check if held item is fishing rod (network_id varies by version)
      const txData = p.transaction?.transaction_data as { held_item?: { network_id?: number } } | undefined;
      const itemId = txData?.held_item?.network_id;
      // Log all item_use for now - can filter by fishing rod ID later
      return true;
    }

    // Filter add_entity to only fishing hooks
    if (name === 'add_entity') {
      const p = packet as PacketParams<'add_entity'>;
      if (p.entity_type === 'minecraft:fishing_hook') {
        // Track both runtime_id and unique_id for this bobber
        this.bobberRuntimeIds.add(String(p.runtime_id));
        this.bobberUniqueIds.add(String(p.unique_id));
        return true;
      }
      return false;
    }

    // Filter remove_entity to tracked bobbers (with cleanup)
    if (name === 'remove_entity') {
      // remove_entity uses entity_id_self which matches unique_id from add_entity
      const entityIdSelf = String((packet as any).entity_id_self);
      if (this.bobberUniqueIds.has(entityIdSelf)) {
        this.bobberUniqueIds.delete(entityIdSelf);
        return true;
      }
      return false;
    }

    // Filter entity_event to fish_hook events OR tracked bobbers
    if (name === 'entity_event') {
      const p = packet as PacketParams<'entity_event'>;
      const eventId = String(p.event_id || '');
      // Always log fish_hook_* events (key fishing events)
      if (eventId.includes('fish_hook')) return true;
      // Also log events for tracked bobbers
      return this.bobberRuntimeIds.has(String(p.runtime_id));
    }

    // Filter set_entity_motion to only tracked bobbers
    if (name === 'set_entity_motion') {
      const p = packet as PacketParams<'set_entity_motion'>;
      return this.bobberRuntimeIds.has(String(p.runtime_id));
    }

    // Filter set_entity_data to only tracked bobbers
    if (name === 'set_entity_data') {
      const p = packet as PacketParams<'set_entity_data'>;
      return this.bobberRuntimeIds.has(String(p.runtime_entity_id));
    }

    // Filter level_sound_event to fishing-related sounds
    if (name === 'level_sound_event') {
      const p = packet as PacketParams<'level_sound_event'>;
      const soundName = String(p.sound_id || '');
      return soundName.includes('splash') || soundName.includes('fishing') || soundName.includes('bobber');
    }

    // Log all player_action that might relate to fishing
    if (name === 'player_action') {
      const p = packet as PacketParams<'player_action'>;
      const fishingActions = ['start_item_use_on', 'stop_item_use_on', 'release_item'];
      return fishingActions.includes(p.action);
    }

    return true;
  }

  protected extractFields(direction: Direction, name: string, packet: unknown): LogEntry | null {
    const base = this.createBaseEntry(direction, name);
    const handler = this.handlers[name as FishingPacketName];

    if (handler) {
      return handler(base, packet);
    }
    return null;
  }

  // ============================================================================
  // Typed Packet Handlers
  // ============================================================================

  private handlers: {
    [K in FishingPacketName]: (base: LogEntry, packet: unknown) => LogEntry | null;
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
        hotbar_slot?: number;
        held_item?: { network_id?: number; count?: number };
        position?: { x: number; y: number; z: number };
      };
      const txData = p.transaction?.transaction_data as unknown as TransactionData | undefined;

      return {
        ...base,
        type: p.transaction?.transaction_type,
        action: txData?.action_type,
        slot: txData?.hotbar_slot,
        item: txData?.held_item ? this.itemName(txData.held_item) : undefined,
        itemCount: txData?.held_item?.count,
        pos: txData?.position ? [txData.position.x, txData.position.y, txData.position.z] : undefined,
      };
    },

    add_entity: (base, packet) => {
      const p = packet as PacketParams<'add_entity'>;
      return {
        ...base,
        entityType: p.entity_type,
        entityId: p.runtime_id,
        uniqueId: p.unique_id,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        velocity: p.velocity ? [p.velocity.x, p.velocity.y, p.velocity.z] : undefined,
      };
    },

    remove_entity: (base, packet) => {
      // remove_entity uses entity_id_self (unique_id), not runtime_id
      const entityIdSelf = (packet as any).entity_id_self;
      return {
        ...base,
        uniqueId: entityIdSelf,
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

    set_entity_motion: (base, packet) => {
      const p = packet as PacketParams<'set_entity_motion'>;
      return {
        ...base,
        entityId: p.runtime_id,
        velocity: p.velocity ? [p.velocity.x, p.velocity.y, p.velocity.z] : undefined,
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

    inventory_slot: (base, packet) => {
      const p = packet as PacketParams<'inventory_slot'>;
      return {
        ...base,
        windowId: p.window_id,
        slot: p.slot,
        item: this.itemName(p.item),
        count: (p.item as { count?: number })?.count,
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
