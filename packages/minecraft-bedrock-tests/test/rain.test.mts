import { expect } from 'expect';
import type { Bot } from 'mineflayer';
import { startBDSServer, connectBotToBDS, waitForBotSpawn, sleep, type BDSServer } from '../src/index.ts';

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

describe('BDS Integration: Rain', function () {
  this.timeout(120_000);

  let server: BDSServer;
  let bot: Bot;

  before(async function () {
    this.timeout(180_000);
    server = await startBDSServer({ version: '1.21.130' });
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

  it('should detect rain starting', async () => {
    // Ensure clear weather first
    await server.sendCommand('weather clear');
    // await sleep(1000);

    // Start rain
    await server.sendCommand('weather rain');
    await once(bot, 'rain');

    expect(bot.isRaining).toBe(true);
  });

  it('should detect rain stopping', async () => {
    // Start with rain
    await server.sendCommand('weather rain');
    await once(bot, 'rain');

    // Clear weather
    await server.sendCommand('weather clear');
    await once(bot, 'rain');

    expect(bot.isRaining).toBe(false);
  });
});
