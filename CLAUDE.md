# CLAUDE.md


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for migrating Mineflayer (a Minecraft bot framework) to support Bedrock Edition. The project maintains compatibility with the existing Java Edition API while adapting to Bedrock's protocol differences.

**Key Goal**: Implement Bedrock-specific plugins that maintain the same API surface as their Java Edition counterparts, allowing bot code to work across both versions with minimal changes.

## Repository Structure

This is a workspace-based monorepo with packages in `packages/`:

- `packages/mineflayer` - Core bot framework with dual plugin system (Java in `lib/plugins`, Bedrock in `lib/bedrockPlugins`)
- `packages/mineflayer-bedrock` - Bedrock-specific implementation, tools, and example bot
- `packages/mineflayer-bedrock-server` - Mock test server implementation for Bedrock Edition testing
- `packages/minecraft-bedrock-tests` - Integration tests using real Bedrock Dedicated Server (see [docs/minecraft-bedrock-tests.md](docs/minecraft-bedrock-tests.md))
- `packages/minecraft-data` - Game data definitions (blocks, items, entities, protocol schemas)
- `packages/prismarine-*` - Low-level protocol and data handling libraries (chunk, registry, viewer)

## Development Commands

### Running the Project

```bash
# Run with Node.js experimental TypeScript support
npm start
# or
node packages/mineflayer-bedrock/src/main.ts
```

### Testing

**Mineflayer Package:**
```bash
cd packages/mineflayer
npm test              # Run tests with linting
npm run mocha_test    # Run tests without linting
npm run lint          # Run linter only
npm run fix           # Auto-fix linting issues
```

**Bedrock-Specific Tests:**
```bash
# From repository root
npm run test:bedrock  # Run Bedrock Edition tests (uses bedrockTest.mts)
npm run test:bds      # Run BDS integration tests (requires BDS installation)
```

Test files:
- `packages/mineflayer/test/bedrockTest.mts` - Bedrock Edition bot tests (mock server)
- `packages/minecraft-bedrock-tests/test/` - Integration tests with real BDS
- Uses `mineflayer-bedrock-server` package to create mock test server instances

## Plugin Architecture

### Dual Plugin System

The project maintains two parallel plugin systems:

1. **Java Edition Plugins** (`packages/mineflayer/lib/plugins/*.js`)
   - Original JavaScript plugins for Java Edition
   - Well-established, fully functional implementations
   - Serve as reference for Bedrock implementations

2. **Bedrock Edition Plugins** (`packages/mineflayer/lib/bedrockPlugins/*.mts`)
   - TypeScript implementations for Bedrock Edition
   - Must maintain the same API as Java plugins
   - Use `.mts` extension for TypeScript modules

### Plugin Loading

Plugins are loaded in `packages/mineflayer/lib/loader.js`:
- Java plugins: Direct requires from `plugins/` directory
- Bedrock plugins: Loaded from `bedrockPlugins/` with `.default` for ES modules
- Each plugin exports a function: `(bot: Bot, options?: any) => void`

### Current Migration Status (from loader.js)

See `packages/mineflayer/lib/loader.js` for the authoritative status of each plugin. Key implementation priorities:

**Phase 1 (Current Focus)**:
- `inventory.mts` - Core inventory management with window handling, item manipulation, transactions
- `simple_inventory.mts` - High-level inventory operations (equip, toss, etc.)

**Implemented**:
- title (100%)
- breath (100%)
- chat (100%)
- entities (100%)
- experience (100%)
- health (100%)
- kick (100%)
- sound (100%)
- spawn_point (100%)
- And others - see loader.js for complete list

**Pending**:
- Plugins requiring inventory system (chest, craft, creative, enchantment_table, furnace, etc.)
- Plugins requiring client-side calculations (digging, explosion)
- Plugins requiring NBT support (book)

## Key Architectural Patterns

### Inventory System

The inventory system is the most complex part of the migration:

**Java Edition** (`lib/plugins/inventory.js` + `simple_inventory.js`):
- Uses transaction-based window clicking with confirmation packets
- Server confirms each action via `transaction` packets
- Has state management with `stateId` (1.17+) or `actionId` (1.16-)
- Window system from prismarine-windows

**Bedrock Edition** (`lib/bedrockPlugins/inventory.mts` + `simple_inventory.mts`):
- Uses `item_stack_request`/`item_stack_response` protocol
- Different window ID system (string-based: "inventory", "armor", "offhand", etc.)
- Packet-driven updates via `inventory_slot`, `inventory_content`, `inventory_transaction`
- Must map Bedrock window IDs to prismarine-windows slot indices

**Critical Differences**:
1. **Slot Indexing**: `getSlotIndex()` maps Bedrock window_id + slot to prismarine-windows indices
2. **Window Identification**: `getWindow()` maps string-based Bedrock IDs to Window objects
3. **Transactions**: Bedrock uses item_stack_request/response instead of window_click/transaction
4. **Update Packets**: Different packet names and structures for slot updates

### Testing Infrastructure

**Packet Replay System:**
`packages/mineflayer-bedrock/packets/` contains packet capture directories for testing:
- Used by replay client (`createReplayClient()` in `packages/mineflayer-bedrock/src/bedrock-replay-protocol/index.ts`)
- Helps test plugin implementations without live server connection
- Replays captured packet sequences to simulate server behavior
- Reference these when implementing packet handlers

**Test Server (mineflayer-bedrock-server):**
`packages/mineflayer-bedrock-server` provides utilities for creating test Bedrock servers:
- `startServer(host, port, version)` - Creates a Bedrock protocol server instance
- `getDataBuilder(version)` - Builds test data (inventory, entities, etc.)
- `waitForClientConnect(server)` - Waits for bot to connect
- `initializeClient(client, data)` - Sends initialization packets to connected client
- Used in `bedrockTest.mts` for integration testing

### Type System

- Core types: `packages/mineflayer/index.d.ts` defines Bot interface and types
- Bedrock protocol types: `packages/mineflayer-bedrock/src/protocol.d.ts` or imported from bedrock-protocol
- Use `protocolTypes` namespace for packet type definitions
- Item/Window/Entity types from prismarine-* libraries

## Implementation Guidelines for Bedrock Plugins

### API Compatibility

**CRITICAL**: Bedrock plugins MUST maintain the same API as Java plugins:
- Same function names, parameters, and return types
- Same events emitted with same event signatures
- Same properties added to the bot object
- Users should be able to switch between Java/Bedrock without code changes

### Reference Implementation Pattern

When implementing a Bedrock plugin:

1. **Read the Java plugin** (`lib/plugins/<name>.js`) to understand the API contract
2. **Identify packet differences** between Java and Bedrock protocols
3. **Map Bedrock packets** to the same bot behavior
4. **Maintain state consistency** - ensure bot properties match Java behavior
5. **Test API compatibility** - same inputs should produce same outputs

### Common Mapping Challenges

- **Window IDs**: Java uses numeric IDs, Bedrock uses string identifiers
- **Slot Indices**: Different inventory layouts require careful index mapping
- **Packet Names**: Different protocols have different packet names for similar concepts
- **Transaction Flow**: Different confirmation/acknowledgment mechanisms
- **Entity IDs**: Runtime entity IDs vs persistent entity IDs

## Important Context for Inventory Migration

### Java Inventory Plugin Key Concepts

1. **Window Management**: Bot can have `currentWindow` (opened container) + `inventory` (player inventory)
2. **Selected Item**: Cursor-held item during window interactions (`window.selectedItem`)
3. **Click Modes**: Different modes (0-4) for left-click, right-click, shift-click, drop, etc.
4. **Slot Ranges**: Functions like `putSelectedItemRange()` and `transfer()` work with slot ranges
5. **Transaction Confirmations**: Async operations that wait for server confirmation

### Bedrock Inventory Considerations

- Bedrock separates inventory into multiple window_ids: "inventory", "armor", "offhand", "hotbar"
- `item_stack_request` is more declarative (describe the full action) vs Java's imperative clicks
- Need to generate proper request_id and track responses
- Container operations must be translated to appropriate item_stack_request actions

## Node.js Version

Requires Node.js >= 22 (uses experimental TypeScript support via --experimental-strip-types)

## Key Dependencies

- `bedrock-protocol` - Bedrock protocol implementation
- `prismarine-*` - Core libraries (item, window, entity, block, world, etc.)
- `mineflayer-pathfinder` - Pathfinding plugin (used in examples)
- `minecraft-protocol` - Java Edition protocol (in mineflayer package)

## Logger System

The bot includes a colorized logger adapted from `@serenityjs/logger`. Located in `packages/mineflayer/lib/logger/`.

### Files
- `logger.mts` - Main Logger class with log levels and formatting
- `logger-colors.mts` - ANSI color constants (LoggerColors)
- `minecraft-colors.mts` - Minecraft § color code to ANSI conversion

### Usage

```typescript
import mineflayer, { Logger, LogLevel, LoggerColors } from 'mineflayer';

// Enable debug logging via bot options
const bot = mineflayer.createBot({
  // ...
  debug: true,              // Enable debug level
  // or
  logLevel: LogLevel.Debug, // Explicit log level
});

// Use bot's logger
bot.logger.info('Connected');
bot.logger.debug('Debug info');   // Only shown when debug=true
bot.logger.warn('Warning');
bot.logger.error('Error');
bot.logger.success('Done');
bot.logger.chat('Player', 'Hello');

// Child loggers for modules
const invLogger = bot.logger.child('Inventory');
invLogger.info('Slot updated');

// Global log level control
Logger.level = LogLevel.Debug;  // Show all
Logger.level = LogLevel.Warn;   // Warnings and errors only
Logger.level = LogLevel.None;   // Silent

// Minecraft color codes auto-converted
bot.logger.info('§6Gold §aGreen §rReset');
```

### Log Levels
- `LogLevel.Debug` (0) - Debug messages
- `LogLevel.Info` (1) - Info, success, chat (default)
- `LogLevel.Warn` (2) - Warnings
- `LogLevel.Error` (3) - Errors only
- `LogLevel.None` (4) - Silent

### TypeScript Pattern for Enums

Since Node.js `--experimental-strip-types` doesn't support TypeScript enums, use the const pattern:

```typescript
export const LogLevel = {
  Debug: 0,
  Info: 1,
  Warn: 2,
  Error: 3,
  None: 4,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];
```


# IMPORTANT:
tests are slow so preffer to run `npm run mocha_test --workspace=minecraft-bedrock-tests -- test/*.test.mts --parallel --jobs 8` command
