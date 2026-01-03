import type { ITestServer, ServerConfig } from '../../abstractions/server.ts';
import {
  startExternalServer,
  type ExternalServer,
  type ExternalServerOptions,
  getWorkerPort,
  getWorkerId,
} from 'minecraft-bedrock-server';

export class BedrockRealServer implements ITestServer {
  readonly edition = 'bedrock' as const;
  readonly mode = 'real' as const;
  readonly host: string;
  readonly port: number;
  readonly version: string;

  private externalServer: ExternalServer | null = null;
  private ready = false;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.host = config.host || '127.0.0.1';
    // Use worker port allocation for parallel testing
    this.port = config.port || getWorkerPort();
    this.version = config.version;
  }

  async start(): Promise<void> {
    const workerId = getWorkerId();
    const bdsPath =
      workerId === 0
        ? `c:/apps/bds-${this.version}`
        : `c:/apps/bds-${this.version}-worker${workerId}`;

    const options: ExternalServerOptions = {
      bdsPath,
      version: this.version,
      port: this.port,
      timeout: this.config.timeout || 60000,
      worldName: this.config.worldName || 'Flat',
      gamemode: this.config.gamemode || 'creative',
      difficulty: this.config.difficulty || 'peaceful',
      allowCheats: this.config.allowCheats ?? true,
      autoDownload: this.config.autoDownload ?? true,
    };

    this.externalServer = await startExternalServer(options);
    this.ready = true;
  }

  async stop(): Promise<void> {
    if (this.externalServer) {
      await this.externalServer.stop();
      this.externalServer = null;
      this.ready = false;
    }
  }

  async executeCommand(command: string): Promise<void> {
    if (!this.externalServer) throw new Error('Server not started');
    await this.externalServer.sendCommand(command);
  }

  async writeConsole(text: string): Promise<void> {
    // For Bedrock, writeConsole is the same as executeCommand
    await this.executeCommand(text);
  }

  async waitForOutput(pattern: RegExp, timeout = 5000): Promise<string> {
    if (!this.externalServer) throw new Error('Server not started');
    return this.externalServer.waitForOutput(pattern, timeout);
  }

  isReady(): boolean {
    return this.ready;
  }

  async opPlayer(username: string): Promise<void> {
    // Bedrock uses op command same as Java
    await this.executeCommand(`op ${username}`);
  }
}
