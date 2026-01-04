import { BaseAnalyzer } from '../base-analyzer.ts';
import type { Direction, LogEntry, AnalyzerConfig, PacketParams, PacketParamsMap } from '../types.ts';

// Block placement related packets
const PACKETS_TO_LOG = [
  'inventory_transaction', // Block placement via item_use
  'update_block', // Block state changes from server
  'block_actor_data', // NBT for signs, chests, etc.
  'player_action', // Build/break actions
  'level_sound_event', // Block sounds
  'block_pick_request', // Pick block with middle click
  'text', // Scenario markers
] as const satisfies readonly (keyof PacketParamsMap)[];

/** Union type of all place-block-related packet names */
export type PlaceBlockPacketName = (typeof PACKETS_TO_LOG)[number];

/** Block-related player actions */
const BLOCK_ACTIONS = [
  'start_item_use_on', // Start placing/interacting
  'stop_item_use_on', // Stop placing
  'start_break', // Start breaking block
  'abort_break', // Cancel breaking
  'stop_break', // Stop breaking
  'continue_break', // Continue breaking
  'block_predict_destroy', // Predicted destruction
  'block_continue_destroy', // Continue destruction
] as const;

/**
 * Analyzer for block placement packets.
 *
 * Packets captured:
 * | Direction     | Packet                | Purpose              | Key Fields                                        |
 * |---------------|-----------------------|----------------------|---------------------------------------------------|
 * | Client→Server | inventory_transaction | Place block          | item_use, click_block, blockPos, face             |
 * | Server→Client | update_block          | Block state update   | pos, blockRuntimeId, flags, layer                 |
 * | Server→Client | block_actor_data      | Block NBT (signs)    | pos, nbt (sign text, chest contents, etc.)        |
 * | Client→Server | player_action         | Build/break actions  | start_item_use_on, start_break, stop_break        |
 * | Server→Client | level_sound_event     | Block sounds         | place, break, hit sounds                          |
 *
 * Block placement cycle:
 *   C→S: player_action {action: "start_item_use_on", pos, face}
 *   C→S: inventory_transaction {type: "item_use", action: "click_block", blockPos, face}
 *   S→C: update_block {pos, blockRuntimeId, flags: "neighbors"}
 *   S→C: level_sound_event {sound: "place", pos, blockType}
 *
 * Sign editing:
 *   S→C: block_actor_data {pos, nbt: {id: "Sign", Text: "..."}}
 *   C→S: block_actor_data {pos, nbt: {Text: "line1\nline2..."}}
 *
 * Block breaking:
 *   C→S: player_action {action: "start_break", pos, face}
 *   C→S: player_action {action: "continue_break" or "abort_break"}
 *   C→S: player_action {action: "block_predict_destroy"}
 *   S→C: update_block {pos, blockRuntimeId: 0 (air)}
 *   S→C: level_sound_event {sound: "break"}
 */
export class PlaceBlockAnalyzer extends BaseAnalyzer {
  readonly config: AnalyzerConfig<PlaceBlockPacketName> = {
    name: 'place-block',
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
    if (!this.config.packets.includes(name as PlaceBlockPacketName)) return false;

    // Filter player_action to only block-related actions
    if (name === 'player_action') {
      const p = packet as PacketParams<'player_action'>;
      return BLOCK_ACTIONS.includes(p.action as (typeof BLOCK_ACTIONS)[number]);
    }

    // Filter inventory_transaction to only item_use (block placement)
    if (name === 'inventory_transaction') {
      const p = packet as PacketParams<'inventory_transaction'>;
      return p.transaction?.transaction_type === 'item_use';
    }

    // Filter level_sound_event to block-related sounds
    if (name === 'level_sound_event') {
      const p = packet as PacketParams<'level_sound_event'>;
      const soundName = String(p.sound_id || '');
      return soundName.includes('place') || soundName.includes('break') || soundName.includes('hit') || soundName.includes('use');
    }

    return true;
  }

  protected extractFields(direction: Direction, name: string, packet: unknown): LogEntry | null {
    const base = this.createBaseEntry(direction, name);
    const handler = this.handlers[name as PlaceBlockPacketName];

    if (handler) {
      return handler(base, packet);
    }
    return null;
  }

  // ============================================================================
  // Typed Packet Handlers
  // ============================================================================

  private handlers: {
    [K in PlaceBlockPacketName]: (base: LogEntry, packet: unknown) => LogEntry | null;
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

    block_actor_data: (base, packet) => {
      const p = packet as any;
      const nbt = p.nbt?.value || {};

      // Extract common block actor fields
      const id = nbt.id?.value;

      // Sign-specific NBT
      let signText: string | undefined;
      if (id === 'Sign' || String(id).toLowerCase().includes('sign')) {
        signText = nbt.Text?.value || nbt.FrontText?.value?.Text?.value;
      }

      // Container-specific NBT
      let items: any[] | undefined;
      if (nbt.Items?.value?.value) {
        items = nbt.Items.value.value.map((item: any) => ({
          slot: item.Slot?.value,
          name: item.Name?.value?.replace('minecraft:', ''),
          count: item.Count?.value,
        }));
      }

      return {
        ...base,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        id,
        signText,
        items,
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

    block_pick_request: (base, packet) => {
      const p = packet as any;
      return {
        ...base,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        addUserData: p.add_user_data,
        hotbarSlot: p.hotbar_slot,
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
