import mineflayer, { type Bot, type BotOptions } from 'mineflayer';
import { type ExternalServer, type ExternalServerOptions, startExternalServer } from './external-server.ts';

/**
 * Run a test function with a managed external server instance.
 * Server is automatically started before and stopped after the test.
 */
export async function withExternalServer(testFn: (server: ExternalServer) => Promise<void>, options?: ExternalServerOptions): Promise<void> {
  const server = await startExternalServer(options);
  try {
    await testFn(server);
  } finally {
    await server.stop();
  }
}

/**
 * Connect a mineflayer bot to the external server.
 */
export async function connectBotToExternalServer(server: ExternalServer, botOptions?: Partial<BotOptions>): Promise<Bot> {
  const bot = mineflayer.createBot({
    host: server.host,
    port: server.port,
    version: `bedrock_${server.version}`,
    auth: 'offline',
    username: botOptions?.username ?? 'TestBot',
    offline: true,
    conLog: () => {},
    ...botOptions,
  });

  return bot;
}

/**
 * Wait for the bot to spawn in the world.
 */
export async function waitForBotSpawn(bot: Bot, timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout waiting for bot to spawn'));
    }, timeout);

    bot.once('spawn', () => {
      clearTimeout(timer);
      resolve();
    });

    bot.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    bot.once('kicked', (reason) => {
      clearTimeout(timer);
      reject(new Error(`Bot was kicked: ${reason}`));
    });
  });
}

/**
 * Wait for a condition to become true.
 */
export async function waitFor(condition: () => boolean, timeout = 10000, interval = 100): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await sleep(interval);
  }
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Server Commands - Use these to set up test scenarios
// ============================================================================

/**
 * Give an item to a player.
 */
export async function giveItem(server: ExternalServer, player: string, item: string, count = 1): Promise<void> {
  await server.sendCommand(`give ${player} ${item} ${count}`);
  // Note: Tests should use waitFor() to verify items are received
  // The server sends inventory_content packet to client after give command
}

/**
 * Clear a player's inventory.
 */
export async function clearInventory(server: ExternalServer, player: string): Promise<void> {
  await server.sendCommand(`clear ${player}`);
  // Note: Tests should use waitFor() to verify inventory is cleared
}

/**
 * Teleport a player to a location.
 */
export async function teleportPlayer(server: ExternalServer, player: string, x: number, y: number, z: number): Promise<void> {
  await server.sendCommand(`tp ${player} ${x} ${y} ${z}`);
  await sleep(100);
}

/**
 * Teleport a player and wait for the bot to receive the position update.
 * This is more reliable than teleportPlayer() as it waits for the move_player packet.
 */
export async function teleportPlayerAndSync(
  server: ExternalServer,
  bot: Bot,
  x: number,
  y: number,
  z: number,
  timeout = 5000
): Promise<void> {
  const positionPromise = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout waiting for position sync after teleport'));
    }, timeout);

    // Listen for the forcedMove event which is emitted when move_player packet updates position
    const onForcedMove = () => {
      clearTimeout(timer);
      resolve();
    };
    bot.once('forcedMove', onForcedMove);
  });

  // Send teleport command
  await server.sendCommand(`tp ${bot.username} ${x} ${y} ${z}`);

  // Wait for position to sync
  await positionPromise;

  // Small delay to ensure all related packets are processed
  await sleep(50);
}

/**
 * Set a player's game mode.
 */
export async function setGamemode(server: ExternalServer, player: string, mode: 'survival' | 'creative' | 'adventure' | 'spectator'): Promise<void> {
  await server.sendCommand(`gamemode ${mode} ${player}`);
  await sleep(100);
}

/**
 * Set a block at a specific location.
 */
export async function setBlock(server: ExternalServer, x: number, y: number, z: number, block: string): Promise<void> {
  await server.sendCommand(`setblock ${x} ${y} ${z} ${block}`);
  await sleep(100);
}

/**
 * Fill a region with a block.
 */
export async function fill(server: ExternalServer, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, block: string): Promise<void> {
  await server.sendCommand(`fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} ${block}`);
  await sleep(100);
}

/**
 * Kill all entities of a type.
 */
export async function killEntities(server: ExternalServer, entityType: string): Promise<void> {
  await server.sendCommand(`kill @e[type=${entityType}]`);
  await sleep(100);
}

// ============================================================================
// Server State Verification - Query server state via behavior pack
// Requires test_helper behavior pack to be installed
// ============================================================================

export interface ServerInventoryItem {
  slot: number;
  name: string;
  count: number;
}

export interface ServerPlayerState {
  name: string;
  position: { x: number; y: number; z: number };
  health: number;
  maxHealth: number;
  gamemode: string;
  dimension: string;
}

export interface ServerBlockInventory {
  position: { x: number; y: number; z: number };
  items: ServerInventoryItem[];
}

export interface InventoryDiff {
  matches: boolean;
  clientOnly: ServerInventoryItem[];
  serverOnly: ServerInventoryItem[];
  countMismatches: Array<{
    slot: number;
    name: string;
    clientCount: number;
    serverCount: number;
  }>;
}

/**
 * Ping the behavior pack to verify it's loaded.
 * Requires test_helper behavior pack.
 */
export async function pingBehaviorPack(server: ExternalServer): Promise<boolean> {
  try {
    await server.sendCommand('scriptevent test:ping');
    await server.waitForOutput(/\[TEST_PONG\]/, 5000);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get server-side player inventory.
 * Requires test_helper behavior pack.
 */
export async function getServerInventory(server: ExternalServer, playerName?: string): Promise<ServerInventoryItem[]> {
  const message = playerName ?? '';
  await server.sendCommand(`scriptevent test:inventory ${message}`);
  const output = await server.waitForOutput(/\[TEST_INVENTORY\](.+)/, 5000);
  const match = output.match(/\[TEST_INVENTORY\](.+)/);
  if (!match) {
    throw new Error('Failed to parse server inventory response');
  }
  return JSON.parse(match[1]);
}

/**
 * Get server-side player state.
 * Requires test_helper behavior pack.
 */
export async function getServerPlayerState(server: ExternalServer, playerName?: string): Promise<ServerPlayerState> {
  const message = playerName ?? '';
  await server.sendCommand(`scriptevent test:state ${message}`);
  const output = await server.waitForOutput(/\[TEST_STATE\](.+)/, 5000);
  const match = output.match(/\[TEST_STATE\](.+)/);
  if (!match) {
    throw new Error('Failed to parse server state response');
  }
  return JSON.parse(match[1]);
}

/**
 * Get server-side block inventory at position.
 * Requires test_helper behavior pack.
 */
export async function getServerBlockInventory(server: ExternalServer, x: number, y: number, z: number): Promise<ServerBlockInventory> {
  await server.sendCommand(`scriptevent test:block_inventory ${x} ${y} ${z}`);
  const output = await server.waitForOutput(/\[TEST_BLOCK_INVENTORY\](.+)/, 5000);
  const match = output.match(/\[TEST_BLOCK_INVENTORY\](.+)/);
  if (!match) {
    throw new Error('Failed to parse block inventory response');
  }
  return JSON.parse(match[1]);
}

/**
 * Clear player inventory via behavior pack.
 * Requires test_helper behavior pack.
 */
export async function clearInventoryViaBehaviorPack(server: ExternalServer, playerName?: string): Promise<void> {
  const message = playerName ?? '';
  await server.sendCommand(`scriptevent test:clear ${message}`);
  await server.waitForOutput(/\[TEST_CLEAR\]/, 5000);
}

/**
 * Compare client inventory state with server inventory state.
 */
export function compareInventory(clientItems: Array<{ slot: number; name: string; count: number }>, serverItems: ServerInventoryItem[]): InventoryDiff {
  const clientMap = new Map(clientItems.map((i) => [`${i.slot}:${i.name}`, i]));
  const serverMap = new Map(serverItems.map((i) => [`${i.slot}:${i.name}`, i]));

  const clientOnly: ServerInventoryItem[] = [];
  const serverOnly: ServerInventoryItem[] = [];
  const countMismatches: InventoryDiff['countMismatches'] = [];

  for (const [key, clientItem] of clientMap) {
    const serverItem = serverMap.get(key);
    if (!serverItem) {
      clientOnly.push(clientItem);
    } else if (clientItem.count !== serverItem.count) {
      countMismatches.push({
        slot: clientItem.slot,
        name: clientItem.name,
        clientCount: clientItem.count,
        serverCount: serverItem.count,
      });
    }
  }

  for (const [key, serverItem] of serverMap) {
    if (!clientMap.has(key)) {
      serverOnly.push(serverItem);
    }
  }

  return {
    matches: clientOnly.length === 0 && serverOnly.length === 0 && countMismatches.length === 0,
    clientOnly,
    serverOnly,
    countMismatches,
  };
}

/**
 * Assert that client and server inventory states match.
 * Throws with detailed diff on mismatch.
 */
export function assertInventoryMatch(clientItems: Array<{ slot: number; name: string; count: number }>, serverItems: ServerInventoryItem[], message?: string): void {
  const diff = compareInventory(clientItems, serverItems);
  if (!diff.matches) {
    const details = [
      message || 'Inventory mismatch',
      diff.clientOnly.length > 0 ? `Client only: ${JSON.stringify(diff.clientOnly)}` : '',
      diff.serverOnly.length > 0 ? `Server only: ${JSON.stringify(diff.serverOnly)}` : '',
      diff.countMismatches.length > 0 ? `Count mismatches: ${JSON.stringify(diff.countMismatches)}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    throw new Error(details);
  }
}

/**
 * Get client inventory as array of items for comparison.
 * By default only includes main inventory slots (0-35) to match server inventory query.
 * Set includeEquipment=true to also include armor (36-39) and offhand (41) slots.
 */
export function getClientInventory(bot: Bot, includeEquipment = false): Array<{ slot: number; name: string; count: number }> {
  const items: Array<{ slot: number; name: string; count: number }> = [];
  // Main inventory is slots 0-35
  // Armor is 36-39 (head, chest, legs, feet)
  // Slot 40 is crafting output
  // Offhand is 41
  const maxSlot = includeEquipment ? bot.inventory.slots.length : 36;
  for (let i = 0; i < maxSlot; i++) {
    const item = bot.inventory.slots[i];
    if (item) {
      items.push({
        slot: i,
        name: item.name,
        count: item.count,
      });
    }
  }
  // If including equipment, also check offhand (slot 41)
  if (includeEquipment && bot.inventory.slots[41]) {
    const item = bot.inventory.slots[41];
    items.push({
      slot: 41,
      name: item.name,
      count: item.count,
    });
  }
  return items;
}
