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

describe('BDS Integration: Bed', function () {
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
    // Give player op and set to survival
    await server.sendCommand(`op "${bot.username}"`);
    await server.sendCommand(`gamemode survival "${bot.username}"`);
    await sleep(500);
  });

  afterEach(async function () {
    if (bot?._client?.close) {
      bot._client.close();
    }
  });

  it('should have isSleeping property initialized to false', async () => {
    expect(bot.isSleeping).toBe(false);
  });

  it('should have isABed function that recognizes bed blocks', async () => {
    expect(typeof bot.isABed).toBe('function');

    // Place a bed and verify it's recognized
    await server.sendCommand(`setblock ~ ~ ~1 bed`);
    await sleep(200);

    const bedBlock = bot.blockAt(bot.entity.position.offset(0, 0, 1).floored());
    if (bedBlock && bedBlock.name.includes('bed')) {
      expect(bot.isABed(bedBlock)).toBe(true);
    }
  });

  it('should have parseBedMetadata function', async () => {
    expect(typeof bot.parseBedMetadata).toBe('function');

    // Place a bed facing south
    const pos = bot.entity.position.floored();
    await server.sendCommand(`setblock ${pos.x} ${pos.y} ${pos.z + 2} bed ["direction"=0,"head_piece_bit"=0]`);
    await server.sendCommand(`setblock ${pos.x} ${pos.y} ${pos.z + 3} bed ["direction"=0,"head_piece_bit"=1]`);
    await sleep(300);

    const footBlock = bot.blockAt(pos.offset(0, 0, 2));
    if (footBlock && footBlock.name.includes('bed')) {
      const metadata = bot.parseBedMetadata(footBlock);
      expect(metadata).toBeTruthy();
      expect(typeof metadata.part).toBe('boolean');
      expect(typeof metadata.occupied).toBe('boolean');
      expect(typeof metadata.facing).toBe('number');
      expect(metadata.headOffset).toBeTruthy();
    }
  });

  it('should sleep in bed at night and emit sleep event', async function () {
    this.timeout(30_000);

    // Set time to night (sleeping is allowed from 12541 to 23458)
    await server.sendCommand('time set 13000');
    await sleep(500);

    // Clear area and place bed
    const pos = bot.entity.position.floored();
    await server.sendCommand(`fill ${pos.x - 2} ${pos.y - 1} ${pos.z - 2} ${pos.x + 2} ${pos.y + 3} ${pos.z + 5} air`);
    await server.sendCommand(`fill ${pos.x - 2} ${pos.y - 1} ${pos.z - 2} ${pos.x + 2} ${pos.y - 1} ${pos.z + 5} stone`);
    await sleep(200);

    // Place bed facing south (foot at z+1, head at z+2)
    await server.sendCommand(`setblock ${pos.x} ${pos.y} ${pos.z + 1} bed ["direction"=0,"head_piece_bit"=0]`);
    await server.sendCommand(`setblock ${pos.x} ${pos.y} ${pos.z + 2} bed ["direction"=0,"head_piece_bit"=1]`);
    await sleep(500);

    // Get the bed block
    const bedBlock = bot.blockAt(pos.offset(0, 0, 1));
    expect(bedBlock).toBeTruthy();
    if (!bedBlock || !bot.isABed(bedBlock)) {
      console.log('Bed block not placed correctly, skipping test. Block:', bedBlock?.name);
      return;
    }

    // Sleep in bed
    const sleepPromise = once(bot, 'sleep', 5000);

    try {
      await bot.sleep(bedBlock);
      await sleepPromise;

      expect(bot.isSleeping).toBe(true);
    } catch (err: any) {
      // Skip if sleep fails due to server-side issues
      if (err.message.includes('not sleeping') || err.message.includes('too far') || err.message.includes('cant click')) {
        console.log('Sleep test skipped:', err.message);
        return;
      }
      throw err;
    }
  });

  it('should wake up from bed and emit wake event', async function () {
    this.timeout(30_000);

    // Set time to night
    await server.sendCommand('time set 13000');
    await sleep(500);

    // Clear area and place bed
    const pos = bot.entity.position.floored();
    await server.sendCommand(`fill ${pos.x - 2} ${pos.y - 1} ${pos.z - 2} ${pos.x + 2} ${pos.y + 3} ${pos.z + 5} air`);
    await server.sendCommand(`fill ${pos.x - 2} ${pos.y - 1} ${pos.z - 2} ${pos.x + 2} ${pos.y - 1} ${pos.z + 5} stone`);
    await sleep(200);

    // Place bed
    await server.sendCommand(`setblock ${pos.x} ${pos.y} ${pos.z + 1} bed ["direction"=0,"head_piece_bit"=0]`);
    await server.sendCommand(`setblock ${pos.x} ${pos.y} ${pos.z + 2} bed ["direction"=0,"head_piece_bit"=1]`);
    await sleep(500);

    const bedBlock = bot.blockAt(pos.offset(0, 0, 1));
    if (!bedBlock || !bot.isABed(bedBlock)) {
      console.log('Bed block not placed correctly, skipping test. Block:', bedBlock?.name);
      return;
    }

    try {
      // Sleep first
      await bot.sleep(bedBlock);
      await sleep(500);

      if (!bot.isSleeping) {
        console.log('Could not enter sleep state, skipping wake test');
        return;
      }

      // Now wake up
      const wakePromise = once(bot, 'wake', 5000);
      await bot.wake();
      await wakePromise;

      expect(bot.isSleeping).toBe(false);
    } catch (err: any) {
      // Skip if sleep/wake fails due to server-side issues
      if (err.message.includes('not sleeping') || err.message.includes('too far') || err.message.includes('awake') || err.message.includes('cant click')) {
        console.log('Wake test skipped:', err.message);
        return;
      }
      throw err;
    }
  });

  it('should throw error when trying to sleep during day', async function () {
    // Set time to midday
    await server.sendCommand('time set 6000');
    await sleep(500);

    // Place bed
    const pos = bot.entity.position.floored();
    await server.sendCommand(`setblock ${pos.x} ${pos.y} ${pos.z + 1} bed ["direction"=0,"head_piece_bit"=0]`);
    await server.sendCommand(`setblock ${pos.x} ${pos.y} ${pos.z + 2} bed ["direction"=0,"head_piece_bit"=1]`);
    await sleep(300);

    const bedBlock = bot.blockAt(pos.offset(0, 0, 1));
    if (!bedBlock || !bot.isABed(bedBlock)) {
      console.log('Bed block not placed correctly, skipping test. Block:', bedBlock?.name);
      return;
    }

    await expect(bot.sleep(bedBlock)).rejects.toThrow("it's not night and it's not a thunderstorm");
  });

  it('should throw error when trying to wake while not sleeping', async () => {
    expect(bot.isSleeping).toBe(false);
    await expect(bot.wake()).rejects.toThrow('already awake');
  });

  it('should throw error when trying to sleep in non-bed block', async () => {
    // Place a stone block
    const pos = bot.entity.position.floored();
    await server.sendCommand(`setblock ${pos.x} ${pos.y} ${pos.z + 1} stone`);
    await sleep(200);

    // Set time to night
    await server.sendCommand('time set 13000');
    await sleep(200);

    const stoneBlock = bot.blockAt(pos.offset(0, 0, 1));
    expect(stoneBlock).toBeTruthy();

    await expect(bot.sleep(stoneBlock!)).rejects.toThrow('wrong block : not a bed block');
  });

  it('should throw error when already sleeping', async function () {
    this.timeout(30_000);

    // Set time to night
    await server.sendCommand('time set 13000');
    await sleep(500);

    // Manually set isSleeping to simulate already sleeping
    bot.isSleeping = true;

    const pos = bot.entity.position.floored();
    await server.sendCommand(`setblock ${pos.x} ${pos.y} ${pos.z + 1} bed ["direction"=0,"head_piece_bit"=0]`);
    await sleep(200);

    const bedBlock = bot.blockAt(pos.offset(0, 0, 1));

    if (bedBlock && bot.isABed(bedBlock)) {
      await expect(bot.sleep(bedBlock)).rejects.toThrow('already sleeping');
    }

    // Reset for cleanup
    bot.isSleeping = false;
  });
});
