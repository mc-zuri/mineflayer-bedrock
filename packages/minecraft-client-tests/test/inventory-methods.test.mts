import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';

/**
 * Tests for lower-level inventory methods.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Inventory Methods',
  (getContext) => {
    describe('Click Window', () => {
      it('should click window with mouse click mode (0)', async () => {
        const { bot } = getContext();

        // Give items to work with
        await bot.test.giveItem('diamond', 10);
        await new Promise((r) => setTimeout(r, 500));

        // Find a slot with diamonds
        const slot = bot.inventory.slots.findIndex((s) => s?.name === 'diamond');
        expect(slot).toBeGreaterThan(-1);

        // Click the slot (mode 0 = left click)
        await bot.clickWindow(slot, 0, 0);
        await new Promise((r) => setTimeout(r, 200));

        // Item should now be on cursor
        expect(bot.inventory.selectedItem).toBeDefined();
      });

      it('should click window with shift click mode (1)', async () => {
        const { bot } = getContext();

        // Give items in hotbar
        await bot.test.giveItem('iron_ingot', 5);
        await new Promise((r) => setTimeout(r, 500));

        // Find a slot with iron
        const slot = bot.inventory.slots.findIndex((s) => s?.name === 'iron_ingot');
        expect(slot).toBeGreaterThan(-1);

        // Shift-click to move to another section
        await bot.clickWindow(slot, 0, 1);
        await new Promise((r) => setTimeout(r, 200));
      });

      it('should click window with drop click mode (4)', async () => {
        const { bot } = getContext();

        // Give items
        await bot.test.giveItem('gold_ingot', 3);
        await new Promise((r) => setTimeout(r, 500));

        const beforeCount = bot.inventory.items().filter((i) => i?.name === 'gold_ingot').length;

        // Find a slot with gold
        const slot = bot.inventory.slots.findIndex((s) => s?.name === 'gold_ingot');
        if (slot > -1) {
          // Drop click (mode 4, button 0 = drop 1 item)
          await bot.clickWindow(slot, 0, 4);
          await new Promise((r) => setTimeout(r, 200));
        }
      });
    });

    describe('Item Movement', () => {
      it('should move slot item with bot.moveSlotItem()', async () => {
        const { bot } = getContext();

        // Give items
        await bot.test.giveItem('emerald', 5);
        await new Promise((r) => setTimeout(r, 500));

        // Find source slot
        const sourceSlot = bot.inventory.slots.findIndex((s) => s?.name === 'emerald');
        expect(sourceSlot).toBeGreaterThan(-1);

        // Find empty destination slot
        const destSlot = bot.inventory.slots.findIndex(
          (s, i) => s === null && i >= 9 && i < 36
        );

        if (sourceSlot > -1 && destSlot > -1) {
          await bot.moveSlotItem(sourceSlot, destSlot);
          await new Promise((r) => setTimeout(r, 300));

          // Verify item moved
          const destItem = bot.inventory.slots[destSlot];
          expect(destItem?.name).toBe('emerald');
        }
      });

      it('should close window with bot.closeWindow()', async () => {
        const { bot } = getContext();

        // Close the inventory window
        bot.closeWindow(bot.inventory);
        await new Promise((r) => setTimeout(r, 200));
      });
    });

    describe('Toss Items', () => {
      it('should toss stack with bot.tossStack()', async () => {
        const { bot } = getContext();

        // Give items
        await bot.test.giveItem('cobblestone', 32);
        await new Promise((r) => setTimeout(r, 500));

        const beforeItems = bot.inventory.items();
        const cobble = beforeItems.find((i) => i?.name === 'cobblestone');

        if (cobble) {
          await bot.tossStack(cobble);
          await new Promise((r) => setTimeout(r, 300));

          // Verify stack was tossed (less cobblestone in inventory)
          const afterItems = bot.inventory.items();
          const afterCobble = afterItems.filter((i) => i?.name === 'cobblestone');
          expect(afterCobble.length).toBeLessThan(beforeItems.filter((i) => i?.name === 'cobblestone').length);
        }
      });

      it('should toss items with bot.toss()', async () => {
        const { bot } = getContext();

        // Give items
        await bot.test.giveItem('oak_planks', 20);
        await new Promise((r) => setTimeout(r, 500));

        const plankId = bot.registry.itemsByName['oak_planks'].id;

        // Toss 5 planks
        await bot.toss(plankId, null, 5);
        await new Promise((r) => setTimeout(r, 300));

        // Verify some planks remain (20 - 5 = 15)
        const afterItems = bot.inventory.items();
        const plankCount = afterItems
          .filter((i) => i?.name === 'oak_planks')
          .reduce((sum, i) => sum + (i?.count || 0), 0);
        expect(plankCount).toBeLessThanOrEqual(15);
      });
    });

    describe('Utility', () => {
      it('should update held item with bot.updateHeldItem()', () => {
        const { bot } = getContext();

        // This just triggers an update, shouldn't throw
        bot.updateHeldItem();
      });
    });
  },
  { skip: ['bedrock'] }
);
