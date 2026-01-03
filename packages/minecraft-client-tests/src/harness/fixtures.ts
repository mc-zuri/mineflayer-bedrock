import type { ITestContext } from '../abstractions/test-context.ts';

/**
 * Common test fixtures and helpers.
 */

/**
 * Wait for a specific item to appear in the bot's inventory.
 */
export async function waitForItem(
  ctx: ITestContext,
  itemName: string,
  timeout = 5000
): Promise<void> {
  await ctx.bot.test.waitFor(
    () => ctx.bot.inventory.items().some((i) => i?.name === itemName),
    timeout
  );
}

/**
 * Wait for the inventory to be empty.
 */
export async function waitForEmptyInventory(
  ctx: ITestContext,
  timeout = 5000
): Promise<void> {
  await ctx.bot.test.waitFor(() => ctx.bot.inventory.items().length === 0, timeout);
}

/**
 * Get an item from the bot's inventory by name.
 */
export function getItem(ctx: ITestContext, itemName: string) {
  return ctx.bot.inventory.items().find((i) => i?.name === itemName);
}

/**
 * Count items of a specific type in the inventory.
 */
export function countItems(ctx: ITestContext, itemName: string): number {
  return ctx.bot.inventory
    .items()
    .filter((i) => i?.name === itemName)
    .reduce((sum, i) => sum + (i?.count || 0), 0);
}

/**
 * Wait for the bot to be at a specific position (within tolerance).
 */
export async function waitForPosition(
  ctx: ITestContext,
  x: number,
  y: number,
  z: number,
  tolerance = 1,
  timeout = 5000
): Promise<void> {
  const { Vec3 } = await import('vec3');
  const target = new Vec3(x, y, z);

  await ctx.bot.test.waitFor(
    () => ctx.bot.entity.position.distanceTo(target) < tolerance,
    timeout
  );
}

/**
 * Wait for a specific health value.
 */
export async function waitForHealth(
  ctx: ITestContext,
  health: number,
  timeout = 5000
): Promise<void> {
  await ctx.bot.test.waitFor(() => ctx.bot.health === health, timeout);
}

/**
 * Wait for the bot to receive a chat message matching a pattern.
 */
export function waitForChat(
  ctx: ITestContext,
  pattern: RegExp | string,
  timeout = 5000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ctx.bot.off('messagestr', handler);
      reject(new Error(`Timeout waiting for chat message matching: ${pattern}`));
    }, timeout);

    const handler = (message: string) => {
      const matches =
        typeof pattern === 'string' ? message.includes(pattern) : pattern.test(message);

      if (matches) {
        clearTimeout(timer);
        ctx.bot.off('messagestr', handler);
        resolve(message);
      }
    };

    ctx.bot.on('messagestr', handler);
  });
}
