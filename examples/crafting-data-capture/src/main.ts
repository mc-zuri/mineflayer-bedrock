import bedrockProtocol, { type Player, type Version } from 'bedrock-protocol';
const { Relay } = bedrockProtocol;

import { startExternalServer, ensureBDSInstalled, type ExternalServer } from 'minecraft-bedrock-test-server';
import { CraftingAnalyzer, InventoryAnalyzer } from 'minecraft-logs-analyzers';
import { PacketDumpWriter } from 'minecraft-bedrock-test-server';
import * as fs from 'fs';
import * as readline from 'readline';
import { VERSION, BDS_PATH, HOST, PORT, OUTPUT_DIR } from './config.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ============================================================================
// Workstation Scenarios
// ============================================================================

interface Scenario {
  name: string;
  items: string[];
  steps: string[];
}

interface Workstation {
  name: string;
  block: string;
  position: { x: number; z: number };
  scenarios: Scenario[];
}

// --- CRAFTING TABLE ---
const craftingTable: Workstation = {
  name: 'CRAFTING TABLE',
  block: 'crafting_table',
  position: { x: 0, z: 2 },
  scenarios: [
    {
      name: 'Craft Planks',
      items: ['oak_log 8'],
      steps: ['Open crafting table', 'Put oak logs in grid', 'Take oak planks'],
    },
    {
      name: 'Craft Sticks',
      items: ['oak_planks 8'],
      steps: ['Open crafting table', 'Put 2 planks vertically', 'Take sticks'],
    },
    {
      name: 'Craft Iron Pickaxe',
      items: ['iron_ingot 8', 'stick 8'],
      steps: ['Open crafting table', 'Place 3 iron on top row', 'Place 2 sticks below center', 'Take pickaxe'],
    },
  ],
};

// --- FURNACE ---
const furnace: Workstation = {
  name: 'FURNACE',
  block: 'furnace',
  position: { x: 4, z: 2 },
  scenarios: [
    {
      name: 'Smelt Iron',
      items: ['raw_iron 8', 'coal 8'],
      steps: ['Open furnace', 'Put coal in fuel slot', 'Put raw iron in input', 'Wait and take iron ingot'],
    },
    {
      name: 'Cook Beef',
      items: ['beef 8', 'coal 8'],
      steps: ['Open furnace', 'Put coal in fuel slot', 'Put beef in input', 'Wait and take steak'],
    },
  ],
};

// --- STONECUTTER ---
const stonecutter: Workstation = {
  name: 'STONECUTTER',
  block: 'stonecutter_block',
  position: { x: 8, z: 2 },
  scenarios: [
    {
      name: 'Cut Stone to Bricks',
      items: ['stone 16'],
      steps: ['Open stonecutter', 'Put stone in input', 'Select stone bricks', 'Take result'],
    },
    {
      name: 'Cut Stone to Slabs',
      items: ['stone 16'],
      steps: ['Open stonecutter', 'Put stone in input', 'Select stone slab', 'Take result'],
    },
  ],
};

// --- SMITHING TABLE ---
const smithingTable: Workstation = {
  name: 'SMITHING TABLE',
  block: 'smithing_table',
  position: { x: 0, z: 6 },
  scenarios: [
    {
      name: 'Upgrade to Netherite Pickaxe',
      items: ['netherite_upgrade_smithing_template 1', 'diamond_pickaxe 1', 'netherite_ingot 1'],
      steps: ['Open smithing table', 'Put template in slot 1', 'Put diamond pickaxe in slot 2', 'Put netherite ingot in slot 3', 'Take netherite pickaxe'],
    },
    {
      name: 'Upgrade to Netherite Sword',
      items: ['netherite_upgrade_smithing_template 1', 'diamond_sword 1', 'netherite_ingot 1'],
      steps: ['Open smithing table', 'Put template in slot 1', 'Put diamond sword in slot 2', 'Put netherite ingot in slot 3', 'Take netherite sword'],
    },
  ],
};

// --- ANVIL ---
const anvil: Workstation = {
  name: 'ANVIL',
  block: 'anvil',
  position: { x: 4, z: 6 },
  scenarios: [
    {
      name: 'Rename Item',
      items: ['diamond_pickaxe 1'],
      steps: ['Open anvil', 'Put pickaxe in left slot', 'Type new name', 'Take renamed item'],
    },
    {
      name: 'Repair Item',
      items: ['iron_sword 1', 'iron_ingot 4'],
      steps: ['Open anvil', 'Put damaged sword in left slot', 'Put iron ingots in right slot', 'Take repaired sword'],
    },
  ],
};

// --- GRINDSTONE ---
const grindstone: Workstation = {
  name: 'GRINDSTONE',
  block: 'grindstone',
  position: { x: 8, z: 6 },
  scenarios: [
    {
      name: 'Disenchant Sword',
      items: [], // Given via special command
      steps: ['Take enchanted sword from inventory', 'Open grindstone', 'Put sword in top slot', 'Take disenchanted sword + XP'],
    },
    {
      name: 'Disenchant Pickaxe',
      items: [], // Given via special command
      steps: ['Take enchanted pickaxe from inventory', 'Open grindstone', 'Put pickaxe in top slot', 'Take disenchanted pickaxe + XP'],
    },
  ],
};

// --- LOOM ---
const loom: Workstation = {
  name: 'LOOM',
  block: 'loom',
  position: { x: 0, z: 10 },
  scenarios: [
    {
      name: 'Apply Stripe Pattern',
      items: ['banner 2 0', 'red_dye 4'], // banner data 0 = white
      steps: ['Open loom', 'Put banner in banner slot', 'Put dye in dye slot', 'Select stripe pattern', 'Take result'],
    },
    {
      name: 'Apply Cross Pattern',
      items: ['banner 2 0', 'blue_dye 4'], // banner data 0 = white
      steps: ['Open loom', 'Put banner in banner slot', 'Put dye in dye slot', 'Select cross pattern', 'Take result'],
    },
  ],
};

// --- CARTOGRAPHY TABLE ---
const cartographyTable: Workstation = {
  name: 'CARTOGRAPHY TABLE',
  block: 'cartography_table',
  position: { x: 4, z: 10 },
  scenarios: [
    {
      name: 'Clone Map',
      items: ['paper 4'], // map given via command
      steps: ['Open cartography table', 'Put filled map in top slot', 'Put empty map in bottom slot', 'Take cloned map'],
    },
    {
      name: 'Extend Map',
      items: ['paper 4'], // map given via command
      steps: ['Open cartography table', 'Put map in top slot', 'Put paper in bottom slot', 'Take extended map'],
    },
    {
      name: 'Lock Map',
      items: ['glass_pane 4'], // map given via command
      steps: ['Open cartography table', 'Put map in top slot', 'Put glass pane in bottom slot', 'Take locked map'],
    },
  ],
};

// --- BREWING STAND ---
const brewingStand: Workstation = {
  name: 'BREWING STAND',
  block: 'brewing_stand',
  position: { x: 8, z: 10 },
  scenarios: [
    {
      name: 'Brew Awkward Potion',
      items: ['blaze_powder 4', 'nether_wart 4', 'glass_bottle 3'],
      steps: ['Open brewing stand', 'Put blaze powder in fuel', 'Put water bottles in slots', 'Put nether wart in ingredient', 'Wait and take awkward potions'],
    },
    {
      name: 'Brew Speed Potion',
      items: ['blaze_powder 4', 'sugar 4', 'potion 3 4'], // potion data 4 = awkward
      steps: ['Open brewing stand', 'Put awkward potions in slots', 'Put sugar in ingredient', 'Wait and take speed potions'],
    },
  ],
};

// --- ENCHANTING TABLE ---
const enchantingTable: Workstation = {
  name: 'ENCHANTING TABLE',
  block: 'enchanting_table',
  position: { x: 4, z: 16 },
  scenarios: [
    {
      name: 'Enchant Sword Level 1',
      items: ['diamond_sword 1', 'lapis_lazuli 8'],
      steps: ['Open enchanting table', 'Put sword in left slot', 'Put lapis in right slot', 'Select level 1 enchant', 'Take enchanted sword'],
    },
    {
      name: 'Enchant Pickaxe Level 3',
      items: ['diamond_pickaxe 1', 'lapis_lazuli 16'],
      steps: ['Open enchanting table', 'Put pickaxe in left slot', 'Put lapis in right slot', 'Select level 3 enchant', 'Take enchanted pickaxe'],
    },
  ],
};

// --- BEACON ---
const beacon: Workstation = {
  name: 'BEACON',
  block: 'beacon',
  position: { x: 4, z: -4 },
  scenarios: [
    {
      name: 'Activate Speed Effect',
      items: ['iron_ingot 8'],
      steps: ['Open beacon', 'Put iron ingot in payment slot', 'Select Speed effect', 'Click checkmark'],
    },
    {
      name: 'Activate Haste Effect',
      items: ['gold_ingot 8'],
      steps: ['Open beacon', 'Put gold ingot in payment slot', 'Select Haste effect', 'Click checkmark'],
    },
  ],
};

// --- BED ---
// Bed placement scenarios testing all directions
// Player rotation: 0=South, 90=West, 180=North, -90/270=East
const bed: Workstation = {
  name: 'BED',
  block: 'air', // No pre-placed block, player places beds
  position: { x: 12, z: 2 },
  scenarios: [
    {
      name: 'Place Bed Facing South',
      items: ['bed 4 0'], // Red bed (data 0)
      steps: ['Face South (toward +Z)', 'Place bed on ground', 'Sleep in bed', 'Wake up'],
    },
    {
      name: 'Place Bed Facing North',
      items: ['bed 4 0'],
      steps: ['Face North (toward -Z)', 'Place bed on ground', 'Sleep in bed', 'Wake up'],
    },
    {
      name: 'Place Bed Facing East',
      items: ['bed 4 0'],
      steps: ['Face East (toward +X)', 'Place bed on ground', 'Sleep in bed', 'Wake up'],
    },
    {
      name: 'Place Bed Facing West',
      items: ['bed 4 0'],
      steps: ['Face West (toward -X)', 'Place bed on ground', 'Sleep in bed', 'Wake up'],
    },
    {
      name: 'Sleep From Foot (South Bed)',
      items: [],
      steps: ['Bed already placed (facing South)', 'You are at the FOOT end', 'Right-click bed to sleep', 'Wake up'],
    },
    {
      name: 'Sleep From Side (South Bed)',
      items: [],
      steps: ['Bed already placed (facing South)', 'You are at the SIDE', 'Right-click bed to sleep', 'Wake up'],
    },
  ],
};

// --- FISHING ---
// Fishing scenarios - requires water and fishing rod
const fishing: Workstation = {
  name: 'FISHING',
  block: 'air', // Water will be placed by setupWorld
  position: { x: 20, z: 2 },
  scenarios: [
    {
      name: 'Cast and Catch Fish',
      items: ['fishing_rod 1'],
      steps: ['Face the water', 'Right-click to cast rod', 'Wait for bobber to dip', 'Right-click to reel in', 'Repeat 3 times'],
    },
    {
      name: 'Cast and Cancel',
      items: ['fishing_rod 1'],
      steps: ['Face the water', 'Right-click to cast rod', 'Right-click immediately to cancel', 'Repeat 2 times'],
    },
    {
      name: 'Catch Multiple Fish',
      items: ['fishing_rod 1'],
      steps: ['Cast and catch fish', 'Keep fishing until rod breaks or 5 catches'],
    },
  ],
};

// --- VILLAGER ---
// Villager trading scenarios
// Note: Villager trades often cost many emeralds, so we give stacks
// Items given via special handling in giveScenarioItems (multiple stacks)
const villager: Workstation = {
  name: 'VILLAGER',
  block: 'air', // Villager will be spawned by setupWorld
  position: { x: 24, z: 2 },
  scenarios: [
    {
      name: 'Open Trade Window',
      items: [], // Given via special handling
      steps: ['Walk up to villager', 'Right-click to open trade window', 'Browse trades', 'Close trade window'],
    },
    {
      name: 'Execute Simple Trade',
      items: [], // Given via special handling
      steps: ['Open trade window', 'Find paper trade (Librarian)', 'Put paper in input slot', 'Take emeralds from output', 'Close window'],
    },
    {
      name: 'Execute Multiple Trades',
      items: [], // Given via special handling
      steps: ['Open trade window', 'Trade paper for emeralds', 'Trade emeralds for bookshelf/enchanted book', 'Repeat 3 times', 'Close window'],
    },
    {
      name: 'Trade with Different Villager',
      items: [], // Given via special handling
      steps: ['Talk to armorer villager', 'Trade coal/iron for emeralds', 'Trade emeralds for iron armor', 'Close window'],
    },
  ],
};

// --- BOOK ---
// Book editing and lectern scenarios
const book: Workstation = {
  name: 'BOOK',
  block: 'lectern',
  position: { x: 28, z: 2 },
  scenarios: [
    {
      name: 'Write in Book',
      items: ['writable_book 1'],
      steps: ['Hold book and quill', 'Right-click to open', 'Type some text', 'Add pages', 'Close book'],
    },
    {
      name: 'Sign Book',
      items: ['writable_book 1'],
      steps: ['Hold book and quill', 'Write some content', 'Click Sign button', 'Enter title', 'Confirm signing'],
    },
    {
      name: 'Place Book on Lectern',
      items: ['writable_book 1'],
      steps: ['Hold book and quill', 'Write something and SIGN it', 'Right-click lectern to place signed book', 'Read pages', 'Take book back'],
    },
    {
      name: 'Read Lectern Book',
      items: [],
      steps: ['Book already on lectern', 'Right-click to read', 'Turn pages', 'Close lectern'],
    },
  ],
};

// --- PLACE BLOCK ---
// Block placement scenarios for various block types
const placeBlock: Workstation = {
  name: 'PLACE BLOCK',
  block: 'air', // No pre-placed block
  position: { x: 32, z: 2 },
  scenarios: [
    {
      name: 'Place Stone Blocks',
      items: ['stone 16'],
      steps: ['Place stone blocks in a row', 'Place some vertically', 'Break one block'],
    },
    {
      name: 'Place and Edit Sign',
      items: ['oak_sign 4'],
      steps: ['Place a sign on ground', 'Enter text on sign', 'Place sign on wall', 'Enter different text'],
    },
    {
      name: 'Place Container Blocks',
      items: ['chest 2', 'barrel 2'],
      steps: ['Place a chest', 'Place another chest next to it (double chest)', 'Place a barrel', 'Open and close each'],
    },
    {
      name: 'Place Redstone Components',
      items: ['lever 2', 'stone_button 2', 'redstone_lamp 2', 'stone 4'],
      steps: ['Place redstone lamp', 'Place lever ON lamp', 'Flip lever on/off', 'Place stone block next to lamp', 'Place button ON stone block', 'Press button'],
    },
  ],
};

// --- PLACE ENTITY ---
// Entity placement scenarios for boats, minecarts, armor stands, etc.
const placeEntity: Workstation = {
  name: 'PLACE ENTITY',
  block: 'air',
  position: { x: 36, z: 2 },
  scenarios: [
    {
      name: 'Place Boat',
      items: ['oak_boat 2'],
      steps: ['Place boat on water/ground', 'Enter boat (right-click)', 'Exit boat (sneak)', 'Break boat (hit 3-4 times)'],
    },
    {
      name: 'Place Minecart',
      items: ['minecart 2', 'rail 8'],
      steps: ['Place rail tracks', 'Place minecart on rail', 'Push minecart', 'Break minecart (hit 3-4 times)'],
    },
    {
      name: 'Place Armor Stand',
      items: ['armor_stand 2', 'diamond_helmet 1', 'diamond_chestplate 1'],
      steps: ['Place armor stand', 'Put helmet on stand', 'Put chestplate on stand', 'Break armor stand (hit 2 times)'],
    },
    {
      name: 'Place Item Frame',
      items: ['frame 4', 'diamond_sword 1', 'diamond 1'],
      steps: ['Place frame on wall', 'Put sword in frame (right-click)', 'Rotate item (right-click)', 'Hit frame to drop item, hit again to break'],
    },
  ],
};

// --- CREATIVE ---
// Creative mode inventory scenarios
const creative: Workstation = {
  name: 'CREATIVE',
  block: 'air',
  position: { x: 40, z: 2 },
  scenarios: [
    {
      name: 'Pick Items from Creative',
      items: [], // Creative mode - no items given
      steps: ['Open creative inventory (E)', 'Search for diamond', 'Pick diamond block', 'Pick diamond sword', 'Close inventory'],
    },
    {
      name: 'Place and Destroy Blocks',
      items: [],
      steps: ['Pick stone from creative', 'Place several blocks', 'Instantly break blocks (left-click)', 'Pick different block and place'],
    },
    {
      name: 'Move Items in Inventory',
      items: [],
      steps: ['Open creative inventory', 'Pick several different items', 'Open survival inventory tab', 'Move items between slots', 'Drop items (Q)'],
    },
    {
      name: 'Hotbar and Quick Select',
      items: [],
      steps: ['Pick items to fill hotbar', 'Switch hotbar slots (1-9)', 'Middle-click block to pick', 'Use scroll wheel to change slot'],
    },
  ],
};

// --- CONSUME ---
// Eating, drinking, and feeding scenarios
const consume: Workstation = {
  name: 'CONSUME',
  block: 'air',
  position: { x: 44, z: 2 },
  scenarios: [
    {
      name: 'Eat Food',
      items: ['cooked_beef 8', 'bread 8', 'golden_apple 2'],
      steps: ['Hold food in hand', 'Hold right-click to eat', 'Eat different foods', 'Try golden apple'],
    },
    {
      name: 'Drink Potion',
      items: ['potion 1 5', 'potion 1 6', 'potion 1 21'], // speed, jump, instant health
      steps: ['Hold potion in hand', 'Right-click to drink', 'Notice effect applied', 'Drink other potions'],
    },
    {
      name: 'Use Milk Bucket',
      items: ['milk_bucket 2', 'potion 1 5'],
      steps: ['Drink potion first', 'Then drink milk bucket', 'Effect should be cleared'],
    },
    {
      name: 'Feed Animal',
      items: ['wheat 8', 'carrot 8'],
      steps: ['Find cow or pig nearby', 'Hold wheat/carrot', 'Right-click animal to feed', 'Animal shows hearts'],
    },
  ],
};

// --- SCOREBOARD ---
// Scoreboard objectives and scores
const scoreboard: Workstation = {
  name: 'SCOREBOARD',
  block: 'air',
  position: { x: 48, z: 2 },
  scenarios: [
    {
      name: 'Create and Display Objective',
      items: [],
      steps: ['Watch sidebar display appear', 'Observe objective name', 'See scores update'],
    },
    {
      name: 'Update Scores',
      items: [],
      steps: ['Watch scores change', 'See multiple players listed', 'Scores increment'],
    },
    {
      name: 'Remove Scores',
      items: [],
      steps: ['Watch player removed from list', 'See score disappear'],
    },
    {
      name: 'Remove Objective',
      items: [],
      steps: ['Watch sidebar disappear', 'Objective removed'],
    },
  ],
};

// --- TITLE ---
// Title, subtitle, actionbar display
const title: Workstation = {
  name: 'TITLE',
  block: 'air',
  position: { x: 52, z: 2 },
  scenarios: [
    {
      name: 'Show Title',
      items: [],
      steps: ['Watch title appear on screen', 'See text fade in and out'],
    },
    {
      name: 'Show Subtitle',
      items: [],
      steps: ['Watch subtitle appear below title', 'See both texts displayed'],
    },
    {
      name: 'Show Actionbar',
      items: [],
      steps: ['Watch actionbar text above hotbar', 'See text disappear after time'],
    },
    {
      name: 'Clear and Reset',
      items: [],
      steps: ['Watch title clear', 'See timing reset'],
    },
  ],
};

// All workstations
const ALL_WORKSTATIONS: Workstation[] = [craftingTable, furnace, stonecutter, smithingTable, anvil, grindstone, loom, cartographyTable, brewingStand, enchantingTable, beacon, bed, fishing, villager, book, placeBlock, placeEntity, creative, consume, scoreboard, title];

// ============================================================================
// Setup Functions
// ============================================================================

async function setupWorld(server: ExternalServer, workstation: Workstation): Promise<void> {
  const Y = 0;
  const { x, z } = workstation.position;

  // Create platform
  await server.sendCommand(`fill ${x - 3} ${Y - 1} ${z - 3} ${x + 3} ${Y - 1} ${z + 3} stone`);
  await server.sendCommand(`fill ${x - 3} ${Y} ${z - 3} ${x + 3} ${Y + 3} ${z + 3} air`);

  // Place workstation
  if (workstation.name === 'ENCHANTING TABLE') {
    await server.sendCommand(`setblock ${x} ${Y} ${z} enchanting_table`);
    // Add bookshelves
    const bookPositions = [
      [-2, 0, -1],
      [-2, 0, 0],
      [-2, 0, 1],
      [-1, 0, -2],
      [0, 0, -2],
      [1, 0, -2],
      [2, 0, -1],
      [2, 0, 0],
      [2, 0, 1],
      [-1, 0, 2],
      [0, 0, 2],
      [1, 0, 2],
    ];
    for (const [dx, dy, dz] of bookPositions) {
      await server.sendCommand(`setblock ${x + dx} ${Y + dy} ${z + dz} bookshelf`);
    }
  } else if (workstation.name === 'BEACON') {
    // Build pyramid first
    await server.sendCommand(`fill ${x - 1} ${Y} ${z - 1} ${x + 1} ${Y} ${z + 1} iron_block`);
    await server.sendCommand(`setblock ${x} ${Y + 1} ${z} beacon`);
  } else if (workstation.name === 'BED') {
    // No pre-placed block for bed - player will place it
    // Just ensure the area is clear
  } else if (workstation.name === 'FISHING') {
    // Create a water pool for fishing
    // Fishing requires at least 2 blocks of water depth for good results
    await server.sendCommand(`fill ${x - 2} ${Y - 3} ${z} ${x + 2} ${Y - 1} ${z + 4} water`);
    // Add walls around pool
    await server.sendCommand(`fill ${x - 3} ${Y - 3} ${z - 1} ${x + 3} ${Y} ${z - 1} stone`);
    await server.sendCommand(`fill ${x - 3} ${Y - 3} ${z + 5} ${x + 3} ${Y} ${z + 5} stone`);
    await server.sendCommand(`fill ${x - 3} ${Y - 3} ${z} ${x - 3} ${Y} ${z + 4} stone`);
    await server.sendCommand(`fill ${x + 3} ${Y - 3} ${z} ${x + 3} ${Y} ${z + 4} stone`);
  } else if (workstation.name === 'VILLAGER') {
    // Kill any existing villagers in area
    await server.sendCommand(`kill @e[type=villager,x=${x},y=${Y},z=${z},r=10]`);
    await server.sendCommand(`kill @e[type=wandering_trader,x=${x},y=${Y},z=${z},r=10]`);
    await sleep(200);
    // Spawn villagers using scriptevent (Bedrock doesn't support NBT in summon)
    // Requires test_helper behavior pack to be loaded
    await server.sendCommand(`scriptevent test:spawn_villager ${x} ${Y} ${z + 1} librarian`);
    await sleep(200);
    await server.sendCommand(`scriptevent test:spawn_villager ${x + 2} ${Y} ${z + 1} armorer`);
    await sleep(200);
    // Place workstations for villagers to claim (backup in case triggerEvent doesn't work)
    await server.sendCommand(`setblock ${x} ${Y} ${z + 2} lectern`);
    await server.sendCommand(`setblock ${x + 2} ${Y} ${z + 2} blast_furnace`);
  } else if (workstation.name === 'PLACE BLOCK') {
    // Create larger platform for block placement
    await server.sendCommand(`fill ${x - 5} ${Y - 1} ${z - 3} ${x + 5} ${Y - 1} ${z + 5} stone`);
    await server.sendCommand(`fill ${x - 5} ${Y} ${z - 3} ${x + 5} ${Y + 4} ${z + 5} air`);
    // Add a wall for sign placement
    await server.sendCommand(`fill ${x - 3} ${Y} ${z + 4} ${x + 3} ${Y + 2} ${z + 4} stone`);
  } else if (workstation.name === 'PLACE ENTITY') {
    // Create larger platform for entity placement
    await server.sendCommand(`fill ${x - 5} ${Y - 1} ${z - 3} ${x + 5} ${Y - 1} ${z + 5} stone`);
    await server.sendCommand(`fill ${x - 5} ${Y} ${z - 3} ${x + 5} ${Y + 4} ${z + 5} air`);
    // Add a small water pool for boats
    await server.sendCommand(`fill ${x - 2} ${Y - 2} ${z} ${x + 2} ${Y - 1} ${z + 2} water`);
    // Add a wall for item frames
    await server.sendCommand(`fill ${x - 3} ${Y} ${z + 4} ${x + 3} ${Y + 2} ${z + 4} stone`);
    // Kill any existing entities
    await server.sendCommand(`kill @e[type=boat,x=${x},y=${Y},z=${z},r=15]`);
    await server.sendCommand(`kill @e[type=minecart,x=${x},y=${Y},z=${z},r=15]`);
    await server.sendCommand(`kill @e[type=armor_stand,x=${x},y=${Y},z=${z},r=15]`);
    await server.sendCommand(`kill @e[type=item_frame,x=${x},y=${Y},z=${z},r=15]`);
  } else if (workstation.name === 'CREATIVE') {
    // Create platform for creative mode testing
    await server.sendCommand(`fill ${x - 5} ${Y - 1} ${z - 3} ${x + 5} ${Y - 1} ${z + 5} stone`);
    await server.sendCommand(`fill ${x - 5} ${Y} ${z - 3} ${x + 5} ${Y + 4} ${z + 5} air`);
    // Set game mode to creative
    await server.sendCommand('gamemode creative @a');
  } else if (workstation.name === 'CONSUME') {
    // Create platform for consume testing
    await server.sendCommand(`fill ${x - 5} ${Y - 1} ${z - 3} ${x + 5} ${Y - 1} ${z + 5} stone`);
    await server.sendCommand(`fill ${x - 5} ${Y} ${z - 3} ${x + 5} ${Y + 4} ${z + 5} air`);
    // Fence in area to keep animals
    await server.sendCommand(`fill ${x - 4} ${Y} ${z - 2} ${x + 4} ${Y} ${z - 2} oak_fence`);
    await server.sendCommand(`fill ${x - 4} ${Y} ${z + 4} ${x + 4} ${Y} ${z + 4} oak_fence`);
    await server.sendCommand(`fill ${x - 4} ${Y} ${z - 2} ${x - 4} ${Y} ${z + 4} oak_fence`);
    await server.sendCommand(`fill ${x + 4} ${Y} ${z - 2} ${x + 4} ${Y} ${z + 4} oak_fence`);
    // Spawn animals for feeding test
    await server.sendCommand(`summon cow ${x} ${Y} ${z + 2}`);
    await server.sendCommand(`summon pig ${x + 2} ${Y} ${z + 2}`);
    // Drain player hunger so they can eat
    await server.sendCommand('effect @a hunger 5 255 true');
  } else if (workstation.name === 'SCOREBOARD') {
    // Setup initial scoreboard for observation
    // Remove any existing objectives first
    await server.sendCommand('scoreboard objectives remove test');
    await sleep(100);
  } else if (workstation.name === 'TITLE') {
    // No special setup needed - titles will be triggered per scenario
  } else {
    await server.sendCommand(`setblock ${x} ${Y} ${z} ${workstation.block}`);
  }

  // Teleport player
  if (workstation.name === 'FISHING') {
    // Teleport to edge of water, facing the pool (toward +Z)
    await server.sendCommand(`tp @a ${x} ${Y + 1} ${z - 1} 0 30`);
  } else if (workstation.name === 'VILLAGER') {
    // Teleport close to villagers, facing them
    await server.sendCommand(`tp @a ${x} ${Y + 1} ${z - 1} 0 0`);
  } else if (workstation.name === 'PLACE BLOCK') {
    // Teleport to center of platform, facing the wall (toward +Z)
    await server.sendCommand(`tp @a ${x} ${Y + 1} ${z - 1} 0 30`);
  } else if (workstation.name === 'PLACE ENTITY') {
    // Teleport to edge of water pool, facing it (toward +Z)
    await server.sendCommand(`tp @a ${x} ${Y + 1} ${z - 2} 0 30`);
  } else if (workstation.name === 'CREATIVE') {
    // Teleport to center of platform
    await server.sendCommand(`tp @a ${x} ${Y + 1} ${z} 0 30`);
  } else if (workstation.name === 'CONSUME') {
    // Teleport to center, facing animals
    await server.sendCommand(`tp @a ${x} ${Y + 1} ${z} 0 0`);
  } else if (workstation.name === 'SCOREBOARD' || workstation.name === 'TITLE') {
    // Teleport to center of platform
    await server.sendCommand(`tp @a ${x} ${Y + 1} ${z} 0 0`);
  } else {
    await server.sendCommand(`tp @a ${x} ${Y + 1} ${z + 2}`);
  }
}

async function giveScenarioItems(server: ExternalServer, workstation: Workstation, scenarioIndex: number): Promise<void> {
  const scenario = workstation.scenarios[scenarioIndex];

  // Clear inventory first
  await server.sendCommand('clear @a');

  // Give scenario items
  for (const item of scenario.items) {
    await server.sendCommand(`give @a ${item}`);
  }

  // Special items for certain workstations
  if (workstation.name === 'GRINDSTONE') {
    // Bedrock: put item in hotbar slot 0, then enchant the held item
    if (scenarioIndex === 0) {
      await server.sendCommand('replaceitem entity @a slot.hotbar 0 diamond_sword 1');
      await sleep(200);
      await server.sendCommand('enchant @a sharpness 5');
    } else {
      await server.sendCommand('replaceitem entity @a slot.hotbar 0 iron_pickaxe 1');
      await sleep(200);
      await server.sendCommand('enchant @a efficiency 4');
    }
  }

  if (workstation.name === 'CARTOGRAPHY TABLE') {
    await server.sendCommand('give @a filled_map 2');
    await server.sendCommand('give @a empty_map 2');
  }

  if (workstation.name === 'BREWING STAND' && scenarioIndex === 0) {
    // Give water bottles for first brewing scenario
    await server.sendCommand('give @a potion 3');
  }

  // BOOK scenarios - setup for lectern scenarios
  if (workstation.name === 'BOOK') {
    const { x, z } = workstation.position;
    const Y = 0;

    if (scenarioIndex === 3) {
      // "Read Lectern Book" - need book on lectern from previous scenario
      // Ensure lectern exists and remind user
      await server.sendCommand(`setblock ${x} ${Y} ${z} lectern`);
      await server.sendCommand(`tellraw @a {"rawtext":[{"text":"§eBook should be on lectern from previous step. If not, place one."}]}`);
      await server.sendCommand('give @a writable_book 1');
    }
  }

  // VILLAGER scenarios - give multiple stacks of items for trading
  if (workstation.name === 'VILLAGER') {
    // Give 4 stacks of emeralds (256 total) for all scenarios
    for (let i = 0; i < 4; i++) {
      await server.sendCommand('give @a emerald 64');
    }
    // Give paper and books for librarian trades
    for (let i = 0; i < 2; i++) {
      await server.sendCommand('give @a paper 64');
      await server.sendCommand('give @a book 64');
    }
    // Give materials for armorer trades
    await server.sendCommand('give @a coal 64');
    await server.sendCommand('give @a iron_ingot 64');
  }

  // BED scenarios - teleport with rotation and set up environment
  if (workstation.name === 'BED') {
    const { x, z } = workstation.position;
    const Y = 0;

    // Clear any existing beds and markers from the area
    await server.sendCommand(`fill ${x - 3} ${Y} ${z - 3} ${x + 3} ${Y + 2} ${z + 3} air`);

    // Set time to night so player can sleep
    await server.sendCommand('time set midnight');

    // Bedrock rotation: yRot is horizontal rotation
    // 0 = South (+Z), 90 = West (-X), 180 = North (-Z), -90/270 = East (+X)
    // xRot is vertical: 0 = straight, positive = looking down (45 = looking at ground nearby)
    const scenario = workstation.scenarios[scenarioIndex];
    let yRot = 0;
    let playerX = x;
    let playerZ = z;

    // Marker positions: foot (green) and head (red) to show bed direction
    let footX = x,
      footZ = z;
    let headX = x,
      headZ = z;

    // Position player so they place bed at center (x, z) with head extending in the direction they face
    // Bed foot is placed where you click, head extends in your facing direction
    switch (scenario.name) {
      case 'Place Bed Facing South':
        // Bed: foot at z, head at z+1 (south)
        yRot = 0;
        playerX = x;
        playerZ = z - 1;
        footX = x;
        footZ = z;
        headX = x;
        headZ = z + 1;
        break;
      case 'Place Bed Facing North':
        // Bed: foot at z, head at z-1 (north)
        yRot = 180;
        playerX = x;
        playerZ = z + 1;
        footX = x;
        footZ = z;
        headX = x;
        headZ = z - 1;
        break;
      case 'Place Bed Facing East':
        // Bed: foot at x, head at x+1 (east)
        yRot = -90;
        playerX = x - 1;
        playerZ = z;
        footX = x;
        footZ = z;
        headX = x + 1;
        headZ = z;
        break;
      case 'Place Bed Facing West':
        // Bed: foot at x, head at x-1 (west)
        yRot = 90;
        playerX = x + 1;
        playerZ = z;
        footX = x;
        footZ = z;
        headX = x - 1;
        headZ = z;
        break;
      case 'Sleep From Foot (South Bed)':
        // Pre-place a bed facing south (direction=0)
        await server.sendCommand(`setblock ${x} ${Y} ${z} bed ["direction"=0]`);
        yRot = 180;
        playerX = x;
        playerZ = z + 2;
        footX = -999; // No markers for pre-placed beds
        break;
      case 'Sleep From Side (South Bed)':
        // Pre-place a bed facing south
        await server.sendCommand(`setblock ${x} ${Y} ${z} bed ["direction"=0]`);
        yRot = -90;
        playerX = x - 1;
        playerZ = z;
        footX = -999; // No markers for pre-placed beds
        break;
    }

    // Place visual markers for placement scenarios (not for sleep scenarios)
    if (footX !== -999) {
      // Reset platform to stone first
      await server.sendCommand(`fill ${x - 3} ${Y - 1} ${z - 3} ${x + 3} ${Y - 1} ${z + 3} stone`);

      // Green concrete = FOOT (place bed here)
      await server.sendCommand(`setblock ${footX} ${Y - 1} ${footZ} lime_concrete`);
      // Red concrete = HEAD (bed extends here)
      await server.sendCommand(`setblock ${headX} ${Y - 1} ${headZ} red_concrete`);

      await server.sendCommand(`tellraw @a {"rawtext":[{"text":"§a[GREEN] = Place bed here"}]}`);
      await server.sendCommand(`tellraw @a {"rawtext":[{"text":"§c[RED] = Bed head goes here"}]}`);
    }

    // Teleport player with rotation
    await server.sendCommand(`tp @a ${playerX} ${Y + 1} ${playerZ} ${yRot} 45`);
  }

  // SCOREBOARD scenarios - run scoreboard commands automatically
  if (workstation.name === 'SCOREBOARD') {
    switch (scenarioIndex) {
      case 0: // Create and Display Objective
        await server.sendCommand('scoreboard objectives add test dummy "Test Score"');
        await sleep(200);
        await server.sendCommand('scoreboard objectives setdisplay sidebar test');
        await sleep(200);
        await server.sendCommand('scoreboard players set Player1 test 100');
        await server.sendCommand('scoreboard players set Player2 test 75');
        await server.sendCommand('scoreboard players set Player3 test 50');
        break;
      case 1: // Update Scores
        await server.sendCommand('scoreboard players add Player1 test 10');
        await sleep(500);
        await server.sendCommand('scoreboard players add Player2 test 25');
        await sleep(500);
        await server.sendCommand('scoreboard players set Player4 test 200');
        break;
      case 2: // Remove Scores
        await server.sendCommand('scoreboard players reset Player3 test');
        await sleep(500);
        await server.sendCommand('scoreboard players reset Player4 test');
        break;
      case 3: // Remove Objective
        await server.sendCommand('scoreboard objectives remove test');
        break;
    }
  }

  // TITLE scenarios - run title commands automatically
  if (workstation.name === 'TITLE') {
    switch (scenarioIndex) {
      case 0: // Show Title
        await server.sendCommand('titleraw @a times 20 60 20');
        await sleep(200);
        await server.sendCommand('titleraw @a title {"rawtext":[{"text":"§6Hello World!"}]}');
        break;
      case 1: // Show Subtitle
        await server.sendCommand('titleraw @a times 20 60 20');
        await sleep(200);
        await server.sendCommand('titleraw @a title {"rawtext":[{"text":"§bMain Title"}]}');
        await sleep(200);
        await server.sendCommand('titleraw @a subtitle {"rawtext":[{"text":"§7This is the subtitle"}]}');
        break;
      case 2: // Show Actionbar
        await server.sendCommand('titleraw @a actionbar {"rawtext":[{"text":"§aActionbar message here!"}]}');
        await sleep(2000);
        await server.sendCommand('titleraw @a actionbar {"rawtext":[{"text":"§eSecond actionbar message"}]}');
        break;
      case 3: // Clear and Reset
        await server.sendCommand('titleraw @a title {"rawtext":[{"text":"§cClearing soon..."}]}');
        await sleep(1500);
        await server.sendCommand('title @a clear');
        await sleep(500);
        await server.sendCommand('title @a reset');
        break;
    }
  }
}

async function sendScenarioText(server: ExternalServer, workstation: Workstation, scenarioIndex: number): Promise<void> {
  const scenario = workstation.scenarios[scenarioIndex];
  const total = workstation.scenarios.length;

  // Escape quotes for JSON
  const escapeJson = (s: string) => s.replace(/"/g, '\\"');

  await server.sendCommand(`tellraw @a {"rawtext":[{"text":"§6=== ${workstation.name} (${scenarioIndex + 1}/${total}) ==="}]}`);
  await server.sendCommand(`tellraw @a {"rawtext":[{"text":"§e${escapeJson(scenario.name)}"}]}`);

  for (let i = 0; i < scenario.steps.length; i++) {
    await server.sendCommand(`tellraw @a {"rawtext":[{"text":"§7${i + 1}. ${escapeJson(scenario.steps[i])}"}]}`);
    console.log('           ', i + 1, scenario.steps[i]);
  }

  await server.sendCommand(`tellraw @a {"rawtext":[{"text":"§aType 'done' when finished"}]}`);
}

// ============================================================================
// Main
// ============================================================================

async function selectWorkstation(): Promise<Workstation> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n=== SELECT WORKSTATION ===\n');
  ALL_WORKSTATIONS.forEach((ws, i) => {
    console.log(`  ${i + 1}. ${ws.name} (${ws.scenarios.length} scenarios)`);
  });
  console.log();

  return new Promise((resolve) => {
    rl.question(`Enter number (1-${ALL_WORKSTATIONS.length}): `, (answer) => {
      rl.close();
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < ALL_WORKSTATIONS.length) {
        resolve(ALL_WORKSTATIONS[index]);
      } else {
        console.log('Invalid selection, defaulting to Crafting Table');
        resolve(ALL_WORKSTATIONS[0]);
      }
    });
  });
}

function formatTimestamp(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}-${hh}${min}`;
}

async function main(): Promise<void> {
  // Select workstation
  const workstation = await selectWorkstation();

  console.log('='.repeat(50));
  console.log(`  Capturing: ${workstation.name}`);
  console.log('='.repeat(50));
  console.log(`  Version: ${VERSION}`);
  console.log(`  Scenarios: ${workstation.scenarios.length}`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log('='.repeat(50));

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Ensure BDS is installed
  console.log('\nChecking BDS installation...');
  await ensureBDSInstalled(VERSION, BDS_PATH);

  // Start BDS
  const BDS_PORT = PORT + 10;
  console.log('Starting Bedrock Dedicated Server...');
  const server = await startExternalServer({ port: BDS_PORT, bdsPath: BDS_PATH });

  await sleep(2000);

  // Set default gamemode for CREATIVE workstation BEFORE player joins
  if (workstation.name === 'CREATIVE') {
    console.log('Setting default gamemode to creative...');
    await server.sendCommand('defaultgamemode creative');
    await sleep(500);
  }

  // Create relay proxy
  console.log('Starting packet capture relay...');
  const version: Version = VERSION as Version;
  const relay = new Relay({
    version,
    host: HOST,
    port: PORT,
    offline: true,
    enableChunkCaching: false,
    destination: {
      host: '127.0.0.1',
      port: BDS_PORT,
      offline: true,
    },
    profilesFolder: './profiles',
    omitParseErrors: true,
  });

  let playerConnected = false;
  let currentScenario = 0;

  relay.on('connect', async (player: Player) => {
    if (playerConnected) return;
    playerConnected = true;

    console.log('\n========================================');
    console.log('  CLIENT CONNECTED');
    console.log('========================================');

    // Setup logging
    const basePath = `${OUTPUT_DIR}/${VERSION}-${workstation.name.replace(/ /g, '_')}-${formatTimestamp()}`;
    const craftingAnalyzer = new CraftingAnalyzer(basePath);
    const inventoryAnalyzer = new InventoryAnalyzer(basePath);
    const dumpWriter = new PacketDumpWriter(basePath, VERSION);

    console.log(`  Logging to: ${basePath}`);

    // Capture packets
    player.on('clientbound', (packet, des) => {
      craftingAnalyzer.log('S', des.data.name, des.data.params);
      inventoryAnalyzer.log('S', des.data.name, des.data.params);
      dumpWriter.writeClientbound(des.fullBuffer);
    });

    player.on('serverbound', (packet, des) => {
      craftingAnalyzer.log('C', des.data.name, des.data.params);
      inventoryAnalyzer.log('C', des.data.name, des.data.params);
      dumpWriter.writeServerbound(des.fullBuffer);

      // Listen for 'done' in chat
      if (des.data.name === 'text' && des.data.params?.message?.toLowerCase() === 'done') {
        handleDone();
      }
    });

    // Setup world and start first scenario
    setTimeout(async () => {
      // Give player OP so they can use commands
      await server.sendCommand('op @a');
      await sleep(200);

      // Set game mode based on workstation
      if (workstation.name === 'CREATIVE') {
        await server.sendCommand('gamemode creative @a');
        // Re-send creative content by toggling gamemode
        await sleep(200);
        await server.sendCommand('gamemode survival @a');
        await sleep(200);
        await server.sendCommand('gamemode creative @a');
      } else {
        await server.sendCommand('gamemode survival @a');
      }
      await server.sendCommand('xp 1000L @a');
      await setupWorld(server, workstation);
      await sleep(500);
      await startScenario();
    }, 3000);

    async function startScenario() {
      if (currentScenario >= workstation.scenarios.length) {
        // All done!
        await server.sendCommand(`tellraw @a {"rawtext":[{"text":"§a=== ALL ${workstation.scenarios.length} SCENARIOS COMPLETE ==="}]}`);
        await server.sendCommand(`tellraw @a {"rawtext":[{"text":"§7Disconnect to save logs"}]}`);
        console.log(`\n  All ${workstation.scenarios.length} scenarios complete!`);
        return;
      }

      const scenario = workstation.scenarios[currentScenario];
      console.log(`\n  Starting scenario ${currentScenario + 1}/${workstation.scenarios.length}: ${scenario.name}`);

      // Reset workstation (destroy and replace to clear any leftover items)
      const { x, z } = workstation.position;
      const Y = 0;

      if (workstation.name === 'BEACON') {
        await server.sendCommand(`setblock ${x} ${Y + 1} ${z} air`);
        await sleep(100);
        await server.sendCommand(`setblock ${x} ${Y + 1} ${z} beacon`);
      } else if (workstation.name === 'ENCHANTING TABLE') {
        await server.sendCommand(`setblock ${x} ${Y} ${z} air`);
        await sleep(100);
        await server.sendCommand(`setblock ${x} ${Y} ${z} enchanting_table`);
      } else {
        await server.sendCommand(`setblock ${x} ${Y} ${z} air`);
        await sleep(100);
        await server.sendCommand(`setblock ${x} ${Y} ${z} ${workstation.block}`);
      }
      await sleep(200);

      await giveScenarioItems(server, workstation, currentScenario);
      await sleep(300);
      await sendScenarioText(server, workstation, currentScenario);
    }

    async function handleDone() {
      const scenario = workstation.scenarios[currentScenario];
      console.log(`  Completed: ${scenario.name}`);

      // Log completion marker
      await server.sendCommand(`tellraw @a {"rawtext":[{"text":"§a✓ ${scenario.name} DONE"}]}`);

      currentScenario++;
      await sleep(500);
      await startScenario();
    }

    player.on('close', () => {
      console.log('\n========================================');
      console.log('  CLIENT DISCONNECTED - LOGS SAVED');
      console.log('========================================');
      craftingAnalyzer.close();
      inventoryAnalyzer.close();
      dumpWriter.close();
    });
  });

  relay.listen();

  // Wait for setup
  await sleep(3000);

  console.log('\n========================================');
  console.log('  READY FOR CONNECTION');
  console.log('========================================');
  console.log(`  Connect Minecraft to: ${HOST}:${PORT}`);
  console.log(`  Testing: ${workstation.name}`);
  console.log('  Type "done" in chat after each scenario');
  console.log('========================================\n');

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await server.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
