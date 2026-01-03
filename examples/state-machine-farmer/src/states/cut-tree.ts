import { StateBehavior } from "@nxg-org/mineflayer-static-statemachine";
import mineflayerPathfinder from "mineflayer-pathfinder";
const { goals } = mineflayerPathfinder;
import { Vec3 } from "vec3";
import type { FarmingContext } from "../context.ts";
import { TREE_BLOCKS, LOG_TO_SAPLING, AXE_TYPES } from "../constants.ts";
import { hasTree, findTreeBase, getNeighborPositions, posToKey, sleep } from "../utils/index.ts";

export class CutTreeState extends StateBehavior {
  name = "cutTree";
  private done = false;

  get ctx(): FarmingContext | undefined {
    return this.bot.farmingContext;
  }

  isFinished(): boolean {
    return this.done;
  }

  hasTree(): boolean {
    return hasTree(this.bot);
  }

  async onStateEntered(): Promise<void> {
    this.done = false;
    if (!this.ctx) {
      this.done = true;
      return;
    }

    this.ctx.treeBasePosition = null;
    this.ctx.saplingType = null;

    try {
      const baseLog = findTreeBase(this.bot);
      if (!baseLog) {
        console.log("No tree found");
        this.done = true;
        return;
      }

      console.log(`Found tree at ${baseLog.pos.toString()} (${baseLog.name})`);
      this.bot.chat(`Cutting ${baseLog.name.replace("_log", "")} tree`);

      this.ctx.treeBasePosition = baseLog.pos.clone();
      this.ctx.saplingType = LOG_TO_SAPLING[baseLog.name] || "oak_sapling";

      await this.equipAxe();
      await this.navigateTo(baseLog.pos, 2);
      await this.cutConnectedBlocks(baseLog.pos);

    } catch (err) {
      console.log("CutTree error:", err);
    } finally {
      this.done = true;
    }
  }

  private async equipAxe(): Promise<void> {
    for (const axeType of AXE_TYPES) {
      const axe = this.bot.inventory.slots.find(s => s?.name === axeType);
      if (axe) {
        await this.bot.equip(axe, "hand");
        await sleep(100);
        break;
      }
    }
  }

  private async navigateTo(pos: Vec3, range: number): Promise<void> {
    const goal = new goals.GoalNear(pos.x, pos.y, pos.z, range);
    await this.bot.pathfinder.goto(goal);
  }

  private async cutConnectedBlocks(startPos: Vec3): Promise<void> {
    const toCheck = [startPos.clone()];
    const cut = new Set<string>();

    while (toCheck.length > 0) {
      const pos = toCheck.shift()!;
      const key = posToKey(pos);

      if (cut.has(key)) continue;

      const block = this.bot.blockAt(pos);
      if (!block || !TREE_BLOCKS.includes(block.name)) continue;

      if (this.bot.entity.position.distanceTo(pos) > 4) {
        await this.navigateTo(pos, 2);
      }

      try {
        await this.bot.dig(block);
        cut.add(key);
      } catch (err) {
        console.log(`Failed to cut at ${pos}: ${err}`);
        continue;
      }

      for (const neighbor of getNeighborPositions(pos)) {
        if (!cut.has(posToKey(neighbor))) {
          const neighborBlock = this.bot.blockAt(neighbor);
          if (neighborBlock && TREE_BLOCKS.includes(neighborBlock.name)) {
            toCheck.push(neighbor);
          }
        }
      }

      await sleep(100);
    }

    console.log(`Cut ${cut.size} blocks`);
    this.bot.chat(`Cut ${cut.size} blocks`);
  }
}
