import { StateBehavior } from '@nxg-org/mineflayer-static-statemachine';
import type { FarmingContext } from '../context.ts';
import { needsDeposit, hasTree, findMatureCrop, findEmptyFarmland } from '../utils/index.ts';

export class IdleState extends StateBehavior {
  name = 'idle';
  private done = false;
  private waitTimeout: ReturnType<typeof setTimeout> | null = null;

  get ctx(): FarmingContext | undefined {
    return this.bot.farmingContext;
  }

  isFinished(): boolean {
    return this.done;
  }

  needsDeposit(): boolean {
    return needsDeposit(this.bot);
  }

  hasTree(): boolean {
    return hasTree(this.bot);
  }

  hasMatureCrops(): boolean {
    return findMatureCrop(this.bot) !== null;
  }

  hasEmptyFarmland(): boolean {
    const pos = findEmptyFarmland(this.bot);
    if (pos && this.ctx) {
      this.ctx.foundFarmland = pos;
      this.ctx.seedForReplant = null;
    }
    return pos !== null;
  }

  async onStateEntered(): Promise<void> {
    this.done = false;
    if (this.needsDeposit() || this.hasTree() || this.hasMatureCrops() || this.hasEmptyFarmland()) {
      this.done = true;
    } else {
      this.waitTimeout = setTimeout(() => {
        this.done = true;
      }, 500);
    }
  }

  onStateExited(): void {
    if (this.waitTimeout) {
      clearTimeout(this.waitTimeout);
      this.waitTimeout = null;
    }
  }
}

export * from './harvest.ts';
export * from './plant.ts';
export * from './deposit.ts';
export * from './cut-tree.ts';
export * from './plant-tree.ts';
