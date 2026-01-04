# Known Protocol Issues & Discoveries

This document tracks protocol bugs, encoding issues, and other technical discoveries found during Bedrock implementation.

## Enchanting Table: option_id encoding

**Discovery Date**: 2026-01-04

**Problem**: Enchanting requests failed with status 21 (invalid recipe) or crashed the server.

**Root Cause**: The `option_id` field in `player_enchant_options` packet is decoded as `zigzag32` by the protocol library, but the `recipe_network_id` in `item_stack_request.craft_recipe` expects the unsigned varint encoding.

**Technical Details**:
- `player_enchant_options.options[].option_id` is defined as `zigzag32` in protocol
- When decoded, value -1662 is received
- Real client sends `recipe_network_id: 3323` in the enchant request
- The relationship: `3323 = zigzag_encode(-1662)` where `zigzag_encode(n) = (n << 1) ^ (n >> 31)`

**Fix Applied** (in `enchanting.mts`):
```typescript
// Convert zigzag-decoded value back to unsigned varint: zigzag encode
optionId = (rawOptionId << 1) ^ (rawOptionId >> 31);
```

**Additional Findings**:
1. `results_deprecated` action MUST include non-empty `result_items` with the input item info, or server crashes
2. Without bookshelves, only cost=1 enchants are valid (higher costs return status 21)
3. After enchanting, the item gets a new `stackId` that must be captured from `item_stack_response` for `takeItem()` to work

**Files Modified**:
- `packages/mineflayer/lib/bedrock/workstations/enchanting.mts`
- `packages/minecraft-bedrock-tests/test/workstation.test.mts`

---

## block_runtime_id type inconsistency

**File**: `packages/minecraft-data/minecraft-data/data/bedrock/1.21.130/protocol.json`

**Issue**: `block_runtime_id` uses inconsistent types:
- `packet_update_block`: uses `varint` (unsigned)
- Other packets (inventory_transaction, etc.): use `zigzag32` (signed)

**Expected**: All `block_runtime_id` fields should use `zigzag32` since block state IDs can be negative.

**Action**: Create PR to fix `packet_update_block.block_runtime_id` type from `varint` to `zigzag32` in minecraft-data repo.

---

## Anvil: Position sync issue in tests

**Discovery Date**: 2026-01-04

**Problem**: Anvil tests fail with "position sync issue" despite working protocol.

**Technical Details**:
- Packet captures confirm anvil DOES send `container_open` like other workstations
- Current implementation uses custom `player_action` + `inventory_transaction` packets
- Should use `bot.openBlock()` like stonecutter, enchanting, grindstone, etc.
- Test failures likely due to teleport/chunk sync timing issues

**Root Cause**: The original `openAnvil` implementation was written assuming no `container_open`, but this was incorrect. The real client does receive `container_open` for anvil.

**Action Required**:
1. Rewrite `openAnvil()` to use `bot.openBlock()` instead of custom packets
2. Add proper `waitForChunksToLoad()` or position sync before opening
3. Enable skipped tests and verify rename/combine work

**Files Affected**:
- `packages/mineflayer/lib/bedrock/workstations/anvil.mts`
- `packages/minecraft-bedrock-tests/test/crafting.test.mts` (skipped tests)

**Status**: Tests skipped. Needs implementation rewrite.

---

## How to Document New Issues

When you discover a protocol issue:

1. Add a new section with a descriptive title
2. Include discovery date
3. Describe the problem and symptoms
4. Document the root cause with technical details
5. Show the fix applied (if any)
6. List affected files
7. Note any remaining action items
