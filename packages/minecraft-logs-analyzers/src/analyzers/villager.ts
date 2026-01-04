import { BaseAnalyzer } from '../base-analyzer.ts';
import type { Direction, LogEntry, AnalyzerConfig, PacketParams, PacketParamsMap } from '../types.ts';

// Villager trading-related packets
const PACKETS_TO_LOG = [
  'interact', // Player interacts with villager
  'container_open', // Trade window opens
  'container_close', // Trade window closes
  'update_trade', // Trade offers data
  'item_stack_request', // Execute trade
  'item_stack_response', // Trade result
  'inventory_slot', // Inventory updates
  'inventory_content', // Full inventory sync
  'set_entity_data', // Villager metadata (profession, level)
  'entity_event', // Villager animations/sounds
  'add_entity', // Villager spawned
  'text', // Scenario markers
] as const satisfies readonly (keyof PacketParamsMap)[];

/** Union type of all villager-related packet names */
export type VillagerPacketName = (typeof PACKETS_TO_LOG)[number];

/**
 * Analyzer for villager trading packets.
 *
 * Packets captured:
 * | Direction     | Packet                | Purpose              | Key Fields                                        |
 * |---------------|-----------------------|----------------------|---------------------------------------------------|
 * | Client→Server | interact              | Open trade window    | action_id, target_entity_id                       |
 * | Server→Client | update_trade          | Trade offers (NBT)   | offers.Recipes[], villager_unique_id, display_name |
 * | Client→Server | item_stack_request    | Execute trade        | place actions for trade slots                     |
 * | Server→Client | item_stack_response   | Trade result         | response status, slots affected                   |
 * | Server→Client | inventory_slot        | Inventory update     | slot, item received                               |
 * | Server→Client | set_entity_data       | Villager state       | trade_tier, trade_experience, skin_id             |
 * | Client→Server | container_close       | Close trade window   | window_id                                         |
 *
 * update_trade NBT structure:
 *   offers: {
 *     type: "compound",
 *     value: {
 *       Recipes: {
 *         type: "list",
 *         value: {
 *           type: "compound",
 *           value: [
 *             {
 *               buyA: { value: { Name: { value: "minecraft:coal" }, Count: { value: 15 } } },
 *               buyB: { value: { Name: { value }, Count: { value } } },  // optional
 *               sell: { value: { Name: { value: "minecraft:emerald" }, Count: { value: 1 } } },
 *               buyCountA: { value: 15 },
 *               maxUses: { value: 16 },
 *               tier: { value: 0 },      // 0-4 (Novice, Apprentice, Journeyman, Expert, Master)
 *               traderExp: { value: 2 },  // XP villager earns from this trade
 *               netId: { value: 3332 },   // Network ID for this trade recipe
 *               priceMultiplierA: { value: 0.05 },
 *               demand: { value: 0 },
 *             },
 *             ...
 *           ]
 *         }
 *       },
 *       TierExpRequirements: { ... }  // XP needed for each tier
 *     }
 *   }
 *
 * Trading cycle:
 *
 * Open trade window:
 *   C→S: interact {action_id: "open_inventory", target_entity_id: villager}
 *   S→C: update_trade {window_type: "trading", offers: { Recipes: [...] }}
 *
 * Execute trade:
 *   C→S: item_stack_request {place action to trade input slots}
 *   S→C: item_stack_response {status, slots}
 *   S→C: inventory_slot {updated items}
 *
 * Close trade window:
 *   C→S: container_close {window_id}
 *
 * Villager metadata (set_entity_data):
 *   - trade_tier: Current villager level (0-4)
 *   - max_trade_tier: Maximum level
 *   - trade_experience: XP towards next level
 *   - skin_id: Profession appearance
 */
export class VillagerAnalyzer extends BaseAnalyzer {
  readonly config: AnalyzerConfig<VillagerPacketName> = {
    name: 'villager',
    packets: PACKETS_TO_LOG,
  };

  // Track villager entity IDs to filter relevant packets
  private villagerIds: Set<string> = new Set();
  // Track active trade window ID
  private tradeWindowId: number | null = null;

  constructor(basePath: string, registry?: any) {
    super(basePath);
    if (registry) {
      this.registry = registry;
    }
    this.init();
  }

  protected shouldLog(name: string, packet: unknown): boolean {
    if (!this.config.packets.includes(name as VillagerPacketName)) return false;

    // Track villager entities
    if (name === 'add_entity') {
      const p = packet as PacketParams<'add_entity'>;
      const entityType = String(p.entity_type || '');
      if (entityType.includes('villager') || entityType.includes('wandering_trader')) {
        this.villagerIds.add(String(p.runtime_id));
        return true;
      }
      return false;
    }

    // Filter interact to only villager-related interactions
    if (name === 'interact') {
      const p = packet as any;
      // Log all interact packets - filter can be refined later
      return true;
    }

    // Track trade window opens
    if (name === 'container_open') {
      const p = packet as PacketParams<'container_open'>;
      // Log all container_open to see trade windows
      return true;
    }

    // Always log update_trade - this is the key villager packet
    if (name === 'update_trade') {
      return true;
    }

    // Log all item_stack_request/response for trade analysis
    if (name === 'item_stack_request' || name === 'item_stack_response') {
      return true;
    }

    // Log container_close
    if (name === 'container_close') {
      return true;
    }

    // Filter set_entity_data to villagers
    if (name === 'set_entity_data') {
      const p = packet as PacketParams<'set_entity_data'>;
      // Log all set_entity_data initially to find villager-related metadata
      return true;
    }

    // Filter entity_event to villagers
    if (name === 'entity_event') {
      const p = packet as PacketParams<'entity_event'>;
      return this.villagerIds.has(String(p.runtime_id));
    }

    // Log inventory updates
    if (name === 'inventory_slot' || name === 'inventory_content') {
      return true;
    }

    return true;
  }

  protected extractFields(direction: Direction, name: string, packet: unknown): LogEntry | null {
    const base = this.createBaseEntry(direction, name);
    const handler = this.handlers[name as VillagerPacketName];

    if (handler) {
      return handler(base, packet);
    }
    return null;
  }

  // ============================================================================
  // Typed Packet Handlers
  // ============================================================================

  private handlers: {
    [K in VillagerPacketName]: (base: LogEntry, packet: unknown) => LogEntry | null;
  } = {
    interact: (base, packet) => {
      const p = packet as any;
      return {
        ...base,
        actionId: p.action_id,
        targetId: p.target_entity_id,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
      };
    },

    container_open: (base, packet) => {
      const p = packet as PacketParams<'container_open'>;
      return {
        ...base,
        windowId: p.window_id,
        windowType: p.window_type,
        entityId: (p as any).entity_unique_id,
        pos: p.coordinates ? [p.coordinates.x, p.coordinates.y, p.coordinates.z] : undefined,
      };
    },

    container_close: (base, packet) => {
      const p = packet as PacketParams<'container_close'>;
      return {
        ...base,
        windowId: p.window_id,
        server: (p as any).server,
      };
    },

    update_trade: (base, packet) => {
      const p = packet as any;

      // Extract trades from NBT-style offers structure
      // Structure: offers.value.Recipes.value.value (array of trade objects)
      // Each trade: { buyA: { type, value: { Name: { value }, Count: { value } } }, sell: {...}, ... }
      let trades: any[] = [];
      const recipes = p.offers?.value?.Recipes?.value?.value;
      if (Array.isArray(recipes)) {
        trades = recipes;
      }

      // Parse NBT item: { type: "compound", value: { Name: { value: "minecraft:coal" }, Count: { value: 15 } } }
      const parseNbtItem = (item: any): { name: string; count: number } | undefined => {
        if (!item?.value) return undefined;
        const name = item.value?.Name?.value;
        const count = item.value?.Count?.value;
        return name ? { name: String(name).replace('minecraft:', ''), count: count ?? 1 } : undefined;
      };

      const simplifiedTrades = trades.map((trade: any, index: number) => {
        const buyAItem = parseNbtItem(trade.buyA);
        const buyBItem = parseNbtItem(trade.buyB);
        const sellItem = parseNbtItem(trade.sell);

        return {
          index,
          buyA: buyAItem?.name,
          buyACount: trade.buyCountA?.value ?? buyAItem?.count,
          buyB: buyBItem?.name,
          buyBCount: trade.buyCountB?.value ?? buyBItem?.count,
          sell: sellItem?.name,
          sellCount: sellItem?.count,
          uses: trade.uses?.value ?? trade.uses,
          maxUses: trade.maxUses?.value ?? trade.maxUses,
          tier: trade.tier?.value ?? trade.tier,
          traderExp: trade.traderExp?.value ?? trade.traderExp,
          priceMultiplier: trade.priceMultiplierA?.value,
          demand: trade.demand?.value ?? trade.demand,
          netId: trade.netId?.value,
        };
      });

      return {
        ...base,
        windowId: p.window_id,
        windowType: p.window_type,
        tradeTier: p.trade_tier,
        villagerId: p.villager_unique_id,
        displayName: p.display_name,
        newTradingUI: p.new_trading_ui,
        economyTrade: p.economic_trades,
        tradeCount: simplifiedTrades.length,
        trades: simplifiedTrades,
      };
    },

    item_stack_request: (base, packet) => {
      const p = packet as PacketParams<'item_stack_request'>;
      const requests = p.requests || [];

      const simplifiedRequests = requests.map((req: any) => ({
        requestId: req.request_id,
        actions: req.actions?.map((action: any) => ({
          type: action.type_id,
          ...this.simplifyAction(action),
        })),
      }));

      return {
        ...base,
        requests: simplifiedRequests,
      };
    },

    item_stack_response: (base, packet) => {
      const p = packet as PacketParams<'item_stack_response'>;
      const responses = p.responses || [];

      const simplifiedResponses = responses.map((resp: any) => ({
        status: resp.status,
        requestId: resp.request_id,
        containers: resp.containers?.map((c: any) => ({
          containerId: c.container_id,
          slots: c.slots?.map((s: any) => ({
            slot: s.slot,
            item: s.item_stack_id,
            count: s.count,
          })),
        })),
      }));

      return {
        ...base,
        responses: simplifiedResponses,
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

    inventory_content: (base, packet) => {
      const p = packet as PacketParams<'inventory_content'>;
      const items = (p.input as any[]) || [];
      const nonEmptyItems = items
        .map((item: any, index: number) => ({
          slot: index,
          item: this.itemName(item),
          count: item?.count,
        }))
        .filter((item) => item.item !== 'air' && item.count > 0);

      return {
        ...base,
        windowId: p.window_id,
        itemCount: nonEmptyItems.length,
        items: nonEmptyItems,
      };
    },

    set_entity_data: (base, packet) => {
      const p = packet as PacketParams<'set_entity_data'>;
      type MetadataEntry = { key: string; type: string; value: unknown };
      const metadata = p.metadata as MetadataEntry[] | undefined;

      // Extract villager-specific metadata
      const villagerKeys = ['trade_tier', 'max_trade_tier', 'trade_experience', 'skin_id', 'variant'];
      const relevantMetadata = metadata?.filter((m) =>
        villagerKeys.some((k) => m.key.includes(k)) || m.key.includes('villager')
      );

      // If no villager metadata, only log if we're tracking this entity
      if (!relevantMetadata?.length && !this.villagerIds.has(String(p.runtime_entity_id))) {
        return null;
      }

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

    entity_event: (base, packet) => {
      const p = packet as PacketParams<'entity_event'>;
      return {
        ...base,
        entityId: p.runtime_id,
        eventId: p.event_id,
        data: p.data,
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

  // Helper to simplify item_stack_request actions
  private simplifyAction(action: any): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (action.count !== undefined) result.count = action.count;
    if (action.source) {
      result.source = {
        type: action.source.source_type,
        slot: action.source.slot,
        stackId: action.source.stack_id,
      };
    }
    if (action.destination) {
      result.destination = {
        type: action.destination.source_type,
        slot: action.destination.slot,
        stackId: action.destination.stack_id,
      };
    }
    if (action.result_items) {
      result.resultItems = action.result_items.map((item: any) => ({
        item: this.itemName(item),
        count: item?.count,
      }));
    }
    if (action.recipe_network_id !== undefined) result.recipeId = action.recipe_network_id;

    return result;
  }
}
