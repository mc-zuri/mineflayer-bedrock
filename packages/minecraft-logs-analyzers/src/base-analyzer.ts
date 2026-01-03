import * as fs from "fs";
import type { Direction, LogEntry, IPacketLogger, AnalyzerConfig } from "./types.ts";

/**
 * Abstract base class for packet analyzers.
 * Subclasses must implement `config` and `extractFields()`.
 */
export abstract class BaseAnalyzer implements IPacketLogger {
  protected stream!: fs.WriteStream;
  protected startTime: number;
  protected lastTick: number = 0;
  protected registry: unknown = null;
  protected enabled: boolean = false;
  private _basePath: string;

  /** Configuration for this analyzer - must be implemented by subclass */
  abstract readonly config: AnalyzerConfig<string>;

  /**
   * @param basePath - Base path without extension, e.g., "logs/1.21.130-1735833600000"
   */
  constructor(basePath: string) {
    // Ensure output directory exists
    const dir = basePath.substring(0, basePath.lastIndexOf("/"));
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.startTime = Date.now();
    this._basePath = basePath;
  }

  /** Initialize the stream - call in subclass constructor after setting config */
  protected init(): void {
    const postfix = this.config.postfix ?? this.config.name;
    const filename = `${this._basePath}-${postfix}.jsonl`;
    this.stream = fs.createWriteStream(filename, { flags: "a" });
  }

  setRegistry(registry: unknown): void {
    this.registry = registry;
  }

  log(direction: Direction, name: string, packet: unknown): void {
    // Enable logging after play_status packet
    if (name === "play_status") {
      this.enabled = true;
      this.startTime = Date.now();
    }

    if (!this.enabled) return;
    if (!this.shouldLog(name, packet)) return;

    const entry = this.extractFields(direction, name, packet);
    if (entry) {
      this.writeEntry(entry);
    }
  }

  /** Check if this packet should be logged - can be overridden for custom filtering */
  protected shouldLog(name: string, packet: unknown): boolean {
    return this.config.packets.includes(name);
  }

  /** Extract relevant fields from packet - must be implemented by subclass */
  protected abstract extractFields(
    direction: Direction,
    name: string,
    packet: unknown
  ): LogEntry | null;

  /** Write a log entry to the stream */
  protected writeEntry(entry: LogEntry): void {
    this.stream.write(
      JSON.stringify(entry, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      ) + "\n"
    );
  }

  /** Create base log entry with common fields */
  protected createBaseEntry(direction: Direction, name: string): LogEntry {
    return {
      t: Date.now() - this.startTime,
      tick: this.lastTick || undefined,
      d: direction,
      p: name,
    };
  }

  /** Update lastTick from packet if available */
  protected updateTick(packet: { tick?: number }): void {
    if (packet.tick !== undefined) {
      this.lastTick = packet.tick;
    }
  }

  /** Resolve item name from item data */
  protected itemName(item: unknown): string | undefined {
    if (!item || typeof item !== "object") return undefined;
    const i = item as Record<string, unknown>;
    if (i.network_id === 0) return undefined;

    // Try direct name first
    if (typeof i.name === "string") return i.name;
    if (typeof i.blockName === "string") return i.blockName;

    // Try to resolve from registry by network_id
    const reg = this.registry as Record<string, unknown> | null;
    if (reg && typeof i.network_id === "number") {
      const items = reg.items as Record<number, { name?: string }> | undefined;
      const itemData = items?.[i.network_id];
      if (itemData?.name) return itemData.name;
    }

    return `id:${i.network_id}`;
  }

  /** Log a custom message/event for debugging */
  message(msg: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const entry: LogEntry = {
      t: Date.now() - this.startTime,
      tick: this.lastTick || undefined,
      d: "C",
      p: "##",
      msg,
      ...data,
    };
    this.writeEntry(entry);
  }

  close(): void {
    if (this.stream) {
      this.stream.end();
    }
  }

  /**
   * Attach to a bot's client to log both incoming and outgoing packets.
   * Requires the bedrock-protocol patch that adds 'writePacket' event.
   */
  attachToBot(client: {
    on(event: "packet", cb: (packet: unknown) => void): void;
    on(event: "writePacket", cb: (name: string, params: unknown) => void): void;
  }): void {
    // Log incoming packets (server -> client)
    client.on("packet", (packet: unknown) => {
      const p = packet as Record<string, unknown> | null;
      const name = (p?.name || (p?.data as Record<string, unknown>)?.name) as string | undefined;
      const params = p?.params || (p?.data as Record<string, unknown>)?.params || packet;
      if (name) {
        this.log("S", name, params);
      }
    });

    // Log outgoing packets (client -> server) - requires patched bedrock-protocol
    client.on("writePacket", (name: string, params: unknown) => {
      this.log("C", name, params);
    });
  }
}
