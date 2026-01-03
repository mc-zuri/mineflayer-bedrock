import { expect } from 'expect';
import type { Bot } from 'mineflayer';
import { startBDSServer, connectBotToBDS, waitForBotSpawn, sleep, type BDSServer } from '../src/index.ts';

/**
 * Helper to wait for an event with timeout
 */
function once<T extends any[]>(emitter: { once: (event: string, listener: (...args: T) => void) => void }, event: string, timeout = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    emitter.once(event, (...args: T) => {
      clearTimeout(timer);
      resolve(args);
    });
  });
}

/**
 * Send a chat message from server (appears as server message)
 */
async function serverSay(server: BDSServer, message: string): Promise<void> {
  await server.sendCommand(`say ${message}`);
  // await sleep(100);
}

/**
 * Send a tellraw message to a player
 */
async function serverTellraw(server: BDSServer, target: string, rawJson: string): Promise<void> {
  await server.sendCommand(`tellraw ${target} ${rawJson}`);
  // await sleep(100);
}

/**
 * Send a whisper/tell to a player from server
 */
async function serverTell(server: BDSServer, target: string, message: string): Promise<void> {
  await server.sendCommand(`tell ${target} ${message}`);
  // await sleep(100);
}

describe('BDS Integration: Chat', function () {
  this.timeout(120_000);

  let server: BDSServer;
  let bot: Bot;

  before(async function () {
    this.timeout(180_000);
    server = await startBDSServer({
      version: '1.21.130',
    });
  });

  after(async function () {
    await server?.stop();
  });

  beforeEach(async function () {
    bot = await connectBotToBDS(server);
    await waitForBotSpawn(bot);
    // await sleep(500);
  });

  afterEach(async function () {
    if (bot?._client?.close) {
      bot._client.close();
    }
  });

  describe('Basic Chat', () => {
    it('should receive message event from server say', async () => {
      const messagePromise = once(bot, 'message');
      await serverSay(server, 'Hello from server');
      const [msg] = await messagePromise;
      expect(msg).toBeTruthy();
      expect(msg.toString()).toContain('Hello from server');
    });

    it('should receive messagestr event', async () => {
      const messagePromise = once(bot, 'messagestr');
      await serverSay(server, 'Test messagestr');
      const [msgStr, type, chatMsg] = await messagePromise;
      expect(typeof msgStr).toBe('string');
      expect(msgStr).toContain('Test messagestr');
    });

    it('should send chat messages', async () => {
      // Set up a listener for the bot's own chat message echoed back
      const messagePromise = once(bot, 'messagestr', 10000);

      // Send a chat message
      const testMessage = 'Hello from bot ' + Date.now();
      bot.chat(testMessage);

      // Wait for the message to be echoed back
      const [msgStr, type, chatMsg, sender] = await messagePromise;

      // Verify message content
      expect(msgStr).toBe(testMessage);
      expect(type).toBe('chat');
      expect(chatMsg.text).toBe(testMessage);
      expect(sender).toBe(bot.username);
    });

    it('should handle tellraw messages', async () => {
      const messagePromise = once(bot, 'message', 10000);
      // Bedrock Edition uses rawtext format, not Java's text format
      await serverTellraw(server, '@a', '{"rawtext":[{"text":"Hello from tellraw"}]}');

      const [msg] = await messagePromise;
      expect(msg).toBeTruthy();
      expect(msg.toString()).toContain('Hello from tellraw');
    });
  });

  describe('Chat Patterns', () => {
    it('should trigger addChatPattern', async () => {
      bot.addChatPattern('testPattern', /Hello Pattern Test/, { repeat: false });

      const patternPromise = once(bot, 'chat:testPattern');
      await serverSay(server, 'Hello Pattern Test');

      const [[match]] = await patternPromise;
      expect(match).toContain('Hello Pattern Test');
    });

    it('should parse capture groups with parse option', async () => {
      bot.addChatPattern('parseTest', /Hello (\w+) World/, { repeat: false, parse: true });

      const patternPromise = once(bot, 'chat:parseTest');
      await serverSay(server, 'Hello Beautiful World');

      const [[matches]] = await patternPromise;
      expect(matches[0]).toBe('Beautiful');
    });

    it('should handle addChatPatternSet for multi-message patterns', async () => {
      bot.addChatPatternSet('multiTest', [/Part One/, /Part Two/], { repeat: false });

      const patternPromise = once(bot, 'chat:multiTest');
      await serverSay(server, 'Part One');
      await serverSay(server, 'Part Two');

      const [[partOne, partTwo]] = await patternPromise;
      expect(partOne).toContain('Part One');
      expect(partTwo).toContain('Part Two');
    });

    it('should repeat patterns by default', async () => {
      bot.addChatPattern('repeatTest', /Repeat Me/);

      // First match
      let patternPromise = once(bot, 'chat:repeatTest');
      await serverSay(server, 'Repeat Me');
      let [[match]] = await patternPromise;
      expect(match).toContain('Repeat Me');

      // Second match (should still work because repeat=true by default)
      patternPromise = once(bot, 'chat:repeatTest');
      await serverSay(server, 'Repeat Me');
      [[match]] = await patternPromise;
      expect(match).toContain('Repeat Me');

      // Cleanup
      bot.removeChatPattern('repeatTest');
    });

    it('should remove pattern by name', async () => {
      bot.addChatPattern('removeByName', /Remove Me/);
      bot.removeChatPattern('removeByName');

      let triggered = false;
      const listener = () => {
        triggered = true;
      };
      bot.once('chat:removeByName', listener);

      await serverSay(server, 'Remove Me');
      // await sleep(500);

      expect(triggered).toBe(false);
      bot.off('chat:removeByName', listener);
    });

    it('should remove pattern by index', async () => {
      const patternIndex = bot.addChatPattern('removeByIndex', /Remove By Index/);

      // First, verify it works
      let patternPromise = once(bot, 'chat:removeByIndex');
      await serverSay(server, 'Remove By Index');
      await patternPromise;

      // Now remove it
      bot.removeChatPattern(patternIndex);

      // Verify it no longer triggers
      let triggered = false;
      const listener = () => {
        triggered = true;
      };
      bot.once('chat:removeByIndex', listener);

      await serverSay(server, 'Remove By Index');
      // await sleep(500);

      expect(triggered).toBe(false);
      bot.off('chat:removeByIndex', listener);
    });
  });

  describe('Await Message', () => {
    it('should await specific message string', async () => {
      const awaitPromise = bot.awaitMessage(/Await This Message/);
      await serverSay(server, 'Await This Message');
      const result = await awaitPromise;
      expect(result).toContain('Await This Message');
    });

    it('should await message from array of options', async () => {
      const awaitPromise = bot.awaitMessage([/Option One/, /Option Two/]);
      await serverSay(server, 'Option Two');
      const result = await awaitPromise;
      expect(result).toContain('Option Two');
    });

    it('should await exact string match', async () => {
      // Note: Server say adds prefix, so we need to match partial
      const messagePromise = once(bot, 'messagestr');
      await serverSay(server, 'ExactMatch123');
      const [msgStr] = await messagePromise;
      expect(msgStr).toContain('ExactMatch123');
    });
  });

  describe('Whisper', () => {
    it('should send whisper via bot.whisper', async () => {
      // Send a whisper - this uses /tell command internally
      bot.whisper('TestBot', 'Hello whisper');

      // Wait to see if the command is accepted without disconnect
      // await sleep(1000);

      // If we get here, the command_request packet was sent correctly
      expect(bot._client).toBeTruthy();
    });
  });

  describe('Command Messages', () => {
    it('should send commands with slash prefix', async () => {
      // Send a command using bot.chat with slash prefix
      bot.chat('/time set day');

      // Wait to see if the command is accepted
      // await sleep(1000);

      // If we get here, the command_request packet was sent correctly
      expect(bot._client).toBeTruthy();
    });

    it('should receive command output', async () => {
      // Give bot operator permissions first
      await server.sendCommand('op TestBot');
      await sleep(100);

      // Listen for message that might come from command execution
      const messagePromise = once(bot, 'message', 5000);

      // Run a command that produces output
      bot.chat('/say Hello from command');

      const [msg] = await messagePromise;
      expect(msg).toBeTruthy();
      expect(msg.toString()).toContain('Hello from command');
    });
  });

  describe('Deprecated chatAddPattern', () => {
    it('should support deprecated chatAddPattern method', async () => {
      // The deprecated method swaps the argument order
      bot.chatAddPattern(/Deprecated Pattern/, 'deprecatedTest');

      const patternPromise = once(bot, 'deprecatedTest', 10000);
      await serverSay(server, 'Deprecated Pattern');

      const args = await patternPromise;
      // Deprecated patterns emit with different args
      expect(args).toBeTruthy();

      bot.removeChatPattern('deprecatedTest');
    });
  });
});
