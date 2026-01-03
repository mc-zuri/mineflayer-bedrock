#!/usr/bin/env node
/**
 * Generate packets directory and internal-server-data.ts from a binary dump file.
 *
 * Usage:
 *   node --experimental-strip-types scripts/generate-packets.ts <dump.bin> [output-dir]
 *
 * The dump.bin file is created by minecraft-logs-recorder's dump-packets command.
 *
 * Example:
 *   node --experimental-strip-types scripts/generate-packets.ts ./logs/1.21.130-dump.bin ./packets
 */

import * as fs from 'fs';
import * as path from 'path';
import { PacketDumpReader } from '../src/common/packet-dump-reader.ts';

// Packets that should be stored as binary (too large for inline JS)
const BINARY_PACKETS = new Set([
  'biome_definition_list',
  'available_entity_identifiers',
  'available_commands',
  'crafting_data',
  'creative_content',
  'item_registry',
  'jigsaw_structure_data',
  'player_list',
  'unlocked_recipes',
]);

// Packets to skip (not needed for mock server or too dynamic)
const SKIP_PACKETS = new Set([
  'level_chunk',
  'sub_chunk',
  'subchunk',
  'update_block',
  'add_entity',
  'add_item_entity',
  'client_cache_blob_status',
  'client_cache_miss_response',
  'player_auth_input',
  'move_entity_data',
  'move_entity_delta',
  'set_actor_data',
  'network_stack_latency',
  'tick_sync',
  'server_to_client_handshake',
]);

// Packets to keep only the first occurrence (no duplicates)
const UNIQUE_ONLY_PACKETS = new Set([
  'network_chunk_publisher_update',
  'current_structure_feature',
]);

// Packets to filter by player runtime_entity_id only
const PLAYER_ENTITY_PACKETS = new Set([
  'set_entity_data',
  'sync_entity_property',
]);

// Packets after which we should waitFor a response
const WAIT_AFTER_PACKETS: Record<string, string> = {
  'resource_packs_info': 'resource_pack_client_response',
  'resource_pack_stack': 'resource_pack_client_response',
  'available_commands': 'serverbound_loading_screen',
};

// Threshold for detecting sleep gaps (ms)
const SLEEP_THRESHOLD_MS = 15;

interface PacketEntry {
  name: string;
  exportName: string;
  params: any;
  buffer?: Buffer;
  isBinary: boolean;
  count: number;
}

interface SequenceAction {
  type: 'sleep' | 'waitFor' | 'write' | 'queue' | 'levelChunks';
  packetName?: string;
  exportName?: string;
  ms?: number;
  distance?: number;
}

function sanitizeExportName(name: string, count: number): string {
  const base = name.replace(/-/g, '_');
  return count > 1 ? `${base}_${count}` : base;
}

function serializeValue(value: any, indent: number = 0): string {
  const spaces = '  '.repeat(indent);
  const nextSpaces = '  '.repeat(indent + 1);

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (typeof value === 'bigint') {
    return `${value}n`;
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'NaN';
    if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
    return String(value);
  }

  if (typeof value === 'string') {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `"${escaped}"`;
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  if (Buffer.isBuffer(value)) {
    return `Buffer.from([${Array.from(value).join(', ')}])`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length <= 3 && value.every(v => typeof v !== 'object' || v === null)) {
      return `[${value.map(v => serializeValue(v, 0)).join(', ')}]`;
    }
    const items = value.map(v => `${nextSpaces}${serializeValue(v, indent + 1)}`).join(',\n');
    return `[\n${items},\n${spaces}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';

    const props = entries.map(([key, val]) => {
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      return `${nextSpaces}${safeKey}: ${serializeValue(val, indent + 1)}`;
    }).join(',\n');
    return `{\n${props},\n${spaces}}`;
  }

  return String(value);
}

function generateTsFile(entry: PacketEntry): string {
  if (entry.isBinary) {
    return `import { readFileSync } from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const data = readFileSync(path.resolve(__dirname, '${entry.name}.bin'));
export function ${entry.exportName}(deserializer) {
  return deserializer.parsePacketBuffer(data).data.params;
}
`;
  }

  return `export function ${entry.exportName}() {
  return ${serializeValue(entry.params, 1)};
}
`;
}

function generateIndex(entries: PacketEntry[]): string {
  const exports = entries.map(e => {
    return `export { ${e.exportName} } from './${e.exportName}.ts';`;
  });
  return exports.join('\n') + '\n';
}

function generateInternalServerData(
  packets: Map<string, PacketEntry>,
  sequence: SequenceAction[],
  usedPackets: Set<string>
): string {
  const usedEntries = Array.from(packets.values()).filter(e => usedPackets.has(e.exportName));

  // Generate sequence array
  const sequenceLines = sequence.map(action => {
    switch (action.type) {
      case 'sleep':
        return `  { type: "sleep", ms: ${action.ms} },`;
      case 'waitFor':
        return `  { type: "waitFor", packetName: "${action.packetName}" },`;
      case 'write':
        return `  { type: "write", packetName: "${action.exportName}" },`;
      case 'queue':
        return `  { type: "queue", packetName: "${action.exportName}" },`;
      case 'levelChunks':
        return `  { type: "levelChunks", distance: ${action.distance} },`;
    }
  }).join('\n');

  // Generate packet loading
  const packetLoads = usedEntries.map(e => {
    if (e.isBinary) {
      return `  const ${e.exportName} = packets.${e.exportName}(deserializer);`;
    }
    return `  const ${e.exportName} = packets.${e.exportName}();`;
  }).join('\n');

  // Generate data object entries
  const dataEntries = usedEntries.map(e => `    ${e.exportName},`).join('\n');

  return `import { createDeserializer, createSerializer } from "bedrock-protocol/src/transforms/serializer.js";
import * as packets from "../../packets/index.ts";
import registryLoader, { type RegistryBedrock } from "prismarine-registry";
import itemLoader, { type Item } from "prismarine-item";

// Subchunk payload data for responding to subchunk requests
export const subchunkPayloads: Record<number, Buffer> = {
  [-4]: Buffer.from(
    "0901fc03fefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffeff04898c9ca501bdc7f7fc0f",
    "hex"
  ),
  [-3]: Buffer.from("0901fd01bdc7f7fc0f", "hex"),
  [-2]: Buffer.from("0901fe01bdc7f7fc0f", "hex"),
  [-1]: Buffer.from(
    "0901ff050000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009506bdc7f7fc0ff3c188db0f97ddf69c04",
    "hex"
  ),
};

// Level chunk payload for flat world
export const levelChunkPayload = Buffer.from(
  "0102010201020102ffffffffffffffffffffffffffffffffffffffff00",
  "hex"
);

// Packet sequence action types
export type PacketAction =
  | { type: "sleep"; ms: number }
  | { type: "waitFor"; packetName: string }
  | { type: "write"; packetName: string }
  | { type: "queue"; packetName: string }
  | { type: "levelChunks"; distance: number };

// The packet sequence for initializing a client (generated from packet dump)
export const initPacketSequence: PacketAction[] = [
${sequenceLines}
];

export function getDataBuilder(version: string) {
  const deserializer = createDeserializer(version);
  const serializer = createSerializer(version);
  let registry = registryLoader(\`bedrock_\${version}\`) as RegistryBedrock;
  let item = (itemLoader as any)(registry) as typeof Item;

  function toNotch(
    name: string | null,
    count: number,
    stackId: number | undefined
  ): any {
    if (name == null) {
      return { network_id: 0 };
    }
    return item.toNotch(
      new item(
        registry.itemsByName[name].id,
        count,
        undefined,
        undefined,
        stackId
      ),
      stackId !== undefined ? 1: 0
    );
  }

  serializer.proto.setVariable("ShieldItemID", 387);
  deserializer.proto.setVariable("ShieldItemID", 387);

  const inventoryItems = Array(36).fill({ network_id: 0 });

  // Load packets from generated files
${packetLoads}

  registry.handleItemRegistry(item_registry);

  const data = {
    fromHex,
    inventoryItems,
${dataEntries}
  };

  function setArmorSlot(
    slotId: number,
    name: string | null,
    count: number,
    stackId: number | undefined = undefined
  ) {
    data.inventory_content_2.input[slotId] = toNotch(name, count, stackId);
  }

  function setInventoryItem(slot: number,
    name: string | null,
    count: number,
    stackId: number | undefined = undefined) {
    inventoryItems[slot] = toNotch(name, count, stackId);
  }

  function setOffhandSlot(name: string | null, stackId: number | undefined = undefined) {
    data.inventory_content_4.input[0] = toNotch(name, 1, stackId);
  }

  function fromHex(base64String: string) {
    return deserializer.parsePacketBuffer(Buffer.from(base64String, "hex")).data
      .params;
  }

  function normalizePacket(name: string, params: any){
    const newBuffer = serializer.createPacketBuffer({ name, params });
    return deserializer.parsePacketBuffer(newBuffer).data.params;
  }

  return {
    fromHex,
    setArmorSlot,
    setInventoryItem,
    setOffhandSlot,
    toNotch,
    data,
    normalizePacket
  };
}
`;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node --experimental-strip-types scripts/generate-packets.ts <dump.bin> [output-dir]

Arguments:
  dump.bin     Path to the binary dump file (created by minecraft-logs-recorder)
  output-dir   Output directory for packets (default: ./packets)

Options:
  --help, -h   Show this help message
  --dry-run    Show what would be generated without writing files
  --verbose    Show packet details

Example:
  node --experimental-strip-types scripts/generate-packets.ts ./logs/1.21.130-dump.bin ./packets
`);
    process.exit(0);
  }

  const dumpFile = args[0];
  const outputDir = args[1] || './packets';
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  if (!fs.existsSync(dumpFile)) {
    console.error(`Error: Dump file not found: ${dumpFile}`);
    process.exit(1);
  }

  console.log(`Reading dump file: ${dumpFile}`);
  const reader = new PacketDumpReader(dumpFile);
  console.log(`Protocol version: ${reader.version}`);

  const packets = new Map<string, PacketEntry>();
  const packetCounts = new Map<string, number>();
  const contentHashes = new Map<string, string>();
  const sequence: SequenceAction[] = [];
  const usedPackets = new Set<string>();

  let totalPackets = 0;
  let skippedPackets = 0;
  let duplicateContent = 0;
  let playerRuntimeEntityId: bigint | null = null;
  let lastTimestamp: number | null = null;
  let passedLoadingScreen = false; // Track if we've passed serverbound_loading_screen wait

  // Packets that should use 'write' instead of 'queue' (sent before waitFor)
  const WRITE_PACKETS = new Set([
    'resource_packs_info',
    'resource_pack_stack',
  ]);

  // Add initial sleep
  sequence.push({ type: 'sleep', ms: 200 });

  // Read all packets
  let packet;
  while ((packet = reader.read())) {
    totalPackets++;

    const name = packet.data.name;
    const params = packet.data.params;
    const timestamp = packet.timestamp;

    // Skip serverbound packets (we handle waitFor based on clientbound packets)
    if (packet.type === 'S') {
      lastTimestamp = timestamp;
      continue;
    }

    // Only process clientbound packets from here
    if (packet.type !== 'C') continue;

    // Detect sleep gaps (only after we've passed loading screen wait)
    if (lastTimestamp !== null && passedLoadingScreen) {
      const gap = timestamp - lastTimestamp;
      if (gap >= SLEEP_THRESHOLD_MS) {
        const sleepMs = Math.round(gap / 10) * 10;
        if (sleepMs > 0) {
          sequence.push({ type: 'sleep', ms: sleepMs });
          if (verbose) console.log(`  [SLEEP] ${sleepMs}ms`);
        }
      }
    }
    lastTimestamp = timestamp;

    // Extract player runtime_entity_id from start_game
    if (name === 'start_game' && playerRuntimeEntityId === null) {
      playerRuntimeEntityId = params.runtime_entity_id;
      console.log(`Player runtime_entity_id: ${playerRuntimeEntityId}`);
    }

    // Skip unwanted packets
    if (SKIP_PACKETS.has(name)) {
      skippedPackets++;
      continue;
    }

    // Filter player entity packets
    if (PLAYER_ENTITY_PACKETS.has(name)) {
      const entityId = params.runtime_entity_id ?? params.runtime_id;
      if (playerRuntimeEntityId !== null && entityId !== playerRuntimeEntityId) {
        skippedPackets++;
        continue;
      }
    }

    // Track duplicate packet names
    const count = (packetCounts.get(name) || 0) + 1;
    packetCounts.set(name, count);

    // Skip duplicates for unique-only packets
    if (UNIQUE_ONLY_PACKETS.has(name) && count > 1) {
      skippedPackets++;
      continue;
    }

    const exportName = sanitizeExportName(name, count);
    const isBinary = BINARY_PACKETS.has(name);

    // Check for duplicate content
    const contentKey = packet.buffer.toString('base64');
    if (contentHashes.has(contentKey)) {
      if (verbose) {
        console.log(`  [DUP] ${name} (${exportName}) - same as ${contentHashes.get(contentKey)}`);
      }
      // Still add to sequence but use the existing export name
      const existingExportName = contentHashes.get(contentKey)!;
      const actionType = WRITE_PACKETS.has(name) ? 'write' : 'queue';
      sequence.push({ type: actionType, packetName: name, exportName: existingExportName });
      usedPackets.add(existingExportName);
      duplicateContent++;
      continue;
    }
    contentHashes.set(contentKey, exportName);

    if (verbose) {
      console.log(`  ${packet.type} ${name} (${exportName}) - ${packet.buffer.length} bytes`);
    }

    packets.set(exportName, {
      name,
      exportName,
      params: packet.data.params,
      buffer: isBinary ? packet.buffer : undefined,
      isBinary,
      count,
    });

    // Use 'write' for resource packs, 'queue' for everything else
    const actionType = WRITE_PACKETS.has(name) ? 'write' : 'queue';
    sequence.push({ type: actionType, packetName: name, exportName });
    usedPackets.add(exportName);

    // Add waitFor after specific packets
    if (name in WAIT_AFTER_PACKETS) {
      const waitForPacket = WAIT_AFTER_PACKETS[name];
      sequence.push({ type: 'waitFor', packetName: waitForPacket });
      if (waitForPacket === 'serverbound_loading_screen') {
        passedLoadingScreen = true;
      }
      if (verbose) console.log(`  [WAIT] ${waitForPacket}`);
    }
  }

  reader.close();

  // Add level chunks action after update_attributes_2
  const ua2Index = sequence.findIndex(a => a.exportName === 'update_attributes_2');
  if (ua2Index !== -1) {
    sequence.splice(ua2Index + 1, 0, { type: 'levelChunks', distance: 6 });
  }

  console.log(`\nProcessed ${totalPackets} packets, ${skippedPackets} skipped, ${duplicateContent} duplicate content, ${packets.size} unique for output`);
  console.log(`Sequence: ${sequence.length} actions, ${usedPackets.size} packets used`);

  if (dryRun) {
    console.log('\nDry run - would generate:');
    for (const [exportName, entry] of packets) {
      console.log(`  ${exportName}.ts${entry.isBinary ? ' + .bin' : ''}`);
    }
    console.log('  index.ts');
    console.log('  src/internal/internal-server-data.ts');
    return;
  }

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate packet files
  let generated = 0;
  for (const [exportName, entry] of packets) {
    const tsContent = generateTsFile(entry);
    const tsPath = path.join(outputDir, `${exportName}.ts`);
    fs.writeFileSync(tsPath, tsContent);
    generated++;

    if (entry.isBinary && entry.buffer) {
      const binPath = path.join(outputDir, `${entry.name}.bin`);
      fs.writeFileSync(binPath, entry.buffer);
    }

    if (verbose) {
      console.log(`  Generated: ${exportName}.ts${entry.isBinary ? ' + .bin' : ''}`);
    }
  }

  // Generate index.ts
  const indexContent = generateIndex(Array.from(packets.values()));
  const indexPath = path.join(outputDir, 'index.ts');
  fs.writeFileSync(indexPath, indexContent);

  // Generate internal-server-data.ts
  const dataContent = generateInternalServerData(packets, sequence, usedPackets);
  const dataPath = path.resolve(outputDir, '../src/internal/internal-server-data.ts');
  fs.writeFileSync(dataPath, dataContent);

  console.log(`\nGenerated ${generated} packet files + index.ts in ${outputDir}`);
  console.log(`Generated src/internal/internal-server-data.ts`);
}

main().catch(console.error);
