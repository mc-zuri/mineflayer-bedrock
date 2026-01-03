#!/usr/bin/env node
import bedrockProtocol, { type Player, type Version } from 'bedrock-protocol';
const { Relay } = bedrockProtocol;

import { PlayerAuthInputAnalyzer, type IPacketLogger } from 'minecraft-logs-analyzers';
import { PacketDumpWriter } from 'minecraft-bedrock-server';

// ============================================================================
// Utilities
// ============================================================================

/** Format timestamp as yyyy-mm-dd-{seconds since midnight} */
function formatTimestamp(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const secondsSinceMidnight = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return `${yyyy}-${mm}-${dd}-${secondsSinceMidnight}`;
}

// ============================================================================
// Configuration
// ============================================================================

interface DumpPacketsConfig {
  listenHost: string;
  listenPort: number;
  destHost: string;
  destPort: number;
  version: string;
  offline: boolean;
  profilesFolder: string;
  logDir: string;
}

const DEFAULTS: DumpPacketsConfig = {
  listenHost: '0.0.0.0',
  listenPort: 19150,
  destHost: '127.0.0.1',
  destPort: 19198,
  version: '1.21.130',
  offline: true,
  profilesFolder: './profiles',
  logDir: './logs',
};

// ============================================================================
// Argument Parsing
// ============================================================================

const ARG_MAP: Record<string, keyof DumpPacketsConfig> = {
  '--listen-host': 'listenHost',
  '--listen-port': 'listenPort',
  '-l': 'listenPort',
  '--dest-host': 'destHost',
  '-d': 'destHost',
  '--dest-port': 'destPort',
  '-p': 'destPort',
  '--version': 'version',
  '-v': 'version',
  '--profiles': 'profilesFolder',
  '--log-dir': 'logDir',
  '-o': 'logDir',
};

function parseArgs(args: string[]): DumpPacketsConfig {
  const config = { ...DEFAULTS };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Help flag
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    // Boolean flags
    if (arg === '--offline') {
      config.offline = true;
      continue;
    }
    if (arg === '--online') {
      config.offline = false;
      continue;
    }

    // Handle --key=value format
    if (arg.includes('=')) {
      const [key, value] = arg.split('=', 2);
      const configKey = ARG_MAP[key];
      if (configKey) {
        setConfigValue(config, configKey, value);
      }
      continue;
    }

    // Handle --key value format
    const configKey = ARG_MAP[arg];
    if (configKey && i + 1 < args.length) {
      setConfigValue(config, configKey, args[++i]);
    }
  }

  return config;
}

function setConfigValue(config: DumpPacketsConfig, key: keyof DumpPacketsConfig, value: string): void {
  if (key === 'listenPort' || key === 'destPort') {
    (config as any)[key] = parseInt(value, 10);
  } else if (key === 'offline') {
    (config as any)[key] = value === 'true';
  } else {
    (config as any)[key] = value;
  }
}

function printHelp(): void {
  console.log(`
dump-packets - Minecraft Bedrock packet capture relay

USAGE:
  npx dump-packets [OPTIONS]
  node dump-packets.ts [OPTIONS]

OPTIONS:
  --listen-host <host>       Host for relay to listen on (default: ${DEFAULTS.listenHost})
  -l, --listen-port <port>   Port for relay to listen on (default: ${DEFAULTS.listenPort})
  -d, --dest-host <host>     Destination server host (default: ${DEFAULTS.destHost})
  -p, --dest-port <port>     Destination server port (default: ${DEFAULTS.destPort})
  -v, --version <ver>        Bedrock protocol version (default: ${DEFAULTS.version})
  --offline                  Use offline authentication (default)
  --online                   Use online authentication
  --profiles <path>          Profiles folder path (default: ${DEFAULTS.profilesFolder})
  -o, --log-dir <path>       Output directory for logs (default: ${DEFAULTS.logDir})
  -h, --help                 Show this help message

EXAMPLES:
  # Run with defaults
  npx dump-packets

  # Custom destination server
  npx dump-packets --dest-host 192.168.1.100 --dest-port 19132

  # Custom listen port
  npx dump-packets -l 19160

  # Online mode with custom profiles
  npx dump-packets --online --profiles ~/.minecraft-profiles

OUTPUT:
  {log-dir}/{version}-{timestamp}.bin    Binary packet dump
  {log-dir}/{version}-{timestamp}.jsonl  JSON Lines packet log
`);
}

// ============================================================================
// Main
// ============================================================================

main();

function main(): void {
  const config = parseArgs(process.argv.slice(2));

  console.log('Starting packet dump relay with config:');
  console.log(`  Listen: ${config.listenHost}:${config.listenPort}`);
  console.log(`  Destination: ${config.destHost}:${config.destPort}`);
  console.log(`  Version: ${config.version}`);
  console.log(`  Auth: ${config.offline ? 'offline' : 'online'}`);
  console.log(`  Profiles: ${config.profilesFolder}`);
  console.log(`  Log dir: ${config.logDir}`);
  console.log();

  start(config);
}

function start(config: DumpPacketsConfig): void {
  const version: Version = config.version as Version;
  const relay = new Relay({
    version,
    host: config.listenHost,
    port: config.listenPort,
    offline: config.offline,
    enableChunkCaching: false,
    destination: {
      host: config.destHost,
      port: config.destPort,
      offline: config.offline,
    },
    profilesFolder: config.profilesFolder,
    omitParseErrors: true,
  });

  relay.on('connect', (player: Player) => {
    console.log('Client connected, starting packet capture...');

    // Generate shared base path for both log files
    const basePath = `${config.logDir}/${config.version}-${formatTimestamp()}`;
    const logger: IPacketLogger = new PlayerAuthInputAnalyzer(basePath);
    const writter = new PacketDumpWriter(basePath, config.version);

    console.log(`  Writing to: ${basePath}.bin`);
    console.log(`  Writing to: ${basePath}.jsonl`);

    player.on('clientbound', (_, des) => {
      logger.log('S', des.data.name, des.data.params);
      writter.writeClientbound(des.fullBuffer);
    });

    player.on('serverbound', (_, des) => {
      logger.log('C', des.data.name, des.data.params);
      writter.writeServerbound(des.fullBuffer);
    });

    player.on('close', () => {
      console.log('Client disconnected, closing logger...');
      logger.close();
      writter.close();
    });
  });

  relay.listen();
  console.log(`Relay listening on ${config.listenHost}:${config.listenPort}`);
}
