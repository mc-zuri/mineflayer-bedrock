// prettier-ignore-line-length
import { Server, type Player, type Version } from "bedrock-protocol";
import {
  subchunkPayloads,
  levelChunkPayload,
  initPacketSequence,
  type PacketAction,
  getDataBuilder,
} from "./internal-server-data.ts";

/**
 * Maps variant packet names to their actual protocol packet names.
 * For example, "inventory_content_2" -> "inventory_content"
 * This is used because the packet sequence uses numbered variants to
 * distinguish between different inventory types (main, armor, ui, offhand)
 * but they all use the same protocol packet name "inventory_content".
 */
function getActualPacketName(packetName: string): string {
  // Handle numbered variants of packets
  const variantMatch = packetName.match(/^(.+?)_\d+$/);
  if (variantMatch) {
    const baseName = variantMatch[1];
    // Only map known variant packets, not all numbered packets
    if (baseName === 'inventory_content' || baseName === 'inventory_slot' ||
        baseName === 'inventory_transaction' || baseName === 'set_time') {
      return baseName;
    }
  }
  return packetName;
}

export async function startServer(host: string, port: number, version: Version) {
  const server = new Server({
    offline: true,
    version: version,
    host: host,
    port: port,
  });
  await server.listen();

  return server;
}

export async function waitForClientConnect(server: Server): Promise<Player> {
  return new Promise((resolve) => {
    server.on("connect", async (client) => {
      resolve(client);
    });
  });
}

export async function initializeClient(client: Player, data: any) {
  // Setup subchunk request handler
  client.on("packet", (packet) => {
    if (packet.data.name === "subchunk_request") {
      client.write("subchunk", {
        cache_enabled: false,
        dimension: 0,
        entries: packet.data.params.requests.map((req) => ({
          dx: req.dx,
          dy: req.dy,
          dz: req.dz,
          heightmap_type: "too_high",
          payload: subchunkPayloads[req.dy],
          render_heightmap_type: "too_high",
          result: "success",
        })),
        origin: { x: 0, y: 0, z: 0 },
      });
    }
  });

  // Track which inventory_content we've sent to apply correct transform
  let inventoryContentCount = 0;

  function getPacketParams(data: any, packetName: string): any {
    // Apply transforms for specific packets that need dynamic data
    if (packetName === "inventory_content") {
      inventoryContentCount++;
      if (inventoryContentCount === 1) {
        // First inventory_content uses player inventory items
        return get_initial_inventory_content(data);
      } else if (inventoryContentCount === 2) {
        // Second inventory_content uses armor slots
        return get_initial_armor_content(data);
      }
    }
    // Default: use packet data directly
    return data[packetName];
  }

  // Execute the packet sequence
  for (const action of initPacketSequence) {
    await executeAction(client, data, action);
  }

  return;

  async function executeAction(client: Player, data: any, action: PacketAction) {
    switch (action.type) {
      case "sleep":
        await sleep(action.ms);
        break;

      case "waitFor":
        await waitFor(action.packetName);
        break;

      case "write":
        client.write(action.packetName, data[action.packetName]);
        break;

      case "queue":
        // Apply transforms for specific packets
        const params = getPacketParams(data, action.packetName);
        // Map variant packet names to actual protocol packet names
        // e.g., "inventory_content_2" -> "inventory_content"
        const actualPacketName = getActualPacketName(action.packetName);
        client.queue(actualPacketName, params);
        break;

      case "levelChunks":
        for (const [x, z] of spiralCoordinates(action.distance)) {
          client.queue("level_chunk", {
            x: x,
            z: z,
            dimension: 0,
            sub_chunk_count: -2,
            highest_subchunk_count: 3,
            cache_enabled: false,
            payload: levelChunkPayload,
          });
        }
        break;
    }
  }

  async function waitFor(name: string) {
    return new Promise<any>((resolve) => {
      client.once(name, (data: any) => {
        resolve(data);
      });
    });
  }

  async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export async function setupServer(
  data: any,
  onClientConnect: (client: Player) => void
) {
  const server = new Server({
    offline: true,
    version: "1.21.130",
    host: "192.168.1.13",
    port: 19150,
  });

  await server.listen();

  const playerReaderPromise = new Promise<{ client: Player }>((resolve) => {
    server.on("connect", async (client) => {
      onClientConnect(client);
    });
  });

  return {
    server,
    waitUntilPlayerInitialized: async () => await playerReaderPromise,
  };
}

function* spiralCoordinates(
  maxDistance: number = 5
): Generator<[number, number]> {
  // Start from distance 2 (based on your pattern)
  for (let dist = -1; dist <= maxDistance; dist++) {
    const coords: Array<[number, number]> = [];

    // Generate all points at this Chebyshev distance
    for (let x = -dist; x <= dist; x++) {
      for (let y = -dist; y <= dist; y++) {
        // Skip origin and points closer than current distance
        if (Math.max(Math.abs(x), Math.abs(y)) === dist) {
          coords.push([x, y]);
        }
      }
    }

    // Sort by Manhattan distance first, then by a custom order
    coords.sort((a, b) => {
      const distA = Math.abs(a[0]) + Math.abs(a[1]);
      const distB = Math.abs(b[0]) + Math.abs(b[1]);

      if (distA !== distB) return distA - distB;

      // Secondary sort for same Manhattan distance
      // Prefer non-zero coords, then by absolute values
      const absA = Math.abs(a[0]) + Math.abs(a[1]) * 100;
      const absB = Math.abs(b[0]) + Math.abs(b[1]) * 100;
      return absA - absB;
    });

    for (const coord of coords) {
      yield coord;
    }
  }
}

function get_initial_inventory_transaction(data) {
  const inventory_transaction = {
    transaction: {
      legacy: {
        legacy_request_id: 0,
      },
      transaction_type: "normal",
      actions: [],
    },
  };
  for (let slot = 0; slot < 35; slot++) {
    const item = data.inventoryItems[slot];
    if (item.network_id !== 0) {
      inventory_transaction.transaction.actions.push({
        source_type: "container",
        inventory_id: "inventory",
        slot: 9,
        old_item: {
          network_id: 0,
        },
        new_item: {
          network_id: 0,
        },
      });
    }
  }

  return inventory_transaction;
}

function get_initial_inventory_content(data) {
  const inventory_content = {
    window_id: "inventory",
    input: data.inventoryItems,
    container: {
      container_id: "anvil_input",
    },
    storage_item: {
      network_id: 0,
    },
  };

  return inventory_content;
}

function get_initial_armor_content(data) {
  const inventory_content = {
    window_id: "armor",
    input: [
      data.inventory_slot.item,
      data.inventory_slot_2.item,
      data.inventory_slot_3.item,
      data.inventory_slot_4.item,
      data.inventory_slot_5.item,
    ],
    container: {
      container_id: "anvil_input",
    },
    storage_item: {
      network_id: 0,
    },
  };

  return inventory_content;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Mock Server Response Handlers
// ============================================================

/**
 * Sets up a handler that echoes chat messages back to the client.
 * Use this to make chat tests pass with mock servers.
 *
 * Text packet structure for 1.21.130 "chat" type:
 * - type: "chat"
 * - needs_translation: bool
 * - category: "authored"
 * - chat/whisper/announcement: strings for type mapping
 * - source_name: string
 * - message: string
 * - xuid: string
 * - platform_chat_id: string
 * - has_filtered_message: bool
 */
export function setupChatEchoHandler(client: Player) {
  client.on("text", (packet: any) => {
    // Echo back chat messages - mirror the exact packet structure including
    // the 1.21.130 specific fields (category, has_filtered_message, etc.)
    const response = {
      type: "chat",
      needs_translation: false,
      category: "authored",
      chat: "chat",
      whisper: "whisper",
      announcement: "announcement",
      source_name: packet.source_name || "BedrockBot",
      message: packet.message,
      xuid: "",
      platform_chat_id: "",
      has_filtered_message: false,
    };

    try {
      client.queue("text", response);
    } catch (e) {
      console.error("[MockServer] Error sending text packet:", e);
    }
  });
}

// Track next available slot for simulateGive
let nextSlot = 0;

/**
 * Simulates giving an item to the player by sending inventory_slot packet.
 *
 * Packet structure:
 * - window_id: WindowIDVarint ("inventory", "armor", etc.)
 * - slot: varint
 * - container: FullContainerName { container_id, dynamic_container_id }
 * - storage_item: Item
 * - item: Item
 */
export function simulateGive(
  client: Player,
  dataBuilder: ReturnType<typeof getDataBuilder>,
  args: string[]
): void {
  // Parse: give <player> <item> [count]
  // or: give <item> [count] (for @s)
  let itemName: string;
  let count = 1;

  if (args[0]?.startsWith("@") || args.length > 2) {
    // First arg is selector/player, second is item
    itemName = args[1] || "stone";
    count = parseInt(args[2]) || 1;
  } else {
    // First arg is item
    itemName = args[0] || "stone";
    count = parseInt(args[1]) || 1;
  }

  const stackId = Date.now() % 10000;
  const slot = nextSlot;
  nextSlot = (nextSlot + 1) % 36; // Cycle through inventory slots

  try {
    const itemData = dataBuilder.toNotch(itemName, count, stackId);

    // Use queue instead of write for proper packet batching
    client.queue("inventory_slot", {
      window_id: "inventory",
      slot: slot,
      container: {
        container_id: "hotbar_and_inventory",
        dynamic_container_id: undefined,
      },
      storage_item: { network_id: 0 },
      item: itemData,
    });
  } catch (e) {
    console.log(`[MockServer] Failed to give item ${itemName}:`, e);
  }
}

/**
 * Resets the next slot counter for simulateGive.
 * Call this when starting a new test to ensure consistent behavior.
 */
export function resetSlotCounter(): void {
  nextSlot = 0;
}

/**
 * Simulates clearing player inventory by sending empty inventory_content.
 */
export function simulateClear(client: Player): void {
  const emptyItems = Array(36).fill({ network_id: 0 });

  // Reset slot counter since inventory is now empty
  nextSlot = 0;

  // Use queue instead of write for proper packet batching
  client.queue("inventory_content", {
    window_id: "inventory",
    input: emptyItems,
    container: {
      container_id: "hotbar_and_inventory",
      dynamic_container_id: undefined,
    },
    storage_item: {
      network_id: 0,
    },
  });
}

/**
 * Sets up a handler for command_request packets.
 * Handles common commands like /give, /clear, /say.
 */
export function setupCommandHandler(
  client: Player,
  dataBuilder: ReturnType<typeof getDataBuilder>,
  customHandlers?: Record<string, (args: string[]) => void>
) {
  client.on("command_request", (packet: any) => {
    const command = packet.command.replace(/^\//, "");
    const parts = command.split(" ");
    const cmd = parts[0].toLowerCase();

    // Built-in handlers
    switch (cmd) {
      case "give":
        simulateGive(client, dataBuilder, parts.slice(1));
        break;

      case "clear":
        simulateClear(client);
        break;

      case "say":
        // Echo /say as server announcement with 1.21.130 format
        client.queue("text", {
          type: "announcement",
          needs_translation: false,
          category: "authored",
          chat: "chat",
          whisper: "whisper",
          announcement: "announcement",
          source_name: "Server",
          message: `[Server] ${parts.slice(1).join(" ")}`,
          xuid: "",
          platform_chat_id: "",
          has_filtered_message: false,
        });
        break;
    }

    // Custom handlers
    if (customHandlers?.[cmd]) {
      customHandlers[cmd](parts.slice(1));
    }
  });
}
