/**
 * Test helper utilities for MockBedrockClient.
 *
 * These helpers simplify common testing patterns and reduce boilerplate.
 */

import { MockBedrockClient, createMockClient } from "./mock-client.ts";
import type { MockClientOptions } from "./mock-client-types.ts";
import { getDataBuilder } from "../internal/internal-server-data.ts";

// Import mineflayer types (bot interface)
type Bot = any; // We use any to avoid circular dependency on mineflayer

export interface TestBotOptions extends MockClientOptions {
  /** Username for the bot */
  username?: string;
  /** Whether to inject start sequence automatically */
  autoStart?: boolean;
}

export interface TestBotResult {
  bot: Bot;
  mockClient: MockBedrockClient;
  dataBuilder: ReturnType<typeof getDataBuilder>;
}

/**
 * Creates a test bot with a mock client.
 *
 * This is a convenience function that:
 * 1. Creates a MockBedrockClient
 * 2. Creates a mineflayer bot with the mock client injected
 * 3. Optionally injects the start sequence
 *
 * @example
 * ```typescript
 * const { bot, mockClient, dataBuilder } = await createTestBot();
 *
 * // Set up inventory
 * dataBuilder.setInventoryItem(0, 'diamond_sword', 1, 1001);
 *
 * // Inject inventory content
 * mockClient.inject('inventory_content', {
 *   window_id: 'inventory',
 *   input: dataBuilder.data.inventoryItems,
 *   ...
 * });
 *
 * // Verify bot state
 * expect(bot.inventory.slots[0].name).toBe('diamond_sword');
 * ```
 */
export async function createTestBot(
  options: TestBotOptions = {}
): Promise<TestBotResult> {
  const version = options.version ?? "1.21.130";
  const username = options.username ?? "TestBot";
  const autoStart = options.autoStart ?? true;

  // Create mock client
  const mockClient = createMockClient({
    version,
    validatePackets: options.validatePackets,
  });

  // Create data builder for packet data
  const dataBuilder = getDataBuilder(version);

  // Import mineflayer dynamically to avoid circular dependency
  const mineflayer = await import("mineflayer");

  // Create bot with mock client
  const bot = mineflayer.createBot({
    host: "127.0.0.1",
    port: 19132,
    version: `bedrock_${version}`,
    client: mockClient,
    auth: "offline",
    username,
  });

  // Wait for bot to be ready for plugins
  await waitForInjectAllowed(bot);

  // Inject start sequence if requested
  if (autoStart) {
    await injectStartSequence(mockClient, dataBuilder);
  }

  return { bot, mockClient, dataBuilder };
}

/**
 * Waits for the bot's inject_allowed event.
 */
export function waitForInjectAllowed(bot: Bot): Promise<void> {
  return new Promise((resolve) => {
    if (bot.registry) {
      resolve();
      return;
    }
    bot.once("inject_allowed", resolve);
  });
}

/**
 * Waits for the bot's spawn event.
 */
export function waitForSpawn(bot: Bot): Promise<void> {
  return new Promise((resolve) => {
    if (bot.entity) {
      resolve();
      return;
    }
    bot.once("spawn", resolve);
  });
}

/**
 * Injects the minimal start sequence needed to spawn the bot.
 *
 * This is a simplified version of initializeClient() from internal-server.ts
 * that only sends the essential packets for testing.
 */
export async function injectStartSequence(
  mockClient: MockBedrockClient,
  dataBuilder: ReturnType<typeof getDataBuilder>
): Promise<void> {
  const data = dataBuilder.data;

  // Essential packets for bot initialization
  const essentialPackets = [
    "start_game",
    "item_registry",
    "inventory_content",
    "inventory_content_2",
    "inventory_content_3",
    "inventory_content_4",
    "player_hotbar",
    "set_health",
    "play_status",
  ];

  for (const packetName of essentialPackets) {
    if (data[packetName]) {
      mockClient.inject(packetName, data[packetName]);
      // Allow event loop to process
      await new Promise((r) => setImmediate(r));
    }
  }
}

/**
 * Injects inventory content with the given items.
 */
export function injectInventoryContent(
  mockClient: MockBedrockClient,
  items: any[]
): void {
  mockClient.inject("inventory_content", {
    window_id: "inventory",
    input: items,
    container: { container_id: "anvil_input" },
    storage_item: { network_id: 0 },
  });
}

/**
 * Injects a single inventory slot update.
 */
export function injectInventorySlot(
  mockClient: MockBedrockClient,
  slot: number,
  item: any
): void {
  mockClient.inject("inventory_slot", {
    window_id: "inventory",
    slot,
    item,
    full_container_name: { container_id: "inventory" },
    storage_item: { network_id: 0 },
  });
}

/**
 * Delays for the specified number of milliseconds.
 * Useful for waiting in tests.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Allows the event loop to process pending events.
 * Useful after injecting packets to let handlers run.
 */
export function tick(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
