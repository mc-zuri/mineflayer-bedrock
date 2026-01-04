import { BaseAnalyzer } from '../base-analyzer.ts';
import type { Direction, LogEntry, AnalyzerConfig, PacketParams, PacketParamsMap } from '../types.ts';

// Book-related packets
const PACKETS_TO_LOG = [
  'book_edit', // Edit book and quill
  'lectern_update', // Lectern book interaction
  'inventory_transaction', // Book interactions
  'item_stack_request', // Moving books
  'item_stack_response', // Response
  'inventory_slot', // Book in inventory
  'container_open', // Open lectern
  'container_close', // Close lectern
  'block_actor_data', // Lectern NBT data
  'update_block', // Lectern state
  'player_action', // Interact with lectern
  'text', // Scenario markers
] as const satisfies readonly (keyof PacketParamsMap)[];

/** Union type of all book-related packet names */
export type BookPacketName = (typeof PACKETS_TO_LOG)[number];

/**
 * Analyzer for book-related packets.
 *
 * Packets captured:
 * | Direction     | Packet                | Purpose              | Key Fields                                        |
 * |---------------|-----------------------|----------------------|---------------------------------------------------|
 * | Client→Server | book_edit             | Edit/sign book       | action, text[], title, author, page               |
 * | Client→Server | lectern_update        | Lectern interaction  | page, total_pages, book_id                        |
 * | Server→Client | block_actor_data      | Lectern NBT          | book data, page, position                         |
 * | Server→Client | inventory_slot        | Book in inventory    | slot, item with NBT                               |
 * | Server→Client | container_open        | Open lectern         | window_id, coordinates                            |
 *
 * Book edit actions:
 *   - replace_page: Replace text on a page
 *   - add_page: Add a new page
 *   - delete_page: Remove a page
 *   - swap_pages: Swap two pages
 *   - sign_book: Sign and finalize book (becomes written_book)
 *
 * Book types:
 *   - writable_book: Book and quill (editable)
 *   - written_book: Signed book (read-only)
 *   - enchanted_book: Book with enchantments
 *
 * Book NBT structure:
 *   - pages: Array of page text (writable_book uses "text", written_book uses "filtered_text")
 *   - author: Book author (written_book only)
 *   - title: Book title (written_book only)
 *   - generation: Copy generation (0=original, 1=copy, 2=copy of copy)
 *
 * Edit cycle:
 *   1. Hold book and quill
 *   2. Right-click to open editor
 *   3. C→S: book_edit {action: "replace_page", text: ["content"], page: 0}
 *   4. C→S: book_edit {action: "sign_book", title: "My Book", author: "Player"}
 *   5. S→C: inventory_slot {written_book with NBT}
 *
 * Lectern cycle:
 *   1. Place book on lectern (item_stack_request or inventory_transaction)
 *   2. S→C: block_actor_data {lectern NBT with book}
 *   3. Right-click lectern to read
 *   4. S→C: container_open
 *   5. C→S: lectern_update {page changes}
 *   6. Take book from lectern
 */
export class BookAnalyzer extends BaseAnalyzer {
  readonly config: AnalyzerConfig<BookPacketName> = {
    name: 'book',
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
    if (!this.config.packets.includes(name as BookPacketName)) return false;

    // Always log book_edit and lectern_update
    if (name === 'book_edit' || name === 'lectern_update') {
      return true;
    }

    // Filter inventory_slot to only book items
    if (name === 'inventory_slot') {
      const p = packet as PacketParams<'inventory_slot'>;
      const itemName = this.itemName(p.item) || '';
      return itemName.includes('book') || itemName.includes('lectern');
    }

    // Filter block_actor_data to lecterns
    if (name === 'block_actor_data') {
      const p = packet as any;
      const id = p.nbt?.value?.id?.value || '';
      return id === 'Lectern' || String(id).toLowerCase().includes('lectern');
    }

    // Filter update_block to lecterns
    if (name === 'update_block') {
      const p = packet as any;
      const blockName = String(p.block_runtime_id || '');
      // Can't easily filter by block name from runtime_id, log all for now
      return false; // Too noisy, disable
    }

    // Filter container_open to lectern-related
    if (name === 'container_open') {
      const p = packet as PacketParams<'container_open'>;
      return p.window_type === 'lectern' || String(p.window_type).includes('lectern');
    }

    // Log all item_stack_request/response for book analysis
    if (name === 'item_stack_request' || name === 'item_stack_response') {
      return true;
    }

    // Filter inventory_transaction to item_use (placing book on lectern)
    if (name === 'inventory_transaction') {
      const p = packet as PacketParams<'inventory_transaction'>;
      return p.transaction?.transaction_type === 'item_use';
    }

    return true;
  }

  protected extractFields(direction: Direction, name: string, packet: unknown): LogEntry | null {
    const base = this.createBaseEntry(direction, name);
    const handler = this.handlers[name as BookPacketName];

    if (handler) {
      return handler(base, packet);
    }
    return null;
  }

  // ============================================================================
  // Typed Packet Handlers
  // ============================================================================

  private handlers: {
    [K in BookPacketName]: (base: LogEntry, packet: unknown) => LogEntry | null;
  } = {
    book_edit: (base, packet) => {
      const p = packet as any;
      return {
        ...base,
        action: p.type, // "replace_page", "add_page", "delete_page", "swap_pages", "sign_book"
        slot: p.slot,
        page: p.page_number,
        secondaryPage: p.secondary_page_number,
        text: p.text,
        title: p.title,
        author: p.author,
        xuid: p.xuid,
        photoName: p.photo_name,
      };
    },

    lectern_update: (base, packet) => {
      const p = packet as any;
      return {
        ...base,
        page: p.page,
        totalPages: p.total_pages,
        bookId: p.book_id,
        droppedBook: p.dropped_book,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
      };
    },

    block_actor_data: (base, packet) => {
      const p = packet as any;
      const nbt = p.nbt?.value || {};

      // Extract book data from lectern NBT
      const book = nbt.book?.value;
      let bookInfo: any = undefined;
      if (book) {
        const tag = book.tag?.value;
        bookInfo = {
          name: book.Name?.value?.replace('minecraft:', ''),
          count: book.Count?.value,
          pages: tag?.pages?.value?.value?.map((page: any) => page.text?.value || page.value),
          author: tag?.author?.value,
          title: tag?.title?.value,
        };
      }

      return {
        ...base,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        id: nbt.id?.value,
        page: nbt.page?.value,
        totalPages: nbt.totalPages?.value,
        book: bookInfo,
      };
    },

    inventory_slot: (base, packet) => {
      const p = packet as PacketParams<'inventory_slot'>;
      const item = p.item as any;

      // Extract book NBT if present
      let bookData: any = undefined;
      if (item?.nbt?.value) {
        const tag = item.nbt.value;
        bookData = {
          pages: tag.pages?.value?.value?.map((page: any) => page.text?.value || page.value),
          author: tag.author?.value,
          title: tag.title?.value,
          generation: tag.generation?.value,
        };
      }

      return {
        ...base,
        windowId: p.window_id,
        slot: p.slot,
        item: this.itemName(p.item),
        count: item?.count,
        bookData: bookData,
      };
    },

    container_open: (base, packet) => {
      const p = packet as PacketParams<'container_open'>;
      return {
        ...base,
        windowId: p.window_id,
        windowType: p.window_type,
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

    inventory_transaction: (base, packet) => {
      const p = packet as PacketParams<'inventory_transaction'>;

      type TransactionData = {
        action_type?: string;
        block_position?: { x: number; y: number; z: number };
        face?: number;
        hotbar_slot?: number;
        held_item?: { network_id?: number; count?: number };
      };
      const txData = p.transaction?.transaction_data as unknown as TransactionData | undefined;

      return {
        ...base,
        type: p.transaction?.transaction_type,
        action: txData?.action_type,
        pos: txData?.block_position
          ? [txData.block_position.x, txData.block_position.y, txData.block_position.z]
          : undefined,
        face: txData?.face,
        slot: txData?.hotbar_slot,
        item: txData?.held_item ? this.itemName(txData.held_item) : undefined,
      };
    },

    item_stack_request: (base, packet) => {
      const p = packet as PacketParams<'item_stack_request'>;
      const requests = p.requests || [];

      const simplifiedRequests = requests.map((req: any) => ({
        requestId: req.request_id,
        actions: req.actions?.map((action: any) => ({
          type: action.type_id,
          count: action.count,
          source: action.source
            ? {
                type: action.source.source_type,
                slot: action.source.slot,
              }
            : undefined,
          destination: action.destination
            ? {
                type: action.destination.source_type,
                slot: action.destination.slot,
              }
            : undefined,
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
      }));

      return {
        ...base,
        responses: simplifiedResponses,
      };
    },

    player_action: (base, packet) => {
      const p = packet as PacketParams<'player_action'>;
      return {
        ...base,
        action: p.action,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        face: p.face,
      };
    },

    update_block: (base, packet) => {
      const p = packet as any;
      return {
        ...base,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        blockRuntimeId: p.block_runtime_id,
        flags: p.flags,
        layer: p.layer,
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
