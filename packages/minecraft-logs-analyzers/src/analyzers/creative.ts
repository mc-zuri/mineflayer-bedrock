import { BaseAnalyzer } from '../base-analyzer.ts';
import type { Direction, LogEntry, AnalyzerConfig, PacketParams, PacketParamsMap } from '../types.ts';

// Creative mode related packets
const PACKETS_TO_LOG = [
  'creative_content', // Server sends full creative inventory
  'set_player_game_type', // Game mode changes
  'inventory_transaction', // Creative item pickup/placement
  'item_stack_request', // Creative crafting requests
  'item_stack_response', // Server response to requests
  'inventory_slot', // Slot updates
  'inventory_content', // Full inventory sync
  'player_hotbar', // Hotbar slot selection
  'text', // Scenario markers
] as const satisfies readonly (keyof PacketParamsMap)[];

/** Union type of all creative-related packet names */
export type CreativePacketName = (typeof PACKETS_TO_LOG)[number];

/**
 * Analyzer for creative mode packets.
 *
 * Packets captured:
 * | Direction     | Packet                | Purpose                    | Key Fields                           |
 * |---------------|-----------------------|----------------------------|--------------------------------------|
 * | Server→Client | creative_content      | Full creative inventory    | groups[], items[]                    |
 * | Server→Client | set_player_game_type  | Game mode change           | gamemode (0=survival, 1=creative)    |
 * | Client→Server | item_stack_request    | Get item from creative     | craft_creative action                |
 * | Server→Client | item_stack_response   | Confirm creative action    | status, containers                   |
 * | Server→Client | inventory_slot        | Slot update                | window_id, slot, item                |
 * | Server→Client | inventory_content     | Full inventory sync        | window_id, slots[]                   |
 *
 * Creative item pickup flow:
 *   S→C: creative_content {groups, items} (sent on join/gamemode change)
 *   S→C: set_player_game_type {gamemode: 1} (switch to creative)
 *   C→S: item_stack_request {actions: [{type: "craft_creative", ...}]}
 *   S→C: item_stack_response {status: "ok", containers}
 *   S→C: inventory_slot {window_id, slot, item}
 *
 * Creative destroy flow:
 *   C→S: inventory_transaction {type: "normal", source: "creative"}
 */
export class CreativeAnalyzer extends BaseAnalyzer {
  readonly config: AnalyzerConfig<CreativePacketName> = {
    name: 'creative',
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
    if (!this.config.packets.includes(name as CreativePacketName)) return false;

    // Log all creative_content (only sent once per session/gamemode change)
    if (name === 'creative_content') {
      return true;
    }

    // Log all set_player_game_type
    if (name === 'set_player_game_type') {
      return true;
    }

    // Filter item_stack_request to creative actions
    if (name === 'item_stack_request') {
      const p = packet as PacketParams<'item_stack_request'>;
      const requests = p.requests || [];
      // Check if any action is craft_creative or creative related
      return requests.some((req: any) => {
        const actions = req.actions || [];
        return actions.some((a: any) =>
          a.type_id === 'craft_creative' ||
          a.type_id === 'creative_create' ||
          a.source?.type === 'creative' ||
          a.destination?.type === 'creative'
        );
      });
    }

    // Log all item_stack_response (for creative request confirmations)
    if (name === 'item_stack_response') {
      return true;
    }

    // Filter inventory_transaction to creative sources
    if (name === 'inventory_transaction') {
      const p = packet as PacketParams<'inventory_transaction'>;
      const tx = p.transaction as any;
      // Check for creative source in actions
      const actions = tx?.actions || [];
      const hasCreativeSource = actions.some((a: any) => a.source_type === 'creative');
      // Also log item_use transactions (placing blocks in creative)
      const isItemUse = tx?.transaction_type === 'item_use';
      return hasCreativeSource || isItemUse;
    }

    // Log inventory_slot and inventory_content for creative window updates
    if (name === 'inventory_slot' || name === 'inventory_content') {
      return true;
    }

    return true;
  }

  protected extractFields(direction: Direction, name: string, packet: unknown): LogEntry | null {
    const base = this.createBaseEntry(direction, name);
    const handler = this.handlers[name as CreativePacketName];

    if (handler) {
      return handler(base, packet);
    }
    return null;
  }

  // ============================================================================
  // Typed Packet Handlers
  // ============================================================================

  private handlers: {
    [K in CreativePacketName]: (base: LogEntry, packet: unknown) => LogEntry | null;
  } = {
    creative_content: (base, packet) => {
      const p = packet as any;
      const groups = p.groups || [];
      const items = p.items || [];

      // Summarize rather than log full content (can be huge)
      return {
        ...base,
        groupCount: groups.length,
        itemCount: items.length,
        groups: groups.map((g: any) => ({
          category: g.category,
          name: g.name,
        })),
        // Sample first 10 items
        sampleItems: items.slice(0, 10).map((item: any) => ({
          creativeIndex: item.entry_id,
          item: this.itemName(item.item),
        })),
      };
    },

    set_player_game_type: (base, packet) => {
      const p = packet as any;
      const gameModes = ['survival', 'creative', 'adventure', 'survival_spectator', 'creative_spectator'];
      return {
        ...base,
        gamemode: p.gamemode,
        gamemodeName: gameModes[p.gamemode] || `unknown(${p.gamemode})`,
      };
    },

    item_stack_request: (base, packet) => {
      const p = packet as PacketParams<'item_stack_request'>;
      const requests = (p.requests || []) as any[];

      const simplified = requests.map((req) => {
        const actions = (req.actions || []).map((a: any) => {
          const action: any = { type: a.type_id };

          if (a.count !== undefined) action.count = a.count;
          if (a.result_items) {
            action.results = a.result_items.map((r: any) => this.itemName(r));
          }
          if (a.source) {
            action.source = {
              type: a.source.type,
              slot: a.source.slot,
            };
          }
          if (a.destination) {
            action.dest = {
              type: a.destination.type,
              slot: a.destination.slot,
            };
          }
          if (a.creative_item_network_id !== undefined) {
            action.creativeNetworkId = a.creative_item_network_id;
          }

          return action;
        });

        return {
          requestId: req.request_id,
          actions,
        };
      });

      return {
        ...base,
        requests: simplified,
      };
    },

    item_stack_response: (base, packet) => {
      const p = packet as any;
      const responses = p.responses || [];

      const simplified = responses.map((r: any) => ({
        requestId: r.request_id,
        status: r.status,
        containers: (r.containers || []).map((c: any) => ({
          id: c.container_id,
          slots: (c.slots || []).map((s: any) => ({
            slot: s.slot,
            item: this.itemName(s),
            count: s.count,
            stackId: s.item_stack_id,
          })),
        })),
      }));

      return {
        ...base,
        responses: simplified,
      };
    },

    inventory_transaction: (base, packet) => {
      const p = packet as PacketParams<'inventory_transaction'>;
      const tx = p.transaction as any;

      type TransactionData = {
        action_type?: string;
        hotbar_slot?: number;
        held_item?: { network_id?: number; count?: number };
        block_position?: { x: number; y: number; z: number };
        face?: number;
      };
      const txData = tx?.transaction_data as TransactionData | undefined;

      // Extract creative-related actions
      const actions = (tx?.actions || []).map((a: any) => ({
        sourceType: a.source_type,
        slot: a.slot,
        oldItem: this.itemName(a.old_item),
        newItem: this.itemName(a.new_item),
      }));

      return {
        ...base,
        type: tx?.transaction_type,
        action: txData?.action_type,
        slot: txData?.hotbar_slot,
        item: txData?.held_item ? this.itemName(txData.held_item) : undefined,
        blockPos: txData?.block_position ? [txData.block_position.x, txData.block_position.y, txData.block_position.z] : undefined,
        face: txData?.face,
        actions: actions.length > 0 ? actions : undefined,
      };
    },

    inventory_slot: (base, packet) => {
      const p = packet as PacketParams<'inventory_slot'>;
      return {
        ...base,
        windowId: p.window_id,
        slot: p.slot,
        item: this.itemName(p.item),
        count: (p.item as any)?.count,
      };
    },

    inventory_content: (base, packet) => {
      const p = packet as PacketParams<'inventory_content'>;
      const slots = (p.input || []) as any[];

      // Count non-empty slots
      const nonEmpty = slots.filter((s: any) => s && s.network_id && s.network_id !== 0);

      return {
        ...base,
        windowId: p.window_id,
        totalSlots: slots.length,
        nonEmptySlots: nonEmpty.length,
        items: nonEmpty.slice(0, 10).map((s: any, i: number) => ({
          slot: i,
          item: this.itemName(s),
          count: s.count,
        })),
      };
    },

    player_hotbar: (base, packet) => {
      const p = packet as any;
      return {
        ...base,
        selectedSlot: p.selected_slot,
        windowId: p.window_id,
        selectSlot: p.select_slot,
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
