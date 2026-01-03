import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';
import { waitForChat } from '../src/harness/fixtures.ts';

/**
 * Chat tests.
 * Tests that chat messages can be sent and received.
 */
crossEditionSuite(
  'chat',
  (getContext) => {
    it('should send and receive chat messages', async function () {
      const ctx = getContext();
      const { bot } = ctx;

      // Send a message
      const testMessage = `test_${Date.now()}`;
      bot.chat(testMessage);

      // Wait for message echo (server sends it back)
      const received = await waitForChat(ctx, testMessage, 5000);
      expect(received).toContain(testMessage);
    });

    it('should receive server messages', async function () {
      const ctx = getContext();
      const { bot } = ctx;

      // Use /say command to send a server message
      bot.chat('/say Hello from test');

      // Wait for the server message
      const received = await waitForChat(ctx, 'Hello from test', 5000);
      expect(received).toContain('Hello from test');
    });
  },
  { resetState: false }
);
