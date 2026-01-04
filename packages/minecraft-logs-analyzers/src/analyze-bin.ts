#!/usr/bin/env node
/**
 * Process a .bin packet dump file through an analyzer to produce .jsonl output
 * Usage: npx tsx analyze-bin.ts <analyzer> <input.bin> [output-base-path]
 */
import { PacketDumpReader } from 'minecraft-bedrock-test-server';
import { BedAnalyzer } from './analyzers/bed.ts';
import { BookAnalyzer } from './analyzers/book.ts';
import { CraftingAnalyzer } from './analyzers/crafting.ts';
import { InventoryAnalyzer } from './analyzers/inventory.ts';
import { FishingAnalyzer } from './analyzers/fishing.ts';
import { VillagerAnalyzer } from './analyzers/villager.ts';
import { PlaceBlockAnalyzer } from './analyzers/place-block.ts';
import { PlaceEntityAnalyzer } from './analyzers/place-entity.ts';
import { CreativeAnalyzer } from './analyzers/creative.ts';
import { ConsumeAnalyzer } from './analyzers/consume.ts';
import { ScoreboardAnalyzer } from './analyzers/scoreboard.ts';
import { TitleAnalyzer } from './analyzers/title.ts';

const ANALYZERS: Record<string, new (basePath: string) => any> = {
  bed: BedAnalyzer,
  book: BookAnalyzer,
  crafting: CraftingAnalyzer,
  inventory: InventoryAnalyzer,
  fishing: FishingAnalyzer,
  villager: VillagerAnalyzer,
  'place-block': PlaceBlockAnalyzer,
  'place-entity': PlaceEntityAnalyzer,
  creative: CreativeAnalyzer,
  consume: ConsumeAnalyzer,
  scoreboard: ScoreboardAnalyzer,
  title: TitleAnalyzer,
};

function printHelp() {
  console.log(`
Usage: npx tsx analyze-bin.ts <analyzer> <input.bin> [output-base-path]

Process a .bin packet dump file through an analyzer.

Available analyzers:
  bed          - Bed placement and sleeping packets
  book         - Book editing and lectern packets
  crafting     - Crafting-related packets
  consume      - Eating, drinking, feeding packets
  creative     - Creative mode inventory packets
  fishing      - Fishing rod, bobber, and catch packets
  inventory    - Inventory and container packets
  villager     - Villager trading packets
  place-block  - Block placement and breaking packets
  place-entity - Entity placement (boats, minecarts, armor stands, frames)
  scoreboard   - Scoreboard objectives and scores packets
  title        - Title, subtitle, actionbar packets

Examples:
  npx tsx analyze-bin.ts bed ./capture.bin ./output/capture
  npx tsx analyze-bin.ts crafting logs/1.21.130-test.bin

Output will be saved as <output-base-path>-<analyzer>.jsonl
If output-base-path is not specified, uses input filename without .bin extension.
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2 || args[0] === '-h' || args[0] === '--help') {
    printHelp();
    process.exit(args[0] === '-h' || args[0] === '--help' ? 0 : 1);
  }

  const [analyzerName, inputFile, outputBase] = args;

  const AnalyzerClass = ANALYZERS[analyzerName];
  if (!AnalyzerClass) {
    console.error(`Unknown analyzer: ${analyzerName}`);
    console.error(`Available: ${Object.keys(ANALYZERS).join(', ')}`);
    process.exit(1);
  }

  // Determine output base path
  const basePath = outputBase || inputFile.replace(/\.bin$/, '');

  let reader: PacketDumpReader;
  try {
    reader = new PacketDumpReader(inputFile);
  } catch (e) {
    console.error(`Failed to open file: ${inputFile}`);
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }

  console.error(`Reading: ${inputFile} (version: ${reader.version})`);
  console.error(`Analyzer: ${analyzerName}`);
  console.error(`Output: ${basePath}-${analyzerName}.jsonl`);

  const analyzer = new AnalyzerClass(basePath);

  // Force enable the analyzer (normally waits for play_status)
  (analyzer as any).enabled = true;

  let packetCount = 0;
  let currentTick = 0;

  while (reader.canRead()) {
    const packet = reader.read();
    if (!packet) break;

    packetCount++;
    const { data, type } = packet;
    const name = data.name;
    const direction = type === 'C' ? 'C' : 'S';

    // Update tick from player_auth_input
    if (name === 'player_auth_input') {
      currentTick = (data.params as any).tick ?? currentTick;
      (analyzer as any).lastTick = currentTick;
    }

    // Log through analyzer
    analyzer.log(direction, name, data.params);
  }

  reader.close();
  analyzer.close();

  console.error(`\nProcessed ${packetCount} packets`);
}

main();
