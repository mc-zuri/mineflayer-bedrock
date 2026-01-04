// Internal (mock) server
export {
  startServer,
  waitForClientConnect,
  initializeClient,
  setupServer,
  // Mock server response handlers
  setupChatEchoHandler,
  setupCommandHandler,
  simulateGive,
  simulateClear,
  resetSlotCounter,
} from './internal/internal-server.ts';
export { getDataBuilder } from './internal/internal-server-data.ts';
export { BedrockReplayClient, createReplayClient } from './internal/replay-client.ts';

// External (BDS) server
export {
  startExternalServer,
  ensureBDSInstalled,
  getWorkerId,
  getWorkerPort,
  type ExternalServer,
  type ExternalServerOptions
} from './external/external-server.ts';

export {
  withExternalServer,
  connectBotToExternalServer,
  waitForBotSpawn,
  waitFor,
  sleep,
  // Server commands
  giveItem,
  clearInventory,
  teleportPlayer,
  teleportPlayerAndSync,
  setGamemode,
  setBlock,
  fill,
  killEntities,
  // Server state verification
  pingBehaviorPack,
  getServerInventory,
  getServerPlayerState,
  getServerBlockInventory,
  clearInventoryViaBehaviorPack,
  compareInventory,
  assertInventoryMatch,
  getClientInventory,
  // Types
  type ServerInventoryItem,
  type ServerPlayerState,
  type ServerBlockInventory,
  type InventoryDiff,
} from './external/external-test-utils.ts';

// Common utilities
export { PacketDumpReader } from './common/packet-dump-reader.ts';
export { PacketDumpWriter } from './common/packet-dump-writer.ts';

// Mock client for network-free testing
export {
  MockBedrockClient,
  createMockClient,
} from './mock/mock-client.ts';
export {
  type MockPacketCapture,
  type MockClientOptions,
  type AutoResponderHandler,
  type AutoResponderResult,
} from './mock/mock-client-types.ts';
export {
  createAutoResponders,
  installAllAutoResponders,
  type AutoResponders,
} from './mock/auto-responders.ts';
export {
  createTestBot,
  waitForInjectAllowed,
  waitForSpawn,
  injectStartSequence,
  injectInventoryContent,
  injectInventorySlot,
  delay,
  tick,
  type TestBotOptions,
  type TestBotResult,
} from './mock/test-helpers.ts';
