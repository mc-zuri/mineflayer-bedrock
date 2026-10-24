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

## Bedrock 1.26.x protocol changes (1.21.130 - 1.26.51)

**Discovery Date**: 2026-10-24

**Problem**: The Bedrock plugins were written for 1.21.130. 1.26.x changed many of the packets they read and write, most
of them in 1.26.40. Written as 1.21.130 lays them out, a packet either fails to serialize (and the error thrown in a
packet listener ends the bot) or is refused by the server.

**Root Cause**: Protocol changes per version, from minecraft-data's schemas (mc-zuri/minecraft-data) and real client
recordings (`D:/bedrock/corpus/sessions/<version>`, bedrock-observer fixtures). Mojang's changelog covers 1.26.40+:
https://mojang.github.io/bedrock-protocol-docs/changelog/compare/1.26.40/1.26.51/

| From | Change |
|---|---|
| 1.26.0 | `book_edit` names the book's slot `inventory_slot` (zigzag32), its page numbers are zigzag32 |
| 1.26.10 | the time of day comes in `sync_world_clocks` (the overworld clock); `set_time` is no longer sent |
| 1.26.20 | `mob_equipment` and `inventory_slot` items are `ItemV4` (`has_stack_id` a bool) |
| 1.26.20 - 1.26.30 | an `ItemV4`'s stack id is a variant, `{ type: 'item_stack_net_id', id }`: sent back as is, every stack request is refused (status 49, FailedToValidateSrcSlot) |
| 1.26.30 | transaction actions name their window by number (`window_id`), with `container_presence` / `flag_presence` before it (1.26.30 - 1.26.45); an item use's face is a byte (no face: 255, not -1); `subchunk_request` offsets are `{ x, y, z }`; `level_sound_event` names its sound by string; `boss_event` writes every field |
| 1.26.30 | `player_auth_input`'s transaction keeps the old layout (`TransactionActionsAuthInput`, `inventory_id`, `Item`) while `inventory_transaction`'s changed |
| 1.26.40 | `player_auth_input`'s input flags are a list of names; its optional fields each come after a `*_presence` byte the client always writes as true (1.26.40 - 1.26.45); each block action has a position and face |
| 1.26.40 | the `Item` type is gone: every item is `ItemV4`, an air item written in full (`extra` left out) |
| 1.26.40 | `crafting_data` lists each kind of recipe in an array of its own, a shaped recipe's input flat, ingredients name their item (`descriptor_type`) |
| 1.26.40 | item stack request actions repeat their type as `legacy_type_id`, numbered as 1.21.130 numbers them (`craft_recipe_auto` 13, `results_deprecated` 19); `craft_recipe_auto` names its ingredients by item (`RecipeIngredient2`) and has no `times_crafted_2`; `results_deprecated` names its items by descriptor |
| 1.26.40 | `player_list` records each carry their own type; `set_score`, `move_entity_delta`, `move_player`, `level_chunk` (sub chunks requested when `highest_subchunk_count` is sent, `sub_chunk_count` is 0) and `subchunk` changed |
| 1.26.51 | `TransactionUseItem` says its `hand`; `boss_event` has no `player_id` |

Also found:
- BDS 1.26.x puts `§r` after a chat message's `source_name`.
- `start_game.player_gamemode` is `fallback` for a player who plays the world's game mode (`world_gamemode`).
- `item_stack_response` statuses past 1 come as numbers: their names are Mojang's `ItemStackNetResult`.
- BDS 1.26.51 warns that NetherNet is the only supported transport, but bedrock-protocol still joins it over RakNet.
- bedrock-protocol 3.60.1's `nbtLoop` reads the wrong size (mc-zuri/bedrock-protocol 40f9756): patched in
  `patches/bedrock-protocol+3.60.1.patch`.
- bedrock-protocol 3.60.1's server refuses a second `set_local_player_as_initialized`; its client already sends one on
  `player_spawn`, as the vanilla client does.

**Fix Applied**:
- `lib/bedrock/protocol-adapter.mts`: the packets the plugins write, built as 1.21.130 lays them out, are rewritten into
  the layout of the bot's version, read from its protocol schema (1.21.130 is written unchanged); received items get
  their stack id as a number.
- The plugins read both layouts of the packets they receive: `crafting_data` (`craftingDataRecipes`), `player_list`,
  `level_chunk`, `boss_event`, `item_stack_response`, `inventory_transaction`, `sync_world_clocks`, `text`.

**Files Modified**:
- `packages/mineflayer/lib/bedrock/protocol-adapter.mts`, `lib/loader.js`, `lib/version.js`
- `packages/mineflayer/lib/bedrockPlugins/{blocks,bossbar,chat,craft,entities,game,inventory,time,villager}.mts`
- `packages/mineflayer/lib/bedrock/{crafting-core,item-stack-actions,index}.mts`

**Remaining**:
- From 1.26.40 a recipe ingredient can name a complex alias (`minecraft:log2`, campfires); it is kept as a
  `complex_alias` that matches no item.
- The mock server (`minecraft-bedrock-test-server` internal server) replays 1.21.130 captures only.

---

## Tests: setblock right after a teleport

**Discovery Date**: 2026-10-24

**Problem**: The farming test's dirt block never showed (about half of the parallel runs, on every version).

**Root Cause**: Right after a far teleport the server has not loaded the chunk yet: `setblock` fails there ("Cannot
place block outside of the world" in the server's output), and no `update_block` is sent. The bot's world was right.

**Fix Applied**: the farming tests send `setblock` again until the bot sees the block (`setBlockAndWait`).

**Files Modified**: `packages/minecraft-bedrock-tests/test/farming.test.mts`

---

## Tests: placing a block inside the player

**Discovery Date**: 2026-10-24

**Problem**: On BDS 1.26.0 (and 1.26.20) the place-block tests placed nothing.

**Root Cause**: The tests set the reference block where the bot stood, then placed the new block in the bot's head
space. Those servers refuse a block in the player; 1.21.130 and 1.26.51 accepted it.

**Fix Applied**: the bot stands beside the block it places on, as the side placement test already did.

**Files Modified**: `packages/minecraft-bedrock-tests/test/place-block.test.mts`

---

## bot.end() / bot.quit(): no end() on the bedrock-protocol client

**Discovery Date**: 2026-10-24

**Problem**: `bot.quit()` threw `TypeError: bot._client.end is not a function` (every version).

**Root Cause**: `loader.js` maps `bot.end` to `_client.end()`, which only minecraft-protocol's (Java) client has. The
bedrock-protocol client has `disconnect()` and `close()`, but `disconnect()` writes `hide_disconnect_screen` and no
`reason`, while the `disconnect` packet (1.21.130 - 1.26.51) has `reason` (DisconnectFailReason) and
`hide_disconnect_reason`.

**Fix Applied**: the Bedrock kick plugin sets `bot.end`: it writes `disconnect` with the schema's fields, then closes
the client (which emits `close`, so the bot emits `end`).

**Files Modified**: `packages/mineflayer/lib/bedrockPlugins/kick.mts`

---

## Physics: no catch-up limit

**Discovery Date**: 2026-10-24

**Problem**: The state-machine-farmer example froze when it went idle: no output, the bot stood still.

**Root Cause**: Not a protocol issue. The Bedrock physics loop ran every missed tick at once, while the Java plugin
runs at most `maxCatchupTicks` (4) per interval. The example's idle checks run block searches on each tick; once
ticks took longer than 50 ms, each interval had more ticks to catch up, and the loop never gave the event loop back.

**Fix Applied**: the Bedrock physics plugin takes `maxCatchupTicks` (default 4) like the Java one.

**Files Modified**: `packages/mineflayer/lib/bedrockPlugins/physics.mts`

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
