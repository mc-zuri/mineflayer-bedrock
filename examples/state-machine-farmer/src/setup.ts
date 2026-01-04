import { giveItem, setBlock, teleportPlayer, type ExternalServer } from 'minecraft-bedrock-test-server';
import { FARM_BASE_X, FARM_BASE_Y, FARM_BASE_Z, FARM_SIZE, getWaterPositions, STARTING_ITEMS } from './config.ts';
import { sleep } from './utils/index.ts';

export async function setupFarm(server: ExternalServer, playerName: string): Promise<void> {
  console.log('Setting up farm...');
  const { baseX, baseY, baseZ, size } = {
    baseX: FARM_BASE_X,
    baseY: FARM_BASE_Y,
    baseZ: FARM_BASE_Z,
    size: FARM_SIZE,
  };

  await teleportPlayer(server, playerName, baseX - size - 1, baseY + 2, baseZ - size - 1);
  await sleep(500);

  await createFarmland(server, baseX, baseY, baseZ, size);
  await addWaterSources(server, baseX, baseY, baseZ, size);
  await plantCrops(server, baseX, baseY, baseZ, size);
  await removeTemporaryBlocks(server, baseX, baseY, baseZ, size);

  for (const item of STARTING_ITEMS) {
    await giveItem(server, playerName, item.name, item.count);
  }

  await setBlock(server, baseX, baseY + 1, baseZ - size - 2, 'chest');
  await placeTree(server, baseX - size - 3, baseY, baseZ);
  await placeTree(server, baseX + size + 3, baseY, baseZ);

  await sleep(2000);
  console.log('Farm setup complete!');
}

async function createFarmland(server: ExternalServer, x: number, y: number, z: number, size: number): Promise<void> {
  await server.sendCommand(`fill ${x - size} ${y} ${z - size} ${x + size} ${y} ${z + size} farmland`);
  await sleep(100);
}

async function addWaterSources(server: ExternalServer, x: number, y: number, z: number, size: number): Promise<void> {
  for (const [dx, dz] of getWaterPositions(size)) {
    await server.sendCommand(`setblock ${x + dx} ${y} ${z + dz} water`);
    await server.sendCommand(`setblock ${x + dx} ${y} ${z + dz} stone_slab ["stone_slab_type"="smooth_stone","top_slot_bit"=true]`);
    await server.sendCommand(`setblock ${x + dx} ${y + 1} ${z + dz} glass`);
  }
  await sleep(100);
}

async function removeTemporaryBlocks(server: ExternalServer, x: number, y: number, z: number, size: number): Promise<void> {
  for (const [dx, dz] of getWaterPositions(size)) {
    await server.sendCommand(`setblock ${x + dx} ${y + 1} ${z + dz} air`);
  }
  await sleep(100);
}

async function plantCrops(server: ExternalServer, x: number, y: number, z: number, size: number): Promise<void> {
  const crops = [
    { name: 'carrots', x1: x - size, z1: z - size, x2: x - 1, z2: z - 1 },
    { name: 'potatoes', x1: x + 1, z1: z - size, x2: x + size, z2: z - 1 },
    { name: 'wheat', x1: x - size, z1: z + 1, x2: x - 1, z2: z + size },
    { name: 'beetroot', x1: x + 1, z1: z + 1, x2: x + size, z2: z + size },
    { name: 'wheat', x1: x, z1: z - size, x2: x, z2: z - 1 },
    { name: 'carrots', x1: x, z1: z + 1, x2: x, z2: z + size },
    { name: 'potatoes', x1: x - size, z1: z, x2: x - 1, z2: z },
    { name: 'beetroot', x1: x + 1, z1: z, x2: x + size, z2: z },
  ];
  for (const c of crops) {
    await server.sendCommand(`fill ${c.x1} ${y + 1} ${c.z1} ${c.x2} ${y + 1} ${c.z2} ${c.name} ["growth"=7] replace air`);
  }
  await sleep(100);
}

async function placeTree(server: ExternalServer, x: number, y: number, z: number): Promise<void> {
  await setBlock(server, x, y, z, 'dirt');
  for (let i = 1; i <= 3; i++) {
    await server.sendCommand(`setblock ${x} ${y + i} ${z} oak_log`);
  }
  await server.sendCommand(`setblock ${x} ${y + 4} ${z} oak_leaves`);
}
