import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';

/**
 * Tests for bot properties.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Properties',
  (getContext) => {
    // Core properties
    describe('Core', () => {
      it('should have bot.registry', () => {
        const { bot } = getContext();
        expect(bot.registry).toBeDefined();
        expect(bot.registry.blocksByName).toBeDefined();
        expect(bot.registry.itemsByName).toBeDefined();
      });

      it('should have bot.world', () => {
        const { bot } = getContext();
        expect(bot.world).toBeDefined();
      });

      it('should have bot.entity', () => {
        const { bot } = getContext();
        expect(bot.entity).toBeDefined();
        expect(bot.entity.position).toBeDefined();
      });

      it('should have bot.entities', () => {
        const { bot } = getContext();
        expect(bot.entities).toBeDefined();
        expect(typeof bot.entities).toBe('object');
      });

      it('should have bot.username', () => {
        const { bot } = getContext();
        expect(bot.username).toBe('TestBot');
      });
    });

    // Game State
    describe('Game State', () => {
      it('should have bot.game.dimension', () => {
        const { bot } = getContext();
        expect(bot.game.dimension).toBeDefined();
        expect(['overworld', 'the_nether', 'the_end', 'minecraft:overworld', 'minecraft:the_nether', 'minecraft:the_end']).toContain(bot.game.dimension);
      });

      it('should have bot.game.gameMode', () => {
        const { bot } = getContext();
        expect(bot.game.gameMode).toBeDefined();
      });

      it('should have bot.game.difficulty', () => {
        const { bot } = getContext();
        expect(bot.game.difficulty).toBeDefined();
      });

      it('should have bot.game.hardcore', () => {
        const { bot } = getContext();
        expect(typeof bot.game.hardcore).toBe('boolean');
      });

      it('should have bot.game.maxPlayers', () => {
        const { bot } = getContext();
        expect(typeof bot.game.maxPlayers).toBe('number');
      });

      it('should have bot.game.minY', () => {
        const { bot } = getContext();
        expect(typeof bot.game.minY).toBe('number');
      });

      it('should have bot.game.height', () => {
        const { bot } = getContext();
        expect(typeof bot.game.height).toBe('number');
      });
    });

    // Health & Food
    describe('Health & Food', () => {
      it('should have bot.health (0-20)', () => {
        const { bot } = getContext();
        expect(typeof bot.health).toBe('number');
        expect(bot.health).toBeGreaterThanOrEqual(0);
        expect(bot.health).toBeLessThanOrEqual(20);
      });

      it('should have bot.food (0-20)', () => {
        const { bot } = getContext();
        expect(typeof bot.food).toBe('number');
        expect(bot.food).toBeGreaterThanOrEqual(0);
        expect(bot.food).toBeLessThanOrEqual(20);
      });

      it('should have bot.foodSaturation', () => {
        const { bot } = getContext();
        expect(typeof bot.foodSaturation).toBe('number');
      });

      it('should have bot.oxygenLevel (0-20)', () => {
        const { bot } = getContext();
        // oxygenLevel may be undefined until first breath update
        if (bot.oxygenLevel !== undefined) {
          expect(typeof bot.oxygenLevel).toBe('number');
          expect(bot.oxygenLevel).toBeGreaterThanOrEqual(0);
          expect(bot.oxygenLevel).toBeLessThanOrEqual(20);
        }
      });
    });

    // Experience
    describe('Experience', () => {
      it('should have bot.experience.level', () => {
        const { bot } = getContext();
        expect(typeof bot.experience.level).toBe('number');
      });

      it('should have bot.experience.points', () => {
        const { bot } = getContext();
        expect(typeof bot.experience.points).toBe('number');
      });

      it('should have bot.experience.progress', () => {
        const { bot } = getContext();
        expect(typeof bot.experience.progress).toBe('number');
        expect(bot.experience.progress).toBeGreaterThanOrEqual(0);
        expect(bot.experience.progress).toBeLessThanOrEqual(1);
      });
    });

    // Time
    describe('Time', () => {
      it('should have bot.time.time', () => {
        const { bot } = getContext();
        expect(typeof bot.time.time).toBe('number');
      });

      it('should have bot.time.timeOfDay', () => {
        const { bot } = getContext();
        expect(typeof bot.time.timeOfDay).toBe('number');
        expect(bot.time.timeOfDay).toBeGreaterThanOrEqual(0);
        expect(bot.time.timeOfDay).toBeLessThan(24000);
      });

      it('should have bot.time.day', () => {
        const { bot } = getContext();
        expect(typeof bot.time.day).toBe('number');
      });

      it('should have bot.time.isDay', () => {
        const { bot } = getContext();
        expect(typeof bot.time.isDay).toBe('boolean');
      });

      it('should have bot.time.age', () => {
        const { bot } = getContext();
        expect(typeof bot.time.age).toBe('number');
      });
    });

    // Physics & Movement
    describe('Physics & Movement', () => {
      it('should have bot.physicsEnabled', () => {
        const { bot } = getContext();
        expect(typeof bot.physicsEnabled).toBe('boolean');
      });

      it('should have bot.controlState', () => {
        const { bot } = getContext();
        expect(bot.controlState).toBeDefined();
        expect(typeof bot.controlState.forward).toBe('boolean');
        expect(typeof bot.controlState.back).toBe('boolean');
        expect(typeof bot.controlState.left).toBe('boolean');
        expect(typeof bot.controlState.right).toBe('boolean');
        expect(typeof bot.controlState.jump).toBe('boolean');
        expect(typeof bot.controlState.sprint).toBe('boolean');
        expect(typeof bot.controlState.sneak).toBe('boolean');
      });
    });

    // Inventory
    describe('Inventory', () => {
      it('should have bot.inventory', () => {
        const { bot } = getContext();
        expect(bot.inventory).toBeDefined();
        expect(typeof bot.inventory.slots).toBe('object');
      });

      it('should have bot.quickBarSlot (0-8)', () => {
        const { bot } = getContext();
        expect(typeof bot.quickBarSlot).toBe('number');
        expect(bot.quickBarSlot).toBeGreaterThanOrEqual(0);
        expect(bot.quickBarSlot).toBeLessThanOrEqual(8);
      });

      it('should have bot.heldItem', () => {
        const { bot } = getContext();
        // heldItem can be null or an Item
        expect(bot.heldItem === null || typeof bot.heldItem === 'object').toBe(true);
      });
    });

    // Players
    describe('Players', () => {
      it('should have bot.player', () => {
        const { bot } = getContext();
        expect(bot.player).toBeDefined();
        expect(bot.player.username).toBe('TestBot');
      });

      it('should have bot.players', () => {
        const { bot } = getContext();
        expect(bot.players).toBeDefined();
        expect(bot.players['TestBot']).toBeDefined();
      });

      it('should have bot.tablist', () => {
        const { bot } = getContext();
        expect(bot.tablist).toBeDefined();
      });
    });

    // Weather
    describe('Weather', () => {
      it('should have bot.isRaining', () => {
        const { bot } = getContext();
        expect(typeof bot.isRaining).toBe('boolean');
      });

      it('should have bot.rainState', () => {
        const { bot } = getContext();
        expect(typeof bot.rainState).toBe('number');
      });

      it('should have bot.thunderState', () => {
        const { bot } = getContext();
        expect(typeof bot.thunderState).toBe('number');
      });
    });

    // Sleep
    describe('Sleep', () => {
      it('should have bot.isSleeping', () => {
        const { bot } = getContext();
        expect(typeof bot.isSleeping).toBe('boolean');
        expect(bot.isSleeping).toBe(false); // Not sleeping initially
      });
    });
  },
  { skip: ['bedrock'], resetState: false }
);
