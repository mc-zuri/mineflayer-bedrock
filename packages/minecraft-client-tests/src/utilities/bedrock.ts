import type { Bot } from 'mineflayer';
import type { Vec3 } from 'vec3';
import type { ITestServer } from '../abstractions/server.ts';
import { BaseTestUtilities } from './shared.ts';

// Import Bedrock test utilities from minecraft-bedrock-test-server
import {
  giveItem as bdsGiveItem,
  clearInventory as bdsClearInventory,
  teleportPlayer,
  setGamemode,
  setBlock as bdsSetBlock,
  fill as bdsFill,
  sleep,
  type ExternalServer,
} from 'minecraft-bedrock-test-server';

/**
 * Bedrock Edition test utilities.
 * For real servers: Commands are sent via server.sendCommand() directly.
 * For mock servers: Commands are simulated via server.executeCommand() which injects packets.
 */
export class BedrockTestUtilities extends BaseTestUtilities {
  constructor(bot: Bot, server: ITestServer) {
    super(bot, server);
  }

  get groundY(): number {
    // Bedrock flat world ground level
    return -60;
  }

  /** Check if running in mock mode */
  private get isMockMode(): boolean {
    return this.server.mode === 'mock';
  }

  /** Get the underlying external server for direct access to utilities (real mode only) */
  private get externalServer(): ExternalServer {
    // ITestServer uses executeCommand while ExternalServer uses sendCommand
    // Create an adapter that bridges the two interfaces
    const server = this.server;
    return {
      host: server.host,
      port: server.port,
      version: server.version,
      stop: () => server.stop(),
      sendCommand: (cmd: string) => server.executeCommand(cmd),
      waitForOutput: (pattern: RegExp, timeout?: number) => server.waitForOutput(pattern, timeout),
    };
  }

  async clearInventory(): Promise<void> {
    if (this.isMockMode) {
      // In mock mode, execute command which will inject packets
      await this.server.executeCommand(`clear ${this.bot.username}`);
      await sleep(100);
    } else {
      await bdsClearInventory(this.externalServer, this.bot.username);
      await sleep(100);
    }
  }

  async teleport(position: Vec3): Promise<void> {
    if (this.isMockMode) {
      await this.server.executeCommand(`tp ${this.bot.username} ${position.x} ${position.y} ${position.z}`);
      await sleep(100);
    } else {
      await teleportPlayer(this.externalServer, this.bot.username, position.x, position.y, position.z);
      await sleep(100);
    }
  }

  async becomeSurvival(): Promise<void> {
    if (this.isMockMode) {
      await this.server.executeCommand(`gamemode survival ${this.bot.username}`);
      await sleep(100);
    } else {
      await setGamemode(this.externalServer, this.bot.username, 'survival');
      await sleep(100);
    }
  }

  async becomeCreative(): Promise<void> {
    if (this.isMockMode) {
      await this.server.executeCommand(`gamemode creative ${this.bot.username}`);
      await sleep(100);
    } else {
      await setGamemode(this.externalServer, this.bot.username, 'creative');
      await sleep(100);
    }
  }

  async giveItem(itemName: string, count = 1): Promise<void> {
    if (this.isMockMode) {
      await this.server.executeCommand(`give ${this.bot.username} ${itemName} ${count}`);
      // In mock mode, packet injection should trigger inventory update
      await this.wait(200);
    } else {
      await bdsGiveItem(this.externalServer, this.bot.username, itemName, count);
      // Wait for inventory update
      await this.waitFor(
        () => this.bot.inventory.items().some((i) => i?.name === itemName),
        5000
      );
    }
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

    let pos: Vec3;
    if (relative) {
      pos = this.bot.entity.position.floored().offset(x, y, z);
    } else {
      pos = new Vec3(x, y, z);
    }

    if (this.isMockMode) {
      await this.server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} ${blockName}`);
      await sleep(50);
    } else {
      await bdsSetBlock(this.externalServer, pos.x, pos.y, pos.z, blockName);
    }
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
    if (this.isMockMode) {
      await this.server.executeCommand(`fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} ${block}`);
      await sleep(50);
    } else {
      await bdsFill(this.externalServer, x1, y1, z1, x2, y2, z2, block);
    }
  }

  async resetState(): Promise<void> {
    if (this.isMockMode) {
      // In mock mode, just wait for basic initialization
      await this.wait(500);
      return;
    }

    await this.becomeCreative();
    await this.clearInventory();

    const { Vec3 } = await import('vec3');
    await this.teleport(new Vec3(0, this.groundY + 2, 0));

    // Wait for chunks to load
    await this.wait(1000);
    await this.clearInventory();
  }
}
