# Detailed API Status per Plugin

Reference: `packages/mineflayer/docs/api.md`

## anvil (60%)

**Dependencies**: inventory

**Implemented in lib/bedrock/workstations/anvil.mts:**
- `bot.openAnvil(anvilBlock)` - Opens anvil (custom implementation - needs rewrite)
- `anvil.putTarget(itemType, metadata, count)` - Place target item via twoStepTransfer
- `anvil.putMaterial(itemType, metadata, count)` - Place material item via twoStepTransfer
- `anvil.rename(name)` - Rename item (uses 'optional' action)
- `anvil.combine()` - Combine items (uses consume + place pattern)

**Status:**
- Packet captures confirm anvil DOES send `container_open` like other workstations
- Current implementation uses custom player_action + inventory_transaction (should use bot.openBlock())
- Tests skipped due to "position sync issue" - likely teleport/chunk sync timing
- Need to rewrite openAnvil() to use bot.openBlock() like stonecutter/enchanting

**Remaining Tasks:**
1. Rewrite openAnvil() to use bot.openBlock() instead of custom packets
2. Debug and fix "position sync issue" causing test failures
3. Enable skipped tests and verify rename/combine work end-to-end

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.openAnvil(anvilBlock)` | [~] | Works but needs rewrite to use bot.openBlock() |
| Method | `anvil.putTarget(itemType, metadata, count)` | [x] | Uses twoStepTransfer |
| Method | `anvil.putMaterial(itemType, metadata, count)` | [x] | Uses twoStepTransfer |
| Method | `anvil.rename(name)` | [~] | Implemented but tests skipped (position sync issue) |
| Method | `anvil.combine()` | [~] | Implemented but tests skipped (position sync issue) |

---

## bed (100%)

**Implementation Analysis:**
- Java: 194 LOC using `entity_action` packet and `game_state_change` for spawnReset
- Bedrock: 207 LOC using `player_action`, `animate`, and `set_spawn_position` packets

**Bedrock Adaptation:**
- Uses `player_action` with `start_sleeping`/`stop_sleeping` actions instead of Java's `entity_action`
- Uses `animate` packet with `wake_up` action for wake detection
- Uses `set_spawn_position` with `spawn_type: 'player'` for spawn point tracking
- Bed metadata parsed from `_properties`: `direction`, `head_piece_bit`, `occupied_bit`
- Direction mapping: 0=south, 1=west, 2=north, 3=east (same as Java)

**Protocol Flow:**
1. Bot activates bed block via `activateBlock()` (sends `inventory_transaction` click_block)
2. Server processes sleep request, sends position updates
3. Client sends `player_action` with `start_sleeping`
4. On wake: server sends `animate` with `wake_up`
5. Client sends `player_action` with `stop_sleeping`

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.isSleeping` | [x] | Tracked via player_action events |
| Event | `"sleep"` | [x] | Emitted on start_sleeping action |
| Event | `"wake"` | [x] | Emitted on animate wake_up |
| Event | `"spawnReset"` | [x] | Via set_spawn_position with invalid coords |
| Method | `bot.sleep(bedBlock)` | [x] | Uses activateBlock, validates night/thunderstorm |
| Method | `bot.isABed(bedBlock)` | [x] | Checks all bed color variants |
| Method | `bot.wake()` | [x] | Sends stop_sleeping player_action |
| Method | `bot.parseBedMetadata(block)` | [x] | Parses _properties for direction/part/occupied |

**Test Coverage:**
- Unit Tests: None in bedrockTest.mts
- BDS Tests: bed.test.mts (sleep/wake flow, error handling, metadata parsing)

---

## block_actions (40%)

**Implementation Analysis:**
- Java: 113 LOC using `block_action` and `block_break_animation` packets
- Bedrock: 128 LOC using `block_event` and `level_event` packets

**Bedrock Adaptation:**
- Uses `block_event` packet instead of Java's `block_action`
- Uses `level_event` with `block_start_break`/`block_stop_break` instead of `block_break_animation`
- Chest facing: Uses `_properties['minecraft:cardinal_direction']` instead of metadata encoding
- Block break: No destroyStage or entityId available (calculated client-side in Bedrock)

**Issues/Limitations:**
1. **noteHeard** - Still uses Java metadata calculation for note_block (line 87)
2. **pistonMove** - Uses `packet.data` for both args; comment says "find java values!!!"
3. **blockBreakProgressObserved** - Always reports destroyStage=0 (not actual progress)
4. **Entity tracking** - entity is always null for break progress events

**Verdict:** Partially implemented (~40%). API surface maintained but with significant limitations. noteblock/piston events need protocol investigation.

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"noteHeard"` | [~] | Emits but uses wrong calculation for note_block |
| Event | `"pistonMove"` | [~] | Emits but wrong args (needs investigation) |
| Event | `"chestLidMove"` | [x] | Works with Bedrock block properties |
| Event | `"blockBreakProgressObserved"` | [~] | Emits but destroyStage always 0 |
| Event | `"blockBreakProgressEnd"` | [x] | Works via level_event |

**Test Coverage:**
- Unit Tests: None in bedrockTest.mts
- BDS Tests: Partial - chestLidMove test in useChests.test.mts

---

## blocks (80%)

**Implementation Analysis:**
- Java: 608 LOC using `map_chunk`, `block_change`, `multi_block_change` packets
- Bedrock: 715 LOC using `level_chunk`, `subchunk`, `update_block` packets

**Bedrock Adaptation:**
- **Chunk Loading**: Uses `level_chunk` + `subchunk` request/response (Bedrock 1.18+ protocol)
- **Block Updates**: Uses `update_block`, `update_subchunk_blocks` instead of Java packets
- **SubChunk Protocol**: Client must request subchunks from server (different from Java's push model)
- **BlobStore**: Optional chunk caching system for Bedrock (not in Java)
- **Dimension**: Uses `start_game` packet instead of Java's `login` for initial dimension

**Missing Features:**
1. **updateSign** - Not implemented (Java has it)
2. **Paintings** - No `paintingsByPos`/`paintingsById` tracking
3. **Explosion block updates** - Commented out ("NO EXP PACKET ON BEDROCK")
4. **Light updates** - Not implemented
5. **Chunk batch throttling** - Not needed for Bedrock

**Verdict:** Well implemented (~80%). Core chunk loading and block queries work. Missing paintings, signs, and some edge cases.

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.world` | [x] | Via prismarine-world |
| Event | `"blockUpdate"` | [x] | Forwarded from world |
| Event | `"blockUpdate:(x,y,z)"` | [x] | Position-specific events work |
| Event | `"blockPlaced"` | [ ] | Requires place_block plugin |
| Event | `"chunkColumnLoad"` | [x] | Via subchunk loading |
| Event | `"chunkColumnUnload"` | [x] | Works |
| Function | `bot.blockAt(point, extraInfos)` | [x] | Works (no painting support) |
| Function | `bot.waitForChunksToLoad()` | [x] | Uses 4-chunk radius |
| Function | `bot.blockInSight()` | [x] | Via ray_trace (deprecated) |
| Function | `bot.blockAtCursor()` | [x] | Via ray_trace |
| Function | `bot.blockAtEntityCursor()` | [x] | Via ray_trace |
| Function | `bot.canSeeBlock()` | [x] | Works |
| Function | `bot.findBlocks()` | [x] | Adapted for Bedrock palette |
| Function | `bot.findBlock()` | [x] | Works |
| Method | `bot.updateSign()` | [ ] | **MISSING** |

**Test Coverage:**
- Unit Tests: None in bedrockTest.mts
- BDS Tests: Implicitly tested via inventory.test.mts, farming.test.mts, useChests.test.mts

---

## book (0-70%)

**Dependencies**: NBT support

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.writeBook(slot, pages)` | [ ] | Requires NBT |

---

## boss_bar (0-80%)

**Implementation Analysis:**
- Java: 63 LOC using `boss_bar` packet with actions (add/update/delete)
- Bedrock: 61 LOC using `boss_event` packet + entity health

**Bedrock Adaptation:**
- Uses `boss_event` packet with types: `show_bar`, `set_bar_progress`, etc.
- Health is calculated from entity attributes (`minecraft:health`) instead of packet value
- Registers player via `register_player` type in response to `show_bar`
- Boss bars are keyed by `boss_entity_id` (unique_id) not UUID
- Deletion handled via `entityGone` event (when boss entity dies)

**Issues/Limitations:**
1. **No dividers** - Bedrock doesn't support segment count
2. **Limited flags** - Only `screen_darkening` mapped; no `isDragonBar`/`createFog`
3. **No update_title** - Title changes not handled
4. **Missing packet types** - Only `show_bar` and `set_bar_progress` implemented

**Verdict:** Partially implemented (~60%). Core create/update/delete works but missing advanced features.

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `BossBar.title` | [x] | From initial packet |
| Property | `BossBar.health` | [x] | From entity attributes |
| Property | `BossBar.dividers` | [~] | Hardcoded to 4 (not in Bedrock) |
| Property | `BossBar.entityUUID` | [x] | Uses boss_entity_id |
| Property | `BossBar.shouldDarkenSky` | [x] | From screen_darkening flag |
| Property | `BossBar.isDragonBar` | [ ] | **MISSING** |
| Property | `BossBar.createFog` | [ ] | **MISSING** |
| Property | `BossBar.color` | [x] | From packet |
| Event | `"bossBarCreated"` | [x] | On show_bar |
| Event | `"bossBarDeleted"` | [x] | On entityGone |
| Event | `"bossBarUpdated"` | [x] | On set_bar_progress |

**Test Coverage:**
- Unit Tests: None
- BDS Tests: None

---

## breath (100%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.oxygenLevel` | [x] | |
| Event | `"breath"` | [x] | |

---

## chat (100%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.chatPatterns` | [x] | |
| Event | `"chat"` | [x] | |
| Event | `"whisper"` | [x] | |
| Event | `"actionBar"` | [x] | |
| Event | `"message"` | [x] | |
| Event | `"messagestr"` | [x] | |
| Event | `"chat:name"` | [x] | |
| Method | `bot.chat(message)` | [x] | Fixed for 1.21.130 |
| Method | `bot.whisper(username, message)` | [x] | |
| Method | `bot.chatAddPattern()` | [x] | Deprecated |
| Method | `bot.addChatPattern()` | [x] | |
| Method | `bot.addChatPatternSet()` | [x] | |
| Method | `bot.removeChatPattern()` | [x] | |
| Method | `bot.awaitMessage()` | [x] | |

---

## chest (100%)

**Dependencies**: inventory

**Implemented in lib/bedrockPlugins/chest.mts:**
- `bot.openContainer(block)` - Opens any container (chest, trapped_chest, barrel, etc.)
- `bot.openChest(block)` - Alias for openContainer
- `bot.openDispenser(block)` - Alias for openContainer
- `window.deposit(itemType, metadata, count)` - Deposit items into container
- `window.withdraw(itemType, metadata, count)` - Withdraw items from container
- `window.close()` - Close container window

**Test Coverage:**
- BDS Tests: useChests.test.mts (18+ tests)
  - Single chest open/close, deposit, withdraw
  - Double chest open/close, deposit, withdraw
  - Trapped chest open/close, deposit, withdraw
  - Large trapped chest operations
  - Multiple item type handling
  - chestLidMove event for double chests

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.openContainer(block)` | [x] | Works with all container types |
| Method | `bot.openChest(block)` | [x] | Alias for openContainer |
| Method | `bot.openDispenser(block)` | [x] | Alias for openContainer |
| Method | `window.deposit(itemType, metadata, count)` | [x] | Uses item_stack_request |
| Method | `window.withdraw(itemType, metadata, count)` | [x] | Uses item_stack_request |
| Method | `window.close()` | [x] | Closes container window |

---

## command_block (0%)

**Dependencies**: inventory

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.setCommandBlock(pos, command, options)` | [ ] | |

---

## craft (95%)

**Dependencies**: inventory, Bedrock recipes

**Implemented in craft.mts + lib/bedrock/workstations/:**
- Parses `crafting_data` packet and stores recipes indexed by output network_id
- Supports shaped, shapeless, and furnace recipes
- Handles item tags and metadata wildcards (32767)
- Uses `craft_recipe_auto` for efficient server-side crafting
- Full workstation support: stonecutter, smithing, enchanting, furnace, anvil, grindstone, loom, brewing, cartography

**Limitations:**
- 2x2 crafting without table requires inventory screen open (Bedrock protocol limitation)
- Item tags may not expand fully for all tag types
- Anvil tests skipped (position sync issue - needs openAnvil rewrite to use bot.openBlock())

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Function | `bot.recipesFor(itemType, metadata, minResultCount, craftingTable)` | [x] | Filters by availability |
| Function | `bot.recipesAll(itemType, metadata, craftingTable)` | [x] | Returns all matching recipes |
| Method | `bot.craft(recipe, count, craftingTable)` | [x] | Uses craft_recipe_auto |
| Method | `bot.openCraftingTable(craftingTableBlock)` | [x] | Opens 3x3 crafting grid |

**Workstation APIs (lib/bedrock/workstations/):**

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.openStonecutter(block)` | [x] | Opens stonecutter |
| Method | `stonecutter.cut(recipeId, result)` | [x] | BDS test passes |
| Method | `bot.openSmithingTable(block)` | [x] | Opens smithing table |
| Method | `smithing.putTemplate/putInput/putMaterial` | [x] | Place items in slots |
| Method | `smithing.upgrade(recipeId, result)` | [x] | BDS test passes |
| Method | `bot.openFurnace(block)` | [x] | Opens furnace window |
| Method | `furnace.putIngredient/putFuel/takeOutput` | [x] | Full furnace API with progress tracking |
| Method | `bot.openEnchantmentTable(block)` | [x] | Opens enchant table |
| Method | `enchantTable.putItem/putLapis` | [x] | Place items in slots |
| Method | `enchantTable.getOptions()` | [x] | Get available enchant options |
| Method | `enchantTable.enchant(slot)` | [x] | BDS test passes |
| Method | `bot.openAnvil(block)` | [x] | Custom impl (no container_open) |
| Method | `anvil.rename/combine` | [~] | Tests skipped (Bedrock protocol issue) |
| Method | `bot.openGrindstone(block)` | [x] | Opens grindstone for disenchanting |
| Method | `grindstone.putItem/disenchant` | [x] | Disenchant items |
| Method | `bot.openLoom(block)` | [x] | Opens loom for banner patterns |
| Method | `loom.putBanner/putDye/applyPattern` | [x] | Banner pattern application |
| Method | `bot.openBrewingStand(block)` | [x] | Opens brewing stand |
| Method | `brewing.putFuel/putIngredient/putBottle/takeBottle` | [x] | Full brewing API with progress |
| Method | `bot.openCartographyTable(block)` | [x] | Opens cartography table |
| Method | `cartography.putMap/putPaper/craft` | [x] | Map cloning/extending/locking |

---

## creative (70%)

**Dependencies**: inventory

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.creative.setInventorySlot()` | [ ] | |
| Method | `bot.creative.clearSlot()` | [ ] | |
| Method | `bot.creative.clearInventory()` | [ ] | |
| Method | `bot.creative.flyTo()` | [ ] | |
| Method | `bot.creative.startFlying()` | [ ] | |
| Method | `bot.creative.stopFlying()` | [ ] | |

---

## digging (100%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.targetDigBlock` | [x] | |
| Event | `"diggingCompleted"` | [x] | |
| Event | `"diggingAborted"` | [x] | |
| Function | `bot.canDigBlock()` | [x] | |
| Method | `bot.dig(block, forceLook, digFace)` | [x] | Uses player_auth_input |
| Method | `bot.stopDigging()` | [x] | |
| Method | `bot.digTime(block)` | [x] | |

---

## enchantment_table (90%)

**Dependencies**: inventory

**Implemented in lib/bedrock/workstations/enchanting.mts:**
- `bot.openEnchantmentTable(block)` - Opens enchantment table window
- `enchantTable.putItem(itemType, metadata)` - Place item to enchant (uses cursor flow)
- `enchantTable.putLapis(count)` - Place lapis lazuli (uses cursor flow)
- `enchantTable.getOptions()` - Get available enchant options from player_enchant_options packet
- `enchantTable.enchant(slot)` - Execute enchant using zigzag-encoded option_id (working)
- `enchantTable.takeItem()` - Take item back (captures new stackId after enchant)
- `enchantTable.close()` - Close and cleanup listener

**Enchant Options:**
Server sends `player_enchant_options` packet after placing item, containing option_id for each enchant slot. The option_id is zigzag32 decoded but recipe_network_id needs the unsigned encoding, so we re-encode it: `(rawOptionId << 1) ^ (rawOptionId >> 31)`.

**Status:**
- Receives enchant options correctly (3 options with cost, option_id, name)
- Enchant execution working - BDS test passes consistently
- Fixed: Zigzag encoding for option_id -> recipe_network_id conversion
- Fixed: Result placed BACK to enchanting_input before consuming lapis
- Fixed: Captures new stackId from enchant response for takeItem()
- Note: Without bookshelves, only cost=1 enchants are valid

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"ready"` | [ ] | Not implemented |
| Property | `enchantmentTable.targetItem()` | [ ] | Not tracked |
| Property | `enchantmentTable.xpseed` | [ ] | Not implemented |
| Property | `enchantmentTable.enchantments` | [ ] | Not implemented |
| Method | `bot.openEnchantmentTable(block)` | [x] | Opens window |
| Method | `enchantTable.putItem(itemType, metadata)` | [x] | Place item, waits for options |
| Method | `enchantTable.putLapis(count)` | [x] | Place lapis |
| Method | `enchantTable.getOptions()` | [x] | Returns available enchant options |
| Method | `enchantTable.enchant(slot)` | [x] | Working - BDS test passes |
| Method | `enchantTable.takeItem()` | [x] | Take item back to inventory |
| Method | `enchantTable.close()` | [x] | Cleanup listener and close |

---

## entities (~90%)

**Implementation Analysis:**
- Java: 957 LOC handling 25+ packet types for entities, players, metadata
- Bedrock: 601 LOC handling Bedrock-specific entity packets

**Bedrock Adaptation:**
- Uses `add_player`, `add_entity`, `add_item_entity` instead of Java's `named_entity_spawn`, `spawn_entity`
- Uses `remove_entity` instead of `entity_destroy`
- Uses `move_player`, `move_entity`, `move_entity_delta` for movement
- Uses `set_entity_link` for riding instead of `attach_entity`
- Uses `set_entity_data` for metadata instead of `entity_metadata`
- Uses `player_list` for player info instead of `player_info`
- Attack uses `inventory_transaction` with `item_use_on_entity` action
- Swing arm uses `animate` packet with `swing_arm` action

**Key Differences:**
1. **Entity IDs**: Bedrock uses `runtime_id` + `unique_id` (vs Java's single `entityId`)
2. **Position offset**: Players offset by `NAMED_ENTITY_HEIGHT` (1.62) in Bedrock
3. **Player list**: Bedrock has different record structure with `type: 'add'/'remove'`
4. **No animation events**: Many Java animation events not mapped

**Issues/Limitations:**
1. **mount/dismount/moveVehicle** - Commented out
2. **Animation events** - Only basic ones (swing_arm)
3. **useOn** - Commented out
4. **Equipment** - entity_equipment commented out
5. **Velocity** - Uses `set_entity_motion` but conversion may differ

**Verdict:** Well implemented (~85%). Core entity tracking works. Missing some animation events and vehicle methods.

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.entity` | [x] | From start_game |
| Property | `bot.entities` | [x] | Keyed by runtime_id |
| Event | `"entitySwingArm"` | [ ] | Not mapped from Bedrock |
| Event | `"entityHurt"` | [ ] | Not mapped |
| Event | `"entityDead"` | [ ] | Not mapped |
| Event | `"entityCrouch"` | [ ] | Not mapped (commented) |
| Event | `"entityUncrouch"` | [ ] | Not mapped (commented) |
| Event | `"entityEquip"` | [ ] | entity_equipment commented |
| Event | `"entitySleep"` | [ ] | Not mapped (commented) |
| Event | `"entitySpawn"` | [x] | Via add_player/add_entity |
| Event | `"playerCollect"` | [ ] | Not implemented |
| Event | `"entityGone"` | [x] | Via remove_entity |
| Event | `"entityMoved"` | [x] | Via move_* packets |
| Event | `"playerMoved"` | [x] | Bedrock-specific event |
| Event | `"entityDetach"` | [x] | Via set_entity_link |
| Event | `"entityAttach"` | [x] | Via set_entity_link |
| Event | `"entityUpdate"` | [x] | Via set_entity_data |
| Event | `"entityAttributes"` | [x] | Via update_attributes |
| Event | `"playerJoined"` | [x] | Via player_list |
| Event | `"playerUpdated"` | [x] | Via player_list |
| Event | `"playerLeft"` | [x] | Via player_list |
| Function | `bot.nearestEntity()` | [x] | Works |
| Method | `bot.attack(entity, swing)` | [x] | Via inventory_transaction |
| Method | `bot.swingArm(hand, showHand)` | [x] | Via animate packet |
| Method | `bot.mount(entity)` | [ ] | Commented out |
| Method | `bot.dismount()` | [ ] | Commented out |
| Method | `bot.moveVehicle(left, forward)` | [ ] | Commented out |
| Method | `bot.useOn(targetEntity)` | [ ] | Commented out |

**Test Coverage:**
- Unit Tests: None in bedrockTest.mts
- BDS Tests: Implicitly tested via other tests

---

## experience (100%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.experience.level` | [x] | |
| Property | `bot.experience.points` | [x] | |
| Property | `bot.experience.progress` | [x] | |
| Event | `"experience"` | [x] | |

---

## explosion (0-90%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Function | `bot.getExplosionDamages()` | [ ] | Requires logical checks |

---

## fishing (0-90%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.fish()` | [ ] | 100% possible |

---

## furnace (85%)

**Dependencies**: inventory

**Implemented in lib/bedrock/workstations/furnace.mts:**
- `bot.openFurnace(furnaceBlock)` - Opens furnace window
- `furnace.putIngredient(itemType, metadata, count)` - Place input item
- `furnace.putFuel(itemType, metadata, count)` - Place fuel item
- `furnace.takeInput()` - Take item from input slot
- `furnace.takeFuel()` - Take item from fuel slot
- `furnace.takeOutput()` - Take smelted item from output slot
- `furnace.fuel` / `furnace.progress` - Progress tracking via container_set_data

**Remaining:**
- Works with all furnace types (furnace, blast_furnace, smoker)
- "update" event not yet implemented

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"update"` | [ ] | Not implemented |
| Property | `furnace.fuel` | [x] | From container_set_data |
| Property | `furnace.progress` | [x] | From container_set_data |
| Method | `bot.openFurnace(block)` | [x] | Opens furnace window |
| Method | `furnace.putIngredient(itemType, metadata, count)` | [x] | Place item in input slot |
| Method | `furnace.putFuel(itemType, metadata, count)` | [x] | Place fuel in slot |
| Method | `furnace.takeInput()` | [x] | Take from input slot |
| Method | `furnace.takeFuel()` | [x] | Take from fuel slot |
| Method | `furnace.takeOutput()` | [x] | Take from output slot |
| Method | `furnace.inputItem()` | [x] | Get input slot item |
| Method | `furnace.fuelItem()` | [x] | Get fuel slot item |
| Method | `furnace.outputItem()` | [x] | Get output slot item |

---

## game (70-100%)

**Implementation Analysis:**
- Java: 142 LOC handling `login`, `respawn`, `game_state_change`, `difficulty`, `registry_data`
- Bedrock: 172 LOC handling `start_game`, `item_registry`, `respawn`

**Bedrock Adaptation:**
- Uses `start_game` packet instead of Java's `login` for initial game state
- Uses `item_registry` packet for item data (handled by registry)
- Dimension info from `start_game.dimension` directly (not codec parsing)
- Sends initialization packets: `serverbound_loading_screen`, `interact`, `set_local_player_as_initialized`
- Creates `item_registry_task` for async item registry loading
- No brand channel (Bedrock doesn't have this)

**Missing Features:**
1. **hardcore mode** - Not applicable to Bedrock
2. **maxPlayers** - Commented out
3. **serverBrand** - No brand channel in Bedrock
4. **game_state_change** - Commented out (needs investigation)
5. **difficulty changes** - Commented out

**Verdict:** Well adapted (~75%). Core game state works but some properties missing.

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.game.levelType` | [x] | From generator field |
| Property | `bot.game.dimension` | [x] | Directly from packet |
| Property | `bot.game.difficulty` | [x] | From start_game |
| Property | `bot.game.gameMode` | [x] | From player_gamemode |
| Property | `bot.game.hardcore` | [~] | Checks gamemode === 'hardcore' |
| Property | `bot.game.maxPlayers` | [ ] | Commented out |
| Property | `bot.game.serverBrand` | [ ] | Not in Bedrock |
| Property | `bot.game.minY` | [x] | From dimensionsByName or default -64 |
| Property | `bot.game.height` | [x] | From dimensionsByName or default 384 |
| Event | `"game"` | [x] | On start_game and respawn |
| Event | `"login"` | [x] | On start_game |
| Event | `"spawn"` | [ ] | Handled by health plugin |
| Event | `"respawn"` | [ ] | Handled by health plugin |

**Test Coverage:**
- Unit Tests: None
- BDS Tests: None

---

## generic_place (0%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.activateBlock()` | [ ] | Possibly implementable |

---

## health (100%)

**Implementation Analysis:**
- Java: 41 LOC using `update_health` packet
- Bedrock: 131 LOC using multiple Bedrock-specific packets

**Bedrock Adaptation:**
- Uses `set_health` packet for direct health updates
- Food/saturation tracked via `entityAttributes` event (`minecraft:player.hunger`, `minecraft:player.saturation`)
- Complex respawn state machine with internal flags: `respawnLocked`, `awaitingRespawn`, `respawnQueued`, `spawned`, `deathHandled`
- Handles `entity_event` for `death_animation` and `respawn` events
- Handles `play_status` with `player_spawn` for initial spawn
- Respawn packet format: `{ position, state, runtime_entity_id }`

**Verdict:** Properly rewritten for Bedrock protocol (not a copy of Java code)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.health` | [x] | From `set_health` and `entityAttributes` |
| Property | `bot.food` | [x] | From `entityAttributes` (default: 20) |
| Property | `bot.foodSaturation` | [x] | From `entityAttributes` (default: 5) |
| Property | `bot.isAlive` | [x] | State-managed with death/spawn flow |
| Event | `"health"` | [x] | Emitted on health change |
| Event | `"death"` | [x] | Via handleDeath() |
| Event | `"spawn"` | [x] | Via handleSpawn() |
| Event | `"respawn"` | [x] | On respawn packet state=0 |
| Method | `bot.respawn()` | [x] | Bedrock-specific packet format |

**Test Coverage:**
- Unit Tests: None in bedrockTest.mts
- BDS Tests: None (needs health.test.mts)

---

## inventory (100%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.heldItem` | [x] | |
| Property | `bot.usingHeldItem` | [x] | |
| Property | `bot.quickBarSlot` | [x] | |
| Property | `bot.inventory` | [x] | |
| Property | `bot.simpleClick.leftMouse` | [x] | |
| Property | `bot.simpleClick.rightMouse` | [x] | |
| Event | `"heldItemChanged"` | [x] | |
| Event | `"windowOpen"` | [x] | |
| Event | `"windowClose"` | [x] | |
| Method | `bot.clickWindow(slot, mouseButton, mode)` | [x] | All modes 0-4 |
| Method | `bot.putSelectedItemRange()` | [x] | |
| Method | `bot.putAway()` | [x] | |
| Method | `bot.closeWindow()` | [x] | |
| Method | `bot.transfer()` | [x] | |
| Method | `bot.moveSlotItem()` | [x] | |
| Method | `bot.updateHeldItem()` | [x] | |
| Method | `bot.getEquipmentDestSlot()` | [x] | |
| Method | `bot.setQuickBarSlot()` | [x] | |
| Method | `bot.openBlock()` | [x] | |
| Method | `bot.openEntity()` | [x] | |

---

## kick (100%)

**Implementation Analysis:**
- Java: 14 LOC with two packet handlers (`kick_disconnect`, `disconnect`)
- Bedrock: 12 LOC with single packet handler (`disconnect`)

**Bedrock Adaptation:**
- Java has separate `kick_disconnect` and `disconnect` packets
- Bedrock only has `disconnect` packet, infers kick by checking if reason contains 'kick'
- Uses `packet.message ?? packet.reason` for the kick reason

**Verdict:** Properly adapted for Bedrock protocol (different packet structure)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"kicked"` | [x] | Infers kicked from reason string |
| Event | `"end"` | [x] | Handled in loader.js (client.on('end')) |
| Event | `"error"` | [x] | Handled in loader.js (client.on('error')) |
| Method | `bot.quit(reason)` | [x] | Calls bot.end() |

**Test Coverage:**
- Unit Tests: None in bedrockTest.mts
- BDS Tests: None

---

## particle (~90%)

**Implementation Analysis:**
- Java: 10 LOC using `world_particles` packet with `Particle.fromNetwork()`
- Bedrock: 18 LOC using `level_event` and `spawn_particle_effect` packets

**Bedrock Adaptation:**
- Uses two packet sources:
  1. `level_event` - filters for `event.startsWith('particle')`
  2. `spawn_particle_effect` - direct particle spawn with name/position
- Creates Particle with `(name, position, offset)` instead of `fromNetwork()`
- Offset hardcoded to `Vec3(0, 0, 0)` - Bedrock doesn't provide offset

**Issues/Limitations:**
1. **offset** - Always (0,0,0), Bedrock packets don't include it
2. **longDistanceRender** - Not available in Bedrock
3. **count** - Not extracted from Bedrock packets
4. **movementSpeed** - Not available in Bedrock
5. **Particle name mapping** - Uses raw Bedrock names (e.g., `particle_drip_lava`)

**Verdict:** Basic implementation (~60%). Emits particle events but missing most properties.

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `Particle.id` | [ ] | Not extracted |
| Property | `Particle.name` | [x] | From packet event/particle_name |
| Property | `Particle.position` | [x] | From packet.position |
| Property | `Particle.offset` | [ ] | Hardcoded (0,0,0) |
| Property | `Particle.longDistanceRender` | [ ] | Not in Bedrock |
| Property | `Particle.count` | [ ] | Not extracted |
| Property | `Particle.movementSpeed` | [ ] | Not in Bedrock |
| Event | `"particle"` | [x] | Via both level_event and spawn_particle_effect |

**Test Coverage:**
- Unit Tests: None
- BDS Tests: None

---

## physics (~70%)

**Implementation Analysis:**
- Java: 441 LOC using `position`, `look`, `position_look`, `flying` packets
- Bedrock: 594 LOC using `player_auth_input` packet (authoritative movement)

**Bedrock Adaptation:**
- **Authoritative Movement**: Bedrock uses `player_auth_input` instead of separate position/look packets
- **InputDataService**: Custom service to track control state transitions
- **Complex Input Flags**: 50+ input flags (jumping, sneaking, sprinting, etc.) vs Java's simple packets
- **Move Vector**: Calculates `move_vector` from WASD state (max 1.0 normalized)
- **Camera Orientation**: Tracks 3D camera orientation vector
- **Transaction System**: Can embed item_stack_request and block_action in movement packet
- **Tick-based**: Uses BigInt tick counter for each movement update
- Older versions (<=1.19.1) also send `set_entity_data` for sneak/sprint

**Key Differences:**
1. **Packet Format**: Single `player_auth_input` vs multiple Java packets
2. **Input Flags**: Complex bitfield vs simple control state
3. **Transaction Embedding**: Can include inventory/block actions in movement
4. **Position**: Sent with `bot.entity.height` offset
5. **No elytraFly**: Not implemented

**Issues/Limitations:**
1. **fireworkRocketDuration** - Not implemented
2. **usedFirework event** - Not implemented
3. **elytraFly** - Not implemented
4. **mount/dismount events** - mount commented out
5. **explosion knockback** - Not implemented

**Verdict:** Well implemented for Bedrock (~80%). Core movement works with authoritative protocol.

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.physicsEnabled` | [x] | Same as Java |
| Property | `bot.physics` | [x] | From prismarine-physics |
| Property | `bot.controlState` | [x] | Same interface |
| Property | `bot.fireworkRocketDuration` | [ ] | Not implemented |
| Event | `"move"` | [x] | Via sendMovementUpdate |
| Event | `"forcedMove"` | [x] | On start_game/move_player |
| Event | `"mount"` | [ ] | Commented out |
| Event | `"dismount"` | [ ] | Commented out |
| Event | `"usedFirework"` | [ ] | Not implemented |
| Event | `"physicsTick"` | [x] | Every 50ms |
| Event | `"subchunkContainingPlayerChanged"` | [x] | Bedrock-specific |
| Method | `bot.setControlState()` | [x] | Works with input flags |
| Method | `bot.getControlState()` | [x] | Same as Java |
| Method | `bot.clearControlStates()` | [x] | Same as Java |
| Method | `bot.lookAt()` | [x] | Force=true by default |
| Method | `bot.look()` | [x] | Force=true by default |
| Method | `bot.waitForTicks()` | [x] | Same as Java |
| Method | `bot.sendPlayerAuthInputTransaction()` | [x] | Bedrock-specific |

**Test Coverage:**
- Unit Tests: None
- BDS Tests: Implicitly tested via pathfinding tests

---

## place_block (0%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"blockPlaced"` | [ ] | |
| Method | `bot.placeBlock()` | [ ] | Requires player_auth_input |
| Method | `bot.activateBlock()` | [ ] | |
| Method | `bot.updateSign()` | [ ] | |

---

## place_entity (0-80%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.placeEntity()` | [ ] | 100% possible |
| Method | `bot.activateEntity()` | [ ] | |
| Method | `bot.activateEntityAt()` | [ ] | |

---

## rain (100%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.isRaining` | [x] | |
| Property | `bot.rainState` | [x] | |
| Property | `bot.thunderState` | [x] | |
| Event | `"rain"` | [x] | |
| Event | `"weatherUpdate"` | [x] | |

---

## ray_trace (100%)

**Implementation Analysis:**
- Java: 66 LOC with raycasting logic
- Bedrock: **Uses same Java plugin directly** (no separate file)

**Why Shared Works:**
The ray_trace plugin performs client-side calculations using:
- `bot.entity.position`, `height`, `pitch`, `yaw` - works on Bedrock
- `bot.world.raycast()` from prismarine-world - works on Bedrock
- `bot.entities` for entity cursor detection - works on Bedrock
- `RaycastIterator` from prismarine-world - platform-agnostic

No protocol-specific code - pure math/geometry calculations.

**Loader Config:** `ray_trace: plugins.ray_trace` (reuses Java plugin)

**Verdict:** Correctly shared - no Bedrock-specific adaptation needed

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Function | `bot.blockAtCursor()` | [x] | Uses blockAtEntityCursor internally |
| Function | `bot.entityAtCursor()` | [x] | Filters entities, uses RaycastIterator |
| Function | `bot.blockAtEntityCursor()` | [x] | Uses world.raycast() |
| Function | `bot.blockInSight()` | [x] | Deprecated, wraps blockAtCursor |

**Test Coverage:**
- Unit Tests: None in bedrockTest.mts
- BDS Tests: None
- Java Tests: externalTests/rayTrace.js exists

---

## resource_pack (N/A)

**Implementation Analysis:**
- Java: 94 LOC with packet handlers for add/remove/send resource packs
- Bedrock: 15 LOC - **Stub implementation** (throws "Not supported")

**Why N/A for Bedrock:**
Bedrock Edition handles resource packs differently - they're negotiated during the login sequence at the protocol level. The bedrock-protocol library handles this automatically before the bot "spawns":
1. Server sends `resource_packs_info`
2. Client responds with `resource_pack_client_response`
3. Server sends `resource_pack_stack`
4. Client responds with `resource_pack_client_response`

This happens before the mineflayer bot is even created, so accept/deny at runtime is not possible.

**Verdict:** Intentionally stub - resource packs handled by bedrock-protocol at connection time

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"resourcePack"` | N/A | Not emitted - handled at protocol level |
| Method | `bot.acceptResourcePack()` | [x] | Throws "Not supported" (intentional) |
| Method | `bot.denyResourcePack()` | [x] | Throws "Not supported" (intentional) |

**Test Coverage:**
- Unit Tests: None (N/A - stub)
- BDS Tests: None (N/A - stub)

---

## scoreboard (10%)

**Implementation Analysis:**
- Java: 75 LOC using `scoreboard_objective`, `scoreboard_score`, `scoreboard_display_objective`
- Bedrock: 64 LOC using `set_display_objective`, `remove_objective`, `set_score` - **ALL COMMENTED OUT**

**Bedrock Packets:**
- `set_display_objective` - Listener exists but logic commented
- `remove_objective` - Listener exists but logic commented
- `set_score` - Listener exists but logic commented

**Why Commented Out:**
The code appears to have been partially adapted but the implementation was left incomplete. The packet handlers exist but all the actual logic is commented:
- No scoreboard creation on `set_display_objective`
- No scoreboard deletion on `remove_objective`
- No score updates on `set_score`
- Just `console.log(packet)` debug statements

**Issues/Limitations:**
1. **All packet handlers commented** - Literally no working logic
2. **Different packet names** - Bedrock uses different packet structures
3. **Properties exposed but empty** - `bot.scoreboards = {}`, `bot.scoreboard = positions`

**Verdict:** Stub only (~5%). Properties exposed but no functionality.

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.scoreboards` | [~] | Exists but always empty |
| Property | `bot.scoreboard` | [~] | Positions object exists |
| Property | `ScoreBoard.name` | [ ] | Never populated |
| Property | `ScoreBoard.title` | [ ] | Never populated |
| Property | `ScoreBoard.itemsMap` | [ ] | Never populated |
| Property | `ScoreBoard.items` | [ ] | Never populated |
| Event | `"scoreboardCreated"` | [ ] | Handler commented |
| Event | `"scoreboardDeleted"` | [ ] | Handler commented |
| Event | `"scoreboardTitleChanged"` | [ ] | Not implemented |
| Event | `"scoreUpdated"` | [ ] | Handler commented |
| Event | `"scoreRemoved"` | [ ] | Handler commented |
| Event | `"scoreboardPosition"` | [ ] | Not implemented |

**Test Coverage:**
- Unit Tests: None
- BDS Tests: None

---

## settings (0%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.settings.chat` | [ ] | |
| Property | `bot.settings.colorsEnabled` | [ ] | |
| Property | `bot.settings.viewDistance` | [ ] | Only some exposed |
| Property | `bot.settings.difficulty` | [ ] | |
| Property | `bot.settings.skinParts` | [ ] | |
| Property | `bot.settings.enableTextFiltering` | [ ] | |
| Property | `bot.settings.enableServerListing` | [ ] | |
| Method | `bot.setSettings()` | [ ] | |

---

## simple_inventory (100%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.equip(item, destination)` | [x] | All slots + armor + offhand |
| Method | `bot.unequip(destination)` | [x] | |
| Method | `bot.tossStack(item)` | [x] | |
| Method | `bot.toss(itemType, metadata, count)` | [x] | |
| Method | `bot.elytraFly()` | [x] | |
| Method | `bot.consume()` | [x] | |
| Method | `bot.activateItem(offHand)` | [x] | |
| Method | `bot.deactivateItem()` | [x] | |

---

## sound (100%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"soundEffectHeard"` | [x] | |
| Event | `"hardcodedSoundEffectHeard"` | [x] | |
| Event | `"noteHeard"` | [x] | |

---

## spawn_point (100%)

**Implementation Analysis:**
- Java: 11 LOC using `spawn_position` packet
- Bedrock: 17 LOC using `set_spawn_position` packet

**Bedrock Adaptation:**
- Uses `set_spawn_position` packet (different from Java's `spawn_position`)
- Filters for `spawn_type === 'player'` (ignores world spawn)
- Extracts from `packet.player_position` field
- Commented code for `world` spawn type (not needed for player spawn)
- Emits `game` event (same as Java)

**Note:** `spawnReset` event is handled by bed plugin (not spawn_point)

**Verdict:** Properly adapted for Bedrock protocol

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.spawnPoint` | [x] | Set from player_position |
| Event | `"game"` | [x] | Emitted on spawn position change |
| Event | `"spawnReset"` | N/A | Handled by bed plugin (not implemented for Bedrock) |

**Test Coverage:**
- Unit Tests: None in bedrockTest.mts
- BDS Tests: None

---

## tablist (0%)

**Implementation Analysis:**
- Java: 31 LOC using `playerlist_header` packet for header/footer
- Bedrock: 12 LOC - **Stub only** (no packet handlers)

**Why Stub:**
Bedrock Edition does NOT have a tab list header/footer packet. The `player_list` packet only contains player entries (handled by entities plugin), not the customizable header/footer text that Java servers can set.

**Bedrock Behavior:**
- Player list comes from `player_list` packet (handled in entities.mts)
- No equivalent to Java's `playerlist_header` packet
- Header/footer would need to be synthesized from other sources (not standard)

**What Works:**
- `bot.tablist` object exists with empty ChatMessage header/footer
- `bot.player` and `bot.players` work (handled by entities plugin)

**Verdict:** Intentionally stub - no Bedrock equivalent for header/footer.

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.tablist` | [~] | Object exists, always empty strings |
| Property | `bot.tablist.header` | [ ] | Always empty (no Bedrock packet) |
| Property | `bot.tablist.footer` | [ ] | Always empty (no Bedrock packet) |
| Property | `bot.player` | [x] | Handled by entities plugin |
| Property | `bot.players` | [x] | Handled by entities plugin |

**Test Coverage:**
- Unit Tests: None
- BDS Tests: None (N/A - stub)

---

## team (0%)

**Implementation Analysis:**
- Java: 77 LOC using `scoreboard_team` or `teams` packet
- Bedrock: 7 LOC - **Explicit stub** with comment "Unsupported in bedrock"

**Why Unsupported:**
Bedrock Edition does not have a native team system equivalent to Java Edition's scoreboard teams. The Java team system provides:
- Name coloring
- Friendly fire rules
- Name tag visibility
- Collision rules
- Prefixes/suffixes

Bedrock handles these features differently (through player permissions, server-side logic, or addons).

**What the Stub Does:**
- Sets `bot.teams = {}` (empty object)
- Sets `bot.teamMap = {}` (empty object)
- No packet handlers
- Comment explicitly states "Unsupported in bedrock"

**Verdict:** Intentionally unsupported - no Bedrock equivalent. Properties exposed but always empty.

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.teams` | [~] | Always empty `{}` |
| Property | `bot.teamMap` | [~] | Always empty `{}` |
| Property | `Team.name` | [ ] | Never populated |
| Property | `Team.friendlyFire` | [ ] | Never populated |
| Property | `Team.nameTagVisibility` | [ ] | Never populated |
| Property | `Team.collisionRule` | [ ] | Never populated |
| Property | `Team.color` | [ ] | Never populated |
| Property | `Team.prefix` | [ ] | Never populated |
| Property | `Team.suffix` | [ ] | Never populated |
| Property | `Team.members` | [ ] | Never populated |
| Event | `"teamCreated"` | [ ] | Never emitted |
| Event | `"teamRemoved"` | [ ] | Never emitted |
| Event | `"teamUpdated"` | [ ] | Never emitted |
| Event | `"teamMemberAdded"` | [ ] | Never emitted |
| Event | `"teamMemberRemoved"` | [ ] | Never emitted |

**Test Coverage:**
- Unit Tests: None (N/A - unsupported)
- BDS Tests: None (N/A - unsupported)

---

## time (100%)

**Implementation Analysis:**
- Java: 38 LOC using single `update_time` packet
- Bedrock: 63 LOC using multiple packets for different data

**Bedrock Adaptation:**
- Time: Uses `set_time` packet (different from Java's `update_time`)
- Age: **Implemented via different packets** (not in set_time):
  - `start_game.current_tick` - initial world tick count
  - `tick_sync.response_time` - ongoing tick updates
- doDaylightCycle: Inferred from negative time value

**Note:** The loader comment "doesnt have AGE" is outdated - age IS implemented.

**Verdict:** Properly adapted for Bedrock protocol - all properties work

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.time.doDaylightCycle` | [x] | Inferred from time sign |
| Property | `bot.time.bigTime` | [x] | From set_time packet |
| Property | `bot.time.time` | [x] | From set_time packet |
| Property | `bot.time.timeOfDay` | [x] | Calculated (time % 24000) |
| Property | `bot.time.day` | [x] | Calculated (time / 24000) |
| Property | `bot.time.isDay` | [x] | Range [0, 13000) |
| Property | `bot.time.moonPhase` | [x] | Calculated (day % 8) |
| Property | `bot.time.bigAge` | [x] | From start_game + tick_sync |
| Property | `bot.time.age` | [x] | From start_game + tick_sync |
| Event | `"time"` | [x] | Emitted on set_time |

**Test Coverage:**
- Unit Tests: None in bedrockTest.mts
- BDS Tests: time.test.mts (5 tests - properties, updates, day/night, moon phase, age)

---

## title (~50%)

**Implementation Analysis:**
- Java: 37 LOC with legacy/new packet support, `parseTitle()` function
- Bedrock: 12 LOC - **INCOMPLETE**

**Bedrock Packet Types (set_title):**
- `0: clear` - Not handled
- `1: reset` - Not handled
- `2: set_title` - Handled
- `3: set_subtitle` - Handled
- `4: action_bar_message` - Not handled
- `5: set_durations` - Not handled (has fade_in_time, stay_time, fade_out_time)
- `6-8: *_json` variants - Not handled

**Missing Implementation:**
1. `title_times` event - packet has `fade_in_time`, `stay_time`, `fade_out_time` fields
2. `title_clear` event - packet type 0 (clear) and 1 (reset)
3. Action bar messages (type 4)
4. JSON text variants (types 6-8)

**Verdict:** Partially implemented - only handles title/subtitle text, missing timing and clear events

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"title"` | [x] | Only set_title (type 2) |
| Event | `"title"` (subtitle) | [x] | Only set_subtitle (type 3) |
| Event | `"title_times"` | [ ] | **MISSING** - need to handle set_durations (type 5) |
| Event | `"title_clear"` | [ ] | **MISSING** - need to handle clear/reset (types 0,1) |

**Test Coverage:**
- Unit Tests: None in bedrockTest.mts
- BDS Tests: None (needs title.test.mts)

---

## villager (0%)

**Dependencies**: inventory

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"ready"` | [ ] | |
| Property | `villager.trades` | [ ] | |
| Method | `bot.openVillager()` | [ ] | |
| Method | `bot.trade()` | [ ] | |
| Method | `villager.trade()` | [ ] | |
