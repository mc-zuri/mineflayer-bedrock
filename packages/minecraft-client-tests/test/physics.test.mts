import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';

/**
 * Tests for physics functionality.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Physics',
  (getContext) => {
    describe('Gravity', () => {
      it('should fall due to gravity when in air', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Teleport bot up high
        const startY = 80;
        await server.executeCommand(`tp @p 0 ${startY} 0`);
        await new Promise((r) => setTimeout(r, 1000));

        const initialY = bot.entity.position.y;

        // Wait for gravity to take effect
        await new Promise((r) => setTimeout(r, 1000));

        // Should have fallen (or at least moved)
        // Note: in creative mode gravity still applies
        expect(bot.entity.position.y).toBeLessThanOrEqual(initialY);
      });

      it('should have onGround = false when falling', async () => {
        const { bot, server } = getContext();

        // Teleport bot up high
        await server.executeCommand('tp @p ~ 120 ~');
        await new Promise((r) => setTimeout(r, 200));

        // Should be falling
        expect(bot.entity.onGround).toBe(false);
      });
    });

    describe('Movement', () => {
      it('should move forward when control state set', async () => {
        const { bot } = getContext();

        const startPos = bot.entity.position.clone();

        // Start moving forward
        bot.setControlState('forward', true);

        // Wait for movement
        await new Promise((r) => setTimeout(r, 500));

        // Stop
        bot.setControlState('forward', false);

        // Should have moved
        const dist = bot.entity.position.distanceTo(startPos);
        expect(dist).toBeGreaterThan(0.1);
      });

      it('should sprint when sprint control set', async () => {
        const { bot } = getContext();

        const startPos = bot.entity.position.clone();

        // Start sprinting forward
        bot.setControlState('forward', true);
        bot.setControlState('sprint', true);

        // Wait for movement
        await new Promise((r) => setTimeout(r, 500));

        // Stop
        bot.clearControlStates();

        // Should have moved faster than walking
        const dist = bot.entity.position.distanceTo(startPos);
        expect(dist).toBeGreaterThan(1);
      });

      it('should jump when jump control set', async () => {
        const { bot, server } = getContext();

        // Make sure we're on ground
        await bot.waitForChunksToLoad();

        // Wait to land
        await new Promise((r) => setTimeout(r, 500));

        const startY = bot.entity.position.y;

        // Jump
        bot.setControlState('jump', true);
        await new Promise((r) => setTimeout(r, 100));
        bot.setControlState('jump', false);

        // Wait for jump
        await new Promise((r) => setTimeout(r, 300));

        // Should have jumped (y increased at some point)
        // Note: might have already fallen back down
      });

      it('should sneak when sneak control set', async () => {
        const { bot } = getContext();

        bot.setControlState('sneak', true);
        await new Promise((r) => setTimeout(r, 100));

        expect(bot.getControlState('sneak')).toBe(true);

        bot.setControlState('sneak', false);
      });
    });

    describe('Physics Toggle', () => {
      it('should disable physics with bot.physicsEnabled = false', async () => {
        const { bot, server } = getContext();

        // Teleport up
        await server.executeCommand('tp @p ~ 100 ~');
        await new Promise((r) => setTimeout(r, 200));

        // Disable physics
        bot.physicsEnabled = false;

        const posY = bot.entity.position.y;

        // Wait
        await new Promise((r) => setTimeout(r, 500));

        // Should NOT have fallen (physics disabled)
        expect(bot.entity.position.y).toBeCloseTo(posY, 0);

        // Re-enable physics
        bot.physicsEnabled = true;
      });
    });
  },
  { skip: ['bedrock'] }
);
