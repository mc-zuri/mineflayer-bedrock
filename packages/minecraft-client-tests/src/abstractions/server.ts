import type { Bot } from 'mineflayer';

export type ServerEdition = 'java' | 'bedrock';
export type ServerMode = 'real' | 'mock';

export interface ServerConfig {
  edition: ServerEdition;
  mode: ServerMode;
  version: string;
  port?: number;
  host?: string;
  timeout?: number;
  worldName?: string;
  gamemode?: 'survival' | 'creative' | 'adventure';
  difficulty?: 'peaceful' | 'easy' | 'normal' | 'hard';
  allowCheats?: boolean;
  autoDownload?: boolean;
}

export interface ITestServer {
  /** Server edition (java or bedrock) */
  readonly edition: ServerEdition;

  /** Server mode (real or mock) */
  readonly mode: ServerMode;

  /** Server host */
  readonly host: string;

  /** Server port */
  readonly port: number;

  /** Minecraft version (without bedrock_ prefix) */
  readonly version: string;

  /** Start the server */
  start(): Promise<void>;

  /** Stop the server */
  stop(): Promise<void>;

  /**
   * Execute a command on the server.
   * For Java: writes to server console (command without slash)
   * For Bedrock: uses sendCommand
   */
  executeCommand(command: string): Promise<void>;

  /**
   * Write raw text to server console
   */
  writeConsole(text: string): Promise<void>;

  /**
   * Wait for specific output pattern in server console
   */
  waitForOutput(pattern: RegExp, timeout?: number): Promise<string>;

  /**
   * Check if server is ready to accept connections
   */
  isReady(): boolean;

  /**
   * Op a player (give operator permissions)
   */
  opPlayer(username: string): Promise<void>;
}
