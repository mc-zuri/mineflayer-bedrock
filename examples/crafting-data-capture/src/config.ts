/**
 * Configuration for crafting data capture example
 */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const VERSION = '1.21.130';

// BDS path - will auto-download if not present
export const BDS_PATH = join(__dirname, '..', 'bds');

// Server settings
export const HOST = '0.0.0.0';
export const PORT = 19192;

// World setup positions
export const SPAWN_POS = { x: 0, y: 4, z: 0 };
export const CRAFTING_TABLE_POS = { x: 2, y: 4, z: 0 };
export const CHEST_POS = { x: -2, y: 4, z: 0 };

// Items to give for crafting tests
export const CRAFTING_ITEMS = [
  // Wood crafting chain
  { name: 'oak_log', count: 64 },
  { name: 'birch_log', count: 32 },
  { name: 'spruce_log', count: 32 },

  // Stone crafting chain
  { name: 'cobblestone', count: 64 },
  { name: 'stone', count: 32 },

  // Iron crafting
  { name: 'iron_ingot', count: 32 },
  { name: 'stick', count: 64 },

  // Diamond crafting
  { name: 'diamond', count: 16 },

  // Misc crafting materials
  { name: 'coal', count: 32 },
  { name: 'string', count: 16 },
  { name: 'leather', count: 16 },
  { name: 'gold_ingot', count: 16 },
  { name: 'redstone', count: 32 },
];

// Output directory for captured logs
export const OUTPUT_DIR = join(__dirname, '..', 'temp', 'crafting-capture');
