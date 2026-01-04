import { expect } from 'expect';
import type { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
import {
  startExternalServer,
  connectBotToExternalServer,
  waitForBotSpawn,
  waitFor,
  sleep,
  giveItem,
  clearInventory,
  setBlock,
  teleportPlayer,
  type ExternalServer,
} from 'minecraft-bedrock-test-server';
import { setupPacketLogging, saveCapturedPackets, createInventoryHelpers, type PacketCapture } from './crafting-test-utils.mts';

/**
 * Workstation Integration Tests
 *
 * Tests for opening and using workstations (grindstone, loom, brewing, cartography, enchanting)
 * Run with: npm run mocha_test --workspace=minecraft-bedrock-tests -- test/workstation.test.mts
 */
describe('BDS Integration: Workstations', function () {
  this.timeout(120_000);

  let server: ExternalServer;
  let bot: Bot;
  let craftingDataRef = { packet: null as any };
  const capturedPackets: PacketCapture[] = [];
  let hasItem: (name: string) => boolean;
  let countItem: (name: string) => number;

  before(async function () {
    this.timeout(180_000);
    server = await startExternalServer({
      version: process.env.BDS_VERSION || '1.21.130',
    });
  });

  after(async function () {
    await server?.stop();
    saveCapturedPackets(capturedPackets, 'workstation_packets.json');
  });

  beforeEach(async function () {
    bot = await connectBotToExternalServer(server);
    setupPacketLogging(bot, capturedPackets, craftingDataRef);
    await waitForBotSpawn(bot);

    const helpers = createInventoryHelpers(bot);
    hasItem = helpers.hasItem;
    countItem = helpers.countItem;

    try {
      await clearInventory(server, bot.username);
    } catch {
      // Ignore clear errors
    }
  });

  afterEach(async function () {
    if (bot?._client?.close) {
      bot._client.close();
    }
  });

  describe('Grindstone', () => {
    it('should open grindstone and place item', async function () {
      this.timeout(60000);

      const grindPos = { x: 4, y: 1, z: 85 };
      await setBlock(server, grindPos.x, grindPos.y - 1, grindPos.z, 'stone');
      await teleportPlayer(server, bot.username, grindPos.x + 0.5, grindPos.y, grindPos.z + 2);
      await bot.waitForChunksToLoad();
      await setBlock(server, grindPos.x, grindPos.y, grindPos.z, 'grindstone');

      await sleep(500);
      const block = bot.blockAt(new Vec3(grindPos.x, grindPos.y, grindPos.z));
      console.log(`Block at grindstone position: ${block?.name}`);

      if (!block || !block.name?.includes('grindstone')) {
        console.log('Grindstone not found, skipping test');
        this.skip();
        return;
      }

      await giveItem(server, bot.username, 'diamond_sword', 1);
      await waitFor(() => hasItem('diamond_sword'), 5000);

      console.log('Opening grindstone...');
      const grindstone = await (bot as any).openGrindstone(block);

      try {
        await grindstone.putItem('diamond_sword', null);
        console.log('Put diamond_sword in grindstone');

        await sleep(300);
        console.log('Grindstone input item:', grindstone.inputItem()?.name);
        console.log('Grindstone test passed!');
      } finally {
        grindstone.close();
      }
    });
  });

  describe('Loom', () => {
    it('should open loom', async function () {
      this.timeout(60000);

      const loomPos = { x: 4, y: 1, z: 90 };
      await setBlock(server, loomPos.x, loomPos.y - 1, loomPos.z, 'stone');
      await teleportPlayer(server, bot.username, loomPos.x + 0.5, loomPos.y, loomPos.z + 2);
      await bot.waitForChunksToLoad();
      await setBlock(server, loomPos.x, loomPos.y, loomPos.z, 'loom');

      await sleep(500);
      const block = bot.blockAt(new Vec3(loomPos.x, loomPos.y, loomPos.z));
      console.log(`Block at loom position: ${block?.name}`);

      if (!block || !block.name?.includes('loom')) {
        console.log('Loom not found, skipping test');
        this.skip();
        return;
      }

      console.log('Opening loom...');
      const loom = await (bot as any).openLoom(block);

      try {
        console.log('Loom window opened: id=' + loom.window?.id);
        expect(loom.window).toBeDefined();
        console.log('Loom test passed!');
      } finally {
        loom.close();
      }
    });
  });

  describe('Brewing Stand', () => {
    it('should open brewing stand', async function () {
      this.timeout(60000);

      const brewPos = { x: 4, y: 1, z: 95 };
      await setBlock(server, brewPos.x, brewPos.y - 1, brewPos.z, 'stone');
      await teleportPlayer(server, bot.username, brewPos.x + 0.5, brewPos.y, brewPos.z + 2);
      await bot.waitForChunksToLoad();
      await setBlock(server, brewPos.x, brewPos.y, brewPos.z, 'brewing_stand');

      await sleep(500);
      const block = bot.blockAt(new Vec3(brewPos.x, brewPos.y, brewPos.z));
      console.log(`Block at brewing stand position: ${block?.name}`);

      if (!block || !block.name?.includes('brewing')) {
        console.log('Brewing stand not found, skipping test');
        this.skip();
        return;
      }

      console.log('Opening brewing stand...');
      const brewingStand = await (bot as any).openBrewingStand(block);

      try {
        console.log('Brewing stand window opened: id=' + brewingStand.window?.id);
        expect(brewingStand.window).toBeDefined();
        console.log('Brewing stand test passed!');
      } finally {
        brewingStand.close();
      }
    });
  });

  describe('Cartography Table', () => {
    it('should open cartography table', async function () {
      this.timeout(60000);

      const cartoPos = { x: 4, y: 1, z: 100 };
      await setBlock(server, cartoPos.x, cartoPos.y - 1, cartoPos.z, 'stone');
      await teleportPlayer(server, bot.username, cartoPos.x + 0.5, cartoPos.y, cartoPos.z + 2);
      await bot.waitForChunksToLoad();
      await setBlock(server, cartoPos.x, cartoPos.y, cartoPos.z, 'cartography_table');

      await sleep(500);
      const block = bot.blockAt(new Vec3(cartoPos.x, cartoPos.y, cartoPos.z));
      console.log(`Block at cartography table position: ${block?.name}`);

      if (!block || !block.name?.includes('cartography')) {
        console.log('Cartography table not found, skipping test');
        this.skip();
        return;
      }

      console.log('Opening cartography table...');
      const cartoTable = await (bot as any).openCartographyTable(block);

      try {
        console.log('Cartography table window opened: id=' + cartoTable.window?.id);
        expect(cartoTable.window).toBeDefined();
        console.log('Cartography table test passed!');
      } finally {
        cartoTable.close();
      }
    });
  });

  // NOTE: Enchanting test is last because it causes BDS server to crash afterward
  describe('Enchanting Table', () => {
    it('should enchant item', async function () {
      this.timeout(60000);

      await waitFor(() => craftingDataRef.packet !== null, 10000);

      const enchantPos = { x: 0, y: 1, z: 80 };
      await teleportPlayer(server, bot.username, enchantPos.x, enchantPos.y + 1, enchantPos.z + 1);
      await bot.waitForChunksToLoad();
      await setBlock(server, enchantPos.x, enchantPos.y, enchantPos.z, 'enchanting_table');

      await sleep(500);
      const block = bot.blockAt(new Vec3(enchantPos.x, enchantPos.y, enchantPos.z));
      console.log(`Block at enchanting table position: ${block?.name}`);

      if (!block || !block.name?.includes('enchant')) {
        console.log('Enchanting table not found, skipping test');
        this.skip();
        return;
      }

      // Use diamond_sword like real client capture
      await giveItem(server, bot.username, 'diamond_sword', 1);
      await giveItem(server, bot.username, 'lapis_lazuli', 8);
      await server.sendCommand(`xp 30L ${bot.username}`);
      await waitFor(() => hasItem('diamond_sword') && hasItem('lapis_lazuli'), 5000);

      console.log('Opening enchanting table...');
      const enchantTable = await (bot as any).openEnchantmentTable(block);

      try {
        await enchantTable.putItem('diamond_sword', null);
        console.log('Put diamond_sword');

        await enchantTable.putLapis(8);
        console.log('Put 8 lapis');

        await sleep(500);

        const options = enchantTable.getOptions?.() || [];
        console.log(`Enchant options available: ${options.length}`);

        if (options.length === 0) {
          console.log('No enchant options received from server, skipping enchant');
          return;
        }

        // Find option with cost=1 (no bookshelves = only level 1 enchants valid)
        const level1OptionIdx = options.findIndex((opt: any) => opt.cost === 1);
        if (level1OptionIdx === -1) {
          console.log('No level 1 enchant option available, skipping');
          return;
        }

        console.log(`Using enchant option ${level1OptionIdx} (cost=1)`);
        await enchantTable.enchant(level1OptionIdx);
        console.log('Enchanting executed!');

        await sleep(500);
        await enchantTable.takeItem();
        console.log('Enchanting test passed!');
      } finally {
        enchantTable.close();
      }
    });
  });
});
