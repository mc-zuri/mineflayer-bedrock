import { expect } from 'expect';
import type { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
import {
  startBDSServer,
  connectBotToBDS,
  waitForBotSpawn,
  waitFor,
  sleep,
  giveItem,
  clearInventory,
  setBlock,
  teleportPlayer,
  getServerInventory,
  getServerBlockInventory,
  assertInventoryMatch,
  getClientInventory,
  type BDSServer,
  fill,
} from '../src/index.ts';

/**
 * Use Chests Test
 *
 * Tests chest interaction functionality including:
 * - Opening and closing chests (single and double)
 * - Depositing items into chests
 * - Withdrawing items from chests
 * - Chest lid move events for double chests
 * - Trapped chest interactions
 *
 * Based on: packages/mineflayer/test/externalTests/useChests.js
 */
describe('BDS Integration: Use Chests', function () {
  this.timeout(180_000);

  let server: BDSServer;
  let bot: Bot;

  // Test locations - relative to test area
  const testBaseX = 50;
  const testBaseY = 0;
  const testBaseZ = 50;

  const smallChestLocation = new Vec3(testBaseX, testBaseY, testBaseZ - 1);
  const largeChestLocations = [new Vec3(testBaseX, testBaseY, testBaseZ + 1), new Vec3(testBaseX + 1, testBaseY, testBaseZ + 1)];
  const smallTrappedChestLocation = new Vec3(testBaseX + 1, testBaseY, testBaseZ);
  const largeTrappedChestLocations = [new Vec3(testBaseX - 1, testBaseY, testBaseZ + 1), new Vec3(testBaseX - 1, testBaseY, testBaseZ)];

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

    // Clear inventory before each test
    try {
      await clearInventory(server, bot.username);
      //await sleep(500);
    } catch {
      // Ignore clear errors
    }
  });

  afterEach(async function () {
    if (bot?._client?.close) {
      bot._client.close();
    }
  });

  // Helper functions
  function itemByName(items: any[], name: string) {
    return items.find((item) => item && item.name === name) || null;
  }

  function hasItem(name: string) {
    return bot.inventory.itemsRange(0, 35).some((i) => i?.name === name);
  }

  function findItem(name: string) {
    return bot.inventory.itemsRange(0, 35).find((i) => i?.name === name);
  }

  async function assertInventorySync(context: string) {
    const serverInventory = await getServerInventory(server, bot.username);
    const clientInventory = getClientInventory(bot);
    assertInventoryMatch(clientInventory, serverInventory, context);
  }

  async function waitForBlock(pos: Vec3, expectedName: string, timeout = 5000) {
    await waitFor(() => bot.blockAt(pos)?.name === expectedName, timeout);
  }

  async function setupTestArea() {
    // Teleport bot to test area
    await teleportPlayer(server, bot.username, testBaseX, testBaseY + 1, testBaseZ);
    //await sleep(1000);
    await bot.waitForChunksToLoad();

    await fill(server, testBaseX - 2, testBaseY + 2, testBaseZ - 2, testBaseX - 2, testBaseY + 2, testBaseZ + 2, 'air');
    await fill(server, testBaseX - 2, testBaseY + 1, testBaseZ - 2, testBaseX - 2, testBaseY + 1, testBaseZ + 2, 'air');
    await fill(server, testBaseX - 2, testBaseY + 0, testBaseZ - 2, testBaseX - 2, testBaseY + 0, testBaseZ + 2, 'stone');
  }

  async function placeChests() {
    // Place small chest
    await setBlock(server, smallChestLocation.x, smallChestLocation.y, smallChestLocation.z, 'chest');

    // Place large chest (two adjacent chests)
    await setBlock(server, largeChestLocations[0].x, largeChestLocations[0].y, largeChestLocations[0].z, 'chest');
    await setBlock(server, largeChestLocations[1].x, largeChestLocations[1].y, largeChestLocations[1].z, 'chest');

    // Place small trapped chest
    await setBlock(server, smallTrappedChestLocation.x, smallTrappedChestLocation.y, smallTrappedChestLocation.z, 'trapped_chest');

    // Place large trapped chest
    await setBlock(server, largeTrappedChestLocations[0].x, largeTrappedChestLocations[0].y, largeTrappedChestLocations[0].z, 'trapped_chest');
    await setBlock(server, largeTrappedChestLocations[1].x, largeTrappedChestLocations[1].y, largeTrappedChestLocations[1].z, 'trapped_chest');

    //await sleep(500);
  }

  describe('Chest Placement Verification', () => {
    it('should place and detect single chest', async function () {
      await setupTestArea();

      // Place a single chest
      await setBlock(server, smallChestLocation.x, smallChestLocation.y, smallChestLocation.z, 'chest');
      await waitForBlock(smallChestLocation, 'chest');

      const chestBlock = bot.blockAt(smallChestLocation);
      expect(chestBlock).toBeTruthy();
      expect(chestBlock!.name).toBe('chest');
    });

    it('should place and detect double chest', async function () {
      await setupTestArea();

      // Place two adjacent chests to form a double chest
      await setBlock(server, largeChestLocations[0].x, largeChestLocations[0].y, largeChestLocations[0].z, 'chest');
      await setBlock(server, largeChestLocations[1].x, largeChestLocations[1].y, largeChestLocations[1].z, 'chest');
      await waitForBlock(largeChestLocations[0], 'chest');
      await waitForBlock(largeChestLocations[1], 'chest');

      const chest1 = bot.blockAt(largeChestLocations[0]);
      const chest2 = bot.blockAt(largeChestLocations[1]);

      expect(chest1).toBeTruthy();
      expect(chest1!.name).toBe('chest');
      expect(chest2).toBeTruthy();
      expect(chest2!.name).toBe('chest');
    });

    it('should place and detect trapped chest', async function () {
      await setupTestArea();

      await setBlock(server, smallTrappedChestLocation.x, smallTrappedChestLocation.y, smallTrappedChestLocation.z, 'trapped_chest');
      await waitForBlock(smallTrappedChestLocation, 'trapped_chest');

      const trappedChest = bot.blockAt(smallTrappedChestLocation);
      expect(trappedChest).toBeTruthy();
      expect(trappedChest!.name).toBe('trapped_chest');
    });
  });

  describe('Single Chest Operations', () => {
    it('should open and close a single chest', async function () {
      await setupTestArea();
      await setBlock(server, smallChestLocation.x, smallChestLocation.y, smallChestLocation.z, 'chest');
      //await sleep(500);

      const chestBlock = bot.blockAt(smallChestLocation)!;
      expect(chestBlock.name).toBe('chest');

      // Select empty slot before opening
      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Open chest
      const window = await bot.openBlock(chestBlock);
      expect(window).toBeTruthy();
      expect(bot.currentWindow).toBeTruthy();

      // Close chest
      await bot.closeWindow(window);
      //await sleep(500);

      expect(bot.currentWindow).toBeFalsy();
    });

    it('should deposit bones into single chest', async function () {
      await setupTestArea();
      await setBlock(server, smallChestLocation.x, smallChestLocation.y, smallChestLocation.z, 'chest');
      //await sleep(500);

      // Give bones to the bot
      await giveItem(server, bot.username, 'bone', 10);
      await waitFor(() => hasItem('bone'), 10000);

      const bone = findItem('bone')!;
      const boneType = bone.type;

      const chestBlock = bot.blockAt(smallChestLocation)!;
      expect(chestBlock.name).toBe('chest');

      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Open chest and deposit
      const window = (await bot.openBlock(chestBlock)) as any;
      expect(window).toBeTruthy();
      expect(window.containerItems().length).toBe(0);

      await window.deposit(boneType, null, 5);
      //await sleep(500);

      await bot.closeWindow(window);
      //await sleep(500);

      // Verify player has 5 bones left
      const remainingBones = findItem('bone');
      expect(remainingBones).toBeTruthy();
      expect(remainingBones!.count).toBe(5);

      // Verify chest has bones on server
      const chestInventory = await getServerBlockInventory(server, smallChestLocation.x, smallChestLocation.y, smallChestLocation.z);
      const chestBones = chestInventory.items.filter((i) => i.name === 'bone');
      expect(chestBones.length).toBeGreaterThan(0);
      const totalBonesInChest = chestBones.reduce((sum, i) => sum + i.count, 0);
      expect(totalBonesInChest).toBe(5);
    });

    it('should withdraw bones from single chest', async function () {
      await setupTestArea();
      await setBlock(server, smallChestLocation.x, smallChestLocation.y, smallChestLocation.z, 'chest');
      //await sleep(500);

      // Give bones to the bot and deposit them first
      await giveItem(server, bot.username, 'bone', 10);
      await waitFor(() => hasItem('bone'), 10000);

      const bone = findItem('bone')!;
      const boneType = bone.type;

      const chestBlock = bot.blockAt(smallChestLocation)!;
      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Deposit all bones
      let window = (await bot.openBlock(chestBlock)) as any;
      await window.deposit(boneType, null, 10);
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      // Verify no bones in inventory
      expect(hasItem('bone')).toBe(false);

      // Withdraw bones
      window = (await bot.openBlock(chestBlock)) as any;
      const containerBone = itemByName(window.containerItems(), 'bone');
      expect(containerBone).toBeTruthy();

      await window.withdraw(boneType, null, 5);
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      // Verify player has 5 bones
      const withdrawnBones = findItem('bone');
      expect(withdrawnBones).toBeTruthy();
      expect(withdrawnBones!.count).toBe(5);
    });
  });

  describe('Double Chest Operations', () => {
    it('should open and close a double chest', async function () {
      await setupTestArea();
      await placeChests();

      const chestBlock = bot.blockAt(largeChestLocations[0])!;
      expect(chestBlock.name).toBe('chest');

      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Open double chest
      const window = await bot.openBlock(chestBlock);
      expect(window).toBeTruthy();
      expect(bot.currentWindow).toBeTruthy();

      // Double chest should have 54 slots (27 per chest)
      // Note: actual slot count depends on prismarine-windows implementation

      await bot.closeWindow(window);
      //await sleep(500);

      expect(bot.currentWindow).toBeFalsy();
    });

    it('should deposit items into double chest', async function () {
      await setupTestArea();
      await placeChests();

      // Give bones to the bot
      await giveItem(server, bot.username, 'bone', 20);
      await waitFor(() => hasItem('bone'), 10000);

      const bone = findItem('bone')!;
      const boneType = bone.type;

      const chestBlock = bot.blockAt(largeChestLocations[0])!;
      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Open chest and deposit
      const window = (await bot.openBlock(chestBlock)) as any;
      expect(window).toBeTruthy();

      await window.deposit(boneType, null, 15);
      //await sleep(500);

      await bot.closeWindow(window);
      //await sleep(500);

      // Verify player has 5 bones left
      const remainingBones = findItem('bone');
      expect(remainingBones).toBeTruthy();
      expect(remainingBones!.count).toBe(5);
    });

    it('should withdraw items from double chest', async function () {
      await setupTestArea();
      await placeChests();

      // Give bones and deposit them first
      await giveItem(server, bot.username, 'bone', 20);
      await waitFor(() => hasItem('bone'), 10000);

      const bone = findItem('bone')!;
      const boneType = bone.type;

      const chestBlock = bot.blockAt(largeChestLocations[0])!;
      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Deposit all bones
      let window = (await bot.openBlock(chestBlock)) as any;
      await window.deposit(boneType, null, 20);
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      expect(hasItem('bone')).toBe(false);

      // Withdraw some bones
      window = (await bot.openBlock(chestBlock)) as any;
      await window.withdraw(boneType, null, 10);
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      // Verify player has 10 bones
      const withdrawnBones = findItem('bone');
      expect(withdrawnBones).toBeTruthy();
      expect(withdrawnBones!.count).toBe(10);
    });
  });

  describe('Trapped Chest Operations', () => {
    it('should open and close trapped chest', async function () {
      await setupTestArea();
      await setBlock(server, smallTrappedChestLocation.x, smallTrappedChestLocation.y, smallTrappedChestLocation.z, 'trapped_chest');
      //await sleep(500);

      const trappedChestBlock = bot.blockAt(smallTrappedChestLocation)!;
      expect(trappedChestBlock.name).toBe('trapped_chest');

      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Open trapped chest
      const window = await bot.openBlock(trappedChestBlock);
      expect(window).toBeTruthy();
      expect(bot.currentWindow).toBeTruthy();

      await bot.closeWindow(window);
      //await sleep(500);

      expect(bot.currentWindow).toBeFalsy();
    });

    it('should deposit items into trapped chest', async function () {
      await setupTestArea();
      await setBlock(server, smallTrappedChestLocation.x, smallTrappedChestLocation.y, smallTrappedChestLocation.z, 'trapped_chest');
      //await sleep(500);

      // Give bones to the bot
      await giveItem(server, bot.username, 'bone', 10);
      await waitFor(() => hasItem('bone'), 10000);

      const bone = findItem('bone')!;
      const boneType = bone.type;

      const trappedChestBlock = bot.blockAt(smallTrappedChestLocation)!;
      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Open trapped chest and deposit
      const window = (await bot.openBlock(trappedChestBlock)) as any;
      expect(window).toBeTruthy();

      await window.deposit(boneType, null, 5);
      //await sleep(500);

      await bot.closeWindow(window);
      //await sleep(500);

      // Verify player has 5 bones left
      const remainingBones = findItem('bone');
      expect(remainingBones).toBeTruthy();
      expect(remainingBones!.count).toBe(5);
    });

    it('should withdraw items from trapped chest', async function () {
      await setupTestArea();
      await setBlock(server, smallTrappedChestLocation.x, smallTrappedChestLocation.y, smallTrappedChestLocation.z, 'trapped_chest');
      //await sleep(500);

      // Give bones and deposit them first
      await giveItem(server, bot.username, 'bone', 10);
      await waitFor(() => hasItem('bone'), 10000);

      const bone = findItem('bone')!;
      const boneType = bone.type;

      const trappedChestBlock = bot.blockAt(smallTrappedChestLocation)!;
      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Deposit all bones
      let window = (await bot.openBlock(trappedChestBlock)) as any;
      await window.deposit(boneType, null, 10);
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      expect(hasItem('bone')).toBe(false);

      // Withdraw some bones
      window = (await bot.openBlock(trappedChestBlock)) as any;
      await window.withdraw(boneType, null, 5);
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      // Verify player has 5 bones
      const withdrawnBones = findItem('bone');
      expect(withdrawnBones).toBeTruthy();
      expect(withdrawnBones!.count).toBe(5);
    });
  });

  describe('Double Trapped Chest Operations', () => {
    it('should open and close double trapped chest', async function () {
      await setupTestArea();
      await placeChests();

      const trappedChestBlock = bot.blockAt(largeTrappedChestLocations[0])!;
      expect(trappedChestBlock.name).toBe('trapped_chest');

      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Open double trapped chest
      const window = await bot.openBlock(trappedChestBlock);
      expect(window).toBeTruthy();
      expect(bot.currentWindow).toBeTruthy();

      await bot.closeWindow(window);
      //await sleep(500);

      expect(bot.currentWindow).toBeFalsy();
    });

    it('should deposit items into double trapped chest', async function () {
      await setupTestArea();
      await placeChests();

      // Give bones to the bot
      await giveItem(server, bot.username, 'bone', 20);
      await waitFor(() => hasItem('bone'), 10000);

      const bone = findItem('bone')!;
      const boneType = bone.type;

      const trappedChestBlock = bot.blockAt(largeTrappedChestLocations[0])!;
      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Open double trapped chest and deposit
      const window = (await bot.openBlock(trappedChestBlock)) as any;
      expect(window).toBeTruthy();

      await window.deposit(boneType, null, 15);
      //await sleep(500);

      await bot.closeWindow(window);
      //await sleep(500);

      // Verify player has 5 bones left
      const remainingBones = findItem('bone');
      expect(remainingBones).toBeTruthy();
      expect(remainingBones!.count).toBe(5);
    });

    it('should withdraw items from double trapped chest', async function () {
      await setupTestArea();
      await placeChests();

      // Give bones and deposit them first
      await giveItem(server, bot.username, 'bone', 20);
      await waitFor(() => hasItem('bone'), 10000);

      const bone = findItem('bone')!;
      const boneType = bone.type;

      const trappedChestBlock = bot.blockAt(largeTrappedChestLocations[0])!;
      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Deposit all bones
      let window = (await bot.openBlock(trappedChestBlock)) as any;
      await window.deposit(boneType, null, 20);
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      expect(hasItem('bone')).toBe(false);

      // Withdraw some bones
      window = (await bot.openBlock(trappedChestBlock)) as any;
      await window.withdraw(boneType, null, 10);
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      // Verify player has 10 bones
      const withdrawnBones = findItem('bone');
      expect(withdrawnBones).toBeTruthy();
      expect(withdrawnBones!.count).toBe(10);
    });
  });

  describe('Complete Workflow', () => {
    it('should complete full deposit and withdraw cycle', async function () {
      this.timeout(60000);

      await setupTestArea();
      await placeChests();

      // Give bones to the bot
      await giveItem(server, bot.username, 'bone', 30);
      await waitFor(() => hasItem('bone'), 10000);
      await assertInventorySync('After receiving bones');

      const bone = findItem('bone')!;
      const boneType = bone.type;

      // Deposit to small chest
      const smallChestBlock = bot.blockAt(smallChestLocation)!;
      bot.setQuickBarSlot(8);
      //await sleep(100);

      let window = (await bot.openBlock(smallChestBlock)) as any;
      expect(window.containerItems().length).toBe(0);
      await window.deposit(boneType, null, 10);
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      expect(findItem('bone')!.count).toBe(20);

      // Deposit to large chest
      const largeChestBlock = bot.blockAt(largeChestLocations[0])!;
      window = (await bot.openBlock(largeChestBlock)) as any;
      await window.deposit(boneType, null, 15);
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      expect(findItem('bone')!.count).toBe(5);

      // Now withdraw from small chest
      window = (await bot.openBlock(smallChestBlock)) as any;
      const containerBone = itemByName(window.containerItems(), 'bone');
      expect(containerBone).toBeTruthy();
      await window.withdraw(boneType, null, 10);
      //await sleep(500);
      expect(window.containerItems().length).toBe(0);
      await bot.closeWindow(window);
      //await sleep(500);

      expect(findItem('bone')!.count).toBe(15);

      // Withdraw from large chest
      window = (await bot.openBlock(largeChestBlock)) as any;
      await window.withdraw(boneType, null, 15);
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      // Should have all bones back
      expect(findItem('bone')!.count).toBe(30);
      await assertInventorySync('After full cycle');
    });

    it('should handle multiple item types in chest', async function () {
      this.timeout(60000);

      await setupTestArea();
      await setBlock(server, smallChestLocation.x, smallChestLocation.y, smallChestLocation.z, 'chest');
      //await sleep(500);

      // Give multiple item types to the bot
      await giveItem(server, bot.username, 'bone', 10);
      await giveItem(server, bot.username, 'diamond', 5);
      await giveItem(server, bot.username, 'iron_ingot', 20);
      await waitFor(() => hasItem('bone') && hasItem('diamond') && hasItem('iron_ingot'), 10000);

      const bone = findItem('bone')!;
      const diamond = findItem('diamond')!;
      const iron = findItem('iron_ingot')!;

      const chestBlock = bot.blockAt(smallChestLocation)!;
      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Deposit all items
      let window = (await bot.openBlock(chestBlock)) as any;
      await window.deposit(bone.type, null, 10);
      await window.deposit(diamond.type, null, 5);
      await window.deposit(iron.type, null, 20);
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      // Verify inventory is empty
      expect(hasItem('bone')).toBe(false);
      expect(hasItem('diamond')).toBe(false);
      expect(hasItem('iron_ingot')).toBe(false);

      // Withdraw all items
      window = (await bot.openBlock(chestBlock)) as any;
      expect(window.containerItems().length).toBe(3);
      await window.withdraw(bone.type, null, 10);
      await window.withdraw(diamond.type, null, 5);
      await window.withdraw(iron.type, null, 20);
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      // Verify all items are back
      expect(findItem('bone')!.count).toBe(10);
      expect(findItem('diamond')!.count).toBe(5);
      expect(findItem('iron_ingot')!.count).toBe(20);
    });
  });

  describe('Chest Lid Events', () => {
    it('should emit chestLidMove event when opening double chest', async function () {
      // Note: This test is skipped because chestLidMove event support
      // for Bedrock Edition needs investigation
      await setupTestArea();
      await placeChests();

      let emitted = false;
      const handler = (block: any, isOpen: number, block2: any) => {
        emitted = true;
        // Verify both blocks are part of the large chest
        const isBlock1Valid = largeChestLocations.some((loc) => loc.equals(block.position));
        const isBlock2Valid = block2 != null && largeChestLocations.some((loc) => loc.equals(block2.position));
        expect(isBlock1Valid && isBlock2Valid).toBe(true);
        expect(isOpen).toBe(true); // Opened by one player
      };

      bot.on('chestLidMove', handler);

      const chestBlock = bot.blockAt(largeChestLocations[0])!;
      bot.setQuickBarSlot(8);
      //await sleep(100);

      const window = await bot.openBlock(chestBlock);
      //await sleep(500);

      expect(emitted).toBe(true);

      bot.removeListener('chestLidMove', handler);
      await bot.closeWindow(window);
    });
  });
});
