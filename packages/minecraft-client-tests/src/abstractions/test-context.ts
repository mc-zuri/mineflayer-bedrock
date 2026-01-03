import type { Bot, BotOptions } from 'mineflayer';
import type { ITestServer, ServerEdition, ServerMode } from './server.ts';
import type { ITestUtilities } from './utilities.ts';

export interface TestBotConfig extends Partial<BotOptions> {
  username?: string;
  viewDistance?: number | string;
}

export interface TestBot extends Bot {
  /** Test utilities attached to the bot */
  test: ITestUtilities;
}

export interface ITestContext {
  /** Server instance */
  server: ITestServer;

  /** Bot instance with test utilities */
  bot: TestBot;

  /** Server edition */
  edition: ServerEdition;

  /** Server mode */
  mode: ServerMode;

  /** Connect a bot to the server */
  connectBot(options?: TestBotConfig): Promise<TestBot>;

  /** Disconnect and cleanup bot */
  disconnectBot(): Promise<void>;

  /** Wait for bot to spawn */
  waitForSpawn(timeout?: number): Promise<void>;
}
