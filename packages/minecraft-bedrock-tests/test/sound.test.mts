import { expect } from 'expect';
import type { Bot } from 'mineflayer';
import { startExternalServer, connectBotToExternalServer, waitForBotSpawn, sleep, type ExternalServer } from 'minecraft-bedrock-test-server';

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

describe('BDS Integration: Sound', function () {
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
    // await sleep(500);
  });

  afterEach(async function () {
    if (bot?._client?.close) {
      bot._client.close();
    }
  });

  it('should receive sound effect events', async () => {
    const soundPromise = once(bot, 'soundEffectHeard');

    // Bedrock playsound syntax: /playsound <sound> [player] [position] [volume] [pitch] [minimumVolume]
    await server.sendCommand(`playsound note.harp ${bot.username} ~ ~ ~ 1 1`);

    const [soundName, position, volume, pitch] = await soundPromise;

    expect(soundName).toBeTruthy();
    expect(position).toBeTruthy();
    expect(typeof volume).toBe('number');
    expect(typeof pitch).toBe('number');
  });
});
