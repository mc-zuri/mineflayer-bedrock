import { StateBehavior } from "@nxg-org/mineflayer-static-statemachine";
import mineflayerPathfinder from "mineflayer-pathfinder";
const { goals } = mineflayerPathfinder;
import { Vec3 } from "vec3";
import type { FarmingContext } from "../context.ts";
import {
  SEARCH_RADIUS, LOG_BLOCKS, SAPLING_BLOCKS, PLANTABLE_GROUND,
  MIN_TREE_SPACING, MIN_VERTICAL_SPACE, MAX_EXTRA_SAPLINGS_PER_CYCLE,
} from "../constants.ts";
import { sleep } from "../utils/index.ts";

export class PlantTreeState extends StateBehavior {
  name = "plantTree";
  private done = false;

  get ctx(): FarmingContext | undefined {
    return this.bot.farmingContext;
  }

  isFinished(): boolean {
    return this.done;
  }

  async onStateEntered(): Promise<void> {
    this.done = false;
    if (!this.ctx) {
      this.done = true;
      return;
    }

    try {
      if (this.ctx.treeBasePosition && this.ctx.saplingType) {
        await this.plantSaplingAt(this.ctx.treeBasePosition, this.ctx.saplingType);
      }
      await this.plantExtraSaplings();
    } catch (err) {
      console.log("PlantTree error:", err);
    } finally {
      this.ctx.treeBasePosition = null;
      this.ctx.saplingType = null;
      this.done = true;
    }
  }

  private async plantSaplingAt(pos: Vec3, saplingType: string): Promise<boolean> {
    const sapling = this.bot.inventory.slots.find(s => s?.name === saplingType);
    if (!sapling) return false;

    const groundPos = pos.offset(0, -1, 0);
    const ground = this.bot.blockAt(groundPos);
    if (!ground || !PLANTABLE_GROUND.includes(ground.name)) return false;

    await this.navigateTo(pos, 2);
    await this.bot.equip(sapling, "hand");
    await sleep(100);
    await this.bot.placeBlock(ground, new Vec3(0, 1, 0));
    console.log(`Planted ${saplingType} at ${pos}`);
    return true;
  }

  private async plantExtraSaplings(): Promise<void> {
    const groundBlocks = this.findGroundBlocks();
    if (groundBlocks.length === 0) return;

    let planted = 0;
    for (const groundPos of groundBlocks) {
      const sapling = this.bot.inventory.slots.find(s => s && SAPLING_BLOCKS.includes(s.name));
      if (!sapling || planted >= MAX_EXTRA_SAPLINGS_PER_CYCLE) break;

      if (!this.isValidPlantingSpot(groundPos)) continue;

      try {
        await this.navigateTo(groundPos, 2);
        await this.bot.equip(sapling, "hand");
        await sleep(100);

        const ground = this.bot.blockAt(groundPos);
        if (ground && PLANTABLE_GROUND.includes(ground.name)) {
          await this.bot.placeBlock(ground, new Vec3(0, 1, 0));
          planted++;
          await sleep(200);
        }
      } catch {
        // Skip invalid spots
      }
    }

    if (planted > 0) {
      console.log(`Planted ${planted} extra sapling(s)`);
      this.bot.chat(`Planted ${planted} extra sapling(s)`);
    }
  }

  private findGroundBlocks(): Vec3[] {
    const dirtType = this.bot.registry.blocksByName["dirt"];
    const grassType = this.bot.registry.blocksByName["grass_block"] || this.bot.registry.blocksByName["grass"];

    const ids: number[] = [];
    if (dirtType) ids.push(dirtType.id);
    if (grassType) ids.push(grassType.id);
    if (ids.length === 0) return [];

    return this.bot.findBlocks({ matching: ids, maxDistance: SEARCH_RADIUS, count: 200 });
  }

  private isValidPlantingSpot(groundPos: Vec3): boolean {
    const above = this.bot.blockAt(groundPos.offset(0, 1, 0));
    if (!above || above.name !== "air") return false;

    for (let y = 1; y <= MIN_VERTICAL_SPACE; y++) {
      const block = this.bot.blockAt(groundPos.offset(0, y, 0));
      if (block && block.name !== "air") return false;
    }

    for (const blockName of [...LOG_BLOCKS, ...SAPLING_BLOCKS]) {
      const blockType = this.bot.registry.blocksByName[blockName];
      if (!blockType) continue;
      const nearby = this.bot.findBlock({
        matching: blockType.id,
        maxDistance: MIN_TREE_SPACING,
        point: groundPos,
      });
      if (nearby) return false;
    }

    return true;
  }

  private async navigateTo(pos: Vec3, range: number): Promise<void> {
    const goal = new goals.GoalNear(pos.x, pos.y, pos.z, range);
    await this.bot.pathfinder.goto(goal);
  }
}
