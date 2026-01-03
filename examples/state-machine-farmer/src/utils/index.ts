import type { Bot } from 'mineflayer';
import type { Vec3 } from 'vec3';
import { SEARCH_RADIUS, DEPOSIT_THRESHOLD, HARVEST_ITEMS, CROP_BLOCKS, LOG_BLOCKS, MAX_CROP_GROWTH } from '../constants.ts';

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export function needsDeposit(bot: Bot): boolean {
  const allItems = bot.inventory.itemsRange(0, 36);
  for (const itemName of HARVEST_ITEMS) {
    let count = 0;
    for (const item of allItems) {
      if (item?.name === itemName) count += item.count;
    }
    if (count >= DEPOSIT_THRESHOLD) return true;
  }
  return false;
}

export function hasTree(bot: Bot): boolean {
  for (const logName of LOG_BLOCKS) {
    const blockType = bot.registry.blocksByName[logName];
    if (!blockType) continue;
    const found = bot.findBlock({
      matching: blockType.id,
      maxDistance: SEARCH_RADIUS,
    });
    if (found) return true;
  }
  return false;
}

export function findMatureCrop(bot: Bot): Vec3 | null {
  for (const cropName of CROP_BLOCKS) {
    const blockType = bot.registry.blocksByName[cropName];
    if (!blockType) continue;

    const found = bot.findBlocks({
      matching: blockType.id,
      maxDistance: SEARCH_RADIUS,
      count: 1,
    });

    for (const pos of found) {
      const block = bot.blockAt(pos);
      // @ts-ignore - Bedrock specific property
      if (block && block._properties?.growth === MAX_CROP_GROWTH) {
        return pos;
      }
    }
  }
  return null;
}

export function findEmptyFarmland(bot: Bot): Vec3 | null {
  const farmlandType = bot.registry.blocksByName['farmland'];
  if (!farmlandType) return null;

  const found = bot.findBlocks({
    matching: farmlandType.id,
    maxDistance: SEARCH_RADIUS,
    count: 64,
  });

  for (const pos of found) {
    const blockAbove = bot.blockAt(pos.offset(0, 1, 0));
    if (blockAbove && blockAbove.name === 'air') {
      return pos;
    }
  }
  return null;
}

interface TreeBase {
  pos: Vec3;
  name: string;
}

export function findTreeBase(bot: Bot): TreeBase | null {
  let result: TreeBase | null = null;
  let lowestY = Infinity;

  for (const logName of LOG_BLOCKS) {
    const blockType = bot.registry.blocksByName[logName];
    if (!blockType) continue;

    const found = bot.findBlocks({
      matching: blockType.id,
      maxDistance: SEARCH_RADIUS,
      count: 64,
    });

    for (const pos of found) {
      if (pos.y < lowestY) {
        lowestY = pos.y;
        result = { pos, name: logName };
      }
    }
  }
  return result;
}

export function getNeighborPositions(pos: Vec3): Vec3[] {
  return [
    pos.offset(0, 1, 0),
    pos.offset(0, -1, 0),
    pos.offset(1, 0, 0),
    pos.offset(-1, 0, 0),
    pos.offset(0, 0, 1),
    pos.offset(0, 0, -1),
    pos.offset(1, 0, 1),
    pos.offset(1, 0, -1),
    pos.offset(-1, 0, 1),
    pos.offset(-1, 0, -1),
    pos.offset(1, 1, 0),
    pos.offset(-1, 1, 0),
    pos.offset(0, 1, 1),
    pos.offset(0, 1, -1),
    pos.offset(1, 1, 1),
    pos.offset(1, 1, -1),
    pos.offset(-1, 1, 1),
    pos.offset(-1, 1, -1),
  ];
}

export function posToKey(pos: Vec3): string {
  return `${pos.x},${pos.y},${pos.z}`;
}
