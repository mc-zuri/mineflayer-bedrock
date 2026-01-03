import { createBot, type BedrockBot, type Bot } from 'mineflayer';
import { sleep } from 'mineflayer/lib/promise_utils.js';
import mineflayerPathfinder from 'mineflayer-pathfinder';
import type { Block } from 'prismarine-block';
import { Vec3 } from 'vec3';
import { startBDSServer, ensureBDSInstalled, giveItem, setBlock, teleportPlayer, type BDSServer, getClientInventory, getServerInventory, assertInventoryMatch } from 'minecraft-bedrock-tests';
import { InventoryAnalyzer } from 'minecraft-logs-analyzers';

/** Format timestamp as yyyy-mm-dd-{seconds since midnight} */
function formatTimestamp(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const secondsSinceMidnight = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return `${yyyy}-${mm}-${dd}-${secondsSinceMidnight}`;
}

// Configuration
const SEARCH_RADIUS = 32;
const DEPOSIT_THRESHOLD = 128; // 2 full stacks
const VERSION = '1.21.130';
const BDS_PATH = `c:/apps/bds-${VERSION}`;

// Farm configuration
const FARM_BASE_X = 20;
const FARM_BASE_Y = -1;
const FARM_BASE_Z = 20;

// Crop blocks and their seed mappings
const CROP_BLOCKS = ['wheat', 'carrots', 'potatoes', 'beetroot'] as const;
const CROP_TO_SEED: Record<string, string> = {
  wheat: 'wheat_seeds',
  carrots: 'carrot',
  potatoes: 'potato',
  beetroot: 'beetroot_seeds',
};

// Items to track for deposit
const HARVEST_ITEMS = ['wheat', 'wheat_seeds', 'carrot', 'potato', 'beetroot', 'beetroot_seeds'];

// Parse command line arguments
const args = process.argv.slice(2);
const host = args[0] || '127.0.0.1';
const port = parseInt(args[1]) || 19191; // Non-standard port to avoid conflicts

// Global state
let server: BDSServer | null = null;
let bot: Bot | null = null;
let isFarming = false;

async function setupFarm(server: BDSServer, playerName: string): Promise<void> {
  console.log('Setting up farm...');

  const baseX = FARM_BASE_X;
  const baseY = FARM_BASE_Y;
  const baseZ = FARM_BASE_Z;

  // Teleport bot to farm FIRST so it receives block updates
  console.log('Teleporting bot to farm location...');
  await teleportPlayer(server, playerName, baseX - 2, baseY + 2, baseZ - 2);
  await sleep(1000); // Wait for teleport and chunk load

  // Water positions (center and corners of 9x9 grid)
  const waterPositions = [
    [0, 0],
    [-4, -4],
    [-4, 4],
    [4, -4],
    [4, 4],
  ];

  console.log('Adding water sources...');
  for (const [dx, dz] of waterPositions) {
    await setBlock(server, baseX + dx, baseY, baseZ + dz, 'water');
  }

  // First, set farmland for all positions in 9x9 grid (excluding water)
  console.log('Creating farmland...');
  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      const isWater = waterPositions.some(([wx, wz]) => wx === dx && wz === dz);
      if (!isWater) {
        await setBlock(server, baseX + dx, baseY, baseZ + dz, 'farmland');
      }
    }
  }

  // Set water blocks

  // Plant crops on farmland at Y=0 (one above farmland)
  // Quadrants: NW=carrots, NE=potatoes, SW=wheat, SE=beetroot
  console.log('Planting crops...');
  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      const isWater = waterPositions.some(([wx, wz]) => wx === dx && wz === dz);
      if (isWater) continue;

      let cropType: string;
      if (dx < 0 && dz < 0) {
        cropType = 'carrots';
      } else if (dx > 0 && dz < 0) {
        cropType = 'potatoes';
      } else if (dx < 0 && dz > 0) {
        cropType = 'wheat';
      } else {
        cropType = 'beetroot';
      }

      // Use setblock command with growth state 7 (fully grown)
      await server.sendCommand(`setblock ${baseX + dx} ${baseY + 1} ${baseZ + dz} ${cropType} ["growth"=7]`);
    }
  }

  // Place chest for deposits
  console.log('Placing chest...');
  await setBlock(server, baseX, baseY + 1, baseZ - 5, 'chest');

  // Give bot seeds and tools
  console.log('Giving items to bot...');
  await giveItem(server, playerName, 'carrot', 64);
  await giveItem(server, playerName, 'potato', 64);
  await giveItem(server, playerName, 'wheat_seeds', 64);
  await giveItem(server, playerName, 'beetroot_seeds', 64);
  //await giveItem(server, playerName, "diamond_hoe", 1);

  console.log('Farm setup complete!');
}

function isFullyGrown(block: Block): boolean {
  if (!CROP_BLOCKS.includes(block.name as (typeof CROP_BLOCKS)[number])) return false;
  return block?._properties?.growth === 7;
}

function findFullyGrownCrops(): Vec3[] {
  if (!bot) return [];
  const positions: Vec3[] = [];

  for (const cropName of CROP_BLOCKS) {
    const blockType = bot.registry.blocksByName[cropName];
    if (!blockType) continue;

    // Use block ID matching instead of function to avoid V8 closure issues
    const found = bot.findBlocks({
      matching: blockType.id,
      maxDistance: SEARCH_RADIUS,
      count: 64,
    });

    // Filter for fully grown crops
    for (const pos of found) {
      const block = bot.blockAt(pos);
      if (block && isFullyGrown(block)) {
        positions.push(pos);
      }
    }
  }

  // Sort by distance
  const botPos = bot.entity.position;
  positions.sort((a, b) => a.distanceTo(botPos) - b.distanceTo(botPos));

  return positions;
}

function findAnyCrops(): Vec3[] {
  if (!bot) return [];
  const positions: Vec3[] = [];

  for (const cropName of CROP_BLOCKS) {
    const blockType = bot.registry.blocksByName[cropName];
    if (!blockType) continue;

    // Use block ID matching instead of function to avoid V8 closure issues
    const found = bot.findBlocks({
      matching: blockType.id,
      maxDistance: SEARCH_RADIUS,
      count: 64,
    });

    positions.push(...found);
  }

  return positions;
}

function getItemsToDeposit(): { type: number; name: string; count: number }[] {
  if (!bot) return [];
  const toDeposit: { type: number; name: string; count: number }[] = [];

  for (const itemName of HARVEST_ITEMS) {
    const itemType = bot.registry.itemsByName[itemName];
    if (!itemType) continue;

    const count = bot.inventory.count(itemType.id, null);
    if (count >= DEPOSIT_THRESHOLD) {
      toDeposit.push({ type: itemType.id, name: itemName, count: 64 });
    }
  }

  return toDeposit;
}

async function navigateTo(position: Vec3, range: number = 2): Promise<boolean> {
  if (!bot) return false;
  try {
    const goal = new mineflayerPathfinder.goals.GoalNear(position.x, position.y, position.z, range);
    bot.pathfinder.setGoal(goal);

    // Wait for goal to be reached or timeout
    const timeout = 30000;
    const startTime = Date.now();

    while (bot.pathfinder.isMoving()) {
      if (Date.now() - startTime > timeout) {
        bot.pathfinder.setGoal(null);
        console.log('Navigation timeout');
        return false;
      }
      await sleep(100);
    }

    return true;
  } catch (err) {
    console.log('Navigation error:', err);
    return false;
  }
}

async function harvest(cropPosition: Vec3): Promise<string | null> {
  if (!bot) return null;
  try {
    const block = bot.blockAt(cropPosition);
    if (!block || !isFullyGrown(block)) {
      return null;
    }

    const cropName = block.name;
    const seedName = CROP_TO_SEED[cropName];

    console.log(`Harvesting ${cropName} at ${cropPosition.toString()}`);

    // Navigate to crop
    if (!(await navigateTo(cropPosition, 1))) {
      return null;
    }

    // Dig the crop
    bot.packetLogger?.message?.('dig:start', {
      block: cropName,
      pos: [cropPosition.x, cropPosition.y, cropPosition.z],
    });
    await bot.dig(block);
    bot.packetLogger?.message?.('dig:done', {
      block: cropName,
      pos: [cropPosition.x, cropPosition.y, cropPosition.z],
    });
    //await sleep(300);

    // Wait for block to become air
    let attempts = 0;
    while (attempts < 10) {
      const updatedBlock = bot.blockAt(cropPosition);
      if (!updatedBlock || updatedBlock.name === 'air') break;
      await sleep(10);
      attempts++;
    }

    const finalBlock = bot.blockAt(cropPosition);
    const success = !finalBlock || finalBlock.name === 'air';
    bot.packetLogger?.message?.(success ? 'dig:success' : 'dig:failed', {
      block: cropName,
      pos: [cropPosition.x, cropPosition.y, cropPosition.z],
      finalBlock: finalBlock?.name,
      attempts,
    });

    return seedName;
  } catch (err) {
    bot.packetLogger?.message?.('dig:error', {
      pos: [cropPosition.x, cropPosition.y, cropPosition.z],
      error: String(err),
    });
    console.log('Harvest error:', err);
  }
}

async function plantSeed(farmlandPos: Vec3, seedName: string, throwOnFail: boolean = true): Promise<boolean> {
  await sleep(10);
  if (!bot) {
    const msg = 'Bot not available';
    if (throwOnFail) throw new Error(msg);
    return false;
  }

  await bot.setQuickBarSlot(((bot.heldItem?.slot ?? 0) + 1) % 5);
  await sleep(10);

  try {
    // Find seed in inventory
    const seedInInventory = bot.inventory.slots.find((s) => s?.name === seedName);
    if (!seedInInventory) {
      const msg = `No ${seedName} in inventory`;
      console.log(msg);
      if (throwOnFail) throw new Error(msg);
      return false;
    }

    // Navigate to farmland
    if (!(await navigateTo(farmlandPos, 2))) {
      const msg = `Failed to navigate to farmland at ${farmlandPos.toString()}`;
      console.log(msg);
      if (throwOnFail) throw new Error(msg);
      return false;
    }

    if (bot.heldItem?.name !== seedInInventory.name) {
      // Equip the seed
      await bot.equip(seedInInventory, 'hand');
      await sleep(10);
    }

    // Get farmland block
    const farmland = bot.blockAt(farmlandPos);

    console.log(`Farmland check: ${farmland?.name} at ${farmlandPos.toString()}`);
    console.log(`Held item: ${bot.heldItem?.name}, quickBarSlot: ${bot.quickBarSlot}`);

    if (!farmland || farmland.name !== 'farmland') {
      const msg = `NOT farmland: ${farmland?.name} at ${farmlandPos.toString()}`;
      console.log(msg);
      if (throwOnFail) throw new Error(msg);
      return false;
    }

    console.log(`Calling placeBlock on farmland at ${farmland.position.toString()}`);
    bot.packetLogger?.message?.('placeBlock:start', {
      seed: seedName,
      pos: [farmlandPos.x, farmlandPos.y, farmlandPos.z],
      heldItem: bot.heldItem?.name,
      heldCount: bot.heldItem?.count,
    });
    await bot.placeBlock(farmland, new Vec3(0, 1, 0));
    await sleep(500);

    const blockAbove = bot.blockAt(farmlandPos.offset(0, 1, 0));
    console.log(`Block above farmland after plant: ${blockAbove?.name}`);

    if (blockAbove && blockAbove.name !== 'air') {
      bot.packetLogger?.message?.('placeBlock:success', {
        seed: seedName,
        pos: [farmlandPos.x, farmlandPos.y, farmlandPos.z],
        planted: blockAbove.name,
      });
      console.log(`Planted ${seedName}!`);
      return true;
    }

    bot.packetLogger?.message?.('placeBlock:failed', {
      seed: seedName,
      pos: [farmlandPos.x, farmlandPos.y, farmlandPos.z],
      blockAbove: blockAbove?.name,
    });
    const msg = `Failed to plant ${seedName} at ${farmlandPos.toString()} - block above is ${blockAbove?.name}`;
    console.log(msg);
    if (throwOnFail) throw new Error(msg);
    return false;
  } catch (err) {
    bot.packetLogger?.message?.('placeBlock:error', {
      seed: seedName,
      pos: [farmlandPos.x, farmlandPos.y, farmlandPos.z],
      error: String(err),
    });
    console.log('Planting error:', err);
    if (throwOnFail) throw err;
    return false;
  }
}

async function harvestAndReplant(cropPosition: Vec3): Promise<boolean> {
  const seedName = await harvest(cropPosition);
  if (!seedName) return false;

  const farmlandPos = cropPosition.offset(0, -1, 0);
  await plantSeed(farmlandPos, seedName, true);
  return true;
}

async function depositToChest(itemType: number, itemName: string, count: number): Promise<boolean> {
  if (!bot) return false;
  try {
    // Find nearest chest
    const chestBlockType = bot.registry.blocksByName['chest'];
    if (!chestBlockType) {
      console.log('Chest block type not found');
      return false;
    }

    const chestBlock = bot.findBlock({
      matching: chestBlockType.id,
      maxDistance: SEARCH_RADIUS,
    });

    if (!chestBlock) {
      console.log('No chest found nearby');
      return false;
    }

    console.log(`Found chest at ${chestBlock.position.toString()}`);

    // Navigate to chest
    if (!(await navigateTo(chestBlock.position, 3))) {
      return false;
    }

    // Open chest
    const chest = await bot.openChest(chestBlock);

    // Deposit items
    try {
      await chest.deposit(itemType, null, count);
      console.log(`Deposited ${count} ${itemName}`);
    } catch (err) {
      console.log('Deposit error:', err);
    }

    // Close chest
    chest.close();

    return true;
  } catch (err) {
    console.log('Chest operation error:', err);
    return false;
  }
}

async function assertInventorySync(context: string, server: BDSServer, bot: any) {
  const serverInventory = await getServerInventory(server, bot.username);
  const clientInventory = getClientInventory(bot);
  assertInventoryMatch(clientInventory, serverInventory, context);
}

async function farmingLoop(server: BDSServer, bot: BedrockBot): Promise<void> {
  if (isFarming) return;
  isFarming = true;

  console.log('Starting farming loop...');

  while (isFarming && bot) {
    try {
      // Check if we need to deposit items
      const itemsToDeposit = getItemsToDeposit();
      if (itemsToDeposit.length > 0) {
        console.log(`Need to deposit ${itemsToDeposit.length} item type(s)`);
        for (const item of itemsToDeposit) {
          await depositToChest(item.type, item.name, item.count);
        }
      }

      // Find fully grown crops
      const crops = findFullyGrownCrops();

      console.log(`Found ${crops.length} fully grown crop(s)`);

      if (crops.length > 0) {
        const closestCrop = crops[0];
        await harvestAndReplant(closestCrop);
      } else {
        // Find farmland with air above (ready for planting)
        const blockType = bot.registry.blocksByName['farmland'];
        const found = bot.findBlocks({
          matching: blockType.id,
          maxDistance: SEARCH_RADIUS,
          count: 64,
        });

        // Find first farmland with air above
        const emptyFarmland = found.find((pos) => {
          const blockAbove = bot.blockAt(pos.offset(0, 1, 0));
          return blockAbove && blockAbove.name === 'air';
        });

        if (emptyFarmland) {
          console.log(`Found empty farmland at ${emptyFarmland.toString()}`);
          const randomCrop = CROP_BLOCKS[Math.floor(Math.random() * CROP_BLOCKS.length)];
          await plantSeed(emptyFarmland, CROP_TO_SEED[randomCrop], true);
        } else {
          console.log('No empty farmland found');
        }
      }

      // Harvest the closest one

      // } else {
      //   // Check if there are ANY crops (even growing ones)
      //   const anyCrops = findAnyCrops();

      //   if (anyCrops.length > 0) {
      //     console.log(`Found ${anyCrops.length} crop(s) still growing, waiting...`);
      //   } else {
      //     console.log('No crops found. Farm may need to be set up again.');
      //   }
      //   await sleep(5000);
      // }

      if (crops.length == 0) {
        await sleep(1000);
      }
    } catch (err) {
      console.log('Farming loop error:', err);
      process.exit();
      await sleep(1000);
    }

    //await sleep(1000);
  }
}

async function main(): Promise<void> {
  console.log(`Farmer Bot starting...`);

  // Download BDS if missing
  console.log('Ensuring BDS is installed...');
  await ensureBDSInstalled(VERSION, BDS_PATH);

  // Start BDS server
  console.log(`Starting BDS server on port ${port}...`);
  server = await startBDSServer({ port });
  console.log('BDS server started!');

  // Create bot with packet logger
  console.log(`Connecting bot to ${host}:${port}...`);
  bot = createBot({
    host,
    port,
    auth: 'offline',
    version: `bedrock_${VERSION}`,
    offline: true,
    //packetLogger: new InventoryAnalyzer(`logs/farmer-bot-${formatTimestamp()}`),
  });

  // Bot event handlers
  bot.once('inject_allowed', () => {
    if (!bot) return;
    console.log('Loading pathfinder...');
    bot.loadPlugin(mineflayerPathfinder.pathfinder);

    bot.defaultMovements = new mineflayerPathfinder.Movements(bot);
    bot.defaultMovements.canDig = false;
    bot.defaultMovements.canOpenDoors = false;
    bot.defaultMovements.allowSprinting = true;
    bot.defaultMovements.allowParkour = false;
    bot.defaultMovements.allowFreeMotion = true;

    bot.pathfinder.setMovements(bot.defaultMovements);
  });

  bot.on('error', (err) => console.error('Bot error:', err));

  bot.on('end', () => {
    console.log('Bot disconnected.');
    isFarming = false;
    bot?.close();
  });

  bot.once('spawn', async () => {
    if (!bot || !server) return;
    console.log('Bot spawned!');
    console.log(`Position: ${bot.entity.position.toString()}`);

    // Wait for chunks to load
    await bot.waitForChunksToLoad();
    console.log('Chunks loaded.');

    // Setup the farm
    await setupFarm(server, bot.username);

    // Force chunk reload by teleporting away and back
    //console.log("Reloading chunks...");
    //await sleep(3000); // Wait for all setblock commands to finish

    // Teleport far away to unload chunks
    // await teleportPlayer(server, bot.username, 1000, 100, 1000);
    // await sleep(1000);

    // Teleport back to farm
    // await teleportPlayer(server, bot.username, FARM_BASE_X - 2, FARM_BASE_Y + 2, FARM_BASE_Z - 2);
    // await sleep(2000);
    // await bot.waitForChunksToLoad();
    // console.log("Ready to start farming...");

    // Wait a bit before starting farming loop
    await sleep(10000);

    // Start the farming loop
    farmingLoop(server, bot);
  });

  // Chat command handler
  bot._client.on('text', (packet: { message: string }) => {
    if (!bot) return;
    const message = packet.message.toLowerCase();

    if (message.includes('stop')) {
      console.log('Stop command received');
      isFarming = false;
      bot.pathfinder.setGoal(null);
    } else if (message.includes('start')) {
      console.log('Start command received');
      if (!isFarming) {
        farmingLoop();
      }
    } else if (message.includes('status')) {
      console.log(`Farming: ${isFarming}`);
      console.log(`Position: ${bot.entity.position.toString()}`);

      const crops = findAnyCrops();
      console.log(`Crops nearby: ${crops.length}`);

      const grownCrops = findFullyGrownCrops();
      console.log(`Fully grown: ${grownCrops.length}`);

      const items = getItemsToDeposit();
      if (items.length > 0) {
        console.log(`Items ready to deposit: ${items.map((i) => `${i.name}(${i.count})`).join(', ')}`);
      }
    }
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  isFarming = false;

  try {
    bot?.close();
  } catch {
    // Ignore close errors
  }

  try {
    if (server) {
      console.log('Stopping BDS server...');
      await server.stop();
    }
  } catch {
    // Ignore stop errors
  }

  process.exit(0);
});

// Run main
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
