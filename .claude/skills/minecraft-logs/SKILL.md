---
name: minecraft-logs
description: Capture Minecraft Bedrock network packets using a proxy relay. Start packet capture, save raw binary dumps and processed JSON logs. Use when debugging Bedrock protocol, analyzing bot behavior, or recording gameplay packets.
allowed-tools: Read, Glob, Grep, Bash
---

# Minecraft Bedrock Packet Capture

Capture Bedrock Edition network packets using a proxy relay between the game client and server.

## Quick Start

```bash
# Start packet capture proxy with defaults
npm run start --workspace=minecraft-logs-recorder

# Or directly
node packages/minecraft-logs-recorder/src/dump-packets.ts
```

Connect Minecraft Bedrock to `localhost:19150` - packets will be relayed to `localhost:19198` and logged.

## CLI Options

```bash
node packages/minecraft-logs-recorder/src/dump-packets.ts [OPTIONS]

OPTIONS:
  --listen-host <host>   Proxy listen host (default: 0.0.0.0)
  -l, --listen-port <port>   Proxy listen port (default: 19150)
  -d, --dest-host <host>     Destination server host (default: 127.0.0.1)
  -p, --dest-port <port>     Destination server port (default: 19198)
  -v, --version <ver>        Protocol version (default: 1.21.130)
  --offline                  Offline auth (default)
  --online                   Online authentication
  --profiles <path>          Profiles folder (default: ./profiles)
  -o, --log-dir <path>       Output directory (default: ./logs)
  -h, --help                 Show help
```

## Output Files

Both files share the same base name:

| File | Format | Purpose |
|------|--------|---------|
| `{version}-{timestamp}.bin` | Binary | Raw packets for replay |
| `{version}-{timestamp}.jsonl` | JSON Lines | Processed packet data |

Filename format: `{version}-{yyyy-mm-dd-{seconds}}` (e.g., `1.21.130-2025-01-02-43200`)

## Common Scenarios

### Capture from BDS Server
```bash
node packages/minecraft-logs-recorder/src/dump-packets.ts \
  -d 127.0.0.1 -p 19132 -o ./captures
```

### Capture with Online Auth
```bash
node packages/minecraft-logs-recorder/src/dump-packets.ts \
  --online --profiles ~/.minecraft-profiles
```

### Custom Listen Port
```bash
node packages/minecraft-logs-recorder/src/dump-packets.ts -l 19160
```

## JSONL Log Format

```json
{"t":1234,"tick":100,"d":"C","p":"player_action","action":"start_break","pos":[50,64,100]}
{"t":1235,"tick":100,"d":"S","p":"inventory_slot","window":"inventory","slot":0,"item":"diamond_pickaxe"}
```

Fields:
- `t` - Milliseconds since capture start
- `tick` - Game tick
- `d` - Direction: `C`=client→server, `S`=server→client
- `p` - Packet name

## Analyzing Captured Logs

### Using Custom Analyzer

To analyze with a specific tool, provide the log file path:

```bash
# Example: custom analyzer script
python your-analyzer.py logs/1.21.130-2025-01-02-43200.jsonl

# Example: jq for JSON processing
cat logs/*.jsonl | jq -c 'select(.p=="item_stack_response")'
```

### Quick Analysis Commands

```bash
# List captured logs
ls -la logs/*.jsonl logs/*.bin

# Count packets by type
grep -o '"p":"[^"]*"' logs/*.jsonl | sort | uniq -c | sort -rn

# Find specific packets
grep '"p":"inventory_transaction"' logs/*.jsonl

# Show timeline (first 20 packets)
head -20 logs/*.jsonl
```

## Binary Replay

Use `.bin` files to replay captured sessions:

```typescript
import { createReplayClient } from 'minecraft-logs-recorder/replay';

const client = createReplayClient('logs/1.21.130-2025-01-02-43200.bin');
client.on('inventory_slot', (params) => {
  console.log('Inventory slot update:', params);
});
```

## Available Analyzers

| Analyzer | Description | Logged Packets |
|----------|-------------|----------------|
| `InventoryAnalyzer` | Inventory operations | `inventory_slot`, `inventory_content`, `inventory_transaction`, `item_stack_request/response`, `mob_equipment`, `player_action`, `animate` |

### Using Analyzers Directly

```typescript
import { InventoryAnalyzer } from 'minecraft-logs-analyzers';

const analyzer = new InventoryAnalyzer('logs/my-capture');
analyzer.attachToBot(client);
// ... on disconnect:
analyzer.close();
```

## Package Structure

| Package | Purpose |
|---------|---------|
| `minecraft-logs-recorder` | Packet capture proxy + replay |
| `minecraft-logs-analyzers` | Analyzer classes + types |

## Related Skills

- Use `/create-analyzer` to create new domain-specific analyzers
