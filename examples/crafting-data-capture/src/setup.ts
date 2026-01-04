import { giveItem, setBlock, teleportPlayer, type ExternalServer } from 'minecraft-bedrock-test-server';
import {
  SPAWN_POS,
  CRAFTING_TABLE_POS,
  CHEST_POS,
  CRAFTING_ITEMS,
} from './config.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Set up the world for crafting packet capture.
 * Creates a flat area with crafting table, chest with items, and gives items to player.
 */
export async function setupCraftingWorld(server: ExternalServer, playerName: string): Promise<void> {
  console.log('Setting up crafting test world...');

  // Create flat platform
  const { x, y, z } = SPAWN_POS;
  await server.sendCommand(`fill ${x - 5} ${y - 1} ${z - 5} ${x + 5} ${y - 1} ${z + 5} stone`);
  await server.sendCommand(`fill ${x - 5} ${y} ${z - 5} ${x + 5} ${y + 3} ${z + 5} air`);
  await sleep(200);

  // Teleport player to spawn
  await teleportPlayer(server, playerName, x, y + 1, z);
  await sleep(300);

  // Place crafting table
  await setBlock(server, CRAFTING_TABLE_POS.x, CRAFTING_TABLE_POS.y, CRAFTING_TABLE_POS.z, 'crafting_table');
  console.log(`  Placed crafting table at ${CRAFTING_TABLE_POS.x}, ${CRAFTING_TABLE_POS.y}, ${CRAFTING_TABLE_POS.z}`);

  // Place chest
  await setBlock(server, CHEST_POS.x, CHEST_POS.y, CHEST_POS.z, 'chest');
  console.log(`  Placed chest at ${CHEST_POS.x}, ${CHEST_POS.y}, ${CHEST_POS.z}`);

  // Place furnace for smelting tests
  await setBlock(server, CHEST_POS.x, CHEST_POS.y, CHEST_POS.z + 1, 'furnace');
  console.log(`  Placed furnace at ${CHEST_POS.x}, ${CHEST_POS.y}, ${CHEST_POS.z + 1}`);

  // Place anvil for repair/rename tests
  await setBlock(server, CRAFTING_TABLE_POS.x, CRAFTING_TABLE_POS.y, CRAFTING_TABLE_POS.z + 1, 'anvil');
  console.log(`  Placed anvil at ${CRAFTING_TABLE_POS.x}, ${CRAFTING_TABLE_POS.y}, ${CRAFTING_TABLE_POS.z + 1}`);

  // Place stonecutter
  await setBlock(server, CRAFTING_TABLE_POS.x + 1, CRAFTING_TABLE_POS.y, CRAFTING_TABLE_POS.z, 'stonecutter_block');
  console.log(`  Placed stonecutter`);

  // Place smithing table
  await setBlock(server, CRAFTING_TABLE_POS.x + 1, CRAFTING_TABLE_POS.y, CRAFTING_TABLE_POS.z + 1, 'smithing_table');
  console.log(`  Placed smithing table`);

  // Place grindstone
  await setBlock(server, CHEST_POS.x - 1, CHEST_POS.y, CHEST_POS.z, 'grindstone');
  console.log(`  Placed grindstone`);

  // Place loom
  await setBlock(server, CHEST_POS.x - 1, CHEST_POS.y, CHEST_POS.z + 1, 'loom');
  console.log(`  Placed loom`);

  await sleep(200);

  // Give items to player
  console.log('  Giving crafting materials to player...');
  for (const item of CRAFTING_ITEMS) {
    await giveItem(server, playerName, item.name, item.count);
    await sleep(50);
  }

  // Fill chest with extra items
  console.log('  Filling chest with extra materials...');
  const chestItems = [
    'oak_planks 64',
    'birch_planks 64',
    'iron_ingot 64',
    'gold_ingot 32',
    'diamond 32',
    'emerald 16',
    'netherite_ingot 8',
    'copper_ingot 64',
  ];
  for (const item of chestItems) {
    await server.sendCommand(`replaceitem block ${CHEST_POS.x} ${CHEST_POS.y} ${CHEST_POS.z} slot.container ${chestItems.indexOf(item)} ${item}`);
    await sleep(50);
  }

  await sleep(500);
  console.log('Crafting world setup complete!');
  console.log('\nWorkstations available:');
  console.log('  - Crafting Table (3x3 crafting)');
  console.log('  - Furnace (smelting)');
  console.log('  - Anvil (repair/rename)');
  console.log('  - Stonecutter (stone cutting)');
  console.log('  - Smithing Table (upgrades)');
  console.log('  - Grindstone (disenchanting)');
  console.log('  - Loom (banners)');
}
