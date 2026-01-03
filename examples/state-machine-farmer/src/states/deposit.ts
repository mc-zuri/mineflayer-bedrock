import { StateBehavior } from "@nxg-org/mineflayer-static-statemachine";
import mineflayerPathfinder from "mineflayer-pathfinder";
const { goals } = mineflayerPathfinder;
import type { FarmingContext } from "../context.ts";
import { SEARCH_RADIUS, DEPOSIT_THRESHOLD, HARVEST_ITEMS } from "../constants.ts";
import { needsDeposit, sleep } from "../utils/index.ts";

export class DepositState extends StateBehavior {
  name = "deposit";
  private done = false;

  get ctx(): FarmingContext | undefined {
    return this.bot.farmingContext;
  }

  isFinished(): boolean {
    return this.done;
  }

  needsDeposit(): boolean {
    return needsDeposit(this.bot);
  }

  async onStateEntered(): Promise<void> {
    this.done = false;
    if (!this.ctx) {
      this.done = true;
      return;
    }

    const itemsToDeposit = this.getItemsToDeposit();
    if (itemsToDeposit.length === 0) {
      console.log("No items to deposit");
      this.done = true;
      return;
    }

    console.log(`Depositing ${itemsToDeposit.length} item type(s)`);
    this.bot.chat(`Depositing ${itemsToDeposit.map(i => i.name).join(", ")}`);

    try {
      await this.depositToChest(itemsToDeposit);
    } catch (err) {
      console.log("Chest error:", err);
    } finally {
      this.done = true;
    }
  }

  private getItemsToDeposit(): { type: number; name: string; count: number }[] {
    const allItems = this.bot.inventory.itemsRange(0, 36);
    const result: { type: number; name: string; count: number }[] = [];

    for (const itemName of HARVEST_ITEMS) {
      const itemType = this.bot.registry.itemsByName[itemName];
      if (!itemType) continue;

      let total = 0;
      for (const item of allItems) {
        if (item?.name === itemName) total += item.count;
      }

      if (total >= DEPOSIT_THRESHOLD) {
        result.push({ type: itemType.id, name: itemName, count: total });
      }
    }
    return result;
  }

  private async depositToChest(items: { type: number; name: string; count: number }[]): Promise<void> {
    const chestBlockType = this.bot.registry.blocksByName["chest"];
    if (!chestBlockType) return;

    const chestBlock = this.bot.findBlock({
      matching: chestBlockType.id,
      maxDistance: SEARCH_RADIUS,
    });

    if (!chestBlock) {
      console.log("No chest found");
      return;
    }

    const goal = new goals.GoalNear(chestBlock.position.x, chestBlock.position.y, chestBlock.position.z, 3);
    await this.bot.pathfinder.goto(goal);

    this.bot.setQuickBarSlot(8);
    await sleep(100);

    const window = await this.bot.openBlock(chestBlock) as unknown as { deposit: (type: number, metadata: null, count: number) => Promise<void> };

    for (const item of items) {
      try {
        await window.deposit(item.type, null, item.count);
        console.log(`Deposited ${item.count} ${item.name}`);
      } catch (err) {
        console.log(`Deposit error ${item.name}:`, err);
      }
    }

    await this.bot.closeWindow(window as unknown as Parameters<typeof this.bot.closeWindow>[0]);
    this.bot.chat("Deposit complete!");
  }
}
