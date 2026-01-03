import { spawn, execSync, type ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Download BDS server if it doesn't exist.
 * Worker 0 downloads; other workers copy from worker 0's installation.
 */
export async function ensureBDSInstalled(version: string, bdsPath: string): Promise<void> {
  const serverExe = path.join(bdsPath, 'bedrock_server.exe');
  const mainBdsPath = `c:/apps/bds-${version}`;
  const mainServerExe = path.join(mainBdsPath, 'bedrock_server.exe');
  const lockFile = path.join(path.dirname(bdsPath), `.bds-download-${version}.lock`);
  const workerId = getWorkerId();

  // Check if already installed
  if (fs.existsSync(serverExe)) {
    return;
  }

  // Workers 1+ copy from main installation
  if (workerId > 0) {
    // Wait for worker 0 to finish downloading if needed
    const maxWait = 5 * 60 * 1000; // 5 minutes
    const start = Date.now();
    while (fs.existsSync(lockFile) && Date.now() - start < maxWait) {
      console.log(`[Worker ${workerId}] Waiting for worker 0 to download BDS...`);
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Copy from main installation
    if (fs.existsSync(mainServerExe)) {
      console.log(`[Worker ${workerId}] Copying BDS from ${mainBdsPath} to ${bdsPath}...`);
      copyDirSync(mainBdsPath, bdsPath);
      console.log(`[Worker ${workerId}] BDS copied successfully`);
      return;
    }

    throw new Error(`BDS not installed at ${mainBdsPath}. Run worker 0 first with autoDownload: true`);
  }

  // Worker 0 downloads
  console.log(`[Worker ${workerId}] BDS not found at ${bdsPath}, downloading version ${version}...`);

  // Create lock file
  fs.mkdirSync(path.dirname(bdsPath), { recursive: true });
  fs.writeFileSync(lockFile, `downloading by worker ${workerId} at ${new Date().toISOString()}`);

  try {
    const url = `https://minecraft.azureedge.net/bin-win/bedrock-server-${version}.zip`;
    const zipPath = path.join(path.dirname(bdsPath), `bedrock-server-${version}.zip`);

    // Download using fetch
    console.log(`Downloading from ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download BDS: ${response.status} ${response.statusText}`);
    }

    // Save to file
    const fileStream = createWriteStream(zipPath);
    await pipeline(response.body as any, fileStream);
    console.log(`Downloaded to ${zipPath}`);

    // Extract using PowerShell (Windows)
    console.log(`Extracting to ${bdsPath}...`);
    fs.mkdirSync(bdsPath, { recursive: true });
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${bdsPath}' -Force"`, {
      stdio: 'inherit',
    });

    // Clean up zip
    fs.unlinkSync(zipPath);
    console.log(`BDS ${version} installed successfully at ${bdsPath}`);
  } finally {
    // Remove lock file
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  }
}

/**
 * Get the worker ID for parallel test execution.
 * Returns 0 for single-threaded execution.
 */
export function getWorkerId(): number {
  return parseInt(process.env.MOCHA_WORKER_ID || '0', 10);
}

/**
 * Get a unique port for this worker.
 * Each worker gets a pair of ports (IPv4 and IPv6).
 */
export function getWorkerPort(basePort = 19132): number {
  return basePort + getWorkerId() * 2;
}

export interface ExternalServerOptions {
  /** Path to existing BDS installation directory */
  bdsPath?: string;
  /** BDS version (used when bdsPath not provided) */
  version?: string;
  /** Server port (default: 19132) */
  port?: number;
  /** Startup timeout in ms (default: 60000) */
  timeout?: number;
  /** World name for isolation */
  worldName?: string;
  /** Game mode */
  gamemode?: 'survival' | 'creative' | 'adventure';
  /** Difficulty level */
  difficulty?: 'peaceful' | 'easy' | 'normal' | 'hard';
  /** Allow cheats for commands like /give */
  allowCheats?: boolean;
  /** Auto-download BDS if not found (default: false) */
  autoDownload?: boolean;
}

export interface ExternalServer {
  host: string;
  port: number;
  version: string;
  /** Stop the server */
  stop(): Promise<void>;
  /** Send a command to the server console (e.g., "give Player diamond 1") */
  sendCommand(command: string): Promise<void>;
  /** Wait for a specific output pattern in server console */
  waitForOutput(pattern: RegExp, timeout?: number): Promise<string>;
}

function getDefaultOptions(): ExternalServerOptions {
  const workerId = getWorkerId();
  const version = '1.21.130';
  // Each worker gets its own BDS directory to avoid server.properties conflicts
  const bdsPath = workerId === 0 ? `c:/apps/bds-${version}` : `c:/apps/bds-${version}-worker${workerId}`;
  return {
    bdsPath,
    version,
    port: getWorkerPort(),
    timeout: 60000,
    worldName: 'Flat',
    gamemode: 'survival',
    difficulty: 'peaceful',
    allowCheats: true,
    autoDownload: false,
  };
}

function updateServerProperties(bdsPath: string, opts: Required<ExternalServerOptions>): void {
  const propsPath = path.join(bdsPath, 'server.properties');
  let content = fs.readFileSync(propsPath, 'utf8');

  const updates: Record<string, string | number | boolean> = {
    'server-port': opts.port,
    'level-name': opts.worldName,
    gamemode: opts.gamemode,
    difficulty: opts.difficulty,
    'allow-cheats': opts.allowCheats,
    'online-mode': false,
    'server-portv6': opts.port + 1,
  };

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;
    if (regex.test(content)) {
      content = content.replace(regex, newLine);
    } else {
      content += `\n${newLine}`;
    }
  }

  fs.writeFileSync(propsPath, content);
}

/**
 * Recursively copy a directory
 */
function copyDirSync(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Recursively remove a directory
 */
function rmDirSync(dir: string): void {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rmDirSync(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  fs.rmdirSync(dir);
}

/**
 * Setup behavior pack for test helper scripts.
 * Installs the test_helper behavior pack and configures permissions.
 */
function setupBehaviorPack(bdsPath: string, worldName: string): void {
  const packUuid = 'a8d43bd0-cffd-4988-949a-5105e14bb5f2';
  const packVersion = [1, 0, 0];

  // Copy behavior pack to development_behavior_packs
  const srcPack = path.resolve(__dirname, '..', '..', 'behavior_packs', 'test_helper');
  const destPack = path.join(bdsPath, 'development_behavior_packs', 'test_helper');

  if (fs.existsSync(srcPack)) {
    //console.log('Installing test_helper behavior pack...');
    // Remove existing to ensure clean state
    rmDirSync(destPack);
    copyDirSync(srcPack, destPack);
  } else {
    console.warn(`Warning: Behavior pack not found at ${srcPack}`);
    return;
  }

  // Create world directory if needed
  const worldPath = path.join(bdsPath, 'worlds', worldName);
  fs.mkdirSync(worldPath, { recursive: true });

  // Enable pack in world_behavior_packs.json
  const packListPath = path.join(worldPath, 'world_behavior_packs.json');
  const packEntry = { pack_id: packUuid, version: packVersion };

  let packs: any[] = [];
  if (fs.existsSync(packListPath)) {
    try {
      packs = JSON.parse(fs.readFileSync(packListPath, 'utf8'));
    } catch {
      packs = [];
    }
  }

  // Add if not already present
  if (!packs.some((p: any) => p.pack_id === packUuid)) {
    packs.push(packEntry);
  }
  fs.writeFileSync(packListPath, JSON.stringify(packs, null, 2));

  // Ensure permissions.json allows Script API
  const configPath = path.join(bdsPath, 'config', 'default');
  fs.mkdirSync(configPath, { recursive: true });
  const permPath = path.join(configPath, 'permissions.json');
  const permissions = {
    allowed_modules: ['@minecraft/server', '@minecraft/server-gametest', '@minecraft/server-ui', '@minecraft/server-admin'],
  };
  fs.writeFileSync(permPath, JSON.stringify(permissions, null, 2));

  // Enable content logging in server.properties for script output
  const propsPath = path.join(bdsPath, 'server.properties');
  let propsContent = fs.readFileSync(propsPath, 'utf8');

  const logUpdates: Record<string, string> = {
    'content-log-console-output-enabled': 'true',
    'content-log-level': 'verbose',
  };

  for (const [key, value] of Object.entries(logUpdates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(propsContent)) {
      propsContent = propsContent.replace(regex, `${key}=${value}`);
    } else {
      propsContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(propsPath, propsContent);
  console.log('Behavior pack setup complete');
}

export async function startExternalServer(options?: ExternalServerOptions): Promise<ExternalServer> {
  const opts = { ...getDefaultOptions(), ...options } as Required<ExternalServerOptions>;
  const workerId = getWorkerId();

  if (workerId > 0) {
    console.log(`[Worker ${workerId}] Starting BDS on port ${opts.port} with world ${opts.worldName}`);
  }

  if (!opts.bdsPath) {
    throw new Error('bdsPath is required - provide path to existing BDS installation');
  }

  // Auto-download BDS if enabled and not found
  if (opts.autoDownload) {
    await ensureBDSInstalled(opts.version, opts.bdsPath);
  }

  const serverExe = path.join(opts.bdsPath, 'bedrock_server.exe');
  if (!fs.existsSync(serverExe)) {
    throw new Error(`BDS executable not found at: ${serverExe}. Set autoDownload: true to auto-download.`);
  }

  // Copy fresh world template to BDS worlds folder
  const templateWorldPath = path.join(__dirname, '..', '..', 'world', 'Flat');
  const serverWorldPath = path.join(opts.bdsPath, 'worlds', opts.worldName);

  if (fs.existsSync(templateWorldPath)) {
    console.log(`Copying fresh world from ${templateWorldPath} to ${serverWorldPath}`);
    // Remove existing world to start fresh
    rmDirSync(serverWorldPath);
    // Copy template world
    copyDirSync(templateWorldPath, serverWorldPath);
  } else {
    console.log(`Warning: Template world not found at ${templateWorldPath}`);
  }

  // Log behavior pack setup
  console.log('Installing test_helper behavior pack...');

  // Update server.properties
  updateServerProperties(opts.bdsPath, opts);

  // Setup behavior pack for test helper commands
  setupBehaviorPack(opts.bdsPath, opts.worldName);

  // Track stdout for command responses
  const outputBuffer: string[] = [];
  const outputListeners: Array<{
    pattern: RegExp;
    resolve: (match: string) => void;
    reject: (err: Error) => void;
  }> = [];

  // Spawn the server process
  const handle: ChildProcess = spawn(serverExe, [], {
    cwd: opts.bdsPath,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Listen to stdout
  handle.stdout?.on('data', (data: Buffer) => {
    const text = data.toString();
    process.stdout.write(text); // Echo to console for debugging

    // Check for pattern matches first - if consumed by listener, don't add to buffer
    let consumed = false;
    for (let i = outputListeners.length - 1; i >= 0; i--) {
      const listener = outputListeners[i];
      if (listener.pattern.test(text)) {
        outputListeners.splice(i, 1);
        listener.resolve(text);
        consumed = true;
      }
    }

    // Only add to buffer if not consumed by a listener
    if (!consumed) {
      outputBuffer.push(text);
    }
  });

  handle.stderr?.on('data', (data: Buffer) => {
    process.stderr.write(data.toString());
  });

  // Wait for server to be ready
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Server did not start within ${opts.timeout}ms`));
    }, opts.timeout);

    const checkReady = (data: Buffer) => {
      const text = data.toString();
      if (text.includes('Server started') || text.includes('IPv4 supported')) {
        clearTimeout(timer);
        handle.stdout?.off('data', checkReady);
        setTimeout(() => resolve(), 500);
      }
    };

    handle.stdout?.on('data', checkReady);

    handle.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    handle.on('exit', (code) => {
      if (code !== 0) {
        clearTimeout(timer);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });

  const externalServer: ExternalServer = {
    host: '127.0.0.1',
    port: opts.port,
    version: opts.version,

    async stop(): Promise<void> {
      return new Promise((resolve) => {
        handle.stdin?.write('stop\n');

        const timer = setTimeout(() => {
          handle.kill('SIGKILL');
          resolve();
        }, 5000);

        handle.on('exit', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    },

    async sendCommand(command: string): Promise<void> {
      if (!handle.stdin) {
        throw new Error('Server stdin not available');
      }
      handle.stdin.write(command + '\n');
    },

    async waitForOutput(pattern: RegExp, timeout = 5000): Promise<string> {
      // Check buffer first and remove matched entry to avoid stale data
      for (let i = 0; i < outputBuffer.length; i++) {
        if (pattern.test(outputBuffer[i])) {
          const match = outputBuffer[i];
          outputBuffer.splice(i, 1); // Remove to prevent stale data on next call
          return match;
        }
      }

      // Wait for new output
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const idx = outputListeners.findIndex((l) => l.resolve === resolve);
          if (idx !== -1) outputListeners.splice(idx, 1);
          reject(new Error(`Timeout waiting for pattern: ${pattern}`));
        }, timeout);

        outputListeners.push({
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
    },
  };

  return externalServer;
}
