import { BaseAnalyzer } from '../base-analyzer.ts';
import type { Direction, LogEntry, AnalyzerConfig, PacketParams, PacketParamsMap } from '../types.ts';

// Crafting-related packets
const PACKETS_TO_LOG = [
  'crafting_data',
  'crafting_event',
  'unlocked_recipes',
  'toggle_crafter_slot_request',
  'item_stack_request',
  'item_stack_response',
  'inventory_transaction',
  'player_action',
  'item_stack_request',
  'item_stack_response',
  'inventory_content',
  'container_open',
  'container_close',
  'text'
] as const satisfies readonly (keyof PacketParamsMap)[];

/** Union type of all crafting-related packet names */
export type CraftingPacketName = (typeof PACKETS_TO_LOG)[number];

/** Crafting action types in item_stack_request */
const CRAFT_ACTION_TYPES = [
  'craft_recipe',
  'craft_recipe_auto',
  'craft_creative',
  'craft_grindstone_request',
  'craft_loom_request',
  'craft_non_implemented_deprecated',
] as const;

/**
 * Analyzer for crafting-related packets.
 * Captures: crafting_data, crafting_event, unlocked_recipes,
 * toggle_crafter_slot_request, item_stack_request (craft actions), item_stack_response
 */
export class CraftingAnalyzer extends BaseAnalyzer {
  readonly config: AnalyzerConfig<CraftingPacketName> = {
    name: 'crafting',
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
    if (!this.config.packets.includes(name as CraftingPacketName)) return false;

    // Log all item_stack_request and item_stack_response packets for full visibility
    return true;
  }

  protected extractFields(direction: Direction, name: string, packet: unknown): LogEntry | null {
    const base = this.createBaseEntry(direction, name);
    const handler = this.handlers[name as CraftingPacketName];

    if (handler) {
      return handler(base, packet);
    }
    return null;
  }

  // ============================================================================
  // Typed Packet Handlers
  // ============================================================================

  private handlers: {
    [K in CraftingPacketName]: (base: LogEntry, packet: unknown) => LogEntry | null;
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
    text: (base, packet) => {
      const p = packet as PacketParams<'text'>;
      return {
        ...base,
        action: p.message
      };
    },
    inventory_transaction: (base, packet) => {
      const p = packet as PacketParams<'inventory_transaction'>;

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
        pos: txData?.block_position ? [txData.block_position.x, txData.block_position.y, txData.block_position.z] : undefined,
        actionsLen: p.transaction?.actions?.length,
        actions: txActions?.length ? txActions : undefined,
        heldStackId: txData?.held_item?.stack_id,
        hasStackId: txData?.held_item?.has_stack_id,
      };
    },
    item_stack_request: (base, packet) => {
      const p = packet as PacketParams<'item_stack_request'>;

      const requests = p.requests?.map((req) => {
        const craftActions = req.actions?.filter((a) => CRAFT_ACTION_TYPES.includes(a.type_id as (typeof CRAFT_ACTION_TYPES)[number]));
        const otherActions = req.actions?.filter((a) => !CRAFT_ACTION_TYPES.includes(a.type_id as (typeof CRAFT_ACTION_TYPES)[number]));

        return {
          reqId: req.request_id,
          craftActions: craftActions?.map((a) => ({
            type: a.type_id,
            recipeNetworkId: a.recipe_network_id,
            timesCrafted: a.times_crafted,
          })),
          otherActions: otherActions?.map((a) => ({
            type: a.type_id,
            src: a.source ? `${a.source.slot_type?.container_id}:${a.source.slot}` : undefined,
            srcStackId: a.source?.stack_id,
            dst: a.destination ? `${a.destination.slot_type?.container_id}:${a.destination.slot}` : undefined,
            dstStackId: a.destination?.stack_id,
            count: a.count,
          })),
        };
      });

      return {
        ...base,
        requests,
      };
    },

  inventory_content: (base, packet) => {
      const p = packet as PacketParams<'inventory_content'>;
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

    item_stack_response: (base, packet) => {
      const p = packet as PacketParams<'item_stack_response'>;
      const responses = p.responses?.map((r) => ({
        reqId: r.request_id,
        status: r.status,
        containers: r.containers?.map((c) => ({
          containerId: c.slot_type?.container_id,
          slots: c.slots?.map((s) => ({
            slot: s.slot,
            item: this.itemName(s),
            count: s.count ?? s.stack_size,
            stackId: s.item_stack_id ?? s.stack_id,
          })),
        })),
      }));

      return {
        ...base,
        responses,
      };
    },
    crafting_data: (base, packet) => {
      const p = packet as PacketParams<'crafting_data'>;

      // Summarize recipes by type instead of logging all
      const recipeSummary: Record<string, number> = {};
      if (p.recipes && Array.isArray(p.recipes)) {
        for (const entry of p.recipes) {
          const type = entry.type || 'unknown';
          recipeSummary[type] = (recipeSummary[type] || 0) + 1;
        }
      }

      return {
        ...base,
        recipeCount: p.recipes?.length ?? 0,
        recipeSummary,
        potionTypeRecipes: p.potion_type_recipes?.length ?? 0,
        potionContainerRecipes: p.potion_container_recipes?.length ?? 0,
        clearRecipes: p.clear_recipes,
      };
    },

    crafting_event: (base, packet) => {
      const p = packet as PacketParams<'crafting_event'>;
      type CraftInput = { network_id?: number; count?: number };

      return {
        ...base,
        windowId: p.window_id,
        recipeType: p.recipe_type,
        recipeId: p.recipe_id,
        inputCount: (p.input as CraftInput[] | undefined)?.length,
        inputs: (p.input as CraftInput[] | undefined)?.slice(0, 9).map((i) => ({
          item: this.itemName(i),
          count: i?.count,
        })),
        outputCount: (p.output as CraftInput[] | undefined)?.length,
        outputs: (p.output as CraftInput[] | undefined)?.map((i) => ({
          item: this.itemName(i),
          count: i?.count,
        })),
      };
    },

    unlocked_recipes: (base, packet) => {
      const p = packet as PacketParams<'unlocked_recipes'>;

      return {
        ...base,
        action: p.unlock_type,
        recipeCount: p.recipes?.length ?? 0,
        recipes: p.recipes?.slice(0, 20), // Limit to first 20
        hasMore: (p.recipes?.length ?? 0) > 20,
      };
    },

    toggle_crafter_slot_request: (base, packet) => {
      const p = packet as PacketParams<'toggle_crafter_slot_request'>;

      return {
        ...base,
        pos: p.pos ? [p.pos.x, p.pos.y, p.pos.z] : undefined,
        slot: p.slot,
        disabled: p.disabled,
      };
    },

    container_open: (base, packet) => {
      const p = packet as PacketParams<'container_open'>;

      return {
        ...base,
        windowId: p.window_id,
        windowType: p.window_type,
        pos: p.coordinates ? [p.coordinates.x, p.coordinates.y, p.coordinates.z] : undefined,
        entityId: p.runtime_entity_id,
      };
    },

    container_close: (base, packet) => {
      const p = packet as PacketParams<'container_close'>;

      return {
        ...base,
        windowId: p.window_id,
        server: p.server,
      };
    },
  };
}
