import type { Bot } from 'mineflayer';
import type { Vec3 } from 'vec3';
import type { ITestServer } from '../abstractions/server.ts';
import { BaseTestUtilities } from './shared.ts';

// Promise utilities
function onceWithCleanup<T>(
  emitter: NodeJS.EventEmitter,
  event: string,
  options: { timeout: number; checkCondition?: (...args: any[]) => boolean }
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      emitter.off(event, handler);
      reject(new Error(`Timeout waiting for ${event}`));
    }, options.timeout);

    const handler = (...args: any[]) => {
      if (!options.checkCondition || options.checkCondition(...args)) {
        clearTimeout(timer);
        emitter.off(event, handler);
        resolve(args as T);
      }
    };

    emitter.on(event, handler);
  });
}

/**
 * Java Edition test utilities.
 * For real servers: Commands are sent via bot.chat() with confirmation via message events.
 * For mock servers: Commands are sent via bot.chat() but confirmations are simulated.
 */
export class JavaTestUtilities extends BaseTestUtilities {
  private static readonly TIMEOUT = 5000;

  constructor(bot: Bot, server: ITestServer) {
    super(bot, server);
  }

  /** Check if running in mock mode */
  private get isMockMode(): boolean {
    return this.server.mode === 'mock';
  }

  get groundY(): number {
    // @ts-ignore - supportFeature may not be typed
    return this.bot.supportFeature && this.bot.supportFeature('tallWorld') ? -60 : 4;
  }

  async clearInventory(): Promise<void> {
    // First give a stone to ensure inventory is not empty (required for clear confirmation)
    const giveStone = onceWithCleanup(this.bot.inventory, 'updateSlot', {
      timeout: 20000,
      checkCondition: (_slot: number, _oldItem: any, newItem: any) => newItem?.name === 'stone',
    });
    this.bot.chat('/give @s stone 1');
    await giveStone;

    // Now clear inventory
    const clearInv = onceWithCleanup(this.bot, 'message', {
      timeout: JavaTestUtilities.TIMEOUT,
      checkCondition: (msg: any) =>
        msg.translate === 'commands.clear.success.single' || msg.translate === 'commands.clear.success',
    });
    this.bot.chat('/clear');
    await clearInv;
  }

  async teleport(position: Vec3): Promise<void> {
    // @ts-ignore - supportFeature may not be typed
    if (this.bot.supportFeature && this.bot.supportFeature('hasExecuteCommand')) {
      this.sayEverywhere(
        `/execute in overworld run teleport ${this.bot.username} ${position.x} ${position.y} ${position.z}`
      );
    } else {
      this.sayEverywhere(`/tp ${this.bot.username} ${position.x} ${position.y} ${position.z}`);
    }

    await onceWithCleanup(this.bot, 'move', {
      timeout: JavaTestUtilities.TIMEOUT,
      checkCondition: () => this.bot.entity.position.distanceTo(position) < 0.9,
    });
  }

  async becomeSurvival(): Promise<void> {
    await this.setGameMode('survival');
  }

  async becomeCreative(): Promise<void> {
    await this.setGameMode('creative');
  }

  private async setGameMode(mode: string): Promise<void> {
    const gameModeChangedMessages = ['commands.gamemode.success.self', 'gameMode.changed'];
    const targetMode = mode;

    let i = 0;
    const msgProm = onceWithCleanup(this.bot, 'message', {
      timeout: JavaTestUtilities.TIMEOUT,
      checkCondition: (msg: any) =>
        gameModeChangedMessages.includes(msg.translate) &&
        i++ > 0 &&
        // @ts-ignore
        this.bot.game.gameMode === targetMode,
    });

    // Toggle mode to ensure we get feedback
    const oppositeMode = mode === 'creative' ? 'survival' : 'creative';
    this.bot.chat(`/gamemode ${mode}`);
    this.bot.chat(`/gamemode ${oppositeMode}`);
    this.bot.chat(`/gamemode ${mode}`);
    await msgProm;
  }

  async giveItem(itemName: string, count = 1): Promise<void> {
    const p = new Promise<void>((resolve) => {
      this.bot.inventory.once('updateSlot', () => resolve());
    });
    this.bot.chat(`/give @s ${itemName} ${count}`);
    await p;
  }

  async setBlock(options: {
    x?: number;
    y?: number;
    z?: number;
    relative?: boolean;
    blockName: string;
  }): Promise<void> {
    const { Vec3 } = await import('vec3');
    const { x = 0, y = 0, z = 0, relative, blockName } = options;

    const pos = relative
      ? this.bot.entity.position.floored().offset(x, y, z)
      : new Vec3(x, y, z);

    const block = this.bot.blockAt(pos);
    if (block?.name === blockName) {
      return;
    }

    const p = new Promise<void>((resolve) => {
      this.bot.world.once(`blockUpdate:(${pos.x}, ${pos.y}, ${pos.z})`, () => resolve());
    });

    const prefix = relative ? '~' : '';
    this.bot.chat(`/setblock ${prefix}${x} ${prefix}${y} ${prefix}${z} ${blockName}`);
    await p;
  }

  async fill(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    block: string
  ): Promise<void> {
    this.bot.chat(`/fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} ${block}`);
    await this.wait(50);
  }
}
