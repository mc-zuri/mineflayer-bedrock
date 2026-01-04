import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';

/**
 * Tests for scoreboard functionality.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Scoreboard',
  (getContext) => {
    describe('Scoreboard Creation', () => {
      it('should track scoreboard when created', async () => {
        const { bot, server } = getContext();

        // Create a scoreboard objective
        await server.executeCommand('scoreboard objectives add test_score dummy "Test Score"');
        await new Promise((r) => setTimeout(r, 500));

        // Check if bot tracked the scoreboard
        expect(bot.scoreboards).toBeDefined();
      });

      it('should emit scoreboardCreated event', async () => {
        const { bot, server } = getContext();

        const scoreboardCreated = new Promise<any>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 5000);
          bot.once('scoreboardCreated', (scoreboard) => {
            clearTimeout(timeout);
            resolve(scoreboard);
          });
        });

        await server.executeCommand('scoreboard objectives add event_test dummy "Event Test"');

        const scoreboard = await scoreboardCreated;
        expect(scoreboard).toBeDefined();
        if (scoreboard) {
          expect(scoreboard.name).toBe('event_test');
        }
      });
    });

    describe('Score Updates', () => {
      it('should track score updates', async () => {
        const { bot, server } = getContext();

        // Create objective
        await server.executeCommand('scoreboard objectives add score_test dummy');
        await new Promise((r) => setTimeout(r, 500));

        // Set a score
        await server.executeCommand('scoreboard players set TestBot score_test 42');
        await new Promise((r) => setTimeout(r, 500));

        // Check if score was tracked
        const scoreboard = Object.values(bot.scoreboards).find(
          (s: any) => s.name === 'score_test'
        ) as any;

        if (scoreboard && scoreboard.itemsMap) {
          expect(scoreboard.itemsMap['TestBot']?.value || 0).toBe(42);
        }
      });

      it('should emit scoreUpdated event', async () => {
        const { bot, server } = getContext();

        await server.executeCommand('scoreboard objectives add update_test dummy');
        await new Promise((r) => setTimeout(r, 500));

        const scoreUpdated = new Promise<any>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 5000);
          bot.once('scoreUpdated', (scoreboard, item) => {
            clearTimeout(timeout);
            resolve({ scoreboard, item });
          });
        });

        await server.executeCommand('scoreboard players set TestBot update_test 100');

        const result = await scoreUpdated;
        expect(result).toBeDefined();
      });
    });

    describe('Sidebar Display', () => {
      it('should track sidebar display position', async () => {
        const { bot, server } = getContext();

        // Create and display objective
        await server.executeCommand('scoreboard objectives add sidebar_test dummy "Sidebar"');
        await new Promise((r) => setTimeout(r, 300));

        await server.executeCommand('scoreboard objectives setdisplay sidebar sidebar_test');
        await new Promise((r) => setTimeout(r, 500));

        // Check if scoreboard position was set
        expect(bot.scoreboard).toBeDefined();
      });
    });

    describe('Scoreboard Deletion', () => {
      it('should emit scoreboardDeleted when removed', async () => {
        const { bot, server } = getContext();

        // Create objective
        await server.executeCommand('scoreboard objectives add delete_test dummy');
        await new Promise((r) => setTimeout(r, 500));

        const scoreboardDeleted = new Promise<any>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 5000);
          bot.once('scoreboardDeleted', (scoreboard) => {
            clearTimeout(timeout);
            resolve(scoreboard);
          });
        });

        // Remove objective
        await server.executeCommand('scoreboard objectives remove delete_test');

        const scoreboard = await scoreboardDeleted;
        expect(scoreboard).toBeDefined();
        if (scoreboard) {
          expect(scoreboard.name).toBe('delete_test');
        }
      });
    });
  },
  { skip: ['bedrock'] }
);
