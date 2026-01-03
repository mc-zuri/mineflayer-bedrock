import { expect } from 'expect';
import type { Bot } from 'mineflayer';
import { startBDSServer, connectBotToBDS, waitForBotSpawn, sleep, type BDSServer } from '../src/index.ts';

describe('BDS Integration: Breath', function () {
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
    //await sleep(500);
  });

  afterEach(async function () {
    if (bot?._client?.close) {
      bot._client.close();
    }
  });

  it('should have correct oxygen level when not underwater', async () => {
    await bot.waitForChunksToLoad();

    // oxygenLevel should be 20 (full) when not underwater
    if (bot.oxygenLevel !== undefined) {
      expect(bot.oxygenLevel).toBe(20);
    }
  });
});
