import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';
import { waitForItem, getItem, countItems, waitForEmptyInventory } from '../src/harness/fixtures.ts';

/**
 * Inventory tests.
 * Tests that inventory operations work correctly across editions.
 */
crossEditionSuite('inventory', (getContext) => {
  it('should give items to player', async function () {
    const ctx = getContext();
    const { bot } = ctx;

    // Give diamond
    await bot.test.giveItem('diamond', 64);

    // Wait for item
    await waitForItem(ctx, 'diamond', 5000);

    // Verify item is in inventory
    const diamond = getItem(ctx, 'diamond');
    expect(diamond).toBeDefined();
    expect(diamond?.count).toBe(64);
  });

  it('should clear inventory', async function () {
    const ctx = getContext();
    const { bot } = ctx;

    // Give some items first
    await bot.test.giveItem('diamond', 32);
    await waitForItem(ctx, 'diamond', 5000);

    // Clear inventory
    await bot.test.clearInventory();

    // Verify inventory is empty
    await bot.test.wait(500);
    const items = bot.inventory.items();
    expect(items.length).toBe(0);
  });

  it('should give multiple items', async function () {
    const ctx = getContext();
    const { bot } = ctx;

    // Give multiple items
    await bot.test.giveItem('diamond', 16);
    await waitForItem(ctx, 'diamond', 5000);

    await bot.test.giveItem('iron_ingot', 32);
    await waitForItem(ctx, 'iron_ingot', 5000);

    // Verify both items are in inventory
    const diamondCount = countItems(ctx, 'diamond');
    const ironCount = countItems(ctx, 'iron_ingot');

    expect(diamondCount).toBe(16);
    expect(ironCount).toBe(32);
  });
});
