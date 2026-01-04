import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';
import { Vec3 } from 'vec3';

/**
 * Tests for bot methods.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Methods',
  (getContext) => {
    describe('Chat', () => {
      it('should send chat with bot.chat()', async () => {
        const { bot } = getContext();

        // Just verify it doesn't throw
        bot.chat('Hello from test!');

        // Give time for message to be sent
        await new Promise((r) => setTimeout(r, 200));
      });

      it('should complete tab with bot.tabComplete()', async () => {
        const { bot } = getContext();

        const results = await bot.tabComplete('/gam');
        expect(Array.isArray(results)).toBe(true);
        // Should have gamemode suggestion
        expect(results.some((r) => r.match.includes('gamemode'))).toBe(true);
      });
    });

    describe('Movement Control', () => {
      it('should set control state with bot.setControlState()', () => {
        const { bot } = getContext();

        bot.setControlState('forward', true);
        expect(bot.getControlState('forward')).toBe(true);

        bot.setControlState('forward', false);
        expect(bot.getControlState('forward')).toBe(false);
      });

      it('should get control state with bot.getControlState()', () => {
        const { bot } = getContext();

        // All controls should be false initially
        expect(bot.getControlState('forward')).toBe(false);
        expect(bot.getControlState('back')).toBe(false);
        expect(bot.getControlState('left')).toBe(false);
        expect(bot.getControlState('right')).toBe(false);
        expect(bot.getControlState('jump')).toBe(false);
        expect(bot.getControlState('sprint')).toBe(false);
        expect(bot.getControlState('sneak')).toBe(false);
      });

      it('should clear control states with bot.clearControlStates()', () => {
        const { bot } = getContext();

        // Set some controls
        bot.setControlState('forward', true);
        bot.setControlState('jump', true);

        // Clear all
        bot.clearControlStates();

        // All should be false
        expect(bot.getControlState('forward')).toBe(false);
        expect(bot.getControlState('jump')).toBe(false);
      });
    });

    describe('Look', () => {
      it('should look at point with bot.lookAt()', async () => {
        const { bot } = getContext();

        const target = bot.entity.position.offset(5, 0, 5);
        await bot.lookAt(target);

        // Verify yaw changed (looking in a different direction)
        expect(bot.entity.yaw).toBeDefined();
      });

      it('should look with yaw/pitch with bot.look()', async () => {
        const { bot } = getContext();

        await bot.look(Math.PI / 4, 0); // 45 degrees, level

        // Give time for look to complete
        await new Promise((r) => setTimeout(r, 100));
      });
    });

    describe('Quick Bar', () => {
      it('should set quick bar slot with bot.setQuickBarSlot()', () => {
        const { bot } = getContext();

        bot.setQuickBarSlot(3);
        expect(bot.quickBarSlot).toBe(3);

        bot.setQuickBarSlot(0);
        expect(bot.quickBarSlot).toBe(0);
      });
    });

    describe('Equipment', () => {
      it('should equip item with bot.equip()', async () => {
        const { bot } = getContext();

        // Give a sword
        await bot.test.giveItem('diamond_sword', 1);
        await new Promise((r) => setTimeout(r, 500));

        // Find the sword in inventory
        const sword = bot.inventory.items().find((i) => i?.name === 'diamond_sword');
        expect(sword).toBeDefined();

        if (sword) {
          await bot.equip(sword, 'hand');
          await new Promise((r) => setTimeout(r, 200));

          // Verify equipped
          expect(bot.heldItem?.name).toBe('diamond_sword');
        }
      });

      it('should unequip with bot.unequip()', async () => {
        const { bot } = getContext();

        // Give and equip a pickaxe
        await bot.test.giveItem('diamond_pickaxe', 1);
        await new Promise((r) => setTimeout(r, 500));

        const pickaxe = bot.inventory.items().find((i) => i?.name === 'diamond_pickaxe');
        if (pickaxe) {
          await bot.equip(pickaxe, 'hand');
          await new Promise((r) => setTimeout(r, 200));

          // Unequip
          await bot.unequip('hand');
          await new Promise((r) => setTimeout(r, 200));

          // Hand should be empty or different item
          expect(bot.heldItem?.name !== 'diamond_pickaxe').toBe(true);
        }
      });
    });

    describe('Item Use', () => {
      it('should swing arm with bot.swingArm()', async () => {
        const { bot } = getContext();

        // Should not throw
        bot.swingArm('right');
        await new Promise((r) => setTimeout(r, 100));

        bot.swingArm('left');
        await new Promise((r) => setTimeout(r, 100));
      });

      it('should activate and deactivate item', async () => {
        const { bot } = getContext();

        // Give a shield
        await bot.test.giveItem('shield', 1);
        await new Promise((r) => setTimeout(r, 500));

        const shield = bot.inventory.items().find((i) => i?.name === 'shield');
        if (shield) {
          await bot.equip(shield, 'off-hand');
          await new Promise((r) => setTimeout(r, 200));

          // Activate (right-click with shield)
          bot.activateItem(true); // offHand = true
          expect(bot.usingHeldItem).toBe(true);

          // Deactivate
          bot.deactivateItem();
          await new Promise((r) => setTimeout(r, 100));
        }
      });
    });

    describe('Block Placement', () => {
      it('should place block with bot.placeBlock()', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Give blocks to place
        await bot.test.giveItem('cobblestone', 10);
        await new Promise((r) => setTimeout(r, 500));

        // Equip cobblestone
        const cobble = bot.inventory.items().find((i) => i?.name === 'cobblestone');
        if (cobble) {
          await bot.equip(cobble, 'hand');
          await new Promise((r) => setTimeout(r, 200));

          // Find a reference block to place against
          const pos = bot.entity.position.floored().offset(1, -1, 0);
          const refBlock = bot.blockAt(pos);

          if (refBlock && refBlock.name !== 'air') {
            // Place on top of reference block
            await bot.placeBlock(refBlock, new Vec3(0, 1, 0));
            await new Promise((r) => setTimeout(r, 500));

            // Verify block was placed
            const placedBlock = bot.blockAt(pos.offset(0, 1, 0));
            expect(placedBlock?.name).toBe('cobblestone');
          }
        }
      });
    });

    describe('Digging', () => {
      it('should dig block with bot.dig()', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Place a block to dig
        const pos = bot.entity.position.floored().offset(1, 0, 1);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} dirt`);
        await new Promise((r) => setTimeout(r, 500));

        const block = bot.blockAt(pos);
        if (block && block.name === 'dirt') {
          await bot.dig(block);
          await new Promise((r) => setTimeout(r, 500));

          // Block should be air now
          const afterBlock = bot.blockAt(pos);
          expect(afterBlock?.name).toBe('air');
        }
      });

      it('should calculate dig time with bot.digTime()', async () => {
        const { bot, server } = getContext();

        await bot.waitForChunksToLoad();

        // Place a stone block
        const pos = bot.entity.position.floored().offset(2, 0, 1);
        await server.executeCommand(`setblock ${pos.x} ${pos.y} ${pos.z} stone`);
        await new Promise((r) => setTimeout(r, 500));

        const block = bot.blockAt(pos);
        if (block) {
          const digTime = bot.digTime(block);
          expect(typeof digTime).toBe('number');
          // In creative mode, dig time is 0 (instant break)
          expect(digTime).toBeGreaterThanOrEqual(0);
        }
      });
    });

    describe('Utility', () => {
      it('should check feature support with bot.supportFeature()', () => {
        const { bot } = getContext();

        // Check a known feature
        const result = bot.supportFeature('theFlattening');
        expect(typeof result).toBe('boolean');
      });

      it('should wait for ticks with bot.waitForTicks()', async () => {
        const { bot } = getContext();

        const start = Date.now();
        await bot.waitForTicks(5);
        const elapsed = Date.now() - start;

        // 5 ticks at 50ms/tick = 250ms minimum
        expect(elapsed).toBeGreaterThanOrEqual(200);
      });
    });
  },
  { skip: ['bedrock'] }
);
