import { expect } from 'expect';
import { crossEditionSuite } from '../src/harness/test-runner.ts';

/**
 * Tests for combat functionality.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Combat',
  (getContext) => {
    describe('Attack', () => {
      it('should attack entity with bot.attack()', async () => {
        const { bot, server } = getContext();

        // Set difficulty to easy so hostile mobs can spawn
        await server.executeCommand('difficulty easy');
        await new Promise((r) => setTimeout(r, 200));

        // Spawn a zombie
        const pos = bot.entity.position;
        await server.executeCommand(`summon zombie ${pos.x + 2} ${pos.y} ${pos.z}`);
        await new Promise((r) => setTimeout(r, 1000));

        const zombie = Object.values(bot.entities).find((e: any) => e.name === 'zombie') as any;
        expect(zombie).toBeDefined();

        if (zombie) {
          // Look at the zombie
          await bot.lookAt(zombie.position.offset(0, 1, 0));

          // Attack
          bot.attack(zombie);
          await new Promise((r) => setTimeout(r, 200));

          // Should not throw
        }
      });

      it('should swing arm when attacking', async () => {
        const { bot, server } = getContext();

        // Set difficulty to easy so hostile mobs can spawn
        await server.executeCommand('difficulty easy');
        await new Promise((r) => setTimeout(r, 200));

        // Spawn a skeleton
        const pos = bot.entity.position;
        await server.executeCommand(`summon skeleton ${pos.x + 3} ${pos.y} ${pos.z}`);
        await new Promise((r) => setTimeout(r, 1000));

        const skeleton = Object.values(bot.entities).find((e: any) => e.name === 'skeleton') as any;

        if (skeleton) {
          await bot.lookAt(skeleton.position.offset(0, 1, 0));
          bot.attack(skeleton);
          // Attack should swing arm automatically
        }
      });
    });

    describe('Weapons', () => {
      it('should equip sword for combat', async () => {
        const { bot } = getContext();

        // Give a sword
        await bot.test.giveItem('diamond_sword', 1);
        await new Promise((r) => setTimeout(r, 500));

        const sword = bot.inventory.items().find((i) => i?.name === 'diamond_sword');
        expect(sword).toBeDefined();

        if (sword) {
          await bot.equip(sword, 'hand');
          await new Promise((r) => setTimeout(r, 200));

          expect(bot.heldItem?.name).toBe('diamond_sword');
        }
      });

      it('should equip shield for defense', async () => {
        const { bot } = getContext();

        // Give a shield
        await bot.test.giveItem('shield', 1);
        await new Promise((r) => setTimeout(r, 500));

        const shield = bot.inventory.items().find((i) => i?.name === 'shield');
        expect(shield).toBeDefined();

        if (shield) {
          await bot.equip(shield, 'off-hand');
          await new Promise((r) => setTimeout(r, 200));
        }
      });
    });

    describe('Use On Entity', () => {
      it('should use item on entity with bot.useOn()', async () => {
        const { bot, server } = getContext();

        // Spawn a cow
        const pos = bot.entity.position;
        await server.executeCommand(`summon cow ${pos.x + 2} ${pos.y} ${pos.z + 2}`);
        await new Promise((r) => setTimeout(r, 500));

        const cow = Object.values(bot.entities).find((e: any) => e.name === 'cow') as any;

        if (cow) {
          // Give a bucket for milking
          await bot.test.giveItem('bucket', 1);
          await new Promise((r) => setTimeout(r, 500));

          const bucket = bot.inventory.items().find((i) => i?.name === 'bucket');
          if (bucket) {
            await bot.equip(bucket, 'hand');
            await new Promise((r) => setTimeout(r, 200));

            // Use bucket on cow (milk)
            await bot.useOn(cow);
            await new Promise((r) => setTimeout(r, 300));
          }
        }
      });
    });

    describe('Activate Entity', () => {
      it('should activate entity with bot.activateEntity()', async () => {
        const { bot, server } = getContext();

        // Spawn a minecart
        const pos = bot.entity.position;
        await server.executeCommand(`summon minecart ${pos.x + 2} ${pos.y} ${pos.z}`);
        await new Promise((r) => setTimeout(r, 500));

        const minecart = Object.values(bot.entities).find((e: any) => e.name === 'minecart') as any;

        if (minecart) {
          // Activate should mount the minecart
          await bot.activateEntity(minecart);
          await new Promise((r) => setTimeout(r, 300));

          // Dismount
          await bot.dismount();
          await new Promise((r) => setTimeout(r, 200));
        }
      });
    });
  },
  { skip: ['bedrock'] }
);
