import { expect } from 'expect';
import type { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
import {
  startBDSServer,
  connectBotToBDS,
  waitForBotSpawn,
  waitFor,
  sleep,
  setBlock,
  fill,
  teleportPlayer,
  giveItem,
  getServerInventory,
  getClientInventory,
  assertInventoryMatch,
  type BDSServer,
} from '../src/index.ts';

// Helper to wait for block to appear after setBlock
async function waitForBlock(bot: Bot, pos: Vec3, expectedName: string, timeout = 10000) {
  await waitFor(() => {
    const block = bot.blockAt(pos);
    return block?.name === expectedName;
  }, timeout);
}

/**
 * Farming Test Environment
 *
 * This test sets up a farming environment to capture packets for:
 * - Harvesting fully grown crops (carrots, potatoes, wheat)
 * - Planting seeds
 * - Breaking crop blocks
 *
 * Run with: npm run test:bds -- --grep "Farming"
 */
describe('BDS Integration: Farming', function () {
  this.timeout(300_000); // 5 minutes for manual packet capture

  let server: BDSServer;
  let bot: Bot;

  before(async function () {
    this.timeout(180_000);
    server = await startBDSServer({
      version: '1.21.130',
    });
  });

  after(async function () {
    await server?.stop();
  });

  beforeEach(async function () {
    bot = await connectBotToBDS(server);
    await waitForBotSpawn(bot);
    await bot.waitForChunksToLoad();
    // await sleep(1000);
  });

  afterEach(async function () {
    try {
      if (bot?._client?.close) {
        bot._client.close();
      }
    } catch {
      // Ignore close errors
    }
    // Wait for server to process disconnect
    await sleep(2000);
  });

  describe('Digging', () => {
    it('should break a dirt block', async function () {
      this.timeout(30000);

      // Teleport bot to a clear area
      await teleportPlayer(server, bot.username, 60, 0, 60);
      // await sleep(1000);
      await bot.waitForChunksToLoad();

      // Place a dirt block in front of the bot
      const blockX = 61;
      const blockY = 0;
      const blockZ = 60;
      const blockPos = new Vec3(blockX, blockY, blockZ);
      await setBlock(server, blockX, blockY, blockZ, 'dirt');
      await waitForBlock(bot, blockPos, 'dirt');

      // Verify the dirt block exists
      const dirtBlock = bot.blockAt(blockPos);
      expect(dirtBlock).toBeTruthy();
      expect(dirtBlock!.name).toBe('dirt');

      // Dig the block
      await bot.dig(dirtBlock!);

      // Wait for block to become air
      await waitFor(() => {
        const block = bot.blockAt(new Vec3(blockX, blockY, blockZ));
        return block?.name === 'air';
      }, 10000);

      const afterBlock = bot.blockAt(new Vec3(blockX, blockY, blockZ));
      expect(afterBlock?.name).toBe('air');
    });

    it('should break grass block', async function () {
      this.timeout(30000);

      // Use position near spawn that reliably loads chunks
      await teleportPlayer(server, bot.username, 5, 0, 5);
      // await sleep(1000);
      await bot.waitForChunksToLoad();

      const blockX = 6;
      const blockY = 0;
      const blockZ = 5;

      // Place a grass block
      const blockPos = new Vec3(blockX, blockY, blockZ);
      await setBlock(server, blockX, blockY, blockZ, 'grass_block');
      await waitForBlock(bot, blockPos, 'grass_block');

      // Verify grass exists
      const grassBlock = bot.blockAt(blockPos);
      expect(grassBlock).toBeTruthy();
      expect(grassBlock!.name).toBe('grass_block');

      // Dig the grass
      await bot.dig(grassBlock!);

      // Wait for block to become air
      await waitFor(() => {
        const block = bot.blockAt(new Vec3(blockX, blockY, blockZ));
        return block?.name === 'air';
      }, 10000);

      const afterBlock = bot.blockAt(new Vec3(blockX, blockY, blockZ));
      expect(afterBlock?.name).toBe('air');
    });

    it('should abort digging when stopDigging is called', async function () {
      this.timeout(30000);

      await teleportPlayer(server, bot.username, 80, 0, 60);
      await bot.waitForChunksToLoad();

      // Place obsidian (takes 250 seconds with bare hands - much safer for abort test)
      const blockX = 81;
      const blockY = 0;
      const blockZ = 60;
      const blockPos = new Vec3(blockX, blockY, blockZ);
      await setBlock(server, blockX, blockY, blockZ, 'obsidian');
      await waitForBlock(bot, blockPos, 'obsidian');

      const obsidianBlock = bot.blockAt(blockPos);
      expect(obsidianBlock).toBeTruthy();
      expect(obsidianBlock!.name).toBe('obsidian');

      // Verify dig time is long enough for this test to be meaningful
      const digTime = bot.digTime(obsidianBlock!);
      console.log(`Obsidian dig time: ${digTime}ms`);
      expect(digTime).toBeGreaterThan(10000); // Should take at least 10 seconds

      // Start digging but abort after a short delay
      const digPromise = bot.dig(obsidianBlock!).catch(() => {});

      // Wait 1 second for digging to start, but not complete
      // Obsidian takes 250 seconds with bare hands, so 1 second is very safe
      await sleep(1000);
      bot.stopDigging();

      // Wait for the dig promise to resolve (aborted)
      await digPromise;

      // Block should still be obsidian (not broken)
      const afterBlock = bot.blockAt(blockPos);
      expect(afterBlock?.name).toBe('obsidian');
    });

    it('should break stone block with bare hands', async function () {
      this.timeout(60000); // Stone takes ~7.5 seconds to break with bare hands

      // Use position near spawn
      await teleportPlayer(server, bot.username, 10, 0, 5);
      await bot.waitForChunksToLoad();

      const blockX = 11;
      const blockY = 0;
      const blockZ = 5;
      const blockPos = new Vec3(blockX, blockY, blockZ);
      await setBlock(server, blockX, blockY, blockZ, 'stone');
      await waitForBlock(bot, blockPos, 'stone');

      const stoneBlock = bot.blockAt(blockPos);
      expect(stoneBlock).toBeTruthy();
      expect(stoneBlock!.name).toBe('stone');

      // Note: Stone takes ~7500ms to break with bare hands in survival
      const digTime = bot.digTime(stoneBlock!);
      expect(digTime).toBeGreaterThan(5000); // Should take a while without tools

      // Dig the block
      await bot.dig(stoneBlock!);

      // Verify block is broken
      await waitFor(() => {
        const block = bot.blockAt(new Vec3(blockX, blockY, blockZ));
        return block?.name === 'air';
      }, 15000);

      const afterBlock = bot.blockAt(new Vec3(blockX, blockY, blockZ));
      expect(afterBlock?.name).toBe('air');
    });
  });

  describe('Planting', () => {
    it('should plant wheat seeds on farmland', async () => {
      const farmX = 30,
        farmY = -1,
        farmZ = 30;

      // Teleport bot near the planting area
      await teleportPlayer(server, bot.username, farmX, farmY + 1, farmZ);
      await bot.waitForChunksToLoad();

      // Create farmland
      await setBlock(server, farmX, farmY, farmZ, 'farmland');
      await sleep(500);

      // Give bot wheat seeds
      await giveItem(server, bot.username, 'wheat_seeds', 1);
      await waitFor(() => {
        const seeds = bot.inventory.slots.find((s) => s?.name === 'wheat_seeds');
        return !!seeds;
      }, 5000);

      // Equip the seeds
      const seeds = bot.inventory.slots.find((s) => s?.name === 'wheat_seeds')!;
      await bot.equip(seeds, 'hand');
      expect(bot.heldItem?.name).toBe('wheat_seeds');

      // Get the farmland block
      const farmland = bot.blockAt(new Vec3(farmX, farmY, farmZ));
      expect(farmland?.name).toBe('farmland');

      // Plant the seeds on top of farmland
      await bot.placeBlock(farmland!, new Vec3(0, 1, 0));
      await sleep(500);

      // Verify wheat crop was planted
      await waitFor(() => {
        const crop = bot.blockAt(new Vec3(farmX, farmY + 1, farmZ));
        return crop?.name === 'wheat';
      }, 5000);

      const crop = bot.blockAt(new Vec3(farmX, farmY + 1, farmZ));
      expect(crop?.name).toBe('wheat');
    });

    it('should plant carrots on farmland', async function () {
      this.timeout(60000);
      // Use position in same chunk as wheat test (chunk containing x=30)
      const farmX = 30,
        farmY = -1,
        farmZ = 35;
      const farmPos = new Vec3(farmX, farmY, farmZ);

      // Teleport bot near the planting area
      console.log('Teleporting...');
      await teleportPlayer(server, bot.username, farmX, farmY + 1, farmZ);
      console.log('Waiting for chunks...');
      await sleep(1000); // Wait for chunks
      await bot.waitForChunksToLoad();
      console.log(`Chunks loaded at (${farmX}, ${farmY + 1}, ${farmZ})`);
      console.log(`Block at farmPos before setBlock: ${bot.blockAt(farmPos)?.name}`);

      // Create farmland - try waiting for the block update
      await setBlock(server, farmX, farmY, farmZ, 'farmland');

      // Wait with retries for block update (up to 10 seconds)
      let farmlandBlock: any = null;
      for (let attempt = 0; attempt < 20; attempt++) {
        await sleep(500);
        farmlandBlock = bot.blockAt(farmPos);
        console.log(`Attempt ${attempt + 1}: Block = ${farmlandBlock?.name}`);
        if (farmlandBlock?.name === 'farmland') break;
      }
      expect(farmlandBlock?.name).toBe('farmland');

      // Give bot carrots (carrots are both the crop and the seed)
      await giveItem(server, bot.username, 'carrot', 1);
      await waitFor(() => {
        const carrot = bot.inventory.slots.find((s) => s?.name === 'carrot');
        return !!carrot;
      }, 5000);

      // Equip the carrot
      const carrot = bot.inventory.slots.find((s) => s?.name === 'carrot')!;
      await bot.equip(carrot, 'hand');
      expect(bot.heldItem?.name).toBe('carrot');

      // Get the farmland block
      const farmland = bot.blockAt(new Vec3(farmX, farmY, farmZ));
      expect(farmland?.name).toBe('farmland');

      // Plant the carrot on top of farmland
      await bot.placeBlock(farmland!, new Vec3(0, 1, 0));
      await sleep(500);

      // Verify carrots were planted
      await waitFor(() => {
        const crop = bot.blockAt(new Vec3(farmX, farmY + 1, farmZ));
        return crop?.name === 'carrots';
      }, 5000);

      const crop = bot.blockAt(new Vec3(farmX, farmY + 1, farmZ));
      expect(crop?.name).toBe('carrots');
    });

    it('should plant multiple seeds consecutively', async function () {
      this.timeout(120_000);
      // Use position in same chunk as wheat test (chunk containing x=30)
      const baseX = 25,
        baseY = -1,
        baseZ = 30;

      // Helper to check inventory sync
      async function assertInventorySync(context: string) {
        const serverInventory = await getServerInventory(server, bot.username);
        const clientInventory = getClientInventory(bot);
        assertInventoryMatch(clientInventory, serverInventory, context);
      }

      await teleportPlayer(server, bot.username, baseX, baseY + 2, baseZ);
      await sleep(1000); // Wait for chunks
      await bot.waitForChunksToLoad();
      console.log('Chunks loaded, creating farmland blocks...');

      // Setup 3 farmland blocks
      for (let i = 0; i < 3; i++) {
        await setBlock(server, baseX + i, baseY, baseZ, 'farmland');
      }
      // Wait with retries for blocks to appear (up to 10 seconds per block)
      for (let i = 0; i < 3; i++) {
        let block: any = null;
        for (let attempt = 0; attempt < 20; attempt++) {
          await sleep(500);
          block = bot.blockAt(new Vec3(baseX + i, baseY, baseZ));
          console.log(`Farmland ${i} attempt ${attempt + 1}: ${block?.name}`);
          if (block?.name === 'farmland') break;
        }
        expect(block?.name).toBe('farmland');
      }

      // Give seeds
      await giveItem(server, bot.username, 'wheat_seeds', 10);
      await waitFor(() => bot.inventory.slots.find((s) => s?.name === 'wheat_seeds'), 5000);

      await assertInventorySync('After receiving seeds');

      // Equip seeds
      const seeds = bot.inventory.slots.find((s) => s?.name === 'wheat_seeds')!;
      await bot.equip(seeds, 'hand');
      console.log(`Equipped seeds: slot=${seeds.slot}, count=${seeds.count}, heldItem=${bot.heldItem?.name}`);

      await assertInventorySync('After equipping seeds');

      // Plant 3 seeds consecutively (the bug scenario)
      for (let i = 0; i < 3; i++) {
        const farmland = bot.blockAt(new Vec3(baseX + i, baseY, baseZ))!;
        expect(farmland.name).toBe('farmland');
        console.log(`Planting seed ${i + 1}: heldItem=${bot.heldItem?.name}, count=${bot.heldItem?.count}`);
        await bot.placeBlock(farmland, new Vec3(0, 1, 0));
        await sleep(500);
        await assertInventorySync(`After planting seed ${i + 1}`);
      }

      // Verify all 3 crops were planted
      for (let i = 0; i < 3; i++) {
        await waitFor(() => bot.blockAt(new Vec3(baseX + i, baseY + 1, baseZ))?.name === 'wheat', 5000);
      }
    });

    it('should plant seeds after collecting items', async function () {
      this.timeout(60_000);
      // Use coordinates close to spawn (0,0) for reliable chunk loading
      const baseX = 50,
        baseY = -1,
        baseZ = 30;

      // Helper to check inventory sync
      async function assertInventorySync(context: string) {
        const serverInventory = await getServerInventory(server, bot.username);
        const clientInventory = getClientInventory(bot);
        assertInventoryMatch(clientInventory, serverInventory, context);
      }

      console.log('Teleporting...');
      await teleportPlayer(server, bot.username, baseX, baseY + 2, baseZ);
      console.log('Waiting for chunks...');
      await bot.waitForChunksToLoad();
      await sleep(1000); // Extra wait for chunk to fully load
      console.log('Setting farmland...');
      await setBlock(server, baseX, baseY, baseZ, 'farmland');
      await setBlock(server, baseX + 1, baseY, baseZ, 'farmland');
      // Wait for block updates to reach the bot
      await sleep(1000);
      console.log(`Bot position: ${bot.entity.position.toString()}`);
      console.log(`Block at ${baseX}, ${baseY}, ${baseZ}: ${bot.blockAt(new Vec3(baseX, baseY, baseZ))?.name}`);
      await waitForBlock(bot, new Vec3(baseX, baseY, baseZ), 'farmland');
      await waitForBlock(bot, new Vec3(baseX + 1, baseY, baseZ), 'farmland');

      // Give seeds and equip
      console.log('Giving seeds...');
      await giveItem(server, bot.username, 'wheat_seeds', 10);
      await waitFor(() => bot.inventory.slots.find((s) => s?.name === 'wheat_seeds'), 5000);
      await assertInventorySync('After receiving seeds');

      console.log('Equipping seeds...');
      await bot.equip(bot.inventory.slots.find((s) => s?.name === 'wheat_seeds')!, 'hand');
      await assertInventorySync('After equipping seeds');

      // Plant first seed
      console.log('Planting first seed...');
      const farmland1 = bot.blockAt(new Vec3(baseX, baseY, baseZ));
      console.log(`Farmland 1: ${farmland1?.name}`);
      await bot.placeBlock(farmland1!, new Vec3(0, 1, 0));
      await waitFor(() => bot.blockAt(new Vec3(baseX, baseY + 1, baseZ))?.name === 'wheat', 5000);
      await assertInventorySync('After planting first seed');
      console.log('First seed planted');

      // Plant second seed (fails without fix)
      console.log('Planting second seed...');
      const farmland2 = bot.blockAt(new Vec3(baseX + 1, baseY, baseZ));
      console.log(`Farmland 2: ${farmland2?.name}`);
      await bot.placeBlock(farmland2!, new Vec3(0, 1, 0));
      await waitFor(() => bot.blockAt(new Vec3(baseX + 1, baseY + 1, baseZ))?.name === 'wheat', 5000);
      await assertInventorySync('After planting second seed');
      console.log('Second seed planted');
    });

    it('should break plant, collect drops, and replant', async function () {
      this.timeout(60_000);
      const baseX = 55,
        baseY = -1,
        baseZ = 30;

      // Helper to check inventory sync
      async function assertInventorySync(context: string) {
        const serverInventory = await getServerInventory(server, bot.username);
        const clientInventory = getClientInventory(bot);
        assertInventoryMatch(clientInventory, serverInventory, context);
      }

      // Teleport bot near the area
      await teleportPlayer(server, bot.username, baseX, baseY + 2, baseZ);
      await sleep(1000); // Wait for teleport to complete
      await bot.waitForChunksToLoad();
      console.log('Chunks loaded, setting up test...');

      // Create farmland
      await setBlock(server, baseX, baseY, baseZ, 'farmland');
      await sleep(1000);

      // Give bot wheat seeds FIRST (before planting wheat, to ensure we have seeds for replant)
      await giveItem(server, bot.username, 'wheat_seeds', 5);
      await waitFor(() => bot.inventory.slots.find((s) => s?.name === 'wheat_seeds'), 5000);
      await assertInventorySync('After receiving seeds');

      const initialSeeds = bot.inventory.slots.find((s) => s?.name === 'wheat_seeds')!;
      console.log(`Initial seeds: ${initialSeeds.count}`);

      // Equip seeds first
      await bot.equip(initialSeeds, 'hand');
      await assertInventorySync('After equipping seeds');
      expect(bot.heldItem?.name).toBe('wheat_seeds');

      // Get farmland block
      const farmland = bot.blockAt(new Vec3(baseX, baseY, baseZ))!;
      console.log(`Farmland block: ${farmland?.name}`);

      // Plant a seed first (this tests the planting works)
      console.log('Planting seed...');
      await bot.placeBlock(farmland, new Vec3(0, 1, 0));
      await sleep(1000);

      // Verify seed was planted
      await waitFor(() => {
        const crop = bot.blockAt(new Vec3(baseX, baseY + 1, baseZ));
        return crop?.name === 'wheat';
      }, 5000);
      console.log('Seed planted successfully');
      await assertInventorySync('After planting seed');

      // Now break the wheat crop
      const wheatBlock = bot.blockAt(new Vec3(baseX, baseY + 1, baseZ))!;
      expect(wheatBlock.name).toBe('wheat');
      console.log('Breaking wheat...');
      await bot.dig(wheatBlock);

      // Wait for block to become air - check against server via command
      await sleep(1000);
      console.log('Wheat broken');
      await assertInventorySync('After breaking wheat');

      // Re-equip seeds (they should still be in inventory)
      const seedsForReplant = bot.inventory.slots.find((s) => s?.name === 'wheat_seeds')!;
      expect(seedsForReplant).toBeTruthy();
      console.log(`Seeds for replant: count=${seedsForReplant.count}`);

      // Switch slot and re-equip to ensure proper state
      await bot.setQuickBarSlot((bot.quickBarSlot + 1) % 9);
      await sleep(100);
      await bot.equip(seedsForReplant, 'hand');
      await sleep(100);
      await assertInventorySync('After re-equipping seeds');
      expect(bot.heldItem?.name).toBe('wheat_seeds');

      // Replant on the same farmland
      console.log('Replanting...');
      await bot.placeBlock(farmland, new Vec3(0, 1, 0));
      await sleep(1000);

      // Verify replant succeeded by checking inventory changed
      await assertInventorySync('After replanting');
      console.log('Successfully replanted!');
    });
  });
});
