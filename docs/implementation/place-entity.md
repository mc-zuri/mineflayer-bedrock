# Place Entity Implementation

**Status**: Analyzer Complete, Plugin Not Implemented
**Analyzer**: `packages/minecraft-logs-analyzers/src/analyzers/place-entity.ts`
**Date**: 2026-01-04

## API (to match Java)

- `bot.placeEntity(referenceBlock, faceVector)` - Place entity and wait for spawn
- `bot._placeEntityWithOptions(referenceBlock, faceVector, options)` - Place with options

## Protocol Notes

From captured packets in `examples/crafting-data-capture/temp/place-entity/`:

| Packet | Direction | Purpose |
|--------|-----------|---------|
| `inventory_transaction` (item_use) | C→S | Place entity item |
| `add_entity` | S→C | Server spawns entity |
| `set_entity_data` | S→C | Entity metadata |
| `move_entity_delta` | S→C | Entity physics updates |
| `interact` | C→S | Entity interaction |
| `entity_event` | S→C | Entity state changes |

### Entity Placement Cycle

```
C→S: player_action {
  action: "start_item_use_on",
  position: [36, -3, 4],
  face: 1
}

C→S: inventory_transaction {
  transaction_type: "item_use",
  transaction_data: {
    action_type: "click_block",
    trigger_type: "player_input",
    hotbar_slot: 0,
    held_item: { network_id: 407, count: 1 },  // Oak Boat
    block_position: { x: 36, y: -1, z: 2 },
    player_pos: { x: 36.54, y: 1.62, z: 1.36 },
    face: 1
  }
}

S→C: add_entity {
  entity_type: "minecraft:boat",
  runtime_id: "13",
  unique_id: "-8589934583",
  position: { x: 36.445, y: 0, z: 2.7 },
  velocity: { x: 0, y: 0, z: 0 },
  pitch: 0,
  yaw: 94.21875,
  head_yaw: 0
}

S→C: set_entity_data {
  runtime_entity_id: "13",
  metadata: [
    { key: "flags", type: "long", value: "844562369085440" },
    { key: "health", type: "int", value: 40 },
    { key: "variant", type: "int", value: 0 },
    { key: "is_buoyant", type: "byte", value: 1 },
    { key: "buoyancy_data", type: "string", value: "{...}" },
    // ... many more fields
  ]
}

// Physics updates follow
S→C: move_entity_delta {
  runtime_entity_id: "13",
  flags: { has_y: true },
  y: -0.039  // Falling/floating
}
```

### Entity Types and Items

| Entity | Item ID | Bedrock Type |
|--------|---------|--------------|
| Boat | 407 (oak), etc. | `minecraft:boat` |
| Minecart | 370 | `minecraft:minecart` |
| Armor Stand | 588 | `minecraft:armor_stand` |
| Item Frame | 553 | `minecraft:frame` |
| Glow Item Frame | 654 | `minecraft:glow_frame` |
| End Crystal | 738 | `minecraft:ender_crystal` |

### Entity Interaction

```
// Mouse hover
C→S: interact {
  target_entity_id: "13",
  action_id: "mouse_over_entity",
  position: { x: 36.45, y: 0.18, z: 2.53 }
}

// Enter vehicle
C→S: interact {
  target_entity_id: "13",
  action_id: "interact"
}

// Leave vehicle
C→S: interact {
  target_entity_id: "13",
  action_id: "leave_vehicle",
  position: { x: 36.445, y: 1.62, z: 1.7 }
}
```

### Entity Damage

```
// When attacking an entity
S→C: set_entity_data {
  runtime_entity_id: "13",
  metadata: [
    { key: "health", type: "int", value: 39 },
    { key: "hurt_time", type: "int", value: 9 },
    { key: "hurt_direction", type: "int", value: -1 }
  ]
}

// Hurt animation countdown
S→C: set_entity_data { metadata: [{ key: "hurt_time", value: 8 }] }
S→C: set_entity_data { metadata: [{ key: "hurt_time", value: 7 }] }
// ... continues to 0
```

## Key Differences from Java

| Aspect | Java | Bedrock |
|--------|------|---------|
| Boat placement | `use_item` packet | `inventory_transaction` (item_use) |
| Entity spawn | `spawn_entity` | `add_entity` |
| Entity ID | Single ID | `runtime_id` + `unique_id` |
| Metadata format | NBT | Array of typed key-value pairs |
| Vehicle interaction | `use_entity` | `interact` with action_id |

## Implementation Plan

1. **Create `place_entity.mts`**:
   - Send `inventory_transaction` for entity placement
   - Wait for matching `add_entity` packet
   - Track spawned entity by type and proximity
   - Emit `entityPlaced` event on success

2. **Entity matching logic**:
   - Store expected entity type from held item
   - Match `add_entity` by entity_type and position
   - Handle different naming conventions (boat, minecraft:boat)

3. **Dependencies**:
   - `entities.mts` for `entitySpawn` event
   - `inventory.mts` for held item info

## Test Data

Captured packet logs available at:
- `examples/crafting-data-capture/temp/place-entity/1.21.130-PLACE_ENTITY-2026-01-04-1329.bin`
- `examples/crafting-data-capture/temp/place-entity/1.21.130-PLACE_ENTITY-2026-01-04-1329-place-entity.jsonl`

Scenarios captured:
1. Boat placement on water/ground, enter/exit, break
2. Minecart placement on rails
3. Armor stand placement and interaction
4. Item frame placement on walls, item insertion, rotation
