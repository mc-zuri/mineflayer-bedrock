export { BaseTestUtilities } from './shared.ts';
export { JavaTestUtilities } from './java.ts';
export { BedrockTestUtilities } from './bedrock.ts';

import type { Bot } from 'mineflayer';
import type { ITestServer, ServerEdition } from '../abstractions/server.ts';
import type { ITestUtilities } from '../abstractions/utilities.ts';
import { JavaTestUtilities } from './java.ts';
import { BedrockTestUtilities } from './bedrock.ts';

/**
 * Create test utilities for the given edition.
 */
export function createTestUtilities(
  edition: ServerEdition,
  bot: Bot,
  server: ITestServer
): ITestUtilities {
  if (edition === 'java') {
    return new JavaTestUtilities(bot, server);
  } else {
    return new BedrockTestUtilities(bot, server);
  }
}
