import { world, system } from "@minecraft/server";

console.log("[Test Helper] Script loaded!");

// Listen for scriptevent messages
system.afterEvents.scriptEventReceive.subscribe((event) => {
  const { id, message, sourceEntity } = event;

  if (!id.startsWith("test:")) return;

  console.log(`[Test Helper] Received: ${id} - ${message}`);

  const command = id.replace("test:", "");

  system.run(() => {
    try {
      switch (command) {
        case "ping":
          console.warn("[TEST_PONG]");
          break;
        case "inventory":
          handleInventory(message);
          break;
        case "state":
          handleState(message);
          break;
        case "block_inventory":
          handleBlockInventory(message);
          break;
        case "clear":
          handleClear(message);
          break;
        default:
          console.warn(`[TEST_ERROR]Unknown command: ${command}`);
      }
    } catch (err) {
      console.warn(`[TEST_ERROR]${err}`);
    }
  });
});

/**
 * Get player by name from message, or first player if not specified
 */
function getPlayer(message) {
  const players = world.getAllPlayers();
  if (message && message.trim()) {
    const player = players.find(p => p.name === message.trim());
    if (player) return player;
  }
  return players.length > 0 ? players[0] : null;
}

/**
 * Handle inventory command - returns player inventory
 * Message format: "PlayerName" or empty for first player
 */
function handleInventory(message) {
  const player = getPlayer(message);
  if (!player) {
    console.warn("[TEST_ERROR]No player found");
    return;
  }

  const inventoryComponent = player.getComponent("minecraft:inventory");
  if (!inventoryComponent) {
    console.warn("[TEST_ERROR]No inventory component");
    return;
  }

  const container = inventoryComponent.container;
  const items = [];

  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item) {
      items.push({
        slot: i,
        name: item.typeId.replace("minecraft:", ""),
        count: item.amount
        // Note: stack_id is NOT available in Script API
      });
    }
  }

  console.warn(`[TEST_INVENTORY]${JSON.stringify(items)}`);
}

/**
 * Handle state command - returns player state
 * Message format: "PlayerName" or empty for first player
 */
function handleState(message) {
  const player = getPlayer(message);
  if (!player) {
    console.warn("[TEST_ERROR]No player found");
    return;
  }

  const healthComponent = player.getComponent("minecraft:health");

  const state = {
    name: player.name,
    position: {
      x: player.location.x,
      y: player.location.y,
      z: player.location.z
    },
    health: healthComponent?.currentValue ?? 0,
    maxHealth: healthComponent?.effectiveMax ?? 0,
    gamemode: player.getGameMode(),
    dimension: player.dimension.id
  };

  console.warn(`[TEST_STATE]${JSON.stringify(state)}`);
}

/**
 * Handle block_inventory command - returns container inventory at position
 * Message format: "x y z" (space separated coordinates)
 */
function handleBlockInventory(message) {
  if (!message || !message.trim()) {
    console.warn("[TEST_ERROR]Missing coordinates: use 'x y z'");
    return;
  }

  const parts = message.trim().split(/\s+/);
  if (parts.length !== 3) {
    console.warn("[TEST_ERROR]Invalid coordinates: use 'x y z'");
    return;
  }

  const x = parseInt(parts[0], 10);
  const y = parseInt(parts[1], 10);
  const z = parseInt(parts[2], 10);

  if (isNaN(x) || isNaN(y) || isNaN(z)) {
    console.warn("[TEST_ERROR]Invalid coordinate values");
    return;
  }

  // Get block in overworld (could be extended to support dimension parameter)
  const dimension = world.getDimension("overworld");
  const block = dimension.getBlock({ x, y, z });

  if (!block) {
    console.warn(`[TEST_ERROR]No block at ${x} ${y} ${z}`);
    return;
  }

  const inventoryComponent = block.getComponent("inventory");
  if (!inventoryComponent || !inventoryComponent.container) {
    console.warn(`[TEST_ERROR]Block at ${x} ${y} ${z} has no inventory (${block.typeId})`);
    return;
  }

  const container = inventoryComponent.container;
  const items = [];

  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item) {
      items.push({
        slot: i,
        name: item.typeId.replace("minecraft:", ""),
        count: item.amount
      });
    }
  }

  console.warn(`[TEST_BLOCK_INVENTORY]${JSON.stringify({ position: { x, y, z }, items })}`);
}

/**
 * Handle clear command - clears player inventory
 * Message format: "PlayerName" or empty for first player
 */
function handleClear(message) {
  const player = getPlayer(message);
  if (!player) {
    console.warn("[TEST_ERROR]No player found");
    return;
  }

  const inventoryComponent = player.getComponent("minecraft:inventory");
  if (!inventoryComponent) {
    console.warn("[TEST_ERROR]No inventory component");
    return;
  }

  inventoryComponent.container.clearAll();
  console.warn(`[TEST_CLEAR]{"success":true}`);
}

console.log("[Test Helper] Ready - use /scriptevent test:ping");
