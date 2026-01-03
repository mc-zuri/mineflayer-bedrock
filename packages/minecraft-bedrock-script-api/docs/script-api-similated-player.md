# Using SimulatedPlayer in Minecraft Bedrock's GameTest API

The **SimulatedPlayer** class in the `@minecraft/server-gametest` module enables automated player simulation within GameTests, providing methods for movement, combat, block interaction, and navigation. This extends the base `Player` class with **50+ unique methods** for programmatic control, making it essential for validating game mechanics, testing mob behaviors, and automating gameplay scenarios. The API requires experimental Beta APIs and runs server-side, meaning some client-triggered events may not fire identically to real players.

## Creating and spawning simulated players

SimulatedPlayer instances can be created through two mechanisms: the **Test class** within registered GameTests (most common), or the standalone module function for players outside test contexts.

**Within a GameTest via Test.spawnSimulatedPlayer():**
```javascript
import { register } from "@minecraft/server-gametest";
import { GameMode } from "@minecraft/server";

register("MyTests", "playerTest", (test) => {
  const player = test.spawnSimulatedPlayer(
    { x: 2, y: 2, z: 2 },  // blockLocation (relative to structure)
    "TestPlayer",          // name (default: "Simulated Player")
    GameMode.survival      // gameMode (optional, default: survival)
  );
  
  player.jump();
  test.succeedOnTick(100);
}).maxTicks(200).structureName("mypack:arena");
```

**Outside test context via module function:**
```javascript
import { spawnSimulatedPlayer } from "@minecraft/server-gametest";
import { world, GameMode } from "@minecraft/server";

const dimension = world.getDimension("overworld");
const player = spawnSimulatedPlayer(
  { dimension, x: 0, y: 64, z: 0 },  // DimensionLocation
  "BotPlayer",
  GameMode.creative
);
// Remove when done with player.remove() or player.disconnect()
```

The Test class version uses **coordinates relative to the structure block**, while the module function requires absolute world coordinates with dimension specified.

## GameTest environment setup requirements

A functional GameTest requires three components: a properly configured **manifest.json**, a **JavaScript entry file**, and an **MCStructure file** defining the test environment.

**Manifest.json dependencies (BP/manifest.json):**
```json
{
  "format_version": 2,
  "header": {
    "name": "My GameTest Pack",
    "uuid": "unique-uuid-here",
    "version": [1, 0, 0],
    "min_engine_version": [1, 21, 0]
  },
  "modules": [{
    "type": "script",
    "language": "javascript",
    "uuid": "another-unique-uuid",
    "version": [1, 0, 0],
    "entry": "scripts/main.js"
  }],
  "dependencies": [
    { "module_name": "@minecraft/server", "version": "1.13.0-beta" },
    { "module_name": "@minecraft/server-gametest", "version": "1.0.0-beta" }
  ]
}
```

**Critical requirements**: Enable the **Beta APIs experiment** in world settings. Use **Normal difficulty** (mob behaviors differ in Peaceful). Structure files go in `BP/structures/<namespace>/<name>.mcstructure` and are referenced via `structureName("namespace:name")`.

**Test registration with RegistrationBuilder:**
```javascript
import * as GameTest from "@minecraft/server-gametest";

GameTest.register("ClassName", "testName", (test) => {
  // Test implementation
  test.succeedWhen(() => { /* assertion */ });
})
.maxTicks(400)           // Timeout: 20 ticks = 1 second
.setupTicks(20)          // Delay before test starts
.structureName("pack:structure")
.tag("combat")           // For /gametest runset <tag>
.required(true);         // Must pass for suite to pass
```

## Movement, navigation, and looking methods

SimulatedPlayer provides both **direct movement** (straight-line travel) and **pathfinding navigation** (obstacle avoidance).

**Direct movement methods:**
```javascript
// Relative to GameTest structure
player.move(1, 0);  // westEast, northSouth (default speed: 1)

// Relative to player's current rotation
player.moveRelative(0, 1);  // leftRight, backwardForward

// Move in straight line to coordinates
player.moveToBlock({ x: 5, y: 2, z: 5 }, { faceTarget: true, speed: 1.5 });
player.moveToLocation({ x: 10, y: 2, z: 10 });
```

**Pathfinding navigation (player must be on ground):**
```javascript
const result = player.navigateToLocation({ x: 15, y: 2, z: 15 }, 1.0);

// NavigationResult contains:
console.log(result.isFullPath);  // boolean: path reaches destination
const waypoints = result.getPath();  // Vector3[]: route coordinates

// Follow entity (stays within 1 block radius)
player.navigateToEntity(targetMob, 1.0);

// Follow waypoint route
player.navigateToLocations([
  { x: 3, y: 2, z: 3 },
  { x: 6, y: 2, z: 6 },
  { x: 9, y: 2, z: 9 }
], 1.0);
```

**Look direction control:**
```javascript
player.lookAtBlock({ x: 5, y: 3, z: 5 });
player.lookAtEntity(zombie);
player.lookAtLocation({ x: 10, y: 5, z: 10 });
player.rotateBody(90);         // Turn relative to current rotation
player.setBodyRotation(180);   // Absolute angle relative to GameTest
```

## Combat, interaction, and item usage

Combat methods support both **raycast-based attacks** (like real players) and **direct entity targeting** (any distance, no line of sight required).

**Combat example:**
```javascript
import { ItemStack } from "@minecraft/server";

register("CombatTests", "attackZombie", (test) => {
  const player = test.spawnSimulatedPlayer({ x: 2, y: 2, z: 2 }, "Fighter");
  const zombie = test.spawn("minecraft:zombie", { x: 5, y: 2, z: 5 });
  
  // Give weapon
  const sword = new ItemStack("minecraft:diamond_sword", 1);
  player.giveItem(sword, true);  // true = select slot
  
  // Raycast attack (6 block range, needs line of sight)
  player.lookAtEntity(zombie);
  player.attack();  // Returns true if attack performed
  
  // Direct entity attack (any distance, no LOS)
  player.attackEntity(zombie);  // Returns true on success
  
  test.succeedWhen(() => {
    test.assertEntityPresentInArea("minecraft:zombie", false);
  });
}).maxTicks(400);
```

**Block interaction:**
```javascript
// Break block (respects game mode, hits until broken)
player.breakBlock({ x: 3, y: 2, z: 3 }, Direction.Up);
player.stopBreakingBlock();

// Use item on block
const cobblestone = new ItemStack("minecraft:cobblestone", 1);
player.setItem(cobblestone, 0, true);
player.useItemInSlotOnBlock(0, { x: 4, y: 1, z: 4 }, Direction.Up);

// Interact with blocks/entities (doors, chests, villagers)
player.interactWithBlock({ x: 5, y: 2, z: 5 });  // Max 6 blocks
player.interactWithEntity(villager);
```

**Item handling:**
```javascript
player.giveItem(new ItemStack("minecraft:apple", 10), true);
player.useItem(new ItemStack("minecraft:ender_pearl"));  // Doesn't consume
player.useItemInSlot(0);
player.dropSelectedItem();
player.stopUsingItem();  // Returns ItemStack that was in use
```

## SimulatedPlayer vs real Player differences

SimulatedPlayer **extends** the `@minecraft/server.Player` class, inheriting all standard player properties while adding simulation-specific methods.

| Aspect | SimulatedPlayer | Real Player |
|--------|-----------------|-------------|
| **Unique properties** | `headRotation` (Vector2), `isSprinting` (boolean) | Full client system info, graphics mode |
| **Movement** | Programmatic via `move()`, `navigate*()` | Client input-driven |
| **Combat** | `attack()`, `attackEntity()` | Client input triggers |
| **Events** | Many events may not fire normally | All events fire |
| **Existence** | Server-side simulation | Client-connected |

**Critical limitation**: The official documentation states that *"many types of events that may be available for entities more broadly, such as item use events, may not fire in the same capacity for simulated players."* Events relying on client-side input detection typically won't trigger since SimulatedPlayer is purely server-side.

SimulatedPlayer **does** affect the game world—blocks break, entities take damage, items are used—but Script API event subscriptions (like `playerBreakBlock`, `playerInteractWithBlock`) may have limited or no functionality.

## Running GameTests and command reference

| Command | Description |
|---------|-------------|
| `/gametest run <class>:<test>` | Run specific test (e.g., `startertests:simpleMobTest`) |
| `/gametest runthis` | Run nearest test in range |
| `/gametest runset [tag]` | Run all tests with optional tag filter |
| `/gametest create <name> [w] [h] [d]` | Create blank test area (max 48 blocks) |
| `/gametest clearall [radius]` | Remove tests (default: 200 blocks) |
| `/gametest pos` | Show relative coordinates |
| `/reload` | Hot-reload scripts (1.19+) |

**Test success/failure conditions:**
- **Success**: `test.succeed()`, `test.succeedWhen(callback)`, `test.succeedOnTick(tick)`
- **Failure**: Timeout (exceeds `maxTicks`), assertion throws, `test.fail(message)` called

## Common use cases for SimulatedPlayer

- **Automated mob behavior testing**: Validate that foxes hunt chickens, zombies attack villagers, or hostile mobs target players correctly
- **Combat mechanics validation**: Test weapon damage, armor effectiveness, shield blocking, attack cooldowns
- **Pathfinding verification**: Ensure AI can navigate mazes, avoid obstacles, and reach destinations
- **Redstone mechanism testing**: Verify pistons, doors, and complex contraptions function correctly with player interaction
- **Block interaction testing**: Validate crafting tables, chests, furnaces respond properly to player actions
- **Tutorial/demo automation**: Create scripted gameplay sequences for showcasing features
- **Regression testing**: Catch unintended behavior changes after game updates

**Example comprehensive test:**
```javascript
GameTest.registerAsync("Integration", "fullPlayerTest", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 1 }, "Tester");
  
  // Navigate to chest
  player.navigateToBlock({ x: 8, y: 2, z: 8 });
  await test.idle(60);
  
  // Open and interact
  player.interactWithBlock({ x: 8, y: 2, z: 8 });
  await test.idle(20);
  
  // Navigate to mob and attack
  const zombie = test.spawn("minecraft:zombie", { x: 12, y: 2, z: 12 });
  player.navigateToEntity(zombie);
  await test.idle(80);
  player.attackEntity(zombie);
  
  test.succeedWhen(() => {
    test.assertEntityPresentInArea("minecraft:zombie", false);
  });
}).maxTicks(600).structureName("integration:arena");
```

## Conclusion

SimulatedPlayer provides a powerful mechanism for automated game testing in Minecraft Bedrock, offering complete programmatic control over player actions from movement to combat. Key practical considerations include using **relative coordinates within tests**, ensuring players are **grounded before navigation**, and understanding that **event firing differs from real players**. The API remains experimental (1.0.0-beta), so method signatures may change—always verify against the latest Microsoft Learn documentation. For production testing, combine SimulatedPlayer with comprehensive assertion methods from the Test class to build robust validation suites that catch regressions and verify gameplay mechanics.