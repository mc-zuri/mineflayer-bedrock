import { BaseAnalyzer } from '../base-analyzer.ts';
import type { Direction, LogEntry, AnalyzerConfig, PacketParams, PacketParamsMap } from '../types.ts';

// Bed-related packets
const PACKETS_TO_LOG = [
  'player_action',
  'inventory_transaction',
  'update_block',
  'animate',
  'text',
  'set_spawn_position', // Server sets spawn point to bed
  'set_entity_data', // Server updates player sleeping state
] as const satisfies readonly (keyof PacketParamsMap)[];

/** Union type of all bed-related packet names */
export type BedPacketName = (typeof PACKETS_TO_LOG)[number];

/** Bed-related player actions */
const BED_ACTIONS = [
  'start_item_use_on',
  'stop_item_use_on',
  'start_sleeping',
  'stop_sleeping',
] as const;

/**
 * Analyzer for bed-related packets.
 *
 * Packets captured:
 * | Direction     | Packet                | Purpose             | Key Fields                                                         |
 * |---------------|-----------------------|---------------------|--------------------------------------------------------------------|
 * | Client→Server | player_action         | Place/Sleep actions | start_item_use_on, start_sleeping, stop_sleeping                   |
 * | Client→Server | inventory_transaction | Bed placement       | item_use, click_block, blockPos, playerPos                         |
 * | Server→Client | update_block          | Bed block updates   | pos, blockRuntimeId                                                |
 * | Server→Client | set_spawn_position    | Spawn set to bed    | playerPos (foot), worldPos (head)                                  |
 * | Server→Client | set_entity_data       | Sleep state         | player_flags, player_bed_position, bed_enter_position, boundingbox |
 * | Server→Client | animate               | Wake up             | action: "wake_up"                                                  |
 *
 * Sleep cycle packets:
 *
 * Enter bed:
 *   C→S: player_action {action: "start_sleeping"}
 *   S→C: set_entity_data {player_flags: 2, player_bed_position: [x,y,z], boundingbox: 0.2x0.2}
 *   S→C: set_spawn_position {playerPos: foot, worldPos: head}
 *
 * Exit bed:
 *   S→C: animate {action: "wake_up"}
 *   S→C: set_entity_data {player_flags: 0, boundingbox: 0.6x1.8}
 *   C→S: player_action {action: "stop_sleeping"}
 */
export class BedAnalyzer extends BaseAnalyzer {
  readonly config: AnalyzerConfig<BedPacketName> = {
    name: 'bed',
    packets: PACKETS_TO_LOG,
  };

  constructor(basePath: string, registry?: any) {
    super(basePath);
    if (registry) {
      this.registry = registry;
    }
    this.init();
  }

  protected shouldLog(name: string, packet: unknown): boolean {
    if (!this.config.packets.includes(name as BedPacketName)) return false;

    // Filter player_action to only bed-related actions
    if (name === 'player_action') {
      const p = packet as PacketParams<'player_action'>;
      return BED_ACTIONS.includes(p.action as (typeof BED_ACTIONS)[number]);
    }

    // Filter inventory_transaction to only item_use (bed placement)
    if (name === 'inventory_transaction') {
      const p = packet as PacketParams<'inventory_transaction'>;
      return p.transaction?.transaction_type === 'item_use';
    }

    // Filter animate to only wake_up
    if (name === 'animate') {
      const p = packet as PacketParams<'animate'>;
      return p.action_id === 'wake_up';
    }

    // Log ALL set_entity_data and set_spawn_position for player entity - don't filter initially
    // Important: Full packet data helps discover which fields matter
    if (name === 'set_entity_data') {
      const p = packet as PacketParams<'set_entity_data'>;
      // Only log player entity (id 1)
      return String(p.runtime_entity_id) === '1';
    }

    return true;
  }

  protected extractFields(direction: Direction, name: string, packet: unknown): LogEntry | null {
    const base = this.createBaseEntry(direction, name);
    const handler = this.handlers[name as BedPacketName];

    if (handler) {
      return handler(base, packet);
    }
    return null;
  }

  // ============================================================================
  // Typed Packet Handlers
  // ============================================================================

  private handlers: {
    [K in BedPacketName]: (base: LogEntry, packet: unknown) => LogEntry | null;
  } = {
    player_action: (base, packet) => {
      const p = packet as PacketParams<'player_action'>;
      return {
        ...base,
        action: p.action,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        resultPos: p.result_position ? [p.result_position.x, p.result_position.y, p.result_position.z] : undefined,
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
        block_runtime_id?: number;
        client_prediction?: string;
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
        clickPos: txData?.click_pos
          ? [Math.round(txData.click_pos.x * 100) / 100, Math.round(txData.click_pos.y * 100) / 100, Math.round(txData.click_pos.z * 100) / 100]
          : undefined,
        face: txData?.face,
        blockRuntimeId: txData?.block_runtime_id,
        prediction: txData?.client_prediction,
      };
    },

    update_block: (base, packet) => {
      const p = packet as PacketParams<'update_block'>;
      return {
        ...base,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        blockRuntimeId: p.block_runtime_id,
        flags: p.flags,
        layer: p.layer,
      };
    },

    animate: (base, packet) => {
      const p = packet as PacketParams<'animate'>;
      return {
        ...base,
        action: p.action_id,
        entityId: p.runtime_entity_id,
        swingSource: p.swing_source,
      };
    },

    text: (base, packet) => {
      const p = packet as PacketParams<'text'>;

      // Extract readable message from JSON if possible
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

    set_spawn_position: (base, packet) => {
      const p = packet as PacketParams<'set_spawn_position'>;
      return {
        ...base,
        spawnType: p.spawn_type,
        playerPos: p.player_position ? [p.player_position.x, p.player_position.y, p.player_position.z] : undefined,
        worldPos: p.world_position ? [p.world_position.x, p.world_position.y, p.world_position.z] : undefined,
        dimension: p.dimension,
      };
    },

    set_entity_data: (base, packet) => {
      const p = packet as PacketParams<'set_entity_data'>;
      type MetadataEntry = { key: string; type: string; value: unknown };
      const metadata = p.metadata as MetadataEntry[] | undefined;

      // Log FULL metadata - important for discovering what fields matter
      // Simplify value output for readability
      const simplifiedMetadata = metadata?.map((m) => {
        // For vec3 types, convert to array
        const val = m.value as Record<string, unknown> | null;
        if (val && typeof val === 'object' && 'x' in val) {
          return { key: m.key, type: m.type, value: [val.x, val.y, val.z] };
        }
        // For long flags, just show the raw value
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
  };
}
