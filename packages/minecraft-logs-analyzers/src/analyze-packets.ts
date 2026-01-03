#!/usr/bin/env node
import * as fs from "fs";
import * as readline from "readline";

interface LogEntry {
  t: number;
  tick?: number;
  d: "C" | "S";
  p: string;
  [key: string]: any;
}

interface AnalysisResult {
  totalPackets: number;
  packetsByType: Record<string, number>;
  packetsByDirection: { C: number; S: number };
  duration: number;
  tickRange: { min: number; max: number };
  errors: string[];
}

async function analyzeFile(filePath: string): Promise<AnalysisResult> {
  const result: AnalysisResult = {
    totalPackets: 0,
    packetsByType: {},
    packetsByDirection: { C: 0, S: 0 },
    duration: 0,
    tickRange: { min: Infinity, max: -Infinity },
    errors: [],
  };

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let minTime = Infinity;
  let maxTime = -Infinity;

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const entry: LogEntry = JSON.parse(line);
      result.totalPackets++;

      // Count by packet type
      result.packetsByType[entry.p] = (result.packetsByType[entry.p] || 0) + 1;

      // Count by direction
      if (entry.d === "C" || entry.d === "S") {
        result.packetsByDirection[entry.d]++;
      }

      // Track time range
      if (entry.t !== undefined) {
        minTime = Math.min(minTime, entry.t);
        maxTime = Math.max(maxTime, entry.t);
      }

      // Track tick range
      if (entry.tick !== undefined) {
        result.tickRange.min = Math.min(result.tickRange.min, entry.tick);
        result.tickRange.max = Math.max(result.tickRange.max, entry.tick);
      }

      // Check for errors in responses
      if (entry.p === "item_stack_response" && entry.responses) {
        for (const resp of entry.responses) {
          if (resp.status !== 0) {
            result.errors.push(`Request ${resp.reqId} failed with status ${resp.status} at t=${entry.t}`);
          }
        }
      }
    } catch (err) {
      // Skip invalid lines
    }
  }

  result.duration = maxTime - minTime;

  if (result.tickRange.min === Infinity) {
    result.tickRange = { min: 0, max: 0 };
  }

  return result;
}

function printResults(result: AnalysisResult): void {
  console.log("\n=== Packet Analysis ===\n");

  console.log(`Total packets: ${result.totalPackets}`);
  console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
  console.log(`Tick range: ${result.tickRange.min} - ${result.tickRange.max}`);
  console.log();

  console.log("Direction:");
  console.log(`  Client → Server: ${result.packetsByDirection.C}`);
  console.log(`  Server → Client: ${result.packetsByDirection.S}`);
  console.log();

  console.log("Packets by type:");
  const sorted = Object.entries(result.packetsByType)
    .sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sorted) {
    console.log(`  ${type}: ${count}`);
  }

  if (result.errors.length > 0) {
    console.log();
    console.log("Errors found:");
    for (const error of result.errors.slice(0, 10)) {
      console.log(`  ${error}`);
    }
    if (result.errors.length > 10) {
      console.log(`  ... and ${result.errors.length - 10} more`);
    }
  }
}

function printHelp(): void {
  console.log(`
analyze-packets - Analyze Minecraft Bedrock packet logs

USAGE:
  node analyze-packets.ts <logfile.jsonl>
  npx analyze-packets <logfile.jsonl>

EXAMPLES:
  node analyze-packets.ts logs/1.21.130-2025-01-02-43200.jsonl

OUTPUT:
  - Total packet count
  - Duration of capture
  - Packets by type (sorted by frequency)
  - Direction breakdown (client vs server)
  - Failed item_stack_response errors
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Analyzing: ${filePath}`);
  const result = await analyzeFile(filePath);
  printResults(result);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
