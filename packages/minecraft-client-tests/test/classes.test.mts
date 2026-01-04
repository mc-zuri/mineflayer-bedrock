import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';

/**
 * Tests for API classes.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Classes',
  (getContext) => {
    describe('Entity', () => {
      it('should have bot.entity with position', () => {
        const { bot } = getContext();

        expect(bot.entity).toBeDefined();
        expect(bot.entity.position).toBeDefined();
        expect(typeof bot.entity.position.x).toBe('number');
        expect(typeof bot.entity.position.y).toBe('number');
        expect(typeof bot.entity.position.z).toBe('number');
      });

      it('should have entity type', () => {
        const { bot } = getContext();

        expect(bot.entity.type).toBeDefined();
        expect(bot.entity.type).toBe('player');
      });

      it('should have entity velocity', () => {
        const { bot } = getContext();

        expect(bot.entity.velocity).toBeDefined();
        expect(typeof bot.entity.velocity.x).toBe('number');
      });

      it('should have entity yaw and pitch', () => {
        const { bot } = getContext();

        expect(typeof bot.entity.yaw).toBe('number');
        expect(typeof bot.entity.pitch).toBe('number');
      });

      it('should have entity metadata', () => {
        const { bot } = getContext();

        expect(bot.entity.metadata).toBeDefined();
      });

      it('should have entity in entities list', () => {
        const { bot } = getContext();

        expect(bot.entities).toBeDefined();
        // Bot's own entity should be in the list
        expect(bot.entities[bot.entity.id]).toBeDefined();
      });
    });

    describe('Block', () => {
      it('should have block properties', async () => {
        const { bot } = getContext();

        await bot.waitForChunksToLoad();

        const pos = bot.entity.position.floored();
        const block = bot.blockAt(pos);

        if (block) {
          expect(block.name).toBeDefined();
          expect(typeof block.name).toBe('string');
          expect(block.type).toBeDefined();
          expect(typeof block.type).toBe('number');
          expect(block.position).toBeDefined();
        }
      });

      it('should have block stateId', async () => {
        const { bot } = getContext();

        await bot.waitForChunksToLoad();

        const pos = bot.entity.position.floored();
        const block = bot.blockAt(pos);

        if (block) {
          expect(typeof block.stateId).toBe('number');
        }
      });

      it('should have block metadata', async () => {
        const { bot } = getContext();

        await bot.waitForChunksToLoad();

        const pos = bot.entity.position.floored();
        const block = bot.blockAt(pos);

        if (block) {
          expect(typeof block.metadata).toBe('number');
        }
      });
    });

    describe('Item', () => {
      it('should have item properties', async () => {
        const { bot } = getContext();

        // Give an item
        await bot.test.giveItem('diamond', 5);
        await new Promise((r) => setTimeout(r, 500));

        const items = bot.inventory.items();
        const diamond = items.find((i) => i?.name === 'diamond');

        expect(diamond).toBeDefined();
        if (diamond) {
          expect(diamond.name).toBe('diamond');
          expect(diamond.type).toBeDefined();
          expect(typeof diamond.type).toBe('number');
          expect(diamond.count).toBe(5);
        }
      });

      it('should have item slot property', async () => {
        const { bot } = getContext();

        await bot.test.giveItem('iron_ingot', 3);
        await new Promise((r) => setTimeout(r, 500));

        const items = bot.inventory.items();
        const iron = items.find((i) => i?.name === 'iron_ingot');

        expect(iron).toBeDefined();
        if (iron) {
          expect(typeof iron.slot).toBe('number');
        }
      });
    });

    describe('Player', () => {
      it('should have player properties', () => {
        const { bot } = getContext();

        expect(bot.player).toBeDefined();
        expect(bot.player.username).toBe('TestBot');
      });

      it('should have player in players list', () => {
        const { bot } = getContext();

        expect(bot.players).toBeDefined();
        expect(bot.players['TestBot']).toBeDefined();
        expect(bot.players['TestBot'].username).toBe('TestBot');
      });

      it('should have player entity reference', () => {
        const { bot } = getContext();

        const player = bot.players['TestBot'];
        expect(player.entity).toBeDefined();
        expect(player.entity).toBe(bot.entity);
      });
    });

    describe('Recipe', () => {
      it('should have recipe properties', () => {
        const { bot } = getContext();

        const stickId = bot.registry.itemsByName['stick'].id;
        const recipes = bot.recipesAll(stickId);

        expect(recipes.length).toBeGreaterThan(0);

        const recipe = recipes[0];
        expect(recipe).toBeDefined();
        expect(recipe.result).toBeDefined();
      });
    });

    describe('Registry', () => {
      it('should have blocksByName', () => {
        const { bot } = getContext();

        expect(bot.registry.blocksByName).toBeDefined();
        expect(bot.registry.blocksByName['stone']).toBeDefined();
        expect(bot.registry.blocksByName['dirt']).toBeDefined();
      });

      it('should have itemsByName', () => {
        const { bot } = getContext();

        expect(bot.registry.itemsByName).toBeDefined();
        expect(bot.registry.itemsByName['diamond']).toBeDefined();
        expect(bot.registry.itemsByName['iron_ingot']).toBeDefined();
      });

      it('should have entitiesByName', () => {
        const { bot } = getContext();

        expect(bot.registry.entitiesByName).toBeDefined();
        expect(bot.registry.entitiesByName['player']).toBeDefined();
        expect(bot.registry.entitiesByName['cow']).toBeDefined();
      });

      it('should have biomes', () => {
        const { bot } = getContext();

        expect(bot.registry.biomes).toBeDefined();
        expect(bot.registry.biomesArray).toBeDefined();
      });
    });
  },
  { skip: ['bedrock'] }
);
