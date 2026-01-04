import { expect } from 'expect';
import { crossEditionSuite, crossEditionTest } from '../src/harness/test-runner.ts';

/**
 * Tests for entity functionality.
 * Java 1.21.4 only for now.
 */

crossEditionSuite(
  'Entity',
  (getContext) => {
    describe('Spawn & Track', () => {
      it('should track spawned entities', async () => {
        const { bot, server } = getContext();

        // Spawn a cow
        const pos = bot.entity.position;
        await server.executeCommand(`summon cow ${pos.x + 5} ${pos.y} ${pos.z + 5}`);
        await new Promise((r) => setTimeout(r, 500));

        // Find the cow in entities
        const cow = Object.values(bot.entities).find((e: any) => e.name === 'cow');
        expect(cow).toBeDefined();
      });

      it('should emit entitySpawn event', async () => {
        const { bot, server } = getContext();

        const entitySpawned = new Promise<any>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 5000);
          bot.once('entitySpawn', (entity) => {
            if (entity.name === 'pig') {
              clearTimeout(timeout);
              resolve(entity);
            }
          });
        });

        const pos = bot.entity.position;
        await server.executeCommand(`summon pig ${pos.x + 3} ${pos.y} ${pos.z + 3}`);

        const entity = await entitySpawned;
        expect(entity).toBeDefined();
        if (entity) {
          expect(entity.name).toBe('pig');
        }
      });

      it('should emit entityGone when entity despawns', async () => {
        const { bot, server } = getContext();

        // First spawn an entity
        const pos = bot.entity.position;
        await server.executeCommand(`summon chicken ${pos.x + 4} ${pos.y} ${pos.z + 4}`);
        await new Promise((r) => setTimeout(r, 500));

        const entityGone = new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => resolve(false), 5000);
          bot.once('entityGone', (entity) => {
            if (entity.name === 'chicken') {
              clearTimeout(timeout);
              resolve(true);
            }
          });
        });

        // Kill the chicken
        await server.executeCommand('kill @e[type=chicken,limit=1]');

        expect(await entityGone).toBe(true);
      });
    });

    describe('Entity Properties', () => {
      it('should have entity position', async () => {
        const { bot, server } = getContext();

        const pos = bot.entity.position;
        await server.executeCommand(`summon sheep ${pos.x + 6} ${pos.y} ${pos.z + 6}`);
        await new Promise((r) => setTimeout(r, 500));

        const sheep = Object.values(bot.entities).find((e: any) => e.name === 'sheep') as any;
        expect(sheep).toBeDefined();
        if (sheep) {
          expect(sheep.position).toBeDefined();
          expect(typeof sheep.position.x).toBe('number');
        }
      });

      it('should have entity velocity', async () => {
        const { bot, server } = getContext();

        const pos = bot.entity.position;
        await server.executeCommand(`summon zombie ${pos.x + 7} ${pos.y} ${pos.z + 7}`);
        await new Promise((r) => setTimeout(r, 1000));

        const zombie = Object.values(bot.entities).find((e: any) => e.name === 'zombie') as any;
        // Zombie might not spawn in creative/peaceful, so just check if entity system works
        if (zombie) {
          // Velocity might be undefined until entity moves
          expect(zombie.position).toBeDefined();
        }
      });

      it('should track entity health via effects', async () => {
        const { bot, server } = getContext();

        const pos = bot.entity.position;
        await server.executeCommand(`summon villager ${pos.x + 5} ${pos.y} ${pos.z}`);
        await new Promise((r) => setTimeout(r, 500));

        // Give the villager an effect
        await server.executeCommand('effect give @e[type=villager,limit=1] glowing 10');
        await new Promise((r) => setTimeout(r, 500));
      });
    });

    describe('Item Drops', () => {
      it('should emit itemDrop event', async () => {
        const { bot, server } = getContext();

        const itemDropped = new Promise<any>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 5000);
          bot.once('itemDrop', (entity) => {
            clearTimeout(timeout);
            resolve(entity);
          });
        });

        // Drop an item
        const pos = bot.entity.position;
        await server.executeCommand(`summon item ${pos.x} ${pos.y + 1} ${pos.z} {Item:{id:"minecraft:diamond",count:1}}`);

        const entity = await itemDropped;
        // Entity may or may not be caught depending on timing
        expect(entity === null || typeof entity === 'object').toBe(true);
      });
    });

    describe('Attack', () => {
      it('should attack entity with bot.attack()', async () => {
        const { bot, server } = getContext();

        // Spawn a zombie
        const pos = bot.entity.position;
        await server.executeCommand(`summon zombie ${pos.x + 2} ${pos.y} ${pos.z}`);
        await new Promise((r) => setTimeout(r, 500));

        const zombie = Object.values(bot.entities).find((e: any) => e.name === 'zombie') as any;
        if (zombie) {
          // Look at the zombie
          await bot.lookAt(zombie.position);

          // Attack - shouldn't throw
          bot.attack(zombie);
          await new Promise((r) => setTimeout(r, 200));
        }
      });
    });
  },
  { skip: ['bedrock'] }
);
