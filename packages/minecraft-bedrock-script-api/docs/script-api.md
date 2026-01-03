# Minecraft Bedrock Script API: Per-Tick Entity Monitoring

The `@minecraft/server` scripting API fully supports per-tick world inspection, with robust mechanisms for monitoring entity velocity, speed, and health every game tick. **Minecraft Bedrock runs at 20 ticks per second**, and the API provides multiple methods for tick-based execution using `system.run()` and `system.runInterval()` rather than direct tick events.

## Running code every tick with system methods

The API does **not** provide `world.beforeEvents.tick` or `world.afterEvents.tick` events. Instead, developers use the `system` object's scheduling methods, which mirror JavaScript's `setInterval` and `setTimeout` patterns.

### Method 1: `system.runInterval()` — Fixed interval execution

The simplest approach for per-tick code uses `runInterval()` with a tick interval of 1 (or omitted, which defaults to every tick):

```typescript
import { system, world } from "@minecraft/server";

// Run every single tick (tickInterval=1 or omitted)
const tickHandler = system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        // Per-tick logic here
    }
}, 1);

// To stop: system.clearRun(tickHandler);
```

**Key parameters:**
- `tickInterval = 0` or `1`: runs every tick
- `tickInterval = 20`: runs every second
- Returns an opaque handle for cancellation via `system.clearRun()`

### Method 2: `system.run()` — Self-calling game loop

For more control, use the recursive `system.run()` pattern, which queues execution for the next tick:

```typescript
import { system, world } from "@minecraft/server";

function gameLoop() {
    try {
        // Runs each minute (every 1200 ticks)
        if (system.currentTick % 1200 === 0) {
            world.sendMessage("Another minute passes...");
        }
        // Your per-tick logic here
    } catch (e) {
        console.warn("Error: " + e);
    }
    system.run(gameLoop); // Queue next tick
}

system.run(gameLoop); // Start the loop
```

This pattern offers **conditional continuation**—you can stop calling `system.run()` to end the loop, whereas `runInterval()` continues until explicitly cleared.

## Getting entity and player velocity every tick

The `Entity.getVelocity()` method returns a `Vector3` containing velocity components **in blocks per tick**. Since `Player` extends `Entity`, all players inherit this method.

```typescript
import { system, world, Vector3 } from "@minecraft/server";

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const velocity: Vector3 = player.getVelocity();
        
        player.sendMessage(
            `Velocity: X=${velocity.x.toFixed(3)}, ` +
            `Y=${velocity.y.toFixed(3)}, Z=${velocity.z.toFixed(3)}`
        );
    }
}, 1);
```

**Available velocity methods on Entity class:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `getVelocity()` | `(): Vector3` | Returns current velocity vector (blocks/tick) |
| `clearVelocity()` | `(): void` | Sets velocity to zero |
| `applyImpulse()` | `(vector: Vector3): void` | Adds impulse to current velocity |
| `applyKnockback()` | `(horizontal: VectorXZ, vertical: number): void` | Applies knockback force |

**Important limitation:** There is no `setVelocity()` method. To set a specific velocity, combine `clearVelocity()` + `applyImpulse()`.

## Calculating speed from velocity

The API does not provide a direct "speed" property—you must **calculate it from the velocity magnitude**. Speed equals the Euclidean length of the velocity vector:

```typescript
import { system, world, Vector3 } from "@minecraft/server";

function calculateSpeed(velocity: Vector3): number {
    return Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
}

function calculateHorizontalSpeed(velocity: Vector3): number {
    return Math.sqrt(velocity.x ** 2 + velocity.z ** 2); // Ignore Y (vertical)
}

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const velocity = player.getVelocity();
        const speedBlocksPerTick = calculateSpeed(velocity);
        const speedBlocksPerSecond = speedBlocksPerTick * 20; // 20 ticks/second
        
        player.onScreenDisplay.setActionBar(
            `Speed: ${speedBlocksPerSecond.toFixed(2)} blocks/sec`
        );
    }
}, 1);
```

**Context for speed values:** Walking speed is approximately **4.3 blocks/second** (0.215 blocks/tick), sprinting reaches **5.6 blocks/second**, and Elytra gliding can exceed **30 blocks/second**.

## Accessing health data every tick

Health is accessed through the **Entity Component System** using `EntityHealthComponent`. The component ID is `"minecraft:health"` or the enum `EntityComponentTypes.Health`.

```typescript
import { 
    system, world, 
    EntityHealthComponent, 
    EntityComponentTypes 
} from "@minecraft/server";

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const health = player.getComponent(
            EntityComponentTypes.Health
        ) as EntityHealthComponent;
        
        if (health) {
            player.onScreenDisplay.setActionBar(
                `Health: ${health.currentValue}/${health.effectiveMax}`
            );
        }
    }
}, 1);
```

**EntityHealthComponent properties (inherited from EntityAttributeComponent):**

| Property | Type | Description |
|----------|------|-------------|
| `currentValue` | `number` | Current health points |
| `defaultValue` | `number` | Default health for this entity type |
| `effectiveMax` | `number` | Maximum health (considering effects/attributes) |
| `effectiveMin` | `number` | Minimum health value |

**Methods for modifying health:**
- `setCurrentValue(value: number): boolean` — Set health to specific value
- `resetToMaxValue(): void` — Fully heal the entity
- `resetToDefaultValue(): void` — Reset to type's default health

## Complete per-tick monitoring example

Here's a production-ready script monitoring velocity, speed, and health simultaneously:

```typescript
import { 
    system, world, Vector3,
    EntityHealthComponent, EntityComponentTypes 
} from "@minecraft/server";

function calculateSpeed(v: Vector3): number {
    return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2) * 20;
}

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        if (!player.isValid) continue;
        
        // Get velocity and calculate speed
        const velocity = player.getVelocity();
        const speed = calculateSpeed(velocity);
        
        // Get health component
        const health = player.getComponent(
            EntityComponentTypes.Health
        ) as EntityHealthComponent;
        
        // Display on action bar
        const healthText = health 
            ? `❤ ${health.currentValue.toFixed(1)}/${health.effectiveMax}` 
            : "";
        const speedText = `⚡ ${speed.toFixed(1)} b/s`;
        const velText = `↗ (${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}, ${velocity.z.toFixed(2)})`;
        
        player.onScreenDisplay.setActionBar(
            `${healthText} | ${speedText}`
        );
    }
}, 1); // Every tick
```

## Performance considerations and watchdog limits

Per-tick operations must respect Minecraft's **watchdog thresholds** to avoid script termination:

| Threshold | Default | Impact |
|-----------|---------|--------|
| Spike threshold | **100 ms** | Maximum single-tick execution time |
| Hang threshold | **3000 ms** | Triggers script termination if exceeded |
| Slow threshold | **2 ms** | Warnings for consistently slow scripts |
| Memory limit | **250 MB** | Hard cap before forced shutdown |

**Best practices for per-tick code:**

1. **Reduce frequency when possible** — If your logic doesn't need every tick, use `runInterval(callback, 5)` or `runInterval(callback, 20)` instead of `1`.

2. **Use `runJob()` for heavy work** — Long-running tasks should use generator functions that yield between operations:
   ```typescript
   function* heavyTask() {
       for (const entity of dimension.getEntities()) {
           // Process entity
           yield; // Yield after each operation
       }
   }
   system.runJob(heavyTask());
   ```

3. **Avoid commands in tight loops** — Use native API methods instead of `runCommandAsync()`, which is limited to **128 async commands per tick**.

4. **Always check `entity.isValid`** — Entities can become invalid between ticks if killed or unloaded.

5. **Cache entity queries** — Calling `world.getAllPlayers()` or `dimension.getEntities()` every tick is acceptable, but cache results within a single tick's logic.

## Conclusion

The Minecraft Bedrock `@minecraft/server` API provides comprehensive support for per-tick world inspection. The key mechanisms are `system.runInterval()` for simple interval-based execution and `system.run()` for flexible game loops. Velocity is directly accessible via `getVelocity()` returning a Vector3, while speed must be calculated as the vector magnitude. Health requires fetching the `EntityHealthComponent` but then provides complete access to current, max, and min values. For production use, monitor performance against watchdog thresholds and prefer native API methods over command execution.