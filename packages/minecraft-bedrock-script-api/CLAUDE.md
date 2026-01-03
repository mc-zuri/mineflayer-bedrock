# CLAUDE.md - Minecraft Bedrock Script API

Project for analyzing Minecraft Bedrock world behavior using the official Script API.

## Project Structure

```
packages/minecraft-bedrock-script-api/
├── .vscode/              # VSCode debugger configuration
├── behavior_packs/
│   └── minecraft-bedrock-script-api/
│       ├── manifest.json # Behavior pack manifest
│       └── pack_icon.png
├── scripts/
│   └── main.ts           # Entry point
├── dist/                 # Build output (generated)
│   ├── scripts/main.js   # Compiled JS for Minecraft
│   └── debug/            # Source maps for debugging
├── .env                  # Project config
├── just.config.ts        # Build task configuration
├── package.json
└── tsconfig.json
```

## Commands

```bash
npm run build          # Compile TypeScript to dist/scripts/main.js
npm run build:production  # Production build (strips dev: labels)
npm run clean          # Clean build artifacts
npm run local-deploy   # Watch mode + auto-deploy
npm run mcaddon        # Create .mcaddon package
npm run lint           # Run linter
```

## Script API Modules

**Installed:**
- `@minecraft/server` (v2.0.0) - Core server API (world, system, entities, blocks)
- `@minecraft/math` - Vector math utilities
- `@minecraft/vanilla-data` - Block/item/entity type constants

**Available to add:**
- `@minecraft/server-ui` - Modal forms and action forms
- `@minecraft/server-gametest` - SimulatedPlayer and GameTest framework
- `@minecraft/server-net` - HTTP requests (BDS only)
- `@minecraft/server-admin` - Server admin utilities

## Key Patterns

### Per-Tick Loop
```typescript
import { world, system } from "@minecraft/server";

function mainTick() {
  // Your per-tick logic (20 ticks = 1 second)
  system.run(mainTick);
}
system.run(mainTick);
```

### Event Subscriptions
```typescript
world.afterEvents.playerJoin.subscribe((event) => {
  event.player.sendMessage("Welcome!");
});

world.beforeEvents.playerBreakBlock.subscribe((event) => {
  // Can cancel with event.cancel = true
});
```

### Entity Velocity/Health
```typescript
const velocity = player.getVelocity(); // Vector3 in blocks/tick
const health = player.getComponent("minecraft:health");
console.log(health?.currentValue, health?.effectiveMax);
```

## Debugging with BDS

1. Configure `server.properties`:
   ```properties
   allow-outbound-script-debugging=true
   allow-inbound-script-debugging=true
   force-inbound-debug-port=19144
   ```

2. Copy behavior pack to `development_behavior_packs/`

3. In VSCode: Press F5 to start debugger listener

4. In BDS console: `/script debugger connect localhost 19144`

## Manifest Dependencies

To add new Script API modules, update `behavior_packs/minecraft-bedrock-script-api/manifest.json`:

```json
"dependencies": [
  { "module_name": "@minecraft/server", "version": "2.0.0" },
  { "module_name": "@minecraft/server-gametest", "version": "1.0.0-beta" }
]
```

And install the npm package:
```bash
npm install @minecraft/server-gametest
```

## Performance Notes

- **Watchdog limits:** 100ms spike threshold, 2ms slow threshold
- Use `system.runInterval(fn, 20)` instead of every-tick when possible
- Use `system.runJob(generator)` for heavy operations
- Always check `entity.isValid` before accessing entity properties
