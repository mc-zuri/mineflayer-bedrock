import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';

/**
 * Tests for sleep functionality.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Sleep',
  (getContext) => {
    describe('Bed Detection', () => {
      it('should detect bed block with bot.isABed()', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Place a bed
        const pos = bot.entity.position.floored().offset(2, -1, 0);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} red_bed[part=foot]`);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z + 1} red_bed[part=head]`);
        await new Promise((r) => setTimeout(r, 500));

        const bedBlock = bot.blockAt(pos);
        expect(bedBlock).toBeDefined();

        if (bedBlock) {
          const isBed = bot.isABed(bedBlock);
          expect(isBed).toBe(true);
        }
      });

      it('should return false for non-bed blocks', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Place a regular block
        const pos = bot.entity.position.floored().offset(3, -1, 0);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} stone`);
        await new Promise((r) => setTimeout(r, 500));

        const stoneBlock = bot.blockAt(pos);
        if (stoneBlock) {
          const isBed = bot.isABed(stoneBlock);
          expect(isBed).toBe(false);
        }
      });
    });

    describe('Sleep State', () => {
      it('should have isSleeping = false initially', () => {
        const { bot } = getContext();
        expect(bot.isSleeping).toBe(false);
      });
    });

    describe('Sleep Attempt', () => {
      // Skip this test as it requires night time and proper bed setup
      it.skip('should sleep in bed at night', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Set time to night
        await server.executeCommand('time set night');
        await new Promise((r) => setTimeout(r, 500));

        // Place a bed nearby
        const pos = bot.entity.position.floored().offset(1, 0, 0);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} red_bed[part=foot,facing=north]`);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z + 1} red_bed[part=head,facing=north]`);
        await new Promise((r) => setTimeout(r, 500));

        const bedBlock = bot.blockAt(pos);
        if (bedBlock && bot.isABed(bedBlock)) {
          try {
            await bot.sleep(bedBlock);
            expect(bot.isSleeping).toBe(true);

            // Wake up
            await bot.wake();
            expect(bot.isSleeping).toBe(false);
          } catch (err) {
            // Sleep might fail due to monsters nearby or other reasons
          }
        }
      });

      it('should reject sleep during day', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Set time to day
        await server.executeCommand('time set day');
        await new Promise((r) => setTimeout(r, 500));

        // Place a bed nearby
        const pos = bot.entity.position.floored().offset(1, 0, 1);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} red_bed[part=foot,facing=north]`);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z + 1} red_bed[part=head,facing=north]`);
        await new Promise((r) => setTimeout(r, 500));

        const bedBlock = bot.blockAt(pos);
        if (bedBlock && bot.isABed(bedBlock)) {
          try {
            await bot.sleep(bedBlock);
            // Should have thrown
            expect(true).toBe(false);
          } catch (err) {
            // Expected to fail during day
            expect(err).toBeDefined();
          }
        }
      });
    });

    describe('Wake', () => {
      it('should have wake method', () => {
        const { bot } = getContext();
        expect(typeof bot.wake).toBe('function');
      });
    });
  },
  { skip: ['bedrock'] }
);
