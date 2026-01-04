import { expect } from 'expect';
import { crossEditionSuite, crossEditionTest } from '../src/harness/test-runner.ts';

/**
 * Tests for bot events.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Events',
  (getContext) => {
    describe('Connection & Lifecycle', () => {
      it('should have emitted spawn event (bot is spawned)', () => {
        const { bot } = getContext();
        // If we're in the test, spawn already happened
        expect(bot.entity).toBeDefined();
        expect(bot.entity.position).toBeDefined();
      });

      it('should emit time event', async () => {
        const { bot } = getContext();
        const timeReceived = await new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => resolve(false), 5000);
          bot.once('time', () => {
            clearTimeout(timeout);
            resolve(true);
          });
        });
        expect(timeReceived).toBe(true);
      });
    });

    describe('Player State', () => {
      // TODO: Fix timing issues with gamemode switch and damage command
      it.skip('should emit health event when damaged', async () => {
        const { bot, server } = getContext();

        // Switch to survival for damage to work
        await server.executeCommand('gamemode survival @p');
        await new Promise((r) => setTimeout(r, 500));

        const healthChanged = new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => resolve(false), 5000);
          bot.once('health', () => {
            clearTimeout(timeout);
            resolve(true);
          });
        });

        // Use /damage command (available since 1.19.4)
        await server.executeCommand('damage @p 5');
        await new Promise((r) => setTimeout(r, 500));

        const result = await healthChanged;

        // Switch back to creative
        await server.executeCommand('gamemode creative @p');

        expect(result).toBe(true);
      });

      it('should emit experience event when XP added', async () => {
        const { bot, server } = getContext();

        const expChanged = new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => resolve(false), 5000);
          bot.once('experience', () => {
            clearTimeout(timeout);
            resolve(true);
          });
        });

        // Give experience
        await server.executeCommand('xp add @p 10');

        expect(await expChanged).toBe(true);
      });
    });

    describe('Movement', () => {
      it('should emit forcedMove on teleport', async () => {
        const { bot, server } = getContext();

        const forcedMoveReceived = new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => resolve(false), 5000);
          bot.once('forcedMove', () => {
            clearTimeout(timeout);
            resolve(true);
          });
        });

        // Teleport the player
        await server.executeCommand('tp @p 100 64 100');

        expect(await forcedMoveReceived).toBe(true);
      });
    });
  },
  { skip: ['bedrock'] }
);

// Chat events - separate suite since they modify chat state
crossEditionSuite(
  'Events: Chat',
  (getContext) => {
    it('should emit message event for server messages', async () => {
      const { bot, server } = getContext();

      const messageReceived = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000);
        bot.once('message', () => {
          clearTimeout(timeout);
          resolve(true);
        });
      });

      // Send a server message via say command
      await server.executeCommand('say Hello from server');

      expect(await messageReceived).toBe(true);
    });

    it('should emit messagestr event with string', async () => {
      const { bot, server } = getContext();

      const messageReceived = new Promise<string | null>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 5000);
        bot.once('messagestr', (msg) => {
          clearTimeout(timeout);
          resolve(msg);
        });
      });

      await server.executeCommand('say Test message');

      const msg = await messageReceived;
      expect(msg).not.toBeNull();
      expect(msg).toContain('Test message');
    });
  },
  { skip: ['bedrock'] }
);

// Weather events - separate since they need weather control
crossEditionSuite(
  'Events: Weather',
  (getContext) => {
    it('should emit weatherUpdate when weather changes', async () => {
      const { bot, server } = getContext();

      // First ensure it's not raining
      await server.executeCommand('weather clear');
      await new Promise((r) => setTimeout(r, 500));

      const weatherChanged = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000);
        bot.once('weatherUpdate', () => {
          clearTimeout(timeout);
          resolve(true);
        });
      });

      // Start rain
      await server.executeCommand('weather rain');

      expect(await weatherChanged).toBe(true);
    });
  },
  { skip: ['bedrock'] }
);

// Death event - separate since it kills the player
crossEditionTest(
  'Events: death event when player dies',
  async (ctx) => {
    const { bot, server } = ctx;

    // Set to survival mode for death to register
    await server.executeCommand('gamemode survival @p');
    await new Promise((r) => setTimeout(r, 1000));

    const deathReceived = new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 10000);
      bot.once('death', () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });

    // Kill the player - use /kill which works in any gamemode
    await server.executeCommand('kill @p');
    await new Promise((r) => setTimeout(r, 500));

    expect(await deathReceived).toBe(true);
  },
  { skip: ['bedrock'] }
);

// Title events
crossEditionSuite(
  'Events: Title',
  (getContext) => {
    it('should emit title event when title shown', async () => {
      const { bot, server } = getContext();

      const titleReceived = new Promise<{ title: string; type: string } | null>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 5000);
        bot.once('title', (title, type) => {
          clearTimeout(timeout);
          resolve({ title, type });
        });
      });

      // Show a title
      await server.executeCommand('title @p title {"text":"Hello World"}');

      const result = await titleReceived;
      expect(result).not.toBeNull();
      if (result) {
        expect(result.title).toContain('Hello World');
      }
    });
  },
  { skip: ['bedrock'] }
);

// Held item events
crossEditionSuite(
  'Events: Held Item',
  (getContext) => {
    it('should emit heldItemChanged when switching slots', async () => {
      const { bot } = getContext();

      // Give an item first
      await bot.test.giveItem('diamond', 1);
      await new Promise((r) => setTimeout(r, 500));

      const heldChanged = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 3000);
        bot.once('heldItemChanged', () => {
          clearTimeout(timeout);
          resolve(true);
        });
      });

      // Switch to a different slot
      const newSlot = (bot.quickBarSlot + 1) % 9;
      bot.setQuickBarSlot(newSlot);

      expect(await heldChanged).toBe(true);
    });
  },
  { skip: ['bedrock'] }
);
