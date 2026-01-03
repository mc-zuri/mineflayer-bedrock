import type { ITestServer, ServerConfig } from '../abstractions/server.ts';
import { JavaRealServer } from './java/real-server.ts';
import { JavaMockServer } from './java/mock-server.ts';
import { BedrockRealServer } from './bedrock/real-server.ts';
import { BedrockMockServer } from './bedrock/mock-server.ts';

/**
 * Create a test server based on configuration.
 *
 * Supports:
 * - java/real: Real Java server using minecraft-wrap
 * - java/mock: Mock Java server using minecraft-protocol
 * - bedrock/real: Real Bedrock Dedicated Server
 * - bedrock/mock: Mock Bedrock server using bedrock-protocol
 */
export function createServer(config: ServerConfig): ITestServer {
  if (config.edition === 'java') {
    if (config.mode === 'real') {
      return new JavaRealServer(config);
    } else {
      return new JavaMockServer(config);
    }
  } else if (config.edition === 'bedrock') {
    if (config.mode === 'real') {
      return new BedrockRealServer(config);
    } else {
      return new BedrockMockServer(config);
    }
  }

  throw new Error(`Unknown server configuration: ${config.edition}/${config.mode}`);
}
