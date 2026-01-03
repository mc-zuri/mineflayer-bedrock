import mineflayer, { type Bot } from 'mineflayer';
import type { ITestContext, TestBot, TestBotConfig } from '../abstractions/test-context.ts';
import type { ITestServer, ServerEdition, ServerMode } from '../abstractions/server.ts';
import { createServer } from '../servers/factory.ts';
import { createTestUtilities } from '../utilities/index.ts';
import { loadConfig, getVersionForEdition, type TestConfig } from './config.ts';

/**
 * Create a test context for a specific server configuration.
 */
function createTestContext(server: ITestServer): ITestContext {
  let currentBot: TestBot | null = null;

  const context: ITestContext = {
    server,
    get bot(): TestBot {
      if (!currentBot) {
        throw new Error('Bot not connected. Call connectBot() first.');
      }
      return currentBot;
    },
    edition: server.edition,
    mode: server.mode,

    async connectBot(options?: TestBotConfig): Promise<TestBot> {
      const version =
        server.edition === 'bedrock' ? `bedrock_${server.version}` : server.version;

      const bot = mineflayer.createBot({
        host: server.host,
        port: server.port,
        version,
        auth: 'offline',
        username: options?.username || 'TestBot',
        // @ts-ignore - offline mode for Bedrock
        offline: true,
        ...options,
      }) as TestBot;

      // Attach test utilities
      bot.test = createTestUtilities(server.edition, bot, server);

      currentBot = bot;
      return bot;
    },

    async disconnectBot(): Promise<void> {
      if (currentBot) {
        try {
          // For Bedrock, use close(); for Java, use end()
          if (currentBot._client && typeof currentBot._client.close === 'function') {
            currentBot._client.close();
          } else if (currentBot._client && typeof currentBot._client.end === 'function') {
            currentBot._client.end();
          }
        } catch (e) {
          // Ignore disconnect errors
        }
        currentBot = null;
      }
    },

    async waitForSpawn(timeout = 30000): Promise<void> {
      if (!currentBot) {
        throw new Error('Bot not connected. Call connectBot() first.');
      }

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Timeout waiting for bot to spawn'));
        }, timeout);

        currentBot!.once('spawn', () => {
          clearTimeout(timer);
          resolve();
        });

        currentBot!.once('error', (err) => {
          clearTimeout(timer);
          reject(err);
        });

        currentBot!.once('kicked', (reason) => {
          clearTimeout(timer);
          reject(new Error(`Bot was kicked: ${reason}`));
        });
      });
    },
  };

  return context;
}

export interface CrossEditionTestOptions {
  /** Editions to skip */
  skip?: ServerEdition[];
  /** Custom config override */
  config?: Partial<TestConfig>;
  /** Whether to reset state before each test */
  resetState?: boolean;
}

/**
 * Run a test function across all configured editions and modes.
 *
 * This creates a Mocha describe block for each edition/mode combination
 * and runs the test function with the appropriate context.
 *
 * @example
 * ```typescript
 * crossEditionTest('inventory: give item', async (ctx) => {
 *   await ctx.bot.test.giveItem('diamond', 64);
 *   expect(ctx.bot.inventory.items().some(i => i?.name === 'diamond')).toBe(true);
 * });
 * ```
 */
export function crossEditionTest(
  name: string,
  testFn: (ctx: ITestContext) => Promise<void>,
  options?: CrossEditionTestOptions
): void {
  const config = { ...loadConfig(), ...options?.config };

  for (const edition of config.editions) {
    if (options?.skip?.includes(edition)) continue;

    for (const mode of config.modes) {
      const version = getVersionForEdition(edition, config);

      describe(`${name} [${edition}/${mode}]`, function () {
        // @ts-ignore - Mocha this context
        this.timeout(config.timeout);

        let ctx: ITestContext;

        before(async function () {
          // @ts-ignore - Mocha this context
          this.timeout(config.timeout);

          const server = createServer({
            edition,
            mode,
            version,
            autoDownload: config.autoDownload,
          });

          await server.start();
          ctx = createTestContext(server);
        });

        after(async function () {
          // @ts-ignore - Mocha this context
          this.timeout(30000);

          if (ctx) {
            await ctx.disconnectBot();
            await ctx.server.stop();
          }
        });

        beforeEach(async function () {
          // @ts-ignore - Mocha this context
          this.timeout(60000);

          await ctx.connectBot();
          await ctx.waitForSpawn();

          // Op the bot for commands
          await ctx.server.opPlayer(ctx.bot.username);
          await new Promise((r) => setTimeout(r, 500));

          // Reset state if enabled
          if (options?.resetState !== false) {
            await ctx.bot.test.resetState();
          }
        });

        afterEach(async function () {
          await ctx.disconnectBot();
        });

        it(name, async function () {
          await testFn(ctx);
        });
      });
    }
  }
}

/**
 * Create a test suite that runs multiple tests on the same server instance.
 *
 * @example
 * ```typescript
 * crossEditionSuite('inventory', (ctx) => {
 *   it('should give items', async () => {
 *     await ctx.bot.test.giveItem('diamond', 64);
 *     expect(ctx.bot.inventory.items().length).toBeGreaterThan(0);
 *   });
 *
 *   it('should clear inventory', async () => {
 *     await ctx.bot.test.clearInventory();
 *     expect(ctx.bot.inventory.items().length).toBe(0);
 *   });
 * });
 * ```
 */
export function crossEditionSuite(
  suiteName: string,
  setupTests: (getContext: () => ITestContext) => void,
  options?: CrossEditionTestOptions
): void {
  const config = { ...loadConfig(), ...options?.config };

  for (const edition of config.editions) {
    if (options?.skip?.includes(edition)) continue;

    for (const mode of config.modes) {
      const version = getVersionForEdition(edition, config);

      describe(`${suiteName} [${edition}/${mode}]`, function () {
        // @ts-ignore - Mocha this context
        this.timeout(config.timeout);

        let ctx: ITestContext;

        before(async function () {
          // @ts-ignore - Mocha this context
          this.timeout(config.timeout);

          const server = createServer({
            edition,
            mode,
            version,
            autoDownload: config.autoDownload,
          });

          await server.start();
          ctx = createTestContext(server);
        });

        after(async function () {
          // @ts-ignore - Mocha this context
          this.timeout(30000);

          if (ctx) {
            await ctx.disconnectBot();
            await ctx.server.stop();
          }
        });

        beforeEach(async function () {
          // @ts-ignore - Mocha this context
          this.timeout(60000);

          await ctx.connectBot();
          await ctx.waitForSpawn();

          // Op the bot for commands
          await ctx.server.opPlayer(ctx.bot.username);
          await new Promise((r) => setTimeout(r, 500));

          // Reset state if enabled
          if (options?.resetState !== false) {
            await ctx.bot.test.resetState();
          }
        });

        afterEach(async function () {
          await ctx.disconnectBot();
        });

        // Run the test setup function with a getter for the context
        setupTests(() => ctx);
      });
    }
  }
}
