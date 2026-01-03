// BDS Server Management
export { startBDSServer, ensureBDSInstalled, getWorkerId, getWorkerPort, type BDSServer, type BDSServerOptions } from './bds-server.ts';

// Test Utilities
export {
  withBDSServer,
  connectBotToBDS,
  waitForBotSpawn,
  waitFor,
  sleep,
  // Server commands
  giveItem,
  clearInventory,
  teleportPlayer,
  setGamemode,
  setBlock,
  fill,
  killEntities,
  // Server state verification (requires test_helper behavior pack)
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
} from './bds-test-utils.ts';
