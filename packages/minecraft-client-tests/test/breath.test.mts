import { expect } from 'expect';
import { crossEditionTest } from '../src/harness/test-runner.ts';

/**
 * Breath/oxygen tests.
 * Tests that oxygen levels are correctly tracked when not underwater.
 */
crossEditionTest(
  'breath: oxygen level when not underwater',
  async (ctx) => {
    const { bot } = ctx;

    // Wait for chunks to load
    await bot.waitForChunksToLoad();

    // When not underwater, oxygen level should be 20 (full)
    if (bot.oxygenLevel !== undefined) {
      expect(bot.oxygenLevel).toBe(20);
    }
  },
  { resetState: false }
);
