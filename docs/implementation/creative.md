# Creative Mode Implementation

**Status**: In Progress (50%) - Flying works, setInventorySlot pending
**Plugin File**: `packages/mineflayer/lib/bedrockPlugins/creative.mts`
**Java Reference**: `packages/mineflayer/lib/plugins/creative.js`
**Date**: 2026-01-04

## Overview

Creative mode plugin provides creative-specific functionality for Bedrock Edition:
- Flying abilities (start/stop/flyTo) - WORKING
- Item manipulation from creative inventory - PENDING (status 7 error)
- Inventory clearing - PENDING

The plugin parses the `creative_content` packet to map item network_ids to creative entry_ids, which are required for the `craft_creative` action.

## API (matches Java)

### Methods

- `bot.creative.setInventorySlot(slot, item)` - Pick item from creative inventory into slot (PENDING)
- `bot.creative.clearSlot(slot)` - Clear a slot by destroying item (PENDING)
- `bot.creative.clearInventory()` - Clear all inventory slots (PENDING)
- `bot.creative.flyTo(destination: Vec3)` - Fly to a position (WORKING)
- `bot.creative.startFlying()` - Start flying, disable gravity (WORKING)
- `bot.creative.stopFlying()` - Stop flying, restore gravity (WORKING)

### Events

None (creative mode doesn't emit events)

### Properties

- `bot.creative` - Creative mode API object

## Protocol Notes

| Packet | Direction | Purpose |
|--------|-----------|---------|
| `creative_content` | S→C | List of all creative inventory items with entry_id |
| `set_player_game_type` | S→C | Game mode change notification |
| `item_stack_request` | C→S | Pick item using craft_creative action |
| `item_stack_response` | S→C | Server confirmation/rejection |

### Creative Item Pick Flow (Pending Investigation)

1. Parse `creative_content` packet on join (maps network_id -> entry_id)
2. C→S: `item_stack_request` with:
   - `craft_creative` action (requires entry_id, times_crafted)
   - `results_deprecated` action (ItemLegacy format)
   - `take` action (from created_output to cursor)
3. S→C: `item_stack_response` with status
4. C→S: `item_stack_request` to place from cursor to destination
5. S→C: `item_stack_response`

### craft_creative Action Structure

```typescript
{
  type_id: 'craft_creative',
  item_id: number,      // entry_id from creative_content (NOT network_id!)
  times_crafted: number // Usually 1
}
```

### results_deprecated Structure (ItemLegacy format)

```typescript
{
  type_id: 'results_deprecated',
  result_items: [{
    network_id: number,
    count: number,
    metadata: number,
    stack_size: number,
    block_runtime_id: number,
    extra: {
      has_nbt: 0,
      can_place_on: [],
      can_destroy: []
    }
  }],
  times_crafted: 1
}
```

### Example from Real Client

```
C→S: item_stack_request {
  requests: [{
    requestId: -227,
    actions: [
      { type: "craft_creative" },
      { type: "results_deprecated", results: ["id:57"] },
      { type: "take", count: 64, source: {slot: 50}, dest: {slot: 0} }
    ]
  }]
}

S→C: item_stack_response {
  responses: [{
    requestId: -227,
    status: "ok",
    containers: [{
      slots: [{ slot: 0, count: 64, stackId: 1 }]
    }]
  }]
}
```

## Key Differences from Java

| Aspect | Java | Bedrock |
|--------|------|---------|
| Packet | `set_creative_slot` | `item_stack_request` with craft_creative |
| Item ID | network_id directly | entry_id from creative_content |
| Flow | Direct slot set | Multi-action request |
| Server mode | Per-player creative | Server must default to creative |

## Implementation Status

### Working
- Flying (startFlying, stopFlying, flyTo)
- creative_content packet parsing
- entry_id lookup for items

### Pending (status 7 error)
- setInventorySlot - craft_creative action rejected
- clearSlot - depends on setInventorySlot
- clearInventory - depends on setInventorySlot

## Known Issues

### Status 7 Error
The server returns status 7 in item_stack_response which indicates "action not allowed".

Tried variations:
1. With/without take action
2. Different container types (creative_output, created_output)
3. Different slot indices (0, 50)
4. Different stack_id values (0, requestId)

### Server Mode Requirement
The server MUST be started with `gamemode: 'creative'` (default mode).
Just changing player gamemode via command doesn't enable full creative mode.

## Test Data

Captured packet logs:
- `examples/crafting-data-capture/temp/crafting-capture/1.21.130-CREATIVE-2026-01-04-1409-creative.jsonl`

BDS integration tests:
- `packages/minecraft-bedrock-tests/test/creative.test.mts`
  - API existence tests: Pass
  - Flying tests: Pass
  - setInventorySlot tests: Skipped (pending protocol investigation)

## Further Investigation Needed

1. Compare byte-level packet format with real client
2. Check if container_open is needed before picking items
3. Verify if specific game state is required
4. Test with different item types (blocks vs items)
