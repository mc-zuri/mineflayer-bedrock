import { expect } from 'expect';
import type { Bot } from 'mineflayer';
import { startBDSServer, connectBotToBDS, waitForBotSpawn, sleep, type BDSServer } from '../src/index.ts';

describe('BDS Integration: Display Name', function () {
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

  it('should have correct player display name', async () => {
    const player = bot.players[bot.username];

    expect(player).toBeTruthy();
    expect(player.displayName).toBeTruthy();
    expect(player.displayName.toString()).toBe(bot.username);
  });
});
