#!/usr/bin/env node
import { PacketDumpReader } from 'minecraft-bedrock-test-server';
import { minimatch } from 'minimatch';

interface Options {
  file: string;
  tick?: number;
  tickStart?: number;
  tickEnd?: number;
  namesOnly: boolean;
  include: string[];
  exclude: string[];
  direction?: 'C' | 'S';
  help: boolean;
}

function printHelp() {
  console.log(`
Usage: npm run read-log -- <file.bin> [options]

Read and filter .bin packet log files.

Options:
  --tick <n>              Show packets at specific tick
  --tick-start <n>        Start tick (inclusive)
  --tick-end <n>          End tick (inclusive)
  --names                 Output packet names only (default)
  --full                  Output full packet data (JSON)
  --include <pattern>     Include only matching packets (glob, comma-separated)
  --exclude <pattern>     Exclude matching packets (glob, comma-separated)
  --direction <C|S>       Filter by direction (C=client->server, S=server->client)
  -h, --help              Show help

Examples:
  # List all packet names at tick 100
  npm run read-log -- logs/capture.bin --tick 100

  # Show full packets from tick 50-100, excluding player_auth_input
  npm run read-log -- logs/capture.bin --tick-start 50 --tick-end 100 --full --exclude player_auth_input

  # Show only inventory-related packets
  npm run read-log -- logs/capture.bin --include 'inventory_*,item_stack_*'

  # Show clientbound packets only
  npm run read-log -- logs/capture.bin --direction C
`);
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    file: '',
    namesOnly: true,
    include: [],
    exclude: [],
    help: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      options.help = true;
      i++;
    } else if (arg === '--tick') {
      options.tick = parseInt(args[++i], 10);
      i++;
    } else if (arg === '--tick-start') {
      options.tickStart = parseInt(args[++i], 10);
      i++;
    } else if (arg === '--tick-end') {
      options.tickEnd = parseInt(args[++i], 10);
      i++;
    } else if (arg === '--names') {
      options.namesOnly = true;
      i++;
    } else if (arg === '--full') {
      options.namesOnly = false;
      i++;
    } else if (arg === '--include') {
      options.include.push(...args[++i].split(','));
      i++;
    } else if (arg === '--exclude') {
      options.exclude.push(...args[++i].split(','));
      i++;
    } else if (arg === '--direction') {
      const dir = args[++i].toUpperCase();
      if (dir === 'C' || dir === 'S') {
        options.direction = dir;
      } else {
        console.error(`Invalid direction: ${dir}. Use C or S.`);
        process.exit(1);
      }
      i++;
    } else if (!arg.startsWith('-')) {
      options.file = arg;
      i++;
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  return options;
}

function matchesPattern(name: string, patterns: string[]): boolean {
  if (patterns.length === 0) return false;
  return patterns.some((pattern) => minimatch(name, pattern));
}

function shouldInclude(name: string, include: string[], exclude: string[]): boolean {
  // If include patterns specified, must match at least one
  if (include.length > 0 && !matchesPattern(name, include)) {
    return false;
  }
  // If exclude patterns specified, must not match any
  if (exclude.length > 0 && matchesPattern(name, exclude)) {
    return false;
  }
  return true;
}

function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help || !options.file) {
    printHelp();
    process.exit(options.help ? 0 : 1);
  }

  // Set tick range from single tick if specified
  if (options.tick !== undefined) {
    options.tickStart = options.tick;
    options.tickEnd = options.tick;
  }

  let reader: PacketDumpReader;
  try {
    reader = new PacketDumpReader(options.file);
  } catch (e) {
    console.error(`Failed to open file: ${options.file}`);
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }

  console.error(`Reading: ${options.file} (version: ${reader.version})`);

  let currentTick = 0;
  let packetCount = 0;
  let filteredCount = 0;

  while (reader.canRead()) {
    const packet = reader.read();
    if (!packet) break;

    packetCount++;
    const { data, type } = packet;
    const name = data.name;

    // Update tick from player_auth_input
    if (name === 'player_auth_input') {
      currentTick = (data.params as any).tick ?? currentTick;
    }

    // Apply tick filter
    if (options.tickStart !== undefined && currentTick < options.tickStart) {
      continue;
    }
    if (options.tickEnd !== undefined && currentTick > options.tickEnd) {
      // Past end tick, stop reading
      break;
    }

    // Apply direction filter
    if (options.direction && type !== options.direction) {
      continue;
    }

    // Apply include/exclude filters
    if (!shouldInclude(name, options.include, options.exclude)) {
      continue;
    }

    filteredCount++;

    if (options.namesOnly) {
      console.log(`tick:${currentTick} ${type} ${name}`);
    } else {
      // BigInt replacer for JSON.stringify
      const replacer = (_key: string, value: unknown) =>
        typeof value === 'bigint' ? value.toString() : value;
      console.log(
        JSON.stringify({
          tick: currentTick,
          d: type,
          p: name,
          params: data.params,
        }, replacer)
      );
    }
  }

  reader.close();
  console.error(`\nTotal: ${packetCount} packets, Shown: ${filteredCount}`);
}

main();
