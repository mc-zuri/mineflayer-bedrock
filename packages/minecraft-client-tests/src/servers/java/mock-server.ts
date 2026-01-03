import type { ITestServer, ServerConfig } from '../../abstractions/server.ts';

// Type declarations for minecraft-protocol
interface MCClient {
  write(name: string, data: any): void;
  on(event: string, handler: (...args: any[]) => void): void;
  once(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
  end(reason?: string): void;
}

interface MCServer {
  on(event: 'listening', callback: () => void): void;
  on(event: 'playerJoin', callback: (client: MCClient) => void): void;
  on(event: 'login', callback: (client: MCClient) => void): void;
  close(): void;
  clients: Map<string, MCClient>;
}

interface MinecraftProtocol {
  createServer(options: {
    'online-mode': boolean;
    version: string;
    port: number;
  }): MCServer;
}

let mcProtocol: MinecraftProtocol | null = null;

async function getMinecraftProtocol(): Promise<MinecraftProtocol> {
  if (!mcProtocol) {
    // @ts-ignore
    const module = await import('minecraft-protocol');
    mcProtocol = module.default || module;
  }
  return mcProtocol;
}

// Port counter for unique ports in mock mode
let javaMockPortCounter = 0;
function getUniqueJavaMockPort(basePort = 25600): number {
  return basePort + (javaMockPortCounter++ * 2);
}

/**
 * Mock Java server for fast, isolated testing.
 * Uses minecraft-protocol to create a fake server that can inject packets directly.
 */
export class JavaMockServer implements ITestServer {
  readonly edition = 'java' as const;
  readonly mode = 'mock' as const;
  readonly host: string;
  readonly port: number;
  readonly version: string;

  private server: MCServer | null = null;
  private ready = false;
  private clients: MCClient[] = [];
  private outputBuffer: string[] = [];
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.host = config.host || '127.0.0.1';
    this.port = config.port || getUniqueJavaMockPort();
    this.version = config.version;
  }

  async start(): Promise<void> {
    const mc = await getMinecraftProtocol();

    this.server = mc.createServer({
      'online-mode': false,
      version: this.version,
      port: this.port,
    });

    await new Promise<void>((resolve) => {
      this.server!.on('listening', () => {
        this.ready = true;
        resolve();
      });
    });

    // Track connected clients
    this.server.on('playerJoin', (client) => {
      this.clients.push(client);
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.clients = [];
      this.ready = false;
    }
  }

  async executeCommand(command: string): Promise<void> {
    // Mock server doesn't have real command execution
    // Commands would need to be simulated via packet injection
    this.outputBuffer.push(`[MOCK] Command executed: ${command}`);
    console.log(`[MockServer] Command: ${command}`);
  }

  async writeConsole(text: string): Promise<void> {
    this.outputBuffer.push(text);
    console.log(`[MockServer] Console: ${text}`);
  }

  async waitForOutput(pattern: RegExp, timeout = 5000): Promise<string> {
    // Check buffer first
    for (let i = 0; i < this.outputBuffer.length; i++) {
      if (pattern.test(this.outputBuffer[i])) {
        const match = this.outputBuffer[i];
        this.outputBuffer.splice(i, 1);
        return match;
      }
    }

    // Mock servers don't have real console output
    // Return a synthetic match after a short delay
    await new Promise((r) => setTimeout(r, 100));
    return `[MOCK] Pattern matched: ${pattern}`;
  }

  isReady(): boolean {
    return this.ready;
  }

  async opPlayer(username: string): Promise<void> {
    // Mock server just logs the op command
    console.log(`[MockServer] Op player: ${username}`);
  }

  // === Mock-specific methods for packet injection ===

  /**
   * Get all connected clients for packet manipulation.
   */
  getClients(): MCClient[] {
    return this.clients;
  }

  /**
   * Get the first connected client.
   */
  getClient(): MCClient | null {
    return this.clients[0] || null;
  }

  /**
   * Write a packet to a specific client.
   */
  writePacket(client: MCClient, name: string, data: any): void {
    client.write(name, data);
  }

  /**
   * Write a packet to all connected clients.
   */
  broadcastPacket(name: string, data: any): void {
    for (const client of this.clients) {
      client.write(name, data);
    }
  }

  /**
   * Get the underlying minecraft-protocol server for advanced manipulation.
   */
  getServer(): MCServer | null {
    return this.server;
  }
}
