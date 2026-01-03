export const SEARCH_RADIUS = 32;
export const DEPOSIT_THRESHOLD = 128;
export const MAX_CROP_GROWTH = 7;
export const MIN_TREE_SPACING = 5;
export const MIN_VERTICAL_SPACE = 6;
export const MAX_EXTRA_SAPLINGS_PER_CYCLE = 10;

export const HARVEST_ITEMS = ['wheat', 'wheat_seeds', 'carrot', 'potato', 'beetroot', 'beetroot_seeds'];

export const CROP_BLOCKS = ['wheat', 'carrots', 'potatoes', 'beetroot'];

export const LOG_BLOCKS = ['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log'];

export const LEAF_BLOCKS = ['oak_leaves', 'birch_leaves', 'spruce_leaves', 'jungle_leaves', 'acacia_leaves', 'dark_oak_leaves', 'azalea_leaves', 'azalea_leaves_flowered'];

export const TREE_BLOCKS = [...LOG_BLOCKS, ...LEAF_BLOCKS];

export const SAPLING_BLOCKS = ['oak_sapling', 'birch_sapling', 'spruce_sapling', 'jungle_sapling', 'acacia_sapling', 'dark_oak_sapling'];

export const PLANTABLE_GROUND = ['dirt', 'grass_block', 'grass', 'podzol', 'coarse_dirt', 'rooted_dirt', 'moss_block', 'mud'];

export const LOG_TO_SAPLING: Record<string, string> = {
  oak_log: 'oak_sapling',
  birch_log: 'birch_sapling',
  spruce_log: 'spruce_sapling',
  jungle_log: 'jungle_sapling',
  acacia_log: 'acacia_sapling',
  dark_oak_log: 'dark_oak_sapling',
};

export const CROP_TO_SEED: Record<string, string> = {
  wheat: 'wheat_seeds',
  carrots: 'carrot',
  potatoes: 'potato',
  beetroot: 'beetroot_seeds',
};

export const SEED_TYPES = ['wheat_seeds', 'carrot', 'potato', 'beetroot_seeds'];

export const AXE_TYPES = ['netherite_axe', 'diamond_axe', 'iron_axe', 'golden_axe', 'stone_axe', 'wooden_axe'];
