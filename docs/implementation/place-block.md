# Place Block Implementation

**Status**: Analyzer Complete, Plugin Not Implemented
**Analyzer**: `packages/minecraft-logs-analyzers/src/analyzers/place-block.ts`
**Date**: 2026-01-04

## API (to match Java)

- `bot.placeBlock(referenceBlock, faceVector)` - Place block on face of reference block
- `bot._placeBlockWithOptions(referenceBlock, faceVector, options)` - Place with options

## Protocol Notes

From captured packets in `examples/crafting-data-capture/temp/place-block/`:

| Packet | Direction | Purpose |
|--------|-----------|---------|
| `player_action` (start_item_use_on) | C→S | Begin placement action |
| `inventory_transaction` (item_use) | C→S | Execute block placement |
| `update_block` | S→C | Server confirms placement |
| `player_action` (stop_item_use_on) | C→S | End placement action |
| `block_actor_data` | S→C | NBT for signs, chests, etc. |

### Block Placement Cycle

```
C→S: player_action {
  action: "start_item_use_on",
  position: [30, -1, 1],      // Reference block position
  result_position: [30, 0, 1], // Destination block position
  face: 1                      // Face index (0-5)
}

C→S: inventory_transaction {
  transaction_type: "item_use",
  transaction_data: {
    action_type: "click_block",
    trigger_type: "player_input",
    hotbar_slot: 0,
    held_item: { network_id: 1, count: 16 },  // Stone
    block_position: { x: 30, y: -1, z: 1 },
    player_pos: { x: 32.5, y: 1.62, z: 1.5 },
    click_pos: { x: 0.53, y: 1, z: 0.15 },    // Click offset on face
    face: 1,
    block_runtime_id: -2144268767,
    client_prediction: "success"
  }
}

S→C: update_block {
  position: { x: 30, y: 0, z: 1 },
  block_runtime_id: -2144268767,
  flags: { neighbors: true, network: true },
  layer: 0
}

C→S: player_action {
  action: "stop_item_use_on",
  position: [30, 0, 1],
  result_position: [0, 0, 0],
  face: 0
}
```

### Face Index Mapping

| Face | Direction | Value |
|------|-----------|-------|
| Down | -Y | 0 |
| Up | +Y | 1 |
| North | -Z | 2 |
| South | +Z | 3 |
| West | -X | 4 |
| East | +X | 5 |

### Special Cases

**Interactive Blocks (Levers, Buttons)**:
- Same protocol, but clicking toggles state instead of placing
- `update_block` returns new state (lit lamp, flipped lever)

**Signs**:
- Placement triggers `block_actor_data` with sign NBT
- Client sends `block_actor_data` back with text content

**Containers (Chests, Barrels)**:
- Standard placement protocol
- Double chest created when placing adjacent to existing chest

## Key Differences from Java

| Aspect | Java | Bedrock |
|--------|------|---------|
| Packet | `block_place` | `player_action` + `inventory_transaction` |
| Start/stop | None | `start_item_use_on` / `stop_item_use_on` |
| Destination | Inferred from face | Explicit `result_position` |
| Confirmation | Implicit | `update_block` packet |
| Prediction | Server-auth | `client_prediction` field |

## Implementation Plan

1. **Create `generic_place.mts`**:
   - Implement `_genericPlace()` using `player_action` + `inventory_transaction`
   - Handle face vector to face index conversion
   - Calculate click position on face
   - Wait for `update_block` confirmation

2. **Create `place_block.mts`**:
   - Wrap `_genericPlace()` with block update validation
   - Emit `blockPlaced` event on success

3. **Dependencies**:
   - `input-data-service.mts` for player_action packets
   - `inventory.mts` for held item tracking

## Test Data

Captured packet logs available at:
- `examples/crafting-data-capture/temp/place-block/1.21.130-PLACE_BLOCK-2026-01-04-1341.bin`
- `examples/crafting-data-capture/temp/place-block/1.21.130-PLACE_BLOCK-2026-01-04-1341-place-block.jsonl`

Scenarios captured:
1. Stone block placement (horizontal row, vertical stack)
2. Sign placement and editing (ground and wall)
3. Container placement (chest, double chest, barrel)
4. Redstone components (lamp, lever, button with toggling)
