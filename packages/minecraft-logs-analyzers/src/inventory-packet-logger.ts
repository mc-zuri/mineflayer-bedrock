import * as fs from 'fs';

export interface IPacketLogger {
  log(direction: 'C' | 'S', name: string, packet: any): void;
  attachToBot(client: any): void;
  setRegistry?(registry: any): void;
  message?(msg: string, data?: Record<string, any>): void;
  close(): void;
}

type Direction = 'C' | 'S';

interface LogEntry {
  t: number;
  tick?: number;
  d: Direction;
  p: string;
  [key: string]: any;
}

const PACKETS_TO_LOG = new Set([
  'player_action',
  'inventory_transaction',
  'item_stack_request',
  'item_stack_response',
  'mob_equipment',
  'inventory_slot',
  'inventory_content',
  'player_auth_input',
  'animate',
]);

export class InventoryAnalyzer implements IPacketLogger {
  private stream: fs.WriteStream;
  private startTime: number;
  private lastTick: number = 0;
  private registry: any = null;
  private enabled: boolean = false;

  /**
   * @param basePath - Base path without extension, e.g., "logs/1.21.130-1735833600000"
   * @param postfix - Optional postfix before extension, e.g., "-inventory" → "basePath-inventory.jsonl"
   * @param registry - Optional registry for item name resolution
   */
  constructor(basePath: string, postfix?: string, registry?: any) {
    // Ensure output directory exists
    const dir = basePath.substring(0, basePath.lastIndexOf('/'));
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = postfix ? `${basePath}-${postfix}.jsonl` : `${basePath}.jsonl`;
    this.stream = fs.createWriteStream(filename, { flags: 'a' });
    this.startTime = Date.now();
    this.registry = registry;
  }

  setRegistry(registry: any): void {
    this.registry = registry;
  }

  log(direction: Direction, name: string, packet: any): void {
    // Enable logging after play_status packet
    if (name === 'play_status') {
      this.enabled = true;
      this.startTime = Date.now(); // Reset start time
    }

    if (!this.enabled) return;
    if (!this.shouldLog(name, packet)) return;

    const entry = this.extractFields(direction, name, packet);
    if (entry) {
      this.stream.write(JSON.stringify(entry, (key, value) => (typeof value === 'bigint' ? value.toString() : value)) + '\n');
    }
  }

  private shouldLog(name: string, packet: any): boolean {
    if (!PACKETS_TO_LOG.has(name)) return false;

    // For player_auth_input, only log if there's block_action or item_stack_request
    if (name === 'player_auth_input') {
      const hasBlockAction = packet.block_action && Array.isArray(packet.block_action) && packet.block_action.length > 0;
      const hasItemStackRequest = packet.item_stack_request && packet.input_data?.item_stack_request;
      return hasBlockAction || hasItemStackRequest;
    }

    return true;
  }

  private extractFields(direction: Direction, name: string, packet: any): LogEntry | null {
    const t = Date.now() - this.startTime;

    // Track tick from player_auth_input
    if (name === 'player_auth_input' && packet.tick !== undefined) {
      this.lastTick = packet.tick;
    }

    const base: LogEntry = {
      t,
      tick: this.lastTick || undefined,
      d: direction,
      p: name,
    };

    switch (name) {
      case 'player_action':
        return {
          ...base,
          action: packet.action,
          pos: packet.position ? [packet.position.x, packet.position.y, packet.position.z] : undefined,
          face: packet.face,
        };

      case 'inventory_transaction':
        const txData = packet.transaction?.transaction_data;
        const txActions = packet.transaction?.actions?.map((a: any) => ({
          src: a.source_type,
          inv: a.inventory_id,
          slot: a.slot,
          oldItem: this.itemName(a.old_item),
          oldCount: a.old_item?.count ?? a.old_item?.stack_size,
          newItem: this.itemName(a.new_item),
          newCount: a.new_item?.count ?? a.new_item?.stack_size,
        }));
        return {
          ...base,
          type: packet.transaction?.transaction_type,
          action: txData?.action_type,
          slot: txData?.hotbar_slot,
          item: this.itemName(txData?.held_item),
          itemCount: txData?.held_item?.count ?? txData?.held_item?.stack_size,
          pos: txData?.block_position ? [txData.block_position.x, txData.block_position.y, txData.block_position.z] : undefined,
          actionsLen: packet.transaction?.actions?.length,
          actions: txActions?.length ? txActions : undefined,
          heldStackId: txData?.held_item?.stack_id,
          hasStackId: txData?.held_item?.has_stack_id,
        };

      case 'item_stack_request':
        const actions = packet.requests?.[0]?.actions?.map((a: any) => ({
          type: a.type_id,
          src: a.source ? `${a.source.slot_type?.container_id}:${a.source.slot}` : undefined,
          dst: a.destination ? `${a.destination.slot_type?.container_id}:${a.destination.slot}` : undefined,
          count: a.count,
        }));
        return {
          ...base,
          reqId: packet.requests?.[0]?.request_id,
          actions,
        };

      case 'item_stack_response':
        const responses = packet.responses?.map((r: any) => ({
          reqId: r.request_id,
          status: r.status,
        }));
        return {
          ...base,
          responses,
        };

      case 'mob_equipment':
        return {
          ...base,
          item: this.itemName(packet.item),
          count: packet.item?.count ?? packet.item?.stack_size,
          slot: packet.slot,
          selected: packet.selected_slot,
        };

      case 'inventory_slot':
        return {
          ...base,
          window: packet.window_id,
          slot: packet.slot,
          item: this.itemName(packet.item),
          count: packet.item?.count ?? packet.item?.stack_size,
          stackId: packet.item?.stack_id,
        };

      case 'inventory_content':
        const items = packet.input?.filter((i: any) => i && i.network_id !== 0);
        const nonEmpty = items?.length ?? 0;
        // Log first few non-empty items with their counts
        const slotDetails = items?.slice(0, 10).map((i: any, idx: number) => ({
          slot: packet.input?.indexOf(i),
          item: this.itemName(i),
          count: i.count ?? i.stack_size,
        }));
        return {
          ...base,
          window: packet.window_id,
          total: packet.input?.length,
          nonEmpty,
          slots: slotDetails,
        };

      case 'player_auth_input':
        // Log tick, block_action, and item_stack_request if present
        const authEntry: LogEntry = {
          ...base,
          tick: packet.tick,
        };

        if (packet.block_action?.length > 0) {
          authEntry.blockAction = packet.block_action.map((a: any) => ({
            action: a.action,
            pos: a.position ? [a.position.x, a.position.y, a.position.z] : undefined,
            face: a.face,
          }));
        }

        if (packet.item_stack_request && packet.input_data?.item_stack_request) {
          const req = packet.item_stack_request;
          authEntry.itemStackReq = {
            reqId: req.request_id,
            actions: req.actions?.map((a: any) => ({
              type: a.type_id,
              slot: a.hotbar_slot,
              durability: a.predicted_durability,
              networkId: a.network_id,
            })),
          };
        }

        return authEntry;

      case 'animate':
        return {
          ...base,
          action: packet.action_id,
          swing: packet.swing_source,
        };

      default:
        return null;
    }
  }

  private itemName(item: any): string | undefined {
    if (!item) return undefined;
    if (item.network_id === 0) return undefined;

    // Try direct name first
    if (item.name) return item.name;
    if (item.blockName) return item.blockName;

    // Try to resolve from registry by network_id
    if (this.registry && item.network_id) {
      const itemData = this.registry.items?.[item.network_id];
      if (itemData?.name) return itemData.name;
    }

    return `id:${item.network_id}`;
  }

  /**
   * Log a custom message/event for debugging
   */
  message(msg: string, data?: Record<string, any>): void {
    if (!this.enabled) return;

    const entry: LogEntry = {
      t: Date.now() - this.startTime,
      tick: this.lastTick || undefined,
      d: 'C',
      p: '##',
      msg,
      ...data,
    };
    this.stream.write(JSON.stringify(entry, (key, value) => (typeof value === 'bigint' ? value.toString() : value)) + '\n');
  }

  close(): void {
    this.stream.end();
  }

  /**
   * Attach to a bot's client to log both incoming and outgoing packets.
   * Requires the bedrock-protocol patch that adds 'writePacket' event.
   */
  attachToBot(client: any): void {
    // Log incoming packets (server -> client)
    client.on('packet', (packet: any) => {
      const name = packet?.name || packet?.data?.name;
      const params = packet?.params || packet?.data?.params || packet;
      if (name) {
        this.log('S', name, params);
      }
    });

    // Log outgoing packets (client -> server) - requires patched bedrock-protocol
    client.on('writePacket', (name: string, params: any) => {
      this.log('C', name, params);
    });
  }
}
