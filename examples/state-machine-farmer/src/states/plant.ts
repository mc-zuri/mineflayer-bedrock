import { StateBehavior } from '@nxg-org/mineflayer-static-statemachine';
import mineflayerPathfinder from 'mineflayer-pathfinder';
const { goals } = mineflayerPathfinder;
import { Vec3 } from 'vec3';
import type { FarmingContext } from '../context.ts';
import { SEED_TYPES } from '../constants.ts';
import { sleep } from '../utils/index.ts';

export class PlantState extends StateBehavior {
  name = 'plant';
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

    this.ctx.planted = false;
    const farmlandPos = this.ctx.farmlandPosition || this.ctx.foundFarmland;
    const seedType = this.ctx.seedForReplant || this.getLowestInventorySeed();

    if (!farmlandPos || !seedType) {
      console.log('No farmland or seed available');
      this.done = true;
      return;
    }

    if (!this.ctx.seedForReplant) {
      this.bot.chat(`Planting ${seedType}`);
    }

    try {
      await this.plantSeed(farmlandPos, seedType);
    } catch (err) {
      console.log('Plant error:', err);
    } finally {
      this.ctx.farmlandPosition = null;
      this.ctx.foundFarmland = null;
      this.ctx.seedForReplant = null;
      this.done = true;
    }
  }

  private getLowestInventorySeed(): string | null {
    let result: string | null = null;
    let lowest = Infinity;

    for (const seed of SEED_TYPES) {
      const itemType = this.bot.registry.itemsByName[seed];
      if (!itemType) continue;
      const count = this.bot.inventory.count(itemType.id, null);
      if (count > 0 && count < lowest) {
        lowest = count;
        result = seed;
      }
    }
    return result;
  }

  private async plantSeed(farmlandPos: Vec3, seedType: string): Promise<void> {
    const seed = this.bot.inventory.slots.find((s) => s?.name === seedType);
    if (!seed) {
      console.log(`No ${seedType} in inventory`);
      return;
    }

    const goal = new goals.GoalNear(farmlandPos.x, farmlandPos.y, farmlandPos.z, 2);
    await this.bot.pathfinder.goto(goal);

    this.bot.setQuickBarSlot(((this.bot.heldItem?.slot ?? 0) + 1) % 9);
    await sleep(10);

    if (this.bot.heldItem?.name !== seed.name) {
      await this.bot.equip(seed, 'hand');
      await sleep(10);
    }

    const farmland = this.bot.blockAt(farmlandPos);
    if (!farmland || farmland.name !== 'farmland') return;

    const above = this.bot.blockAt(farmlandPos.offset(0, 1, 0));
    if (above && above.name !== 'air') return;

    console.log(`Planting ${seedType} at ${farmlandPos}`);
    await this.bot.placeBlock(farmland, new Vec3(0, 1, 0));

    const afterPlant = this.bot.blockAt(farmlandPos.offset(0, 1, 0));
    if (afterPlant && afterPlant.name !== 'air') {
      this.ctx!.planted = true;
      console.log(`Planted ${seedType}`);
    }
  }
}
