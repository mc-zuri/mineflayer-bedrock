import type { Vec3 } from 'vec3';

export interface FarmingContext {
  foundCrop: Vec3 | null;
  cropType: string | null;
  harvested: boolean;
  seedForReplant: string | null;
  farmlandPosition: Vec3 | null;
  foundFarmland: Vec3 | null;
  needsDeposit: boolean;
  itemsToDeposit: { type: number; name: string; count: number }[];
  planted: boolean;
  treeBasePosition: Vec3 | null;
  saplingType: string | null;
  lastHarvestPos: Vec3 | null;
  harvestDirection: number | null;
}

export function createFarmingContext(): FarmingContext {
  return {
    foundCrop: null,
    cropType: null,
    harvested: false,
    seedForReplant: null,
    farmlandPosition: null,
    foundFarmland: null,
    needsDeposit: false,
    itemsToDeposit: [],
    planted: false,
    treeBasePosition: null,
    saplingType: null,
    lastHarvestPos: null,
    harvestDirection: null,
  };
}

declare module 'mineflayer' {
  interface Bot {
    farmingContext?: FarmingContext;
  }
}
