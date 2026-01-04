import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';

/**
 * Tests for windows and containers.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Windows',
  (getContext) => {
    describe('Base Window (Inventory)', () => {
      it('should have inventory window', () => {
        const { bot } = getContext();

        expect(bot.inventory).toBeDefined();
        expect(bot.inventory.slots).toBeDefined();
        expect(Array.isArray(bot.inventory.slots)).toBe(true);
      });

      it('should have inventory items method', () => {
        const { bot } = getContext();

        const items = bot.inventory.items();
        expect(Array.isArray(items)).toBe(true);
      });

      it('should have inventory slots count', () => {
        const { bot } = getContext();

        // Player inventory has 46 slots (36 main + 4 armor + 4 crafting + offhand + result)
        expect(bot.inventory.slots.length).toBeGreaterThanOrEqual(36);
      });
    });

    // TODO: Container opening tests need work on positioning/raycast
    describe.skip('Container Opening', () => {
      it('should open chest with bot.openChest()', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Place a chest
        const pos = bot.entity.position.floored().offset(2, 0, 0);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} chest`);
        await new Promise((r) => setTimeout(r, 500));

        const chestBlock = bot.blockAt(pos);
        if (chestBlock && chestBlock.name === 'chest') {
          const chest = await bot.openChest(chestBlock);

          expect(chest).toBeDefined();
          expect(chest.slots).toBeDefined();

          // Close the chest
          chest.close();
          await new Promise((r) => setTimeout(r, 200));
        }
      });

      it('should open container with bot.openContainer()', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Place a barrel
        const pos = bot.entity.position.floored().offset(2, 0, 1);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} barrel`);
        await new Promise((r) => setTimeout(r, 500));

        const barrelBlock = bot.blockAt(pos);
        if (barrelBlock && barrelBlock.name === 'barrel') {
          const container = await bot.openContainer(barrelBlock);

          expect(container).toBeDefined();
          expect(container.slots).toBeDefined();

          // Close
          container.close();
          await new Promise((r) => setTimeout(r, 200));
        }
      });
    });

    // TODO: Window operations tests need container opening to work
    describe.skip('Window Operations', () => {
      it('should deposit items into chest', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Give items
        await bot.test.giveItem('diamond', 10);
        await new Promise((r) => setTimeout(r, 500));

        // Place a chest
        const pos = bot.entity.position.floored().offset(2, 0, 2);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} chest`);
        await new Promise((r) => setTimeout(r, 500));

        const chestBlock = bot.blockAt(pos);
        if (chestBlock && chestBlock.name === 'chest') {
          const chest = await bot.openChest(chestBlock);

          // Deposit diamonds
          const diamondId = bot.registry.itemsByName['diamond'].id;
          await chest.deposit(diamondId, null, 5);
          await new Promise((r) => setTimeout(r, 300));

          // Verify some diamonds are in chest
          const chestItems = chest.items();
          const diamondsInChest = chestItems.filter((i) => i?.name === 'diamond');
          expect(diamondsInChest.length).toBeGreaterThan(0);

          chest.close();
          await new Promise((r) => setTimeout(r, 200));
        }
      });

      it('should withdraw items from chest', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Clear inventory first
        await bot.test.clearInventory();
        await new Promise((r) => setTimeout(r, 300));

        // Place chest with items using loot table or data
        const pos = bot.entity.position.floored().offset(3, 0, 2);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} chest`);
        await new Promise((r) => setTimeout(r, 300));

        // Put items in chest via data command
        await server.executeCommand(
          `item replace block ${pos.x} ${pos.y} ${pos.z} container.0 with gold_ingot 16`
        );
        await new Promise((r) => setTimeout(r, 500));

        const chestBlock = bot.blockAt(pos);
        if (chestBlock && chestBlock.name === 'chest') {
          const chest = await bot.openChest(chestBlock);

          // Withdraw gold
          const goldId = bot.registry.itemsByName['gold_ingot'].id;
          await chest.withdraw(goldId, null, 8);
          await new Promise((r) => setTimeout(r, 300));

          // Verify some gold in inventory
          const invItems = bot.inventory.items();
          const goldInInv = invItems.filter((i) => i?.name === 'gold_ingot');
          expect(goldInInv.length).toBeGreaterThan(0);

          chest.close();
          await new Promise((r) => setTimeout(r, 200));
        }
      });
    });
  },
  { skip: ['bedrock'] }
);

// Furnace tests - TODO: Need container opening to work
crossEditionSuite(
  'Windows: Furnace',
  (getContext) => {
    it.skip('should open furnace with bot.openFurnace()', async () => {
      const { bot, server } = getContext();

      await bot.waitForChunksToLoad();

      // Place a furnace
      const pos = bot.entity.position.floored().offset(2, 0, 3);
      await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} furnace`);
      await new Promise((r) => setTimeout(r, 500));

      const furnaceBlock = bot.blockAt(pos);
      if (furnaceBlock && furnaceBlock.name === 'furnace') {
        const furnace = await bot.openFurnace(furnaceBlock);

        expect(furnace).toBeDefined();
        expect(furnace.inputItem).toBeDefined();
        expect(furnace.fuelItem).toBeDefined();
        expect(furnace.outputItem).toBeDefined();

        furnace.close();
        await new Promise((r) => setTimeout(r, 200));
      }
    });
  },
  { skip: ['bedrock'] }
);
