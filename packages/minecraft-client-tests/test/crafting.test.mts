import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';

/**
 * Tests for crafting functionality.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Crafting',
  (getContext) => {
    describe('Recipe Lookup', () => {
      it('should find recipe for sticks from planks', async () => {
        const { bot } = getContext();

        // Give planks
        await bot.test.giveItem('oak_planks', 4);
        await new Promise((r) => setTimeout(r, 500));

        const stickId = bot.registry.itemsByName['stick'].id;
        const recipes = bot.recipesFor(stickId);

        expect(recipes.length).toBeGreaterThan(0);
      });

      it('should find recipe for crafting table', async () => {
        const { bot } = getContext();

        // Give planks
        await bot.test.giveItem('oak_planks', 4);
        await new Promise((r) => setTimeout(r, 500));

        const tableId = bot.registry.itemsByName['crafting_table'].id;
        const recipes = bot.recipesFor(tableId);

        expect(recipes.length).toBeGreaterThan(0);
      });

      it('should return empty array when missing materials', async () => {
        const { bot } = getContext();

        // Clear inventory
        await bot.test.clearInventory();
        await new Promise((r) => setTimeout(r, 300));

        const diamondBlockId = bot.registry.itemsByName['diamond_block'].id;
        const recipes = bot.recipesFor(diamondBlockId);

        // No diamonds in inventory, so no valid recipes
        expect(recipes.length).toBe(0);
      });
    });

    describe('Crafting 2x2 (Inventory)', () => {
      it('should craft sticks in inventory', async () => {
        const { bot } = getContext();

        // Clear inventory first
        await bot.test.clearInventory();
        await new Promise((r) => setTimeout(r, 300));

        // Give planks
        await bot.test.giveItem('oak_planks', 8);
        await new Promise((r) => setTimeout(r, 500));

        const stickId = bot.registry.itemsByName['stick'].id;
        const recipes = bot.recipesFor(stickId);

        expect(recipes.length).toBeGreaterThan(0);

        // Craft sticks (2x2 recipe)
        await bot.craft(recipes[0], 1);
        await new Promise((r) => setTimeout(r, 500));

        // Check we got sticks
        const items = bot.inventory.items();
        const sticks = items.filter((i) => i?.name === 'stick');
        expect(sticks.length).toBeGreaterThan(0);
      });

      it('should craft crafting table in inventory', async () => {
        const { bot } = getContext();

        await bot.test.clearInventory();
        await new Promise((r) => setTimeout(r, 300));

        // Give planks (need 4 for crafting table)
        await bot.test.giveItem('oak_planks', 4);
        await new Promise((r) => setTimeout(r, 500));

        const tableId = bot.registry.itemsByName['crafting_table'].id;
        const recipes = bot.recipesFor(tableId);

        expect(recipes.length).toBeGreaterThan(0);

        await bot.craft(recipes[0], 1);
        await new Promise((r) => setTimeout(r, 500));

        const items = bot.inventory.items();
        const tables = items.filter((i) => i?.name === 'crafting_table');
        expect(tables.length).toBeGreaterThan(0);
      });
    });

    // TODO: 3x3 crafting requires window opening which has timing issues
    describe.skip('Crafting 3x3 (Crafting Table)', () => {
      it('should craft with crafting table', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        await bot.test.clearInventory();
        await new Promise((r) => setTimeout(r, 300));

        // Place a crafting table
        const pos = bot.entity.position.floored().offset(1, -1, 1);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} crafting_table`);
        await new Promise((r) => setTimeout(r, 500));

        // Give materials for a chest (8 planks)
        await bot.test.giveItem('oak_planks', 8);
        await new Promise((r) => setTimeout(r, 500));

        // Find the crafting table
        const tableBlock = bot.blockAt(pos);
        expect(tableBlock?.name).toBe('crafting_table');

        // Get chest recipe
        const chestId = bot.registry.itemsByName['chest'].id;
        const recipes = bot.recipesFor(chestId, null, tableBlock!);

        expect(recipes.length).toBeGreaterThan(0);

        // Craft chest using crafting table
        await bot.craft(recipes[0], 1, tableBlock!);
        await new Promise((r) => setTimeout(r, 500));

        // Verify we got a chest
        const items = bot.inventory.items();
        const chests = items.filter((i) => i?.name === 'chest');
        expect(chests.length).toBeGreaterThan(0);
      });
    });
  },
  { skip: ['bedrock'] }
);
