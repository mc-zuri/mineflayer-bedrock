import type { ITestServer, ServerConfig } from '../../abstractions/server.ts';
import {
  startServer,
  waitForClientConnect,
  initializeClient,
  getDataBuilder,
  setupChatEchoHandler,
  setupCommandHandler,
  simulateGive,
  simulateClear,
} from 'minecraft-bedrock-server';
import type { Server, Player, Version } from 'bedrock-protocol';

// Port counter for unique ports in mock mode
let mockPortCounter = 0;
function getUniqueMockPort(basePort = 19200): number {
  return basePort + (mockPortCounter++ * 2);
}

/**
 * Mock Bedrock server for fast, isolated testing.
 * Uses bedrock-protocol to create a fake server that can inject packets directly.
 */
export class BedrockMockServer implements ITestServer {
  readonly edition = 'bedrock' as const;
  readonly mode = 'mock' as const;
  readonly host: string;
  readonly port: number;
  readonly version: string;

  private server: Server | null = null;
  private client: Player | null = null;
  private ready = false;
  private outputBuffer: string[] = [];
  private config: ServerConfig;
  private dataBuilder: ReturnType<typeof getDataBuilder> | null = null;

  constructor(config: ServerConfig) {
    this.config = config;
    this.host = config.host || '127.0.0.1';
    this.port = config.port || getUniqueMockPort();
    this.version = config.version;
  }

  async start(): Promise<void> {
    // Build test data for the version
    this.dataBuilder = getDataBuilder(this.version);

    // Start the mock server
    this.server = await startServer(this.host, this.port, this.version as Version);

    // Set up client connection handling - initialize client synchronously when they connect
    this.server.on('connect', async (client: Player) => {
      this.client = client;
      try {
        // Set up response handlers for chat and commands
        setupChatEchoHandler(client);
        setupCommandHandler(client, this.dataBuilder!);

        await initializeClient(client, this.dataBuilder!.data);
      } catch (e) {
        console.error('[BedrockMockServer] Error initializing client:', e);
      }
    });

    // Wait a bit for server to be fully ready
    await new Promise((r) => setTimeout(r, 100));
    this.ready = true;
  }

  async stop(): Promise<void> {
    if (this.client) {
      try {
        this.client.close();
      } catch (e) {
        // Ignore close errors
      }
      this.client = null;
    }
    if (this.server) {
      this.server.close();
      this.server = null;
      this.ready = false;
    }
  }

  async executeCommand(command: string): Promise<void> {
    // Mock server doesn't have real command execution
    // Commands would need to be simulated via packet injection
    this.outputBuffer.push(`[MOCK] Command executed: ${command}`);
    console.log(`[BedrockMockServer] Command: ${command}`);

    // Simulate some commands via packet injection
    if (this.client) {
      await this.simulateCommand(command);
    }
  }

  async writeConsole(text: string): Promise<void> {
    this.outputBuffer.push(text);
    console.log(`[BedrockMockServer] Console: ${text}`);
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
    // In mock mode, player has all permissions by default
    console.log(`[BedrockMockServer] Op player: ${username}`);
  }

  // === Mock-specific methods for packet injection ===

  /**
   * Get the connected client for packet manipulation.
   */
  getClient(): Player | null {
    return this.client;
  }

  /**
   * Write a packet to the connected client.
   */
  writePacket(name: string, data: any): void {
    if (this.client) {
      this.client.write(name, data);
    }
  }

  /**
   * Queue a packet to the connected client.
   */
  queuePacket(name: string, data: any): void {
    if (this.client) {
      this.client.queue(name, data);
    }
  }

  /**
   * Get the underlying bedrock-protocol server for advanced manipulation.
   */
  getServer(): Server | null {
    return this.server;
  }

  /**
   * Get the data builder for creating test data.
   */
  getDataBuilder(): ReturnType<typeof getDataBuilder> | null {
    return this.dataBuilder;
  }

  /**
   * Simulate a command by injecting appropriate packets.
   * This handles server-side executeCommand calls (not client packets).
   */
  private async simulateCommand(command: string): Promise<void> {
    if (!this.client || !this.dataBuilder) return;

    // Parse command
    const parts = command.replace(/^\//, '').split(' ');
    const cmd = parts[0].toLowerCase();

    switch (cmd) {
      case 'give':
        // Use the shared simulateGive function
        simulateGive(this.client, this.dataBuilder, parts.slice(1));
        break;
      case 'clear':
        // Use the shared simulateClear function
        simulateClear(this.client);
        break;
      case 'gamemode':
        // Could send update_abilities packet
        break;
      case 'tp':
      case 'teleport':
        // Could send move_player packet
        break;
      default:
        // Unknown command, just log
        break;
    }
  }
}
