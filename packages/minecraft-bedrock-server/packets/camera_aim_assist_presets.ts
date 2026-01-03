export function camera_aim_assist_presets() {
  return {
    categories: [
      {
        name: "minecraft:bucket",
        entity_priorities: [],
        block_priorities: [
          {
            id: "minecraft:cauldron",
            priority: 60,
          },
          {
            id: "minecraft:lava",
            priority: 60,
          },
          {
            id: "minecraft:water",
            priority: 60,
          },
        ],
        block_tags: [],
        entity_default: 30,
        block_default: 30,
      },
      {
        name: "minecraft:empty_hand",
        entity_priorities: [],
        block_priorities: [
          {
            id: "minecraft:oak_log",
            priority: 60,
          },
          {
            id: "minecraft:cherry_log",
            priority: 60,
          },
          {
            id: "minecraft:birch_log",
            priority: 60,
          },
          {
            id: "minecraft:spruce_log",
            priority: 60,
          },
          {
            id: "minecraft:acacia_log",
            priority: 60,
          },
          {
            id: "minecraft:jungle_log",
            priority: 60,
          },
          {
            id: "minecraft:dark_oak_log",
            priority: 60,
          },
          {
            id: "minecraft:mangrove_log",
            priority: 60,
          },
        ],
        block_tags: [],
        entity_default: 30,
        block_default: 30,
      },
      {
        name: "minecraft:default",
        entity_priorities: [],
        block_priorities: [
          {
            id: "minecraft:lever",
            priority: 60,
          },
          {
            id: "minecraft:oak_button",
            priority: 60,
          },
          {
            id: "minecraft:birch_button",
            priority: 60,
          },
          {
            id: "minecraft:spruce_button",
            priority: 60,
          },
          {
            id: "minecraft:dark_oak_button",
            priority: 60,
          },
        ],
        block_tags: [],
        entity_default: undefined,
        block_default: undefined,
      },
    ],
    presets: [
      {
        id: "minecraft:aim_assist_default",
        exclusion_settings: {
          blocks: ["minecraft:bedrock"],
          entities: ["minecraft:arrow"],
          block_tags: [],
        },
        target_liquids: [
          "minecraft:bucket",
          "minecraft:oak_boat",
          "minecraft:birch_boat",
          "minecraft:spruce_boat",
          "minecraft:jungle_boat",
          "minecraft:acacia_boat",
          "minecraft:dark_oak_boat",
          "minecraft:mangrove_boat",
          "minecraft:cherry_boat",
          "minecraft:bamboo_raft",
          "minecraft:oak_chest_boat",
          "minecraft:birch_chest_boat",
          "minecraft:spruce_chest_boat",
          "minecraft:jungle_chest_boat",
          "minecraft:acacia_chest_boat",
          "minecraft:dark_oak_chest_boat",
          "minecraft:mangrove_chest_boat",
          "minecraft:cherry_chest_boat",
          "minecraft:bamboo_chest_raft",
        ],
        item_settings: [
          {
            id: "minecraft:bucket",
            category: "minecraft:bucket",
          },
        ],
        default_item_settings: "minecraft:default",
        hand_settings: "minecraft:empty_hand",
      },
    ],
    operation: "add_to_existing",
  };
}
