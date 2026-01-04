import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';
import { Vec3 } from 'vec3';

/**
 * Tests for bot functions.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Functions',
  (getContext) => {
    describe('Block Query', () => {
      it('should get block at point with bot.blockAt()', async () => {
        const { bot } = getContext();

        // Wait for chunks to load
        await bot.waitForChunksToLoad();

        // Get block at bot's feet position
        const pos = bot.entity.position.floored();
        const block = bot.blockAt(pos);

        expect(block).toBeDefined();
        if (block) {
          expect(block.name).toBeDefined();
          expect(block.position).toBeDefined();
        }
      });

      it('should wait for chunks with bot.waitForChunksToLoad()', async () => {
        const { bot } = getContext();

        // This should resolve without error when chunks are loaded
        await bot.waitForChunksToLoad();

        // After waiting, we should be able to get blocks
        const pos = bot.entity.position.floored();
        const block = bot.blockAt(pos);
        expect(block).not.toBeNull();
      });

      it('should check if can see block with bot.canSeeBlock()', async () => {
        const { bot } = getContext();

        await bot.waitForChunksToLoad();

        const pos = bot.entity.position.floored();
        const block = bot.blockAt(pos);

        if (block) {
          const canSee = bot.canSeeBlock(block);
          expect(typeof canSee).toBe('boolean');
        }
      });
    });

    describe('Block Search', () => {
      it('should find blocks with bot.findBlocks()', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Place a block we can search for
        const pos = bot.entity.position.floored().offset(2, -1, 2);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} diamond_block`);
        await new Promise((r) => setTimeout(r, 500));

        // Search for diamond blocks
        const blocks = bot.findBlocks({
          matching: (block) => block.name === 'diamond_block',
          maxDistance: 16,
          count: 1,
        });

        expect(Array.isArray(blocks)).toBe(true);
        expect(blocks.length).toBeGreaterThanOrEqual(1);
      });

      it('should find single block with bot.findBlock()', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Place a block we can search for
        const pos = bot.entity.position.floored().offset(3, -1, 3);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} gold_block`);
        await new Promise((r) => setTimeout(r, 500));

        // Search for gold block
        const block = bot.findBlock({
          matching: (b) => b.name === 'gold_block',
          maxDistance: 16,
        });

        expect(block).toBeDefined();
        if (block) {
          expect(block.name).toBe('gold_block');
        }
      });
    });

    describe('Entity Query', () => {
      it('should get entity at cursor with bot.entityAtCursor()', async () => {
        const { bot } = getContext();

        // entityAtCursor returns null or an entity
        const entity = bot.entityAtCursor();
        // Can be null if not looking at any entity
        expect(entity === null || typeof entity === 'object').toBe(true);
      });

      it('should find nearest entity with bot.nearestEntity()', async () => {
        const { bot } = getContext();

        // Find any nearby entity (might be none in test environment)
        const entity = bot.nearestEntity();
        // Can be null if no entities nearby
        expect(entity === null || typeof entity === 'object').toBe(true);
      });

      it('should find nearest entity with filter function', async () => {
        const { bot, server } = getContext();

        // Spawn a cow near the bot
        const pos = bot.entity.position;
        await server.executeCommand(`summon cow ${pos.x + 3} ${pos.y} ${pos.z + 3}`);
        await new Promise((r) => setTimeout(r, 500));

        // Find the cow
        const cow = bot.nearestEntity((e) => e.name === 'cow');
        expect(cow).toBeDefined();
        if (cow) {
          expect(cow.name).toBe('cow');
        }
      });
    });

    describe('Digging', () => {
      it('should check if can dig block with bot.canDigBlock()', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Place a dirt block
        const pos = bot.entity.position.floored().offset(1, 0, 1);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} dirt`);
        await new Promise((r) => setTimeout(r, 500));

        const block = bot.blockAt(pos);
        if (block) {
          const canDig = bot.canDigBlock(block);
          expect(typeof canDig).toBe('boolean');
        }
      });
    });

    describe('Recipes', () => {
      it('should get recipes for item with bot.recipesFor()', async () => {
        const { bot } = getContext();

        // Give the bot planks so it can craft sticks
        await bot.test.giveItem('oak_planks', 4);
        await new Promise((r) => setTimeout(r, 500));

        // Get recipes for sticks (requires planks which we gave)
        const itemId = bot.registry.itemsByName['stick'].id;
        const recipes = bot.recipesFor(itemId);

        expect(Array.isArray(recipes)).toBe(true);
        // With planks in inventory, stick recipes should be available
        expect(recipes.length).toBeGreaterThanOrEqual(1);
      });

      it('should get all recipes with bot.recipesAll()', async () => {
        const { bot } = getContext();

        // Get all recipes for sticks (doesn't require materials)
        const itemId = bot.registry.itemsByName['stick'].id;
        const recipes = bot.recipesAll(itemId);

        expect(Array.isArray(recipes)).toBe(true);
        // Sticks should have recipes
        expect(recipes.length).toBeGreaterThanOrEqual(1);
      });
    });
  },
  { skip: ['bedrock'] }
);
