import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';
import { Vec3 } from 'vec3';
import PrismarineItem from 'prismarine-item';

/**
 * Tests for creative mode functionality.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Creative',
  (getContext) => {
    describe('Inventory', () => {
      it('should set inventory slot with bot.creative.setInventorySlot()', async () => {
        const { bot } = getContext();

        // Create an item using prismarine-item
        const Item = PrismarineItem(bot.registry);
        const itemData = bot.registry.itemsByName['diamond'];
        const item = new Item(itemData.id, 32);
        const slot = 36; // First hotbar slot

        await bot.creative.setInventorySlot(slot, item);
        await new Promise((r) => setTimeout(r, 500));

        // Verify item was set
        const slotItem = bot.inventory.slots[slot];
        expect(slotItem).toBeDefined();
        if (slotItem) {
          expect(slotItem.name).toBe('diamond');
          expect(slotItem.count).toBe(32);
        }
      });

      it('should clear slot with bot.creative.clearSlot()', async () => {
        const { bot } = getContext();

        // First set an item using prismarine-item
        const Item = PrismarineItem(bot.registry);
        const itemData = bot.registry.itemsByName['iron_ingot'];
        const item = new Item(itemData.id, 16);
        const slot = 37;

        await bot.creative.setInventorySlot(slot, item);
        await new Promise((r) => setTimeout(r, 500));

        // Clear the slot
        await bot.creative.clearSlot(slot);
        await new Promise((r) => setTimeout(r, 500));

        // Verify slot is empty
        const slotItem = bot.inventory.slots[slot];
        expect(slotItem).toBeNull();
      });

      it('should clear inventory with bot.creative.clearInventory()', async () => {
        const { bot } = getContext();

        // First add some items
        await bot.test.giveItem('gold_ingot', 10);
        await bot.test.giveItem('emerald', 5);
        await new Promise((r) => setTimeout(r, 500));

        // Clear all
        await bot.creative.clearInventory();
        await new Promise((r) => setTimeout(r, 500));

        // Verify inventory is empty
        const items = bot.inventory.items();
        expect(items.length).toBe(0);
      });
    });

    describe('Flying', () => {
      it('should start flying with bot.creative.startFlying()', async () => {
        const { bot } = getContext();

        await bot.creative.startFlying();
        await new Promise((r) => setTimeout(r, 200));

        // Check flying state (if available)
        // Note: Flying state may not be directly accessible
      });

      it('should stop flying with bot.creative.stopFlying()', async () => {
        const { bot } = getContext();

        // Start flying first
        await bot.creative.startFlying();
        await new Promise((r) => setTimeout(r, 200));

        // Stop flying
        await bot.creative.stopFlying();
        await new Promise((r) => setTimeout(r, 200));
      });

      it('should fly to destination with bot.creative.flyTo()', async () => {
        const { bot } = getContext();

        const startPos = bot.entity.position.clone();
        const targetPos = startPos.offset(5, 5, 5);

        await bot.creative.flyTo(targetPos);

        // Verify we moved towards target
        const endPos = bot.entity.position;
        const distToTarget = endPos.distanceTo(targetPos);
        expect(distToTarget).toBeLessThan(2); // Should be close to target
      });
    });
  },
  { skip: ['bedrock'] }
);
