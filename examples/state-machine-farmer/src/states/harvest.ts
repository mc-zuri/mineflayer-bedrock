import { StateBehavior } from "@nxg-org/mineflayer-static-statemachine";
import mineflayerPathfinder from "mineflayer-pathfinder";
const { goals } = mineflayerPathfinder;
import { Vec3 } from "vec3";
import type { FarmingContext } from "../context.ts";
import { SEARCH_RADIUS, CROP_BLOCKS, MAX_CROP_GROWTH, CROP_TO_SEED } from "../constants.ts";
import { sleep } from "../utils/index.ts";

const SAME_DIR_ANGLE = Math.PI / 4;

export class HarvestState extends StateBehavior {
  name = "harvest";
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

    this.ctx.harvested = false;
    this.ctx.seedForReplant = null;
    this.ctx.farmlandPosition = null;

    const best = this.findBestCrop();
    if (!best) {
      console.log("No mature crops");
      this.ctx.harvestDirection = null;
      this.done = true;
      return;
    }

    this.ctx.harvestDirection = best.targetYaw;
    console.log(`Harvesting ${best.type} at ${best.pos}`);
    this.bot.chat(`Harvesting ${best.type}`);

    try {
      await this.harvestCrop(best.pos, best.type);
    } catch (err) {
      console.log("Harvest error:", err);
    } finally {
      this.done = true;
    }
  }

  private findBestCrop(): { pos: Vec3; type: string; targetYaw: number } | null {
    const botPos = this.bot.entity.position;
    const currentDir = this.ctx?.harvestDirection ?? null;
    const crops: { pos: Vec3; type: string; dist: number; targetYaw: number; score: number }[] = [];

    for (const cropName of CROP_BLOCKS) {
      const blockType = this.bot.registry.blocksByName[cropName];
      if (!blockType) continue;

      const found = this.bot.findBlocks({ matching: blockType.id, maxDistance: SEARCH_RADIUS, count: 64 });
      for (const pos of found) {
        const block = this.bot.blockAt(pos);
        // @ts-ignore - Bedrock specific
        if (block && block._properties?.growth === MAX_CROP_GROWTH) {
          const dx = pos.x - botPos.x;
          const dz = pos.z - botPos.z;
          const dist = botPos.distanceTo(pos);
          const targetYaw = Math.atan2(-dx, -dz);
          const dirScore = this.calculateDirectionScore(targetYaw, currentDir);
          crops.push({ pos, type: cropName, dist, targetYaw, score: dist + dirScore });
        }
      }
    }

    if (crops.length === 0) return null;
    crops.sort((a, b) => a.score - b.score);
    return crops[0];
  }

  private calculateDirectionScore(targetYaw: number, currentDir: number | null): number {
    if (currentDir === null) return 0;
    let diff = targetYaw - currentDir;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return Math.abs(diff) < SAME_DIR_ANGLE ? -10 : Math.abs(diff) * 5;
  }

  private async harvestCrop(pos: Vec3, cropType: string): Promise<void> {
    const goal = new goals.GoalNear(pos.x, pos.y, pos.z, 2);
    await this.bot.pathfinder.goto(goal);

    const block = this.bot.blockAt(pos);
    // @ts-ignore
    if (!block || block._properties?.growth !== MAX_CROP_GROWTH) return;

    await this.bot.dig(block);
    await sleep(100);

    const updated = this.bot.blockAt(pos);
    if (!updated || updated.name === "air") {
      this.ctx!.harvested = true;
      this.ctx!.seedForReplant = CROP_TO_SEED[cropType];
      this.ctx!.farmlandPosition = pos.offset(0, -1, 0);
      console.log(`Harvested, replanting with ${this.ctx!.seedForReplant}`);
    }
  }
}
