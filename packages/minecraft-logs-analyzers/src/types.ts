/**
 * Shared types for minecraft-logs-analyzers
 */

export type Direction = 'C' | 'S';

export interface LogEntry {
  /** Timestamp in ms since capture start */
  t: number;
  /** Game tick (from player_auth_input) */
  tick?: number;
  /** Direction: C=client->server, S=server->client */
  d: Direction;
  /** Packet name */
  p: string;
  /** Additional fields */
  [key: string]: any;
}

export interface IPacketLogger {
  /** Log a packet */
  log(direction: Direction, name: string, packet: unknown): void;
  /** Attach to a bedrock-protocol client */
  attachToBot(client: { on(event: 'packet', cb: (packet: unknown) => void): void; on(event: 'writePacket', cb: (name: string, params: unknown) => void): void }): void;
  /** Set registry for item/block name resolution */
  setRegistry?(registry: unknown): void;
  /** Log a custom message/event */
  message?(msg: string, data?: Record<string, unknown>): void;
  /** Close the logger */
  close(): void;
}

export interface AnalyzerConfig<Names extends string = string> {
  /** Analyzer name (used for file postfix) */
  name: string;
  /** Packet types this analyzer captures */
  packets: readonly Names[];
  /** Optional custom file postfix (default: name) */
  postfix?: string;
}

export interface AnalysisResult {
  /** Summary statistics */
  stats: Record<string, any>;
  /** Errors/anomalies found */
  errors: string[];
  /** Custom data from analyzer */
  data?: any;
}

// ============================================================================
// Typed Packet Handler Utilities
// ============================================================================

/** Re-export PacketParamsMap from global types for use in analyzers */
export type PacketParamsMap = globalThis.PacketParamsMap;

/** Extract packet params type by name from PacketParamsMap */
export type PacketParams<K extends keyof PacketParamsMap> = PacketParamsMap[K];

/** Handler function for a specific packet type */
export type PacketHandler<K extends keyof PacketParamsMap> = (base: LogEntry, packet: PacketParams<K>) => LogEntry | null;

/** Create a typed handler map for a set of packet names */
export type PacketHandlerMap<Names extends keyof PacketParamsMap> = {
  [K in Names]: PacketHandler<K>;
};
