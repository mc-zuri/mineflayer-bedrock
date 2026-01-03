import type { Vec3 } from 'vec3';
import type { Item } from 'prismarine-item';
import type { Bot } from 'mineflayer';
import type { ITestServer } from './server.ts';

export interface ITestUtilities {
  /** Ground Y coordinate (differs between Java flat and Bedrock flat worlds) */
  readonly groundY: number;

  /** Reference to the bot */
  readonly bot: Bot;

  /** Reference to the server */
  readonly server: ITestServer;

  // === State Management ===

  /** Reset world state to clean superflat */
  resetState(): Promise<void>;

  /** Clear player inventory */
  clearInventory(): Promise<void>;

  /** Set game mode to survival */
  becomeSurvival(): Promise<void>;

  /** Set game mode to creative */
  becomeCreative(): Promise<void>;

  // === Movement ===

  /** Teleport to position */
  teleport(position: Vec3): Promise<void>;

  /** Fly in creative mode */
  fly(delta: Vec3): Promise<void>;

  // === Block Operations ===

  /** Set a block at position */
  setBlock(options: {
    x?: number;
    y?: number;
    z?: number;
    relative?: boolean;
    blockName: string;
  }): Promise<void>;

  /** Fill region with block */
  fill(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    block: string
  ): Promise<void>;

  /** Place block from slot at position */
  placeBlock(slot: number, position: Vec3): Promise<void>;

  // === Inventory Operations ===

  /** Give item to player */
  giveItem(itemName: string, count?: number): Promise<void>;

  /** Set specific inventory slot (creative mode) */
  setInventorySlot(slot: number, item: Item | null): Promise<void>;

  /** Wait for item to be received in inventory */
  awaitItemReceived(command: string): Promise<void>;

  // === Communication ===

  /** Send chat message and log it */
  sayEverywhere(message: string): void;

  // === Timing ===

  /** Wait for milliseconds */
  wait(ms: number): Promise<void>;

  /** Wait for condition to be true */
  waitFor(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<void>;

  // === Utility ===

  /** Kill the player */
  selfKill(): void;
}
