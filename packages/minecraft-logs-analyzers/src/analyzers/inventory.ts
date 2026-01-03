import { BaseAnalyzer } from "../base-analyzer.ts";
import type {
  Direction,
  LogEntry,
  AnalyzerConfig,
  PacketParams,
  PacketParamsMap,
} from "../types.ts";

// Use const assertion + satisfies for type-safe packet names with autocomplete
const PACKETS_TO_LOG = [
  "player_action",
  "inventory_transaction",
  "item_stack_request",
  "item_stack_response",
  "mob_equipment",
  "inventory_slot",
  "inventory_content",
  "player_auth_input",
  "animate",
] as const satisfies readonly (keyof PacketParamsMap)[];

/** Union type of all inventory-related packet names */
export type InventoryPacketName = (typeof PACKETS_TO_LOG)[number];

/**
 * Analyzer for inventory-related packets.
 * Captures: player_action, inventory_transaction, item_stack_request/response,
 * mob_equipment, inventory_slot, inventory_content, player_auth_input, animate
 */
export class InventoryAnalyzer extends BaseAnalyzer {
  readonly config: AnalyzerConfig<InventoryPacketName> = {
    name: "inventory",
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
    if (!this.config.packets.includes(name as InventoryPacketName)) return false;

    // For player_auth_input, only log if there's block_action or item_stack_request
    if (name === "player_auth_input") {
      const p = packet as PacketParams<"player_auth_input">;
      const hasBlockAction = p.block_action && Array.isArray(p.block_action) && p.block_action.length > 0;
      const hasItemStackRequest = !!(p.item_stack_request && p.input_data?.item_stack_request);
      return hasBlockAction || hasItemStackRequest;
    }

    return true;
  }

  protected extractFields(
    direction: Direction,
    name: string,
    packet: unknown
  ): LogEntry | null {
    // Track tick from player_auth_input
    if (name === "player_auth_input") {
      this.updateTick(packet as { tick?: number });
    }

    const base = this.createBaseEntry(direction, name);
    const handler = this.handlers[name as InventoryPacketName];

    if (handler) {
      return handler(base, packet);
    }
    return null;
  }

  // ============================================================================
  // Typed Packet Handlers
  // ============================================================================

  private handlers: { [K in InventoryPacketName]: (base: LogEntry, packet: unknown) => LogEntry | null } = {
    player_action: (base, packet) => {
      const p = packet as PacketParams<"player_action">;
      return {
        ...base,
        action: p.action,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        face: p.face,
      };
    },

    inventory_transaction: (base, packet) => {
      const p = packet as PacketParams<"inventory_transaction">;

      // Define transaction data type with all possible fields from different transaction types
      type TransactionData = {
        action_type?: string;
        hotbar_slot?: number;
        held_item?: { count?: number; stack_id?: number; has_stack_id?: boolean };
        block_position?: { x: number; y: number; z: number };
      };
      const txData = p.transaction?.transaction_data as unknown as TransactionData | undefined;

      const txActions = p.transaction?.actions?.map((a) => ({
        src: a.source_type,
        inv: a.inventory_id,
        slot: a.slot,
        oldItem: this.itemName(a.old_item),
        oldCount: a.old_item?.count,
        newItem: this.itemName(a.new_item),
        newCount: a.new_item?.count,
      }));

      return {
        ...base,
        type: p.transaction?.transaction_type,
        action: txData?.action_type,
        slot: txData?.hotbar_slot,
        item: txData?.held_item ? this.itemName(txData.held_item) : undefined,
        itemCount: txData?.held_item?.count,
        pos: txData?.block_position
          ? [txData.block_position.x, txData.block_position.y, txData.block_position.z]
          : undefined,
        actionsLen: p.transaction?.actions?.length,
        actions: txActions?.length ? txActions : undefined,
        heldStackId: txData?.held_item?.stack_id,
        hasStackId: txData?.held_item?.has_stack_id,
      };
    },

    item_stack_request: (base, packet) => {
      const p = packet as PacketParams<"item_stack_request">;
      const firstRequest = p.requests?.[0];
      const actions = firstRequest?.actions?.map((a) => ({
        type: a.type_id,
        src: a.source ? `${a.source.slot_type?.container_id}:${a.source.slot}` : undefined,
        dst: a.destination ? `${a.destination.slot_type?.container_id}:${a.destination.slot}` : undefined,
        count: a.count,
      }));

      return {
        ...base,
        reqId: firstRequest?.request_id,
        actions,
      };
    },

    item_stack_response: (base, packet) => {
      const p = packet as PacketParams<"item_stack_response">;
      const responses = (p.responses)?.map((r) => ({
        reqId: r.request_id,
        status: r.status,
      }));

      return {
        ...base,
        responses,
      };
    },

    mob_equipment: (base, packet) => {
      const p = packet as PacketParams<"mob_equipment">;
      return {
        ...base,
        item: this.itemName(p.item),
        count: p.item?.count,
        slot: p.slot,
        selected: p.selected_slot,
      };
    },

    inventory_slot: (base, packet) => {
      const p = packet as PacketParams<"inventory_slot">;
      const item = p.item as { count?: number; stack_size?: number; stack_id?: number } | undefined;
      return {
        ...base,
        window: p.window_id,
        slot: p.slot,
        item: this.itemName(p.item),
        count: item?.count ?? item?.stack_size,
        stackId: item?.stack_id,
      };
    },

    inventory_content: (base, packet) => {
      const p = packet as PacketParams<"inventory_content">;
      type InventoryItem = { network_id?: number; count?: number; stack_size?: number };
      const input = p.input as InventoryItem[] | undefined;
      const items = input?.filter((i) => i && i.network_id !== 0);
      const nonEmpty = items?.length ?? 0;
      const slotDetails = items?.slice(0, 10).map((i) => ({
        slot: input?.indexOf(i),
        item: this.itemName(i),
        count: i.count ?? i.stack_size,
      }));

      return {
        ...base,
        window: p.window_id,
        total: input?.length,
        nonEmpty,
        slots: slotDetails,
      };
    },

    player_auth_input: (base, packet) => {
      const p = packet as PacketParams<"player_auth_input">;
      const authEntry: LogEntry = {
        ...base,
        tick: typeof p.tick === "bigint" ? Number(p.tick) : p.tick,
      };

      type BlockAction = { action?: string; position?: { x: number; y: number; z: number }; face?: number };
      if (p.block_action && p.block_action.length > 0) {
        authEntry.blockAction = (p.block_action as BlockAction[]).map((a) => ({
          action: a.action,
          pos: a.position ? [a.position.x, a.position.y, a.position.z] : undefined,
          face: a.face,
        }));
      }

      type ItemStackAction = { type_id?: string; hotbar_slot?: number; predicted_durability?: number; network_id?: number };
      type ItemStackRequest = { request_id?: number; actions?: ItemStackAction[] };
      if (p.item_stack_request && p.input_data?.item_stack_request) {
        const req = p.item_stack_request as unknown as ItemStackRequest;
        authEntry.itemStackReq = {
          reqId: req.request_id,
          actions: req.actions?.map((a) => ({
            type: a.type_id,
            slot: a.hotbar_slot,
            durability: a.predicted_durability,
            networkId: a.network_id,
          })),
        };
      }

      return authEntry;
    },

    animate: (base, packet) => {
      const p = packet as PacketParams<"animate"> & { swing_source?: unknown };
      return {
        ...base,
        action: p.action_id,
        swing: p.swing_source,
      };
    },
  };
}
