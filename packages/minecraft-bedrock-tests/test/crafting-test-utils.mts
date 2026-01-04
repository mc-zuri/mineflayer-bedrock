/**
 * Shared utilities for crafting/workstation tests
 */
import type { Bot } from 'mineflayer';
import fs from 'fs';
import path from 'path';

// Packet names to capture for debugging
export const CAPTURE_PACKETS = [
  'crafting_data',
  'crafting_event',
  'item_stack_request',
  'item_stack_response',
  'inventory_transaction',
  'container_open',
  'container_close',
  'inventory_content',
  'inventory_slot',
];

// JSON replacer to handle BigInt values
export function jsonReplacer(_key: string, value: any): any {
  return typeof value === 'bigint' ? value.toString() : value;
}

export interface PacketCapture {
  name: string;
  data: any;
  timestamp: number;
}

/**
 * Sets up packet logging for crafting-related packets
 */
export function setupPacketLogging(
  bot: Bot,
  capturedPackets: PacketCapture[],
  craftingDataRef: { packet: any }
) {
  // Capture crafting_data packet (sent once at login)
  bot._client.on('crafting_data', (packet: any) => {
    craftingDataRef.packet = packet;
    capturedPackets.push({
      name: 'crafting_data',
      data: {
        recipes_count: packet.recipes?.length,
        clear_recipes: packet.clear_recipes,
        // Sample first few recipes
        sample_recipes: packet.recipes?.slice(0, 5),
      },
      timestamp: Date.now(),
    });
    console.log(`[PACKET] crafting_data: ${packet.recipes?.length} recipes`);
  });

  // Capture other crafting-related packets
  for (const packetName of CAPTURE_PACKETS) {
    if (packetName === 'crafting_data') continue; // Already handled above

    bot._client.on(packetName, (packet: any) => {
      capturedPackets.push({
        name: packetName,
        data: packet,
        timestamp: Date.now(),
      });
      console.log(`[PACKET] ${packetName}:`, JSON.stringify(packet, jsonReplacer).substring(0, 200));
    });
  }
}

/**
 * Save captured packets to file
 */
export function saveCapturedPackets(capturedPackets: PacketCapture[], filename: string) {
  if (capturedPackets.length > 0) {
    const outputDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(outputDir, filename),
      JSON.stringify(capturedPackets, (_k, v) => typeof v === 'bigint' ? v.toString() : v, 2)
    );
    console.log(`Saved ${capturedPackets.length} captured packets to temp/${filename}`);
  }
}

/**
 * Inventory helpers
 */
export function createInventoryHelpers(bot: Bot) {
  function getSlotItems() {
    return bot.inventory.slots.filter(Boolean);
  }

  function hasItem(name: string) {
    return getSlotItems().some((i) => i?.name === name);
  }

  function findItem(name: string) {
    return getSlotItems().find((i) => i?.name === name);
  }

  function countItem(name: string) {
    return getSlotItems()
      .filter((i) => i?.name === name)
      .reduce((sum, i) => sum + (i?.count || 0), 0);
  }

  return { getSlotItems, hasItem, findItem, countItem };
}
