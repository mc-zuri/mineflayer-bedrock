import type { Bot } from 'mineflayer';
import type { Vec3 } from 'vec3';
import type { Item } from 'prismarine-item';
import type { ITestServer } from '../abstractions/server.ts';
import type { ITestUtilities } from '../abstractions/utilities.ts';

/**
 * Base class for test utilities with shared implementations.
 * Edition-specific behavior is implemented in subclasses.
 */
export abstract class BaseTestUtilities implements ITestUtilities {
  public readonly bot: Bot;
  public readonly server: ITestServer;

  constructor(bot: Bot, server: ITestServer) {
    this.bot = bot;
    this.server = server;
  }

  // Abstract methods to be implemented by subclasses
  abstract get groundY(): number;
  abstract clearInventory(): Promise<void>;
  abstract teleport(position: Vec3): Promise<void>;
  abstract becomeSurvival(): Promise<void>;
  abstract becomeCreative(): Promise<void>;
  abstract giveItem(itemName: string, count?: number): Promise<void>;
  abstract setBlock(options: {
    x?: number;
    y?: number;
    z?: number;
    relative?: boolean;
    blockName: string;
  }): Promise<void>;
  abstract fill(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    block: string
  ): Promise<void>;

  // Shared implementations

  sayEverywhere(message: string): void {
    this.bot.chat(message);
    console.log(message);
  }

  wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout = 10000,
    interval = 100
  ): Promise<void> {
    const start = Date.now();
    while (!(await condition())) {
      if (Date.now() - start > timeout) {
        throw new Error('Timeout waiting for condition');
      }
      await this.wait(interval);
    }
  }

  selfKill(): void {
    this.bot.chat('/kill @s');
  }

  async fly(delta: Vec3): Promise<void> {
    // @ts-ignore - creative may not be typed
    if (this.bot.creative) {
      // @ts-ignore
      await this.bot.creative.flyTo(this.bot.entity.position.plus(delta));
    }
  }

  async placeBlock(slot: number, position: Vec3): Promise<void> {
    const { Vec3 } = await import('vec3');
    this.bot.setQuickBarSlot(slot - 36);
    const referenceBlock = this.bot.blockAt(position.plus(new Vec3(0, -1, 0)));
    if (referenceBlock) {
      await this.bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
    }
  }

  async setInventorySlot(slot: number, item: Item | null): Promise<void> {
    // @ts-ignore - creative may not be typed
    if (this.bot.creative) {
      // @ts-ignore
      await this.bot.creative.setInventorySlot(slot, item);
    }
  }

  async awaitItemReceived(command: string): Promise<void> {
    const p = new Promise<void>((resolve) => {
      this.bot.inventory.once('updateSlot', () => resolve());
    });
    this.bot.chat(command);
    await p;
  }

  async resetState(): Promise<void> {
    await this.becomeCreative();
    await this.clearInventory();

    // @ts-ignore - creative may not be typed
    if (this.bot.creative) {
      // @ts-ignore
      this.bot.creative.startFlying();
    }

    const { Vec3 } = await import('vec3');
    await this.teleport(new Vec3(0, this.groundY, 0));
    await this.bot.waitForChunksToLoad();
    await this.resetBlocksToSuperflat();
    await this.wait(1000);
    await this.clearInventory();
  }

  protected async resetBlocksToSuperflat(): Promise<void> {
    // Get layer names based on version
    let grassName = 'grass_block';
    // @ts-ignore - supportFeature may not be typed
    if (this.bot.supportFeature && this.bot.supportFeature('itemsAreAlsoBlocks')) {
      grassName = 'grass';
    }

    const layerNames = ['bedrock', 'dirt', 'dirt', grassName, 'air', 'air', 'air', 'air', 'air'];

    const groundY = 4;
    for (let y = groundY + 4; y >= groundY - 1; y--) {
      const realY = y + this.groundY - 4;
      await this.fill(-5, realY, -5, 5, realY, 5, layerNames[y]);
    }
    await this.wait(100);
  }
}
