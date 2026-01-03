import { expect } from 'expect';
import type { Bot } from 'mineflayer';
import { startExternalServer, connectBotToExternalServer, waitForBotSpawn, sleep, setGamemode, type ExternalServer } from 'minecraft-bedrock-test-server';

function once(emitter: { once: (event: string, listener: (...args: any[]) => void) => void }, event: string, timeout = 10000): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);
    emitter.once(event, (...args: any[]) => {
      clearTimeout(timer);
      resolve(args);
    });
  });
}

describe('BDS Integration: Experience', function () {
  this.timeout(120_000);

  let server: ExternalServer;
  let bot: Bot;

  before(async function () {
    this.timeout(180_000);
    server = await startExternalServer({ version: process.env.BDS_VERSION || '1.21.130' });
  });

  after(async function () {
    await server?.stop();
  });

  beforeEach(async function () {
    bot = await connectBotToExternalServer(server);
    await waitForBotSpawn(bot);
    await setGamemode(server, bot.username, 'survival');
    // await sleep(500);
  });

  afterEach(async function () {
    if (bot?._client?.close) {
      bot._client.close();
    }
  });

  it('should have experience properties with correct types', async () => {
    expect(bot.experience).toBeTruthy();
    expect(typeof bot.experience.level).toBe('number');
    expect(typeof bot.experience.points).toBe('number');
    expect(typeof bot.experience.progress).toBe('number');

    expect(bot.experience.level).toBeGreaterThanOrEqual(0);
    expect(bot.experience.points).toBeGreaterThanOrEqual(0);
    expect(bot.experience.progress).toBeGreaterThanOrEqual(0);
    expect(bot.experience.progress).toBeLessThanOrEqual(1);
  });

  it('should update when adding experience levels', async () => {
    const initialLevel = bot.experience.level;

    // Bedrock uses different XP command syntax
    await server.sendCommand(`xp 10L ${bot.username}`);
    await once(bot, 'experience');
    // await sleep(200);

    expect(bot.experience.level).toBeGreaterThanOrEqual(initialLevel + 10);
  });

  it('should update progress correctly', async () => {
    // Reset XP first
    await server.sendCommand(`xp -1000000L ${bot.username}`);
    await once(bot, 'experience');

    // Set to specific level
    await server.sendCommand(`xp 5L ${bot.username}`);
    await once(bot, 'experience');
    // await sleep(200);

    expect(bot.experience.level).toBeGreaterThanOrEqual(5);
    expect(bot.experience.progress).toBeGreaterThanOrEqual(0);
    expect(bot.experience.progress).toBeLessThanOrEqual(1);
  });
});
