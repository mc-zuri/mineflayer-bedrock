import { createDeserializer, createSerializer } from "bedrock-protocol/src/transforms/serializer.js";
import * as packets from "../../packets/index.ts";
import registryLoader, { type RegistryBedrock } from "prismarine-registry";
import itemLoader, { type Item } from "prismarine-item";

// Subchunk payload data for responding to subchunk requests
export const subchunkPayloads: Record<number, Buffer> = {
  [-4]: Buffer.from(
    "0901fc03fefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffefffeff04898c9ca501bdc7f7fc0f",
    "hex"
  ),
  [-3]: Buffer.from("0901fd01bdc7f7fc0f", "hex"),
  [-2]: Buffer.from("0901fe01bdc7f7fc0f", "hex"),
  [-1]: Buffer.from(
    "0901ff050000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009500000095000000950000009506bdc7f7fc0ff3c188db0f97ddf69c04",
    "hex"
  ),
};

// Level chunk payload for flat world
export const levelChunkPayload = Buffer.from(
  "0102010201020102ffffffffffffffffffffffffffffffffffffffff00",
  "hex"
);

// Packet sequence action types
export type PacketAction =
  | { type: "sleep"; ms: number }
  | { type: "waitFor"; packetName: string }
  | { type: "write"; packetName: string }
  | { type: "queue"; packetName: string }
  | { type: "levelChunks"; distance: number };

// The packet sequence for initializing a client (generated from packet dump)
export const initPacketSequence: PacketAction[] = [
  { type: "sleep", ms: 200 },
  { type: "write", packetName: "resource_packs_info" },
  { type: "waitFor", packetName: "resource_pack_client_response" },
  { type: "write", packetName: "resource_pack_stack" },
  { type: "waitFor", packetName: "resource_pack_client_response" },
  { type: "queue", packetName: "inventory_transaction" },
  { type: "queue", packetName: "inventory_slot" },
  { type: "queue", packetName: "inventory_slot_2" },
  { type: "queue", packetName: "inventory_slot_3" },
  { type: "queue", packetName: "inventory_slot_4" },
  { type: "queue", packetName: "inventory_slot_5" },
  { type: "queue", packetName: "inventory_transaction_2" },
  { type: "queue", packetName: "level_event_generic" },
  { type: "queue", packetName: "player_list" },
  { type: "queue", packetName: "set_time" },
  { type: "queue", packetName: "jigsaw_structure_data" },
  { type: "queue", packetName: "start_game" },
  { type: "queue", packetName: "item_registry" },
  { type: "queue", packetName: "set_spawn_position" },
  { type: "queue", packetName: "set_time" },
  { type: "queue", packetName: "set_difficulty" },
  { type: "queue", packetName: "set_commands_enabled" },
  { type: "queue", packetName: "update_adventure_settings" },
  { type: "queue", packetName: "update_abilities" },
  { type: "queue", packetName: "game_rules_changed" },
  { type: "queue", packetName: "player_list" },
  { type: "queue", packetName: "update_abilities" },
  { type: "queue", packetName: "biome_definition_list" },
  { type: "queue", packetName: "available_entity_identifiers" },
  { type: "queue", packetName: "player_fog" },
  { type: "queue", packetName: "camera_presets" },
  { type: "queue", packetName: "camera_aim_assist_presets" },
  { type: "queue", packetName: "update_attributes" },
  { type: "queue", packetName: "creative_content" },
  { type: "queue", packetName: "trim_data" },
  { type: "queue", packetName: "inventory_content" },
  { type: "queue", packetName: "inventory_content_2" },
  { type: "queue", packetName: "inventory_content_3" },
  { type: "queue", packetName: "inventory_content_4" },
  { type: "queue", packetName: "player_hotbar" },
  { type: "queue", packetName: "crafting_data" },
  { type: "queue", packetName: "available_commands" },
  { type: "waitFor", packetName: "serverbound_loading_screen" },
  { type: "queue", packetName: "set_player_inventory_options" },
  { type: "queue", packetName: "respawn" },
  { type: "queue", packetName: "respawn_2" },
  { type: "queue", packetName: "network_chunk_publisher_update" },
  { type: "queue", packetName: "set_entity_data" },
  { type: "queue", packetName: "current_structure_feature" },
  { type: "queue", packetName: "update_attributes_2" },
  { type: "levelChunks", distance: 6 },
  { type: "queue", packetName: "respawn_3" },
  { type: "queue", packetName: "update_attributes_3" },
  { type: "queue", packetName: "update_subchunk_blocks" },
  { type: "queue", packetName: "block_entity_data" },
  { type: "queue", packetName: "block_entity_data_2" },
  { type: "queue", packetName: "chunk_radius_update" },
  { type: "queue", packetName: "set_health" },
  { type: "queue", packetName: "play_status" },
  { type: "queue", packetName: "camera_aim_assist" },
  { type: "queue", packetName: "camera_aim_assist" },
  { type: "queue", packetName: "unlocked_recipes" },
  { type: "queue", packetName: "set_entity_data_2" },
  { type: "queue", packetName: "container_open" },
  { type: "queue", packetName: "set_time_3" },
  { type: "queue", packetName: "container_close" },
];

export function getDataBuilder(version: string) {
  const deserializer = createDeserializer(version);
  const serializer = createSerializer(version);
  let registry = registryLoader(`bedrock_${version}`) as RegistryBedrock;
  let item = (itemLoader as any)(registry) as typeof Item;

  function toNotch(
    name: string | null,
    count: number,
    stackId: number | undefined
  ): any {
    if (name == null) {
      return { network_id: 0 };
    }
    return item.toNotch(
      new item(
        registry.itemsByName[name].id,
        count,
        undefined,
        undefined,
        stackId
      ),
      stackId !== undefined ? 1: 0
    );
  }

  serializer.proto.setVariable("ShieldItemID", 387);
  deserializer.proto.setVariable("ShieldItemID", 387);

  const inventoryItems = Array(36).fill({ network_id: 0 });

  // Load packets from generated files
  const resource_packs_info = packets.resource_packs_info();
  const resource_pack_stack = packets.resource_pack_stack();
  const inventory_transaction = packets.inventory_transaction();
  const inventory_slot = packets.inventory_slot();
  const inventory_slot_2 = packets.inventory_slot_2();
  const inventory_slot_3 = packets.inventory_slot_3();
  const inventory_slot_4 = packets.inventory_slot_4();
  const inventory_slot_5 = packets.inventory_slot_5();
  const inventory_transaction_2 = packets.inventory_transaction_2();
  const level_event_generic = packets.level_event_generic();
  const player_list = packets.player_list(deserializer);
  const set_time = packets.set_time();
  const jigsaw_structure_data = packets.jigsaw_structure_data(deserializer);
  const start_game = packets.start_game();
  const item_registry = packets.item_registry(deserializer);
  const set_spawn_position = packets.set_spawn_position();
  const set_difficulty = packets.set_difficulty();
  const set_commands_enabled = packets.set_commands_enabled();
  const update_adventure_settings = packets.update_adventure_settings();
  const update_abilities = packets.update_abilities();
  const game_rules_changed = packets.game_rules_changed();
  const biome_definition_list = packets.biome_definition_list(deserializer);
  const available_entity_identifiers = packets.available_entity_identifiers(deserializer);
  const player_fog = packets.player_fog();
  const camera_presets = packets.camera_presets();
  const camera_aim_assist_presets = packets.camera_aim_assist_presets();
  const update_attributes = packets.update_attributes();
  const creative_content = packets.creative_content(deserializer);
  const trim_data = packets.trim_data();
  const inventory_content = packets.inventory_content();
  const inventory_content_2 = packets.inventory_content_2();
  const inventory_content_3 = packets.inventory_content_3();
  const inventory_content_4 = packets.inventory_content_4();
  const player_hotbar = packets.player_hotbar();
  const crafting_data = packets.crafting_data(deserializer);
  const available_commands = packets.available_commands(deserializer);
  const set_player_inventory_options = packets.set_player_inventory_options();
  const respawn = packets.respawn();
  const respawn_2 = packets.respawn_2();
  const network_chunk_publisher_update = packets.network_chunk_publisher_update();
  const set_entity_data = packets.set_entity_data();
  const current_structure_feature = packets.current_structure_feature();
  const update_attributes_2 = packets.update_attributes_2();
  const respawn_3 = packets.respawn_3();
  const update_attributes_3 = packets.update_attributes_3();
  const update_subchunk_blocks = packets.update_subchunk_blocks();
  const block_entity_data = packets.block_entity_data();
  const block_entity_data_2 = packets.block_entity_data_2();
  const chunk_radius_update = packets.chunk_radius_update();
  const set_health = packets.set_health();
  const play_status = packets.play_status();
  const camera_aim_assist = packets.camera_aim_assist();
  const unlocked_recipes = packets.unlocked_recipes(deserializer);
  const set_entity_data_2 = packets.set_entity_data_2();
  const container_open = packets.container_open();
  const set_time_3 = packets.set_time_3();
  const container_close = packets.container_close();

  registry.handleItemRegistry(item_registry);

  const data = {
    fromHex,
    inventoryItems,
    resource_packs_info,
    resource_pack_stack,
    inventory_transaction,
    inventory_slot,
    inventory_slot_2,
    inventory_slot_3,
    inventory_slot_4,
    inventory_slot_5,
    inventory_transaction_2,
    level_event_generic,
    player_list,
    set_time,
    jigsaw_structure_data,
    start_game,
    item_registry,
    set_spawn_position,
    set_difficulty,
    set_commands_enabled,
    update_adventure_settings,
    update_abilities,
    game_rules_changed,
    biome_definition_list,
    available_entity_identifiers,
    player_fog,
    camera_presets,
    camera_aim_assist_presets,
    update_attributes,
    creative_content,
    trim_data,
    inventory_content,
    inventory_content_2,
    inventory_content_3,
    inventory_content_4,
    player_hotbar,
    crafting_data,
    available_commands,
    set_player_inventory_options,
    respawn,
    respawn_2,
    network_chunk_publisher_update,
    set_entity_data,
    current_structure_feature,
    update_attributes_2,
    respawn_3,
    update_attributes_3,
    update_subchunk_blocks,
    block_entity_data,
    block_entity_data_2,
    chunk_radius_update,
    set_health,
    play_status,
    camera_aim_assist,
    unlocked_recipes,
    set_entity_data_2,
    container_open,
    set_time_3,
    container_close,
  };

  function setArmorSlot(
    slotId: number,
    name: string | null,
    count: number,
    stackId: number | undefined = undefined
  ) {
    data.inventory_content_2.input[slotId] = toNotch(name, count, stackId);
  }

  function setInventoryItem(slot: number,
    name: string | null,
    count: number,
    stackId: number | undefined = undefined) {
    inventoryItems[slot] = toNotch(name, count, stackId);
  }

  function setOffhandSlot(name: string | null, stackId: number | undefined = undefined) {
    data.inventory_content_4.input[0] = toNotch(name, 1, stackId);
  }

  function fromHex(base64String: string) {
    return deserializer.parsePacketBuffer(Buffer.from(base64String, "hex")).data
      .params;
  }

  function normalizePacket(name: string, params: any){
    const newBuffer = serializer.createPacketBuffer({ name, params });
    return deserializer.parsePacketBuffer(newBuffer).data.params;
  }

  return {
    fromHex,
    setArmorSlot,
    setInventoryItem,
    setOffhandSlot,
    toNotch,
    data,
    normalizePacket
  };
}
