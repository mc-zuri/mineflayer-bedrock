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

describe('BDS Integration: Time', function () {
  this.timeout(120_000);

  let server: ExternalServer;
  let bot: Bot;

  before(async function () {
    this.timeout(180_000);
    server = await startExternalServer({ version: '1.21.130' });
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

  it('should have all time properties with correct types', async () => {
    // Verify time object exists
    expect(bot.time).toBeTruthy();

    // Property types matching Java plugin API
    const timeProps: Record<string, string> = {
      doDaylightCycle: 'boolean',
      bigTime: 'bigint',
      time: 'number',
      timeOfDay: 'number',
      day: 'number',
      isDay: 'boolean',
      moonPhase: 'number',
      bigAge: 'bigint',
      age: 'number',
    };

    // Verify all properties exist and have correct types
    for (const [prop, expectedType] of Object.entries(timeProps)) {
      expect(typeof bot.time[prop]).toBe(expectedType);
    }

    // Verify ranges
    expect(bot.time.timeOfDay).toBeGreaterThanOrEqual(0);
    expect(bot.time.timeOfDay).toBeLessThan(24000);
    expect(bot.time.moonPhase).toBeGreaterThanOrEqual(0);
    expect(bot.time.moonPhase).toBeLessThan(8);
    expect(bot.time.day).toBeGreaterThanOrEqual(0);
    expect(bot.time.age).toBeGreaterThanOrEqual(0);
    expect(bot.time.bigAge).toBeGreaterThanOrEqual(0n);
  });

  it('should update time when server changes time', async () => {
    // Set time to midnight
    await server.sendCommand('time set 18000');
    await once(bot, 'time');
    // await sleep(200);

    // Check it's close to midnight (18000)
    expect(Math.abs(bot.time.timeOfDay - 18000)).toBeLessThan(500);
    expect(bot.time.isDay).toBe(false);
  });

  it('should correctly report day vs night', async () => {
    // Test time transitions matching Java tests
    const timeTests = [
      { time: 18000, name: 'midnight', isDay: false },
      { time: 6000, name: 'noon', isDay: true },
      { time: 12000, name: 'sunset', isDay: true },
      { time: 0, name: 'sunrise', isDay: true },
    ];

    for (const test of timeTests) {
      await server.sendCommand(`time set ${test.time}`);
      await once(bot, 'time');
      // await sleep(200);
      expect(Math.abs(bot.time.timeOfDay - test.time)).toBeLessThan(500);
      expect(bot.time.isDay).toBe(test.isDay);
    }
  });

  it('should track day and moon phase progression', async () => {
    // Set time to start of day
    await server.sendCommand('time set 0');
    await once(bot, 'time');
    // await sleep(200);

    const initialDay = bot.time.day;
    const initialPhase = bot.time.moonPhase;

    // Add a full day
    await server.sendCommand('time add 24000');
    await once(bot, 'time');
    // await sleep(200);

    expect(bot.time.day).toBeGreaterThanOrEqual(initialDay + 1);
    // Moon phase should change after a full day (cycles every 8 days)
    expect(bot.time.moonPhase).not.toBe(initialPhase);
  });

  it('should have valid age from world tick', async () => {
    // Age should be initialized from start_game.current_tick or tick_sync
    // and should be a positive value representing world ticks
    expect(bot.time.age).toBeGreaterThan(0);
    expect(bot.time.bigAge).toBeGreaterThan(0n);
  });
});
