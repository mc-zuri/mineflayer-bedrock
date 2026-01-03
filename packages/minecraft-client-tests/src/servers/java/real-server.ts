import * as path from 'path';
import * as fs from 'fs';
import type { ITestServer, ServerConfig } from '../../abstractions/server.ts';

// Type declarations for minecraft-wrap (no @types available)
interface WrapInstance {
  on(event: 'line', callback: (line: string) => void): void;
  startServer(
    props: Record<string, string | number | boolean>,
    callback: (err?: Error) => void
  ): void;
  stopServer(callback: (err?: Error) => void): void;
  deleteServerData(callback: (err?: Error) => void): void;
  writeServer(text: string): void;
}

interface MinecraftWrap {
  Wrap: new (jarPath: string, serverPath: string) => WrapInstance;
  download: (version: string, jarPath: string, callback: (err?: Error) => void) => void;
}

// Dynamic import for CommonJS module
let minecraftWrap: MinecraftWrap | null = null;

async function getMinecraftWrap(): Promise<MinecraftWrap> {
  if (!minecraftWrap) {
    // @ts-ignore - CommonJS import
    const module = await import('minecraft-wrap');
    minecraftWrap = module.default || module;
  }
  return minecraftWrap;
}

const DEFAULT_SERVER_PROPS = {
  'level-type': 'FLAT',
  'spawn-npcs': 'true',
  'spawn-animals': 'false',
  'online-mode': 'false',
  gamemode: '1',
  'spawn-monsters': 'false',
  'generate-structures': 'false',
  'enable-command-block': 'true',
  'use-native-transport': 'false',
};

export class JavaRealServer implements ITestServer {
  readonly edition = 'java' as const;
  readonly mode = 'real' as const;
  readonly host: string;
  readonly port: number;
  readonly version: string;

  private wrap: WrapInstance | null = null;
  private serverPath: string;
  private jarPath: string;
  private ready = false;
  private outputBuffer: string[] = [];
  private outputListeners: Array<{
    pattern: RegExp;
    resolve: (match: string) => void;
    reject: (err: Error) => void;
  }> = [];
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.host = config.host || '127.0.0.1';
    this.port = config.port || 25565;
    this.version = config.version;

    const jarDir = process.env.MC_SERVER_JAR_DIR || path.join(process.cwd(), 'server_jars');
    this.jarPath = path.join(jarDir, `minecraft_server.${this.version}.jar`);
    this.serverPath = path.join(process.cwd(), 'test_server', `server_${this.version}_${this.port}`);
  }

  async start(): Promise<void> {
    const mcWrap = await getMinecraftWrap();

    // Download server JAR if needed
    await new Promise<void>((resolve, reject) => {
      // Ensure jar directory exists
      fs.mkdirSync(path.dirname(this.jarPath), { recursive: true });

      mcWrap.download(this.version, this.jarPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Create wrap instance
    this.wrap = new mcWrap.Wrap(this.jarPath, this.serverPath);

    // Capture output for waitForOutput
    this.wrap.on('line', (line) => {
      console.log(line);
      this.outputBuffer.push(line);

      // Check listeners
      for (let i = this.outputListeners.length - 1; i >= 0; i--) {
        const listener = this.outputListeners[i];
        if (listener.pattern.test(line)) {
          this.outputListeners.splice(i, 1);
          listener.resolve(line);
        }
      }
    });

    // Start server
    const props = {
      ...DEFAULT_SERVER_PROPS,
      'server-port': this.port,
      gamemode: this.config.gamemode === 'survival' ? '0' : '1',
      difficulty: this.config.difficulty || 'peaceful',
    };

    await new Promise<void>((resolve, reject) => {
      this.wrap!.startServer(props, (err) => {
        if (err) reject(err);
        else {
          this.ready = true;
          resolve();
        }
      });
    });

    // Wait a moment for server to stabilize
    await new Promise((r) => setTimeout(r, 500));
  }

  async stop(): Promise<void> {
    if (!this.wrap) return;

    await new Promise<void>((resolve, reject) => {
      this.wrap!.stopServer((err) => {
        if (err) console.error('Error stopping server:', err);

        this.wrap!.deleteServerData((delErr) => {
          if (delErr) console.error('Error deleting server data:', delErr);
          this.ready = false;
          resolve();
        });
      });
    });
  }

  async executeCommand(command: string): Promise<void> {
    if (!this.wrap) throw new Error('Server not started');
    // Java server console commands don't use slash prefix
    this.wrap.writeServer(command + '\n');
  }

  async writeConsole(text: string): Promise<void> {
    if (!this.wrap) throw new Error('Server not started');
    this.wrap.writeServer(text);
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

    // Wait for new output
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.outputListeners.findIndex((l) => l.resolve === resolve);
        if (idx !== -1) this.outputListeners.splice(idx, 1);
        reject(new Error(`Timeout waiting for pattern: ${pattern}`));
      }, timeout);

      this.outputListeners.push({
        pattern,
        resolve: (match) => {
          clearTimeout(timer);
          resolve(match);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
    });
  }

  isReady(): boolean {
    return this.ready;
  }

  async opPlayer(username: string): Promise<void> {
    await this.executeCommand(`op ${username}`);
  }
}
