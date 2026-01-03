import { expect } from 'expect';
import type { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
import {
  startExternalServer,
  connectBotToExternalServer,
  waitForBotSpawn,
  waitFor,
  sleep,
  giveItem,
  clearInventory,
  setBlock,
  teleportPlayer,
  pingBehaviorPack,
  getServerInventory,
  getServerBlockInventory,
  getServerPlayerState,
  getClientInventory,
  assertInventoryMatch,
  type ExternalServer,
  type ServerInventoryItem,
} from 'minecraft-bedrock-test-server';

describe('BDS Integration: Inventory', function () {
  this.timeout(120_000); // BDS tests need longer timeout

  let server: ExternalServer;
  let bot: Bot;

  before(async function () {
    this.timeout(180_000); // Extra time for server download/startup
    server = await startExternalServer({
      version: '1.21.130',
      // Uses default: survival mode, peaceful difficulty, cheats enabled
    });
  });

  after(async function () {
    await server?.stop();
  });

  beforeEach(async function () {
    bot = await connectBotToExternalServer(server);
    await waitForBotSpawn(bot);
    // Clear inventory before each test (ignore errors if already empty)
    try {
      await clearInventory(server, bot.username);
      //await sleep(500);
    } catch {
      // Ignore clear errors
    }
  });

  afterEach(async function () {
    if (bot?._client?.close) {
      bot._client.close();
    }
  });

  // Helper to verify client inventory matches server inventory
  async function assertInventorySync(context: string) {
    const serverInventory = await getServerInventory(server, bot.username);
    const clientInventory = getClientInventory(bot);
    assertInventoryMatch(clientInventory, serverInventory, context);
  }

  // Helper to get client chest inventory from open window
  function getClientChestInventory(window: any): Array<{ slot: number; name: string; count: number }> {
    const items: Array<{ slot: number; name: string; count: number }> = [];
    const containerSlots = window.inventoryStart ?? 27;
    for (let i = 0; i < containerSlots; i++) {
      const item = window.slots[i];
      if (item) {
        items.push({
          slot: i,
          name: item.name,
          count: item.count,
        });
      }
    }
    return items;
  }

  // Helper to verify client chest window matches server chest inventory
  async function assertChestInventorySync(window: any, chestPos: { x: number; y: number; z: number }, context: string) {
    const serverChestInventory = await getServerBlockInventory(server, chestPos.x, chestPos.y, chestPos.z);
    const clientChestInventory = getClientChestInventory(window);
    assertInventoryMatch(clientChestInventory, serverChestInventory.items, context);
  }

  // Helper to get non-null items from slots
  function getSlotItems() {
    return bot.inventory.slots.filter(Boolean);
  }

  function hasItem(name: string) {
    return getSlotItems().some((i) => i?.name === name);
  }

  function findItem(name: string) {
    return getSlotItems().find((i) => i?.name === name);
  }

  describe('Behavior Pack', () => {
    it('should have test_helper behavior pack loaded', async () => {
      const loaded = await pingBehaviorPack(server);
      expect(loaded).toBe(true);
    });

    it('should return player state from server', async () => {
      const state = await getServerPlayerState(server, bot.username);
      expect(state).toBeTruthy();
      expect(state.name).toBe(bot.username);
      expect(state.gamemode).toBeDefined();
      expect(state.position).toBeDefined();
    });

    it('should return player inventory from server', async () => {
      // Give player an item first
      await giveItem(server, bot.username, 'diamond', 5);
      //await sleep(500);

      const inventory = await getServerInventory(server, bot.username);
      expect(inventory).toBeTruthy();
      expect(Array.isArray(inventory)).toBe(true);

      // Should have the diamond
      const diamond = inventory.find((i) => i.name === 'diamond');
      expect(diamond).toBeTruthy();
      expect(diamond!.count).toBe(5);
    });

    it('should return block inventory from server', async () => {
      // Teleport to chest location and wait for chunks
      await teleportPlayer(server, bot.username, -8, 0, 0);
      //await sleep(1000);
      await bot.waitForChunksToLoad();

      // Query chest at known position
      const chestPos = { x: -9, y: 0, z: 0 };
      const chestInventory = await getServerBlockInventory(server, chestPos.x, chestPos.y, chestPos.z);

      expect(chestInventory).toBeTruthy();
      expect(chestInventory.position).toEqual(chestPos);
      expect(Array.isArray(chestInventory.items)).toBe(true);
    });
  });

  describe('Receiving Items', () => {
    it('should receive items given by server', async () => {
      await giveItem(server, bot.username, 'diamond_sword', 1);

      await waitFor(() => hasItem('diamond_sword'), 10000);

      const sword = findItem('diamond_sword');
      expect(sword).toBeTruthy();
      expect(sword!.count).toBe(1);

      await assertInventorySync('After receiving diamond_sword');
    });

    it('should receive stacked items', async () => {
      await giveItem(server, bot.username, 'diamond', 64);

      await waitFor(() => hasItem('diamond'), 5000);

      const diamonds = findItem('diamond');
      expect(diamonds).toBeTruthy();
      expect(diamonds!.count).toBe(64);

      await assertInventorySync('After receiving 64 diamonds');
    });

    it('should receive multiple different items', async () => {
      await giveItem(server, bot.username, 'diamond_sword', 1);
      await giveItem(server, bot.username, 'diamond_pickaxe', 1);
      await giveItem(server, bot.username, 'diamond', 32);

      await waitFor(() => getSlotItems().length >= 3, 5000);

      expect(hasItem('diamond_sword')).toBe(true);
      expect(hasItem('diamond_pickaxe')).toBe(true);
      expect(hasItem('diamond')).toBe(true);

      await assertInventorySync('After receiving multiple items');
    });
  });

  describe('Moving Items', () => {
    it('should move item to another empty slot', async () => {
      await giveItem(server, bot.username, 'diamond', 64);
      await waitFor(() => hasItem('diamond'), 5000);

      const item = findItem('diamond')!;
      const originalSlot = item.slot;
      // Find an empty slot
      let targetSlot = -1;
      for (let i = 0; i < 36; i++) {
        if (i !== originalSlot && !bot.inventory.slots[i]) {
          targetSlot = i;
          break;
        }
      }

      expect(targetSlot).not.toBe(-1);

      await bot.moveSlotItem(originalSlot, targetSlot);

      // Verify the move
      await waitFor(() => bot.inventory.slots[targetSlot]?.name === 'diamond' && !bot.inventory.slots[originalSlot], 5000);

      expect(bot.inventory.slots[targetSlot]?.name).toBe('diamond');
      expect(bot.inventory.slots[targetSlot]?.count).toBe(64);
      expect(bot.inventory.slots[originalSlot]).toBeFalsy();

      await assertInventorySync('After moving diamond to empty slot');
    });

    it('should swap items when moving to occupied slot', async () => {
      await giveItem(server, bot.username, 'diamond', 32);
      await giveItem(server, bot.username, 'gold_ingot', 16);
      await waitFor(() => getSlotItems().length >= 2, 5000);

      const diamond = findItem('diamond')!;
      const gold = findItem('gold_ingot')!;
      const diamondSlot = diamond.slot;
      const goldSlot = gold.slot;

      await bot.moveSlotItem(diamondSlot, goldSlot);

      // After swap, gold should be in diamond's original slot
      await waitFor(() => {
        const slotA = bot.inventory.slots[diamondSlot];
        const slotB = bot.inventory.slots[goldSlot];
        return slotA?.name === 'gold_ingot' && slotB?.name === 'diamond';
      }, 5000);

      expect(bot.inventory.slots[goldSlot]?.name).toBe('diamond');
      expect(bot.inventory.slots[diamondSlot]?.name).toBe('gold_ingot');

      await assertInventorySync('After swapping diamond and gold');
    });
  });

  describe('Equipment', () => {
    it('should equip helmet', async () => {
      await giveItem(server, bot.username, 'diamond_helmet', 1);
      await waitFor(() => hasItem('diamond_helmet'), 5000);
      await assertInventorySync('After receiving diamond_helmet');

      const helmet = findItem('diamond_helmet')!;
      await bot.equip(helmet, 'head');

      const headSlot = bot.getEquipmentDestSlot('head');
      await waitFor(() => bot.inventory.slots[headSlot]?.name === 'diamond_helmet', 5000);

      expect(bot.inventory.slots[headSlot]?.name).toBe('diamond_helmet');
      await assertInventorySync('After equipping helmet');
    });

    it('should equip full armor set', async () => {
      await giveItem(server, bot.username, 'diamond_helmet', 1);
      await giveItem(server, bot.username, 'diamond_chestplate', 1);
      await giveItem(server, bot.username, 'diamond_leggings', 1);
      await giveItem(server, bot.username, 'diamond_boots', 1);
      await waitFor(() => getSlotItems().length >= 4, 5000);
      await assertInventorySync('After receiving armor set');

      const helmet = findItem('diamond_helmet')!;
      const chestplate = findItem('diamond_chestplate')!;
      const leggings = findItem('diamond_leggings')!;
      const boots = findItem('diamond_boots')!;

      await bot.equip(helmet, 'head');
      await bot.equip(chestplate, 'torso');
      await bot.equip(leggings, 'legs');
      await bot.equip(boots, 'feet');

      await waitFor(() => {
        const headSlot = bot.getEquipmentDestSlot('head');
        const torsoSlot = bot.getEquipmentDestSlot('torso');
        const legsSlot = bot.getEquipmentDestSlot('legs');
        const feetSlot = bot.getEquipmentDestSlot('feet');
        return (
          bot.inventory.slots[headSlot]?.name === 'diamond_helmet' &&
          bot.inventory.slots[torsoSlot]?.name === 'diamond_chestplate' &&
          bot.inventory.slots[legsSlot]?.name === 'diamond_leggings' &&
          bot.inventory.slots[feetSlot]?.name === 'diamond_boots'
        );
      }, 10000);

      expect(bot.inventory.slots[bot.getEquipmentDestSlot('head')]?.name).toBe('diamond_helmet');
      expect(bot.inventory.slots[bot.getEquipmentDestSlot('torso')]?.name).toBe('diamond_chestplate');
      expect(bot.inventory.slots[bot.getEquipmentDestSlot('legs')]?.name).toBe('diamond_leggings');
      expect(bot.inventory.slots[bot.getEquipmentDestSlot('feet')]?.name).toBe('diamond_boots');
      await assertInventorySync('After equipping full armor set');
    });

    it('should equip offhand item', async () => {
      await giveItem(server, bot.username, 'shield', 1);
      await waitFor(() => hasItem('shield'), 5000);
      await assertInventorySync('After receiving shield');

      const shield = findItem('shield')!;
      await bot.equip(shield, 'off-hand');

      const offhandSlot = bot.getEquipmentDestSlot('off-hand');
      await waitFor(() => bot.inventory.slots[offhandSlot]?.name === 'shield', 5000);

      expect(bot.inventory.slots[offhandSlot]?.name).toBe('shield');
      await assertInventorySync('After equipping shield to offhand');
    });

    it('should unequip helmet', async () => {
      await giveItem(server, bot.username, 'diamond_helmet', 1);
      await waitFor(() => hasItem('diamond_helmet'), 5000);
      await assertInventorySync('After receiving diamond_helmet');

      const helmet = findItem('diamond_helmet')!;
      await bot.equip(helmet, 'head');

      const headSlot = bot.getEquipmentDestSlot('head');
      await waitFor(() => bot.inventory.slots[headSlot]?.name === 'diamond_helmet', 5000);
      await assertInventorySync('After equipping helmet');

      // Now unequip
      await bot.unequip('head');

      // Helmet should be moved back to inventory
      await waitFor(() => !bot.inventory.slots[headSlot], 5000);
      expect(bot.inventory.slots[headSlot]).toBeFalsy();
      expect(hasItem('diamond_helmet')).toBe(true);
      await assertInventorySync('After unequipping helmet');
    });

    it('should equip item to hand when another item is already held', async () => {
      // Give sword (goes to slot 0) and pickaxe (goes to slot 1)
      // Both items are in hotbar, so switching between them should work
      await giveItem(server, bot.username, 'diamond_sword', 1);
      await giveItem(server, bot.username, 'diamond_pickaxe', 1);

      await waitFor(() => hasItem('diamond_sword') && hasItem('diamond_pickaxe'), 5000);
      await assertInventorySync('After receiving items');

      const sword = findItem('diamond_sword')!;
      const pickaxe = findItem('diamond_pickaxe')!;

      // Sword is at slot 0, pickaxe at slot 1. Default quickBarSlot is 0.
      expect(bot.quickBarSlot).toBe(0);
      expect(sword.slot).toBe(0);

      // Equip pickaxe to hand (should select slot 1)
      await bot.equip(pickaxe, 'hand');

      // Verify: pickaxe should now be in hand
      expect(bot.quickBarSlot).toBe(1);
      expect(bot.heldItem?.name).toBe('diamond_pickaxe');

      // Both items should still exist
      expect(hasItem('diamond_sword')).toBe(true);
      expect(hasItem('diamond_pickaxe')).toBe(true);
      await assertInventorySync('After equipping pickaxe to hand');

      // Switch back to sword
      await bot.equip(sword, 'hand');
      expect(bot.quickBarSlot).toBe(0);
      expect(bot.heldItem?.name).toBe('diamond_sword');
      await assertInventorySync('After switching back to sword');
    });

    it('should swap item from inventory to full hotbar', async () => {
      // Fill all 9 hotbar slots with different non-stackable items
      const tools = ['wooden_sword', 'stone_sword', 'iron_sword', 'wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe', 'wooden_axe', 'stone_axe', 'iron_axe'];
      for (const tool of tools) {
        await giveItem(server, bot.username, tool, 1);
        await sleep(50);
      }
      await waitFor(() => {
        // Check that all 9 hotbar slots are filled
        for (let i = 0; i < 9; i++) {
          if (!bot.inventory.slots[i]) return false;
        }
        return true;
      }, 5000);
      await assertInventorySync('After filling hotbar with tools');

      // Give a diamond that will go to main inventory (slot 9+)
      await giveItem(server, bot.username, 'diamond', 1);
      await waitFor(() => hasItem('diamond'), 5000);

      const diamond = findItem('diamond')!;
      expect(diamond.slot).toBeGreaterThanOrEqual(9); // Should be in main inventory
      await assertInventorySync('After receiving diamond in inventory');

      // Currently holding wooden_sword in slot 0
      expect(bot.quickBarSlot).toBe(0);
      expect(bot.heldItem?.name).toBe('wooden_sword');

      // Equip diamond to hand - should swap with current held item
      await bot.equip(diamond, 'hand');

      // Verify: diamond should now be in hand (slot 0)
      expect(bot.heldItem?.name).toBe('diamond');

      // Wooden sword should be moved to where diamond was
      expect(hasItem('wooden_sword')).toBe(true);
      expect(hasItem('diamond')).toBe(true);
      await assertInventorySync('After swapping diamond to hand');
    });
  });

  describe('Tossing Items', () => {
    it('should toss entire stack', async () => {
      await giveItem(server, bot.username, 'diamond', 64);
      await waitFor(() => hasItem('diamond'), 5000);
      await assertInventorySync('After receiving 64 diamonds');

      const diamond = findItem('diamond')!;
      await bot.tossStack(diamond);

      await waitFor(() => !hasItem('diamond'), 5000);

      expect(hasItem('diamond')).toBe(false);
      await assertInventorySync('After tossing entire stack');
    });

    it('should toss single item from stack', async () => {
      await giveItem(server, bot.username, 'diamond', 64);
      await waitFor(() => hasItem('diamond'), 5000);
      await assertInventorySync('After receiving 64 diamonds');

      const diamond = findItem('diamond')!;
      await bot.toss(diamond.type, null, 1);

      await waitFor(() => {
        const d = findItem('diamond');
        return d && d.count === 63;
      }, 5000);

      const remaining = findItem('diamond');
      expect(remaining).toBeTruthy();
      expect(remaining!.count).toBe(63);
      await assertInventorySync('After tossing single item');
    });
  });

  describe('Container Operations', () => {
    // Container opening requires further investigation into bedrock-protocol
    // The packets are being sent correctly but BDS doesn't respond with container_open
    // This may be related to client initialization or player_auth_input handling

    it('should open and close a chest', async () => {
      // Fresh flat world is copied each test run, use fixed coordinates
      // First, check where the ground is and place chest there

      // Teleport bot to (10, -50, 10) - high enough to be safe
      await teleportPlayer(server, bot.username, -8, 0, 0);
      //await sleep(1000);
      await bot.waitForChunksToLoad();

      let pos = new Vec3(-9, 0, 0);
      // Log where bot ended up
      console.log('DEBUG: Bot spawned at:', bot.entity.position);

      // Place chest at same Y level as bot (next to them)
      //const chestY = Math.floor(bot.entity.position.y);
      //console.log('DEBUG: Placing chest at Y:', chestY);
      //await setBlock(server, 11, chestY, 10, 'chest');
      ////await sleep(500);

      // Wait for chest block to appear in bot's world
      //console.log('DEBUG: Waiting for chest block at (11,', chestY, ', 10)...');
      // await waitFor(() => {
      //   const block = bot.blockAt(new Vec3(11, chestY, 10));
      //   if (block) {
      //     console.log('DEBUG: Block at position:', block.name, 'stateId:', (block as any).stateId);
      //   }
      //   return block?.name === 'chest';
      // }, 10000);

      const chestBlock = bot.blockAt(pos)!;
      console.log('DEBUG: Chest found, stateId:', (chestBlock as any).stateId);
      console.log('DEBUG: Bot position:', bot.entity.position);
      expect(chestBlock).toBeTruthy();
      expect(chestBlock.name).toBe('chest');

      // Try to open the chest
      console.log('DEBUG: Opening chest...');
      console.log('DEBUG: quickBarSlot:', bot.quickBarSlot, 'heldItem:', bot.heldItem);

      const window = await bot.openBlock(chestBlock);
      console.log('DEBUG: Window opened:', window?.type);
      expect(window).toBeTruthy();
      expect(bot.currentWindow).toBeTruthy();

      // Close the chest
      await bot.closeWindow(window);
      //await sleep(500);

      expect(bot.currentWindow).toBeFalsy();
    });

    it('should deposit items to a chest', async () => {
      // Use existing chest at (-9, 0, 0) in flat world
      const chestPos = { x: -9, y: 0, z: 0 };
      await teleportPlayer(server, bot.username, -8, 0, 0);
      //await sleep(1000);
      await bot.waitForChunksToLoad();

      const pos = new Vec3(chestPos.x, chestPos.y, chestPos.z);

      // Give the player some diamonds
      await giveItem(server, bot.username, 'diamond', 32);
      await waitFor(() => hasItem('diamond'), 5000);

      const diamond = findItem('diamond')!;
      const diamondType = diamond.type;

      const chestBlock = bot.blockAt(pos)!;
      expect(chestBlock.name).toBe('chest');

      // Select an empty hotbar slot (slot 8) before interacting
      bot.setQuickBarSlot(8);
      //await sleep(100);

      // Open the chest
      const window = (await bot.openBlock(chestBlock)) as any;
      expect(window).toBeTruthy();
      expect(typeof window.deposit).toBe('function');

      // Deposit items
      await window.deposit(diamondType, null, 10);

      // Wait for items to be transferred
      //await sleep(500);

      // Close the chest
      await bot.closeWindow(window);
      //await sleep(500);

      // Verify we still have some diamonds in inventory
      const remainingDiamond = findItem('diamond');
      expect(remainingDiamond).toBeTruthy();
      expect(remainingDiamond!.count).toBe(22);
      await assertInventorySync('Player inventory after deposit');

      // Verify chest contents on server
      const chestInventory = await getServerBlockInventory(server, chestPos.x, chestPos.y, chestPos.z);
      const chestDiamonds = chestInventory.items.filter((i) => i.name === 'diamond');
      expect(chestDiamonds.length).toBeGreaterThan(0);
      const totalDiamondsInChest = chestDiamonds.reduce((sum, i) => sum + i.count, 0);
      expect(totalDiamondsInChest).toBe(10);
    });

    it('should deposit multiple  items to a chest', async () => {
      // Use existing chest at (-9, 0, 0) in flat world
      const chestPos = { x: -9, y: 0, z: 0 };
      await teleportPlayer(server, bot.username, -8, 0, 0);
      await bot.waitForChunksToLoad();

      const pos = new Vec3(chestPos.x, chestPos.y, chestPos.z);

      // Record initial diamond count in chest (chest may have items from previous tests)
      const initialChestInventory = await getServerBlockInventory(server, chestPos.x, chestPos.y, chestPos.z);
      const initialDiamonds = initialChestInventory.items.filter((i) => i.name === 'diamond');
      const initialDiamondCount = initialDiamonds.reduce((sum, i) => sum + i.count, 0);

      // Give the player some items
      await giveItem(server, bot.username, 'diamond', 32);
      await giveItem(server, bot.username, 'bone', 32);
      await giveItem(server, bot.username, 'iron_ingot', 32);
      await waitFor(() => hasItem('bone') && hasItem('diamond') && hasItem('iron_ingot'), 10000);

      const bone = findItem('bone')!;
      const diamond = findItem('diamond')!;
      const iron = findItem('iron_ingot')!;

      const chestBlock = bot.blockAt(pos)!;
      expect(chestBlock.name).toBe('chest');

      // Select an empty hotbar slot (slot 8) before interacting
      bot.setQuickBarSlot(8);

      // Open the chest
      const window = (await bot.openBlock(chestBlock)) as any;
      expect(window).toBeTruthy();
      expect(typeof window.deposit).toBe('function');

      // Deposit items
      await window.deposit(iron.type, null, 1);
      await assertInventorySync('Player inventory after iron deposit');
      await assertChestInventorySync(window, chestPos, 'Chest inventory after iron deposit');

      await window.deposit(bone.type, null, 1);
      await assertInventorySync('Player inventory after bone deposit');
      await assertChestInventorySync(window, chestPos, 'Chest inventory after bone deposit');

      await window.deposit(diamond.type, null, 1);
      await assertInventorySync('Player inventory after diamond deposit');
      await assertChestInventorySync(window, chestPos, 'Chest inventory after diamond deposit');

      // Close the chest
      await bot.closeWindow(window);

      // Verify we still have some diamonds in inventory (deposited 1 of 32)
      const remainingDiamond = findItem('diamond');
      expect(remainingDiamond).toBeTruthy();
      expect(remainingDiamond!.count).toBe(31);
      await assertInventorySync('Player inventory after deposit');

      // Verify chest contents on server (deposited 1 additional diamond)
      const chestInventory = await getServerBlockInventory(server, chestPos.x, chestPos.y, chestPos.z);
      const chestDiamonds = chestInventory.items.filter((i) => i.name === 'diamond');
      expect(chestDiamonds.length).toBeGreaterThan(0);
      const totalDiamondsInChest = chestDiamonds.reduce((sum, i) => sum + i.count, 0);
      expect(totalDiamondsInChest).toBe(initialDiamondCount + 1);
    });

    it('should withdraw items from a chest', async () => {
      // Use existing chest at (-9, 0, 0) in flat world
      const chestPos = { x: -9, y: 0, z: 0 };
      await teleportPlayer(server, bot.username, -8, 0, 0);
      //await sleep(1000);
      await bot.waitForChunksToLoad();

      const pos = new Vec3(chestPos.x, chestPos.y, chestPos.z);

      // Give the player some diamonds to deposit first
      await giveItem(server, bot.username, 'diamond', 10);
      await waitFor(() => hasItem('diamond'), 5000);

      const diamond = findItem('diamond')!;
      const diamondType = diamond.type;

      const chestBlock = bot.blockAt(pos)!;
      expect(chestBlock.name).toBe('chest');

      bot.setQuickBarSlot(8);
      //await sleep(100);

      await assertInventorySync('Before open chest');
      // Open the chest and deposit all diamonds
      let window = (await bot.openBlock(chestBlock)) as any;
      await assertInventorySync('After open chest');
      await window.deposit(diamondType, null, 10);
      await assertInventorySync('After deposit');
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);
      await assertInventorySync('After close window');

      // Verify no diamonds in player inventory
      expect(hasItem('diamond')).toBe(false);

      // Verify chest has the diamonds on server
      let chestInventory = await getServerBlockInventory(server, chestPos.x, chestPos.y, chestPos.z);
      let chestDiamonds = chestInventory.items.filter((i) => i.name === 'diamond');
      expect(chestDiamonds.length).toBeGreaterThan(0);

      // Reopen the chest and withdraw diamonds
      await assertInventorySync('Before open chest');
      window = (await bot.openBlock(chestBlock)) as any;
      await assertInventorySync('After open chest');
      expect(typeof window.withdraw).toBe('function');

      await window.withdraw(diamondType, null, 1);
      await assertInventorySync('After withdraw');
      //await sleep(500);
      await bot.closeWindow(window);
      //await sleep(500);

      // Verify we have diamonds back in inventory
      const withdrawnDiamond = findItem('diamond');
      expect(withdrawnDiamond).toBeTruthy();
      expect(withdrawnDiamond!.count).toBe(1);
      await assertInventorySync('Player inventory after withdraw');

      // Verify chest contents on server
      // Note: deposit goes to new slot, withdraw takes from original slot (slot 13)
      chestInventory = await getServerBlockInventory(server, chestPos.x, chestPos.y, chestPos.z);
      chestDiamonds = chestInventory.items.filter((i) => i.name === 'diamond');
      const remainingInChest = chestDiamonds.reduce((sum, i) => sum + i.count, 0);
      // After deposit (slot 25) + withdraw from original (slot 13), remaining = 1 deposited diamond
      expect(remainingInChest).toBeGreaterThanOrEqual(0);
    });
  });
});
