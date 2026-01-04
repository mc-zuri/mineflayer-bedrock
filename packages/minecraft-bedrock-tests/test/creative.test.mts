import { expect } from 'expect';
import type { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
import itemLoader from 'prismarine-item';
import {
  startExternalServer,
  connectBotToExternalServer,
  waitForBotSpawn,
  sleep,
  clearInventory,
  type ExternalServer,
} from 'minecraft-bedrock-test-server';

// Item class loader (initialized per bot)
let Item: any;

describe('BDS Integration: Creative Mode', function () {
  this.timeout(120_000);

  let server: ExternalServer;
  let bot: Bot;

  before(async function () {
    this.timeout(180_000);
    server = await startExternalServer({
      version: process.env.BDS_VERSION || '1.21.130',
      gamemode: 'creative', // Must be default gamemode to receive creative_content packet
    });
  });

  after(async function () {
    await server?.stop();
  });

  beforeEach(async function () {
    bot = await connectBotToExternalServer(server);
    await waitForBotSpawn(bot);
    // Wait for item_registry to be processed so network_ids are correct
    if ((bot as any).item_registry_task) {
      await (bot as any).item_registry_task.promise;
    }
    // Initialize Item class for this bot's registry (after registry is updated)
    Item = (itemLoader as any)(bot.registry);
    // Server starts in creative mode - wait for it to be fully applied
    await sleep(500);
    // Clear inventory before each test
    try {
      await clearInventory(server, bot.username);
      await sleep(200);
    } catch {
      // Ignore clear errors
    }
  });

  afterEach(async function () {
    if (bot?._client?.close) {
      bot._client.close();
    }
  });

  describe('Creative API Existence', function () {
    it('should have creative property on bot', function () {
      expect(bot.creative).toBeDefined();
    });

    it('should have setInventorySlot function', function () {
      expect(typeof bot.creative.setInventorySlot).toBe('function');
    });

    it('should have clearSlot function', function () {
      expect(typeof bot.creative.clearSlot).toBe('function');
    });

    it('should have clearInventory function', function () {
      expect(typeof bot.creative.clearInventory).toBe('function');
    });

    it('should have flyTo function', function () {
      expect(typeof bot.creative.flyTo).toBe('function');
    });

    it('should have startFlying function', function () {
      expect(typeof bot.creative.startFlying).toBe('function');
    });

    it('should have stopFlying function', function () {
      expect(typeof bot.creative.stopFlying).toBe('function');
    });
  });

  describe('Flying', function () {
    it('should start and stop flying', async function () {
      const initialGravity = bot.physics.gravity;

      bot.creative.startFlying();
      expect(bot.physics.gravity).toBe(0);

      bot.creative.stopFlying();
      expect(bot.physics.gravity).toBe(initialGravity);
    });

    it.skip('should fly to a destination (physics timing issue)', async function () {
      // Get initial position
      const startPos = bot.entity.position.clone();

      // Fly a short distance
      const destPos = startPos.offset(5, 3, 5);
      await bot.creative.flyTo(destPos);

      // Check we're close to destination
      const dist = bot.entity.position.distanceTo(destPos);
      expect(dist).toBeLessThan(1);
    });
  });

  describe.skip('setInventorySlot (pending protocol investigation - status 7 error)', function () {
    it('should set a simple item in hotbar slot', async function () {
      // Debug: check diamond_block registry values
      const dbEntry = bot.registry.itemsByName.diamond_block;
      console.log(`DEBUG: diamond_block registry entry:`, dbEntry);
      console.log(`DEBUG: diamond_block.id=${dbEntry?.id}`);

      const diamondBlock = new Item(dbEntry.id, 64, 0);
      console.log(`DEBUG: Item created:`, diamondBlock.name, 'type:', diamondBlock.type);

      await bot.creative.setInventorySlot(0, diamondBlock);
      await sleep(200);

      const item = bot.inventory.slots[0];
      expect(item).toBeTruthy();
      expect(item?.name).toBe('diamond_block');
      expect(item?.count).toBe(64);
    });

    it('should set item in main inventory slot', async function () {
      const ironIngot = new Item(bot.registry.itemsByName.iron_ingot.id, 32, 0);

      await bot.creative.setInventorySlot(10, ironIngot);
      await sleep(200);

      const item = bot.inventory.slots[10];
      expect(item).toBeTruthy();
      expect(item?.name).toBe('iron_ingot');
      expect(item?.count).toBe(32);
    });

    it('should clear slot by setting to null', async function () {
      const item = new Item(bot.registry.itemsByName.diamond.id, 64, 0);

      // Set item first
      await bot.creative.setInventorySlot(0, item);
      await sleep(200);
      expect(bot.inventory.slots[0]).toBeTruthy();

      // Clear by setting to null
      await bot.creative.setInventorySlot(0, null);
      await sleep(200);

      expect(bot.inventory.slots[0]).toBeNull();
    });
  });

  describe.skip('clearSlot (pending protocol investigation)', function () {
    it('should clear an occupied slot', async function () {
      const diamond = new Item(bot.registry.itemsByName.diamond.id, 64, 0);

      // First set an item
      await bot.creative.setInventorySlot(0, diamond);
      await sleep(200);
      expect(bot.inventory.slots[0]).toBeTruthy();

      // Then clear it
      await bot.creative.clearSlot(0);
      await sleep(200);

      expect(bot.inventory.slots[0]).toBeNull();
    });
  });

  describe.skip('clearInventory (pending protocol investigation)', function () {
    it('should clear all items from inventory', async function () {
      // Set multiple items
      await bot.creative.setInventorySlot(0, new Item(bot.registry.itemsByName.diamond.id, 64, 0));
      await bot.creative.setInventorySlot(1, new Item(bot.registry.itemsByName.iron_ingot.id, 32, 0));
      await bot.creative.setInventorySlot(10, new Item(bot.registry.itemsByName.cobblestone.id, 64, 0));
      await sleep(300);

      // Verify items are set
      expect(bot.inventory.slots[0]).toBeTruthy();
      expect(bot.inventory.slots[1]).toBeTruthy();
      expect(bot.inventory.slots[10]).toBeTruthy();

      // Clear all
      await bot.creative.clearInventory();
      await sleep(300);

      // Verify all cleared
      const nonNullItems = bot.inventory.slots.filter(Boolean);
      expect(nonNullItems.length).toBe(0);
    });
  });
});
