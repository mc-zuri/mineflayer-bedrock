import * as os from 'os';

export const VERSION = '1.21.130';
const isWindows = os.platform() === 'win32';
export const BDS_PATH = process.env.BDS_PATH || (isWindows ? `c:/apps/bds-${VERSION}` : `${os.homedir()}/apps/bds-${VERSION}`);

export const FARM_BASE_X = 20;
export const FARM_BASE_Y = -1;
export const FARM_BASE_Z = 20;
export const FARM_SIZE = 8;

const HYDRATION_RADIUS = 8;

export function getWaterPositions(size: number): [number, number][] {
  const positions: [number, number][] = [];
  for (let x = -size; x <= size; x += HYDRATION_RADIUS) {
    for (let z = -size; z <= size; z += HYDRATION_RADIUS) {
      positions.push([x, z]);
    }
  }
  return positions;
}

export const STARTING_ITEMS = [
  { name: 'beetroot_seeds', count: 64 },
  { name: 'carrot', count: 64 },
  { name: 'potato', count: 64 },
  { name: 'wheat_seeds', count: 64 },
  { name: 'oak_sapling', count: 30 },
  { name: 'netherite_axe', count: 2 },
  { name: 'dirt', count: 128 },
];
