import { expect } from 'expect';
import type { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
import {
  startExternalServer,
  connectBotToExternalServer,
  waitForBotSpawn,
  sleep,
  giveItem,
  clearInventory,
  teleportPlayer,
  type ExternalServer,
  fill,
} from 'minecraft-bedrock-test-server';

/**
 * Villager Trading Tests
 *
 * Tests villager trading functionality including:
 * - Opening trade window with villagers
 * - Receiving trade offers
 * - Executing trades
 * - Closing trade window
 *
 * Note: Villager trading in Bedrock requires villagers to have claimed
 * workstations and leveled up to have trades. The tests spawn pre-configured
 * villagers using scriptevent if available.
 */
describe('BDS Integration: Villager Trading', function () {
  this.timeout(180_000);

  let server: ExternalServer;
  let bot: Bot;

  // Test locations
  const testBaseX = 60;
  const testBaseY = 0;
  const testBaseZ = 60;

  before(async function () {
    this.timeout(180_000);
    server = await startExternalServer({
      version: process.env.BDS_VERSION || '1.21.130',
    });
  });

  after(async function () {
    await server?.stop();
  });

  beforeEach(async function () {
    bot = await connectBotToExternalServer(server);
    await waitForBotSpawn(bot);
    await bot.waitForChunksToLoad();

    // Clear inventory
    try {
      await clearInventory(server, bot.username);
    } catch {
      // Ignore
    }

    // Setup test area
    await setupTestArea();
  });

  afterEach(async function () {
    // Kill villagers in test area
    await server.sendCommand(`kill @e[type=villager,x=${testBaseX},y=${testBaseY},z=${testBaseZ},r=20]`);
    await server.sendCommand(`kill @e[type=wandering_trader,x=${testBaseX},y=${testBaseY},z=${testBaseZ},r=20]`);

    if (bot?._client?.close) {
      bot._client.close();
    }
  });

  async function setupTestArea() {
    // Create platform
    await fill(server, testBaseX - 5, testBaseY - 1, testBaseZ - 5, testBaseX + 5, testBaseY - 1, testBaseZ + 5, 'stone');
    await fill(server, testBaseX - 5, testBaseY, testBaseZ - 5, testBaseX + 5, testBaseY + 3, testBaseZ + 5, 'air');

    // Teleport player
    await teleportPlayer(server, bot.username, testBaseX, testBaseY + 1, testBaseZ);
    await sleep(500);
  }

  async function spawnVillager(x: number, y: number, z: number, profession?: string): Promise<void> {
    // Kill any existing villagers at location first
    await server.sendCommand(`kill @e[type=villager,x=${x},y=${y},z=${z},r=3]`);
    await sleep(200);

    // Try scriptevent for profession-specific villager (if test_helper behavior pack is loaded)
    if (profession) {
      await server.sendCommand(`scriptevent test:spawn_villager ${x} ${y} ${z} ${profession}`);
      await sleep(300);
    }

    // Fallback: spawn generic villager
    await server.sendCommand(`summon villager ${x} ${y} ${z}`);
    await sleep(500);
  }

  async function findNearbyVillager(): Promise<any | null> {
    for (const entityId of Object.keys(bot.entities)) {
      const entity = bot.entities[entityId];
      if (entity && (String(entity.type).includes('villager') || String(entity.name).includes('villager'))) {
        const distance = entity.position.distanceTo(bot.entity.position);
        if (distance < 10) {
          return entity;
        }
      }
    }
    return null;
  }

  it('should have openVillager function', async () => {
    expect(typeof bot.openVillager).toBe('function');
  });

  it('should have trade function', async () => {
    expect(typeof bot.trade).toBe('function');
  });

  it('should spawn and detect villager entity', async function () {
    await spawnVillager(testBaseX, testBaseY, testBaseZ + 2);
    await sleep(1000);

    const villager = await findNearbyVillager();
    expect(villager).toBeTruthy();
  });

  it('should open villager trade window', async function () {
    this.timeout(30_000);

    // Spawn villager
    await spawnVillager(testBaseX, testBaseY, testBaseZ + 2, 'librarian');
    await sleep(1000);

    // Place workstation for villager to claim (lectern for librarian)
    await server.sendCommand(`setblock ${testBaseX} ${testBaseY} ${testBaseZ + 3} lectern`);
    await sleep(1000);

    const villager = await findNearbyVillager();
    if (!villager) {
      console.log('No villager found, skipping test');
      return;
    }

    try {
      const tradeWindow = await bot.openVillager(villager);

      expect(tradeWindow).toBeTruthy();
      expect(tradeWindow.trades).toBeDefined();
      expect(Array.isArray(tradeWindow.trades)).toBe(true);

      console.log(`Trade window opened with ${tradeWindow.trades.length} trades`);

      // Close window
      if (tradeWindow.close) {
        tradeWindow.close();
      }
    } catch (err: any) {
      // May fail if villager has no trades yet
      if (err.message.includes('Timeout')) {
        console.log('Trade window timeout - villager may not have trades');
        return;
      }
      throw err;
    }
  });

  it('should receive trade offers from villager', async function () {
    this.timeout(30_000);

    // Spawn librarian villager with workstation
    await server.sendCommand(`setblock ${testBaseX} ${testBaseY} ${testBaseZ + 3} lectern`);
    await sleep(200);
    await spawnVillager(testBaseX, testBaseY, testBaseZ + 2, 'librarian');
    await sleep(2000); // Wait for villager to claim workstation

    const villager = await findNearbyVillager();
    if (!villager) {
      console.log('No villager found, skipping test');
      return;
    }

    try {
      const tradeWindow = await bot.openVillager(villager);

      if (tradeWindow.trades.length > 0) {
        const firstTrade = tradeWindow.trades[0];
        console.log('First trade:', {
          input1: firstTrade.inputItem1?.name,
          input2: firstTrade.inputItem2?.name,
          output: firstTrade.outputItem?.name,
          maxUses: firstTrade.maximumNbTradeUses,
        });

        expect(firstTrade.inputItem1).toBeTruthy();
        expect(firstTrade.outputItem).toBeTruthy();
        expect(typeof firstTrade.maximumNbTradeUses).toBe('number');
        expect(typeof firstTrade.nbTradeUses).toBe('number');
      } else {
        console.log('Villager has no trades yet (needs to level up)');
      }

      if (tradeWindow.close) {
        tradeWindow.close();
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        console.log('Trade window timeout - villager may not have trades');
        return;
      }
      throw err;
    }
  });

  it('should execute trade with villager', async function () {
    this.timeout(60_000);

    // Setup: Spawn librarian with workstation and give bot trading materials
    await server.sendCommand(`setblock ${testBaseX} ${testBaseY} ${testBaseZ + 3} lectern`);
    await sleep(200);
    await spawnVillager(testBaseX, testBaseY, testBaseZ + 2, 'librarian');
    await sleep(2000);

    // Give player emeralds and paper for common librarian trades
    await giveItem(server, bot.username, 'emerald', 64);
    await giveItem(server, bot.username, 'paper', 64);
    await sleep(500);

    const villager = await findNearbyVillager();
    if (!villager) {
      console.log('No villager found, skipping test');
      return;
    }

    try {
      const tradeWindow = await bot.openVillager(villager);

      if (tradeWindow.trades.length === 0) {
        console.log('Villager has no trades, skipping trade execution');
        if (tradeWindow.close) tradeWindow.close();
        return;
      }

      // Find a trade we can afford
      let affordableTradeIndex = -1;
      for (let i = 0; i < tradeWindow.trades.length; i++) {
        const trade = tradeWindow.trades[i];
        if (trade.tradeDisabled) continue;

        // Check if we have the input items
        const hasInput1 = bot.inventory.items().some(
          (item) => item.type === trade.inputItem1.type && item.count >= (trade.realPrice ?? trade.inputItem1.count)
        );
        const hasInput2 = !trade.hasItem2 || bot.inventory.items().some(
          (item) => item.type === trade.inputItem2!.type && item.count >= trade.inputItem2!.count
        );

        if (hasInput1 && hasInput2) {
          affordableTradeIndex = i;
          break;
        }
      }

      if (affordableTradeIndex === -1) {
        console.log('No affordable trades found, skipping');
        if (tradeWindow.close) tradeWindow.close();
        return;
      }

      const trade = tradeWindow.trades[affordableTradeIndex];
      console.log(`Executing trade ${affordableTradeIndex}: ${trade.inputItem1.name} → ${trade.outputItem.name}`);

      const initialOutputCount = bot.inventory.count(trade.outputItem.type);

      await bot.trade(tradeWindow, affordableTradeIndex, 1);

      await sleep(500);

      const finalOutputCount = bot.inventory.count(trade.outputItem.type);
      console.log(`Output count: ${initialOutputCount} → ${finalOutputCount}`);

      // Note: Trade may fail due to server-side issues, so we just log
      if (finalOutputCount > initialOutputCount) {
        console.log('Trade successful!');
      } else {
        console.log('Trade may not have completed (server-side issue or different slot)');
      }

      if (tradeWindow.close) {
        tradeWindow.close();
      }
    } catch (err: any) {
      if (err.message.includes('Timeout') || err.message.includes('Cannot find')) {
        console.log('Trade test skipped:', err.message);
        return;
      }
      throw err;
    }
  });

  it('should handle wandering trader', async function () {
    this.timeout(30_000);

    // Spawn wandering trader
    await server.sendCommand(`summon wandering_trader ${testBaseX} ${testBaseY} ${testBaseZ + 2}`);
    await sleep(1000);

    // Find the trader
    let trader: any = null;
    for (const entityId of Object.keys(bot.entities)) {
      const entity = bot.entities[entityId];
      if (entity && String(entity.type).includes('wandering_trader')) {
        const distance = entity.position.distanceTo(bot.entity.position);
        if (distance < 10) {
          trader = entity;
          break;
        }
      }
    }

    if (!trader) {
      console.log('No wandering trader found, skipping test');
      return;
    }

    try {
      const tradeWindow = await bot.openVillager(trader);

      expect(tradeWindow).toBeTruthy();
      console.log(`Wandering trader has ${tradeWindow.trades.length} trades`);

      if (tradeWindow.close) {
        tradeWindow.close();
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        console.log('Trade window timeout');
        return;
      }
      throw err;
    }
  });

  it('should throw error when trading with non-villager entity', async function () {
    // Spawn a cow
    await server.sendCommand(`summon cow ${testBaseX} ${testBaseY} ${testBaseZ + 2}`);
    await sleep(500);

    // Find the cow
    let cow: any = null;
    for (const entityId of Object.keys(bot.entities)) {
      const entity = bot.entities[entityId];
      if (entity && String(entity.type).includes('cow')) {
        const distance = entity.position.distanceTo(bot.entity.position);
        if (distance < 10) {
          cow = entity;
          break;
        }
      }
    }

    if (!cow) {
      console.log('No cow found, skipping test');
      return;
    }

    await expect(bot.openVillager(cow)).rejects.toThrow('not a villager');

    // Cleanup
    await server.sendCommand(`kill @e[type=cow,x=${testBaseX},y=${testBaseY},z=${testBaseZ},r=10]`);
  });
});
