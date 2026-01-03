# TODO

## Plugin Migration Checklist

### How to Complete This Checklist

For each plugin, verify and check off:

1. **Bedrock Impl** - Create `.mts` file in `packages/mineflayer/lib/bedrockPlugins/`
   - Read the Java plugin in `lib/plugins/<name>.js` to understand the API
   - Implement the same API using Bedrock protocol packets
   - Ensure all events, methods, and properties match the Java version

2. **Unit Tests** - Add tests in `packages/mineflayer/test/bedrockTest.mts`
   - Test against mock server (`mineflayer-bedrock-server`)
   - Cover core functionality and edge cases
   - Verify API compatibility with Java version

3. **BDS Tests** - Add integration tests in `packages/minecraft-bedrock-tests/test/<plugin>.test.mts`
   - Test against real Bedrock Dedicated Server
   - Run with: `npm run test:bds` or `npm run mocha_test --workspace=minecraft-bedrock-tests`
   - Cover real-world scenarios

4. **Loader Enabled** - Enable plugin in `packages/mineflayer/lib/loader.js`
   - Uncomment the plugin import in the Bedrock plugins section
   - Uncomment the plugin in the `bedrockPlugins` object
   - Test that bot loads without errors

| Plugin | % | Reviewed | Bedrock Impl | Unit Tests | BDS Tests | Loader Enabled | Dependencies / Notes |
|--------|---|----------|--------------|------------|-----------|----------------|----------------------|
| anvil | 0% | [ ] | [ ] | [ ] | [ ] | [ ] | Requires inventory |
| bed | 0-40% | [ ] | [ ] | [ ] | [ ] | [ ] | Possibly implementable |
| block_actions | 40% | [ ] | [x] | [ ] | [x] | [x] | destroyStage unavailable, client-side calc needed |
| blocks | 80% | [ ] | [x] | [ ] | [x] | [x] | WIP world loader, doors BBS issues |
| book | 0-70% | [ ] | [ ] | [ ] | [ ] | [ ] | Requires NBT support |
| boss_bar | 0-80% | [ ] | [x] | [ ] | [ ] | [x] | Entity-based in Bedrock |
| breath | 100% | [x] | [x] | [ ] | [x] | [x] | - |
| chat | 100% | [x] | [x] | [ ] | [x] | [x] | Fixed for 1.21.130 |
| chest | 0% | [ ] | [ ] | [ ] | [ ] | [ ] | Requires inventory |
| command_block | 0% | [ ] | [ ] | [ ] | [ ] | [ ] | Requires inventory |
| craft | 40% | [ ] | [ ] | [ ] | [ ] | [ ] | Requires inventory + Bedrock recipes |
| creative | 70% | [ ] | [ ] | [ ] | [ ] | [ ] | Requires inventory |
| digging | 100% | [x] | [x] | [x] | [x] | [x] | Uses player_auth_input block_action |
| enchantment_table | 0% | [ ] | [ ] | [ ] | [ ] | [ ] | Requires inventory |
| entities | ~90% | [ ] | [x] | [ ] | [x] | [x] | No item entities, yaw/pitch conversion issues |
| experience | 100% | [x] | [x] | [ ] | [x] | [x] | - |
| explosion | 0-90% | [ ] | [ ] | [ ] | [ ] | [ ] | Requires logical checks |
| fishing | 0-90% | [ ] | [ ] | [ ] | [ ] | [ ] | 100% possible |
| furnace | 0% | [ ] | [ ] | [ ] | [ ] | [ ] | Requires inventory |
| game | 70-100% | [ ] | [x] | [ ] | [ ] | [x] | Requires other plugin implementations |
| generic_place | 0% | [ ] | [ ] | [ ] | [ ] | [ ] | Possibly implementable |
| health | 100% | [x] | [x] | [ ] | [ ] | [x] | Properly adapted for Bedrock protocol |
| inventory | 100% | [x] | [x] | [x] | [x] | [x] | Full click modes (0-4), containers, transfers |
| kick | 100% | [x] | [x] | [ ] | [ ] | [x] | Adapted for Bedrock disconnect packet |
| particle | ~90% | [ ] | [x] | [ ] | [ ] | [x] | Needs unification |
| physics | ~70% | [ ] | [x] | [ ] | [ ] | [x] | Requires blocks + minecraft-data update |
| place_block | 0% | [ ] | [ ] | [ ] | [ ] | [ ] | Requires player_auth_input logic |
| place_entity | 0-80% | [ ] | [ ] | [ ] | [ ] | [ ] | 100% possible |
| rain | 100% | [x] | [x] | [ ] | [x] | [x] | - |
| ray_trace | 100% | [x] | [x] | [ ] | [ ] | [x] | Shared Java plugin - no Bedrock changes needed |
| resource_pack | N/A | [x] | [x] | [ ] | [ ] | [x] | Handled by bedrock-protocol at login |
| scoreboard | 10% | [ ] | [x] | [ ] | [ ] | [x] | Badly implemented, 0 functions working |
| settings | 0% | [ ] | [ ] | [ ] | [ ] | [ ] | Only some settings exposed |
| simple_inventory | 100% | [x] | [x] | [x] | [ ] | [x] | Requires inventory |
| sound | 100% | [x] | [x] | [ ] | [x] | [x] | - |
| spawn_point | 100% | [x] | [x] | [ ] | [ ] | [x] | Properly adapted for Bedrock |
| tablist | 0% | [ ] | [x] | [ ] | [ ] | [x] | Bedrock doesn't have natively, conversion possible |
| team | 0% | [ ] | [x] | [ ] | [ ] | [x] | Requires investigation |
| time | 100% | [x] | [x] | [ ] | [x] | [x] | Properly adapted - age via tick_sync |
| title | ~50% | [x] | [x] | [ ] | [ ] | [x] | Missing title_times, title_clear events |
| villager | 0% | [ ] | [ ] | [ ] | [ ] | [ ] | Requires inventory |

### Checklist Column Definitions

- **Reviewed**: Plugin has been reviewed and all checkboxes verified
- **Bedrock Impl**: `.mts` file exists in `packages/mineflayer/lib/bedrockPlugins/`
- **Unit Tests**: Tests in `packages/mineflayer/test/bedrockTest.mts` or `inventoryTest.mts`
- **BDS Tests**: Tests in `packages/minecraft-bedrock-tests/test/`
- **Loader Enabled**: Plugin enabled (not commented) in `packages/mineflayer/lib/loader.js`

### Summary Statistics

**Total Plugins**: 41

**Bedrock Implementation**: 26/41 (63%)
- Completed: block_actions, blocks, boss_bar, breath, chat, digging, entities, experience, game, health, inventory, kick, particle, physics, rain, ray_trace, resource_pack, scoreboard, simple_inventory, sound, spawn_point, tablist, team, time, title
- Missing: anvil, bed, book, chest, command_block, craft, creative, enchantment_table, explosion, fishing, furnace, generic_place, place_block, place_entity, settings, villager

**Unit Tests**: 3/41 (7%)
- Completed: digging, inventory, simple_inventory
- Missing: 38 plugins need unit tests

**BDS Integration Tests**: 10/41 (24%)
- Completed: block_actions, blocks, breath, chat, digging, entities, experience, inventory, rain, sound, time
- Missing: 31 plugins need BDS tests

**Loader Enabled**: 26/41 (63%)
- Enabled: block_actions, blocks, boss_bar, breath, chat, digging, entities, experience, game, health, inventory, kick, particle, physics, rain, ray_trace, resource_pack, scoreboard, simple_inventory, sound, spawn_point, tablist, team, time, title
- Disabled: anvil, bed, book, chest, command_block, craft, creative, enchantment_table, explosion, fishing, furnace, generic_place, place_block, place_entity, settings, villager

**Fully Reviewed**: 15/41 (37%)
- breath, chat, digging, experience, health, inventory, kick, rain, ray_trace, resource_pack, simple_inventory, sound, spawn_point, time, title

---

## Detailed API Status per Plugin

Reference: `packages/mineflayer/docs/api.md`

### anvil (0%)
**Dependencies**: inventory

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.openAnvil(anvilBlock)` | [ ] | |
| Method | `anvil.combine(itemOne, itemTwo, name)` | [ ] | |
| Method | `anvil.rename(item, name)` | [ ] | |

---

### bed (0-40%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.isSleeping` | [ ] | |
| Event | `"sleep"` | [ ] | |
| Event | `"wake"` | [ ] | |
| Method | `bot.sleep(bedBlock)` | [ ] | |
| Method | `bot.isABed(bedBlock)` | [ ] | |
| Method | `bot.wake()` | [ ] | |

---

### block_actions (40%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"noteHeard"` | [ ] | Requires piston/noteblock fix |
| Event | `"pistonMove"` | [ ] | Requires fix |
| Event | `"chestLidMove"` | [ ] | |
| Event | `"blockBreakProgressObserved"` | [ ] | destroyStage unavailable in Bedrock |
| Event | `"blockBreakProgressEnd"` | [ ] | |

---

### blocks (80%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.world` | [x] | |
| Event | `"blockUpdate"` | [x] | |
| Event | `"blockUpdate:(x,y,z)"` | [x] | |
| Event | `"blockPlaced"` | [ ] | Requires place_block |
| Event | `"chunkColumnLoad"` | [x] | |
| Event | `"chunkColumnUnload"` | [x] | |
| Function | `bot.blockAt(point, extraInfos)` | [x] | |
| Function | `bot.waitForChunksToLoad()` | [x] | |
| Function | `bot.blockInSight()` | [x] | Deprecated |
| Function | `bot.blockAtCursor()` | [x] | Via ray_trace |
| Function | `bot.blockAtEntityCursor()` | [x] | Via ray_trace |
| Function | `bot.canSeeBlock()` | [x] | |
| Function | `bot.findBlocks()` | [x] | |
| Function | `bot.findBlock()` | [x] | |

**Notes**: WIP world loader, doors BBS calculation issues

---

### book (0-70%)
**Dependencies**: NBT support

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.writeBook(slot, pages)` | [ ] | Requires NBT |

---

### boss_bar (0-80%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `BossBar.title` | [x] | |
| Property | `BossBar.health` | [x] | |
| Property | `BossBar.dividers` | [ ] | Not in Bedrock |
| Property | `BossBar.entityUUID` | [x] | |
| Property | `BossBar.shouldDarkenSky` | [ ] | |
| Property | `BossBar.isDragonBar` | [ ] | |
| Property | `BossBar.createFog` | [ ] | |
| Property | `BossBar.color` | [x] | |
| Event | `"bossBarCreated"` | [x] | |
| Event | `"bossBarDeleted"` | [x] | |
| Event | `"bossBarUpdated"` | [x] | |

**Notes**: Entity-based in Bedrock (not packet-based like Java)

---

### breath (100%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.oxygenLevel` | [x] | |
| Event | `"breath"` | [x] | |

---

### chat (100%)

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

### chest (0%)
**Dependencies**: inventory

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.openContainer()` | [ ] | |
| Method | `bot.openChest()` | [ ] | Deprecated |
| Method | `window.deposit()` | [ ] | |
| Method | `window.withdraw()` | [ ] | |
| Method | `window.close()` | [ ] | |

---

### command_block (0%)
**Dependencies**: inventory

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.setCommandBlock(pos, command, options)` | [ ] | |

---

### craft (40%)
**Dependencies**: inventory, Bedrock recipes

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Function | `bot.recipesFor()` | [ ] | |
| Function | `bot.recipesAll()` | [ ] | |
| Method | `bot.craft(recipe, count, craftingTable)` | [ ] | |

---

### creative (70%)
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

### digging (100%)

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

### enchantment_table (0%)
**Dependencies**: inventory

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"ready"` | [ ] | |
| Property | `enchantmentTable.targetItem()` | [ ] | |
| Property | `enchantmentTable.xpseed` | [ ] | |
| Property | `enchantmentTable.enchantments` | [ ] | |
| Method | `bot.openEnchantmentTable()` | [ ] | |
| Method | `enchantmentTable.enchant()` | [ ] | |
| Method | `enchantmentTable.takeTargetItem()` | [ ] | |
| Method | `enchantmentTable.putTargetItem()` | [ ] | |
| Method | `enchantmentTable.putLapis()` | [ ] | |

---

### entities (~90%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.entity` | [x] | |
| Property | `bot.entities` | [x] | |
| Event | `"entitySwingArm"` | [x] | |
| Event | `"entityHurt"` | [x] | |
| Event | `"entityDead"` | [x] | |
| Event | `"entityTaming"` | [ ] | |
| Event | `"entityTamed"` | [ ] | |
| Event | `"entityShakingOffWater"` | [ ] | |
| Event | `"entityEatingGrass"` | [ ] | |
| Event | `"entityHandSwap"` | [ ] | |
| Event | `"entityWake"` | [x] | |
| Event | `"entityEat"` | [ ] | |
| Event | `"entityCriticalEffect"` | [ ] | |
| Event | `"entityMagicCriticalEffect"` | [ ] | |
| Event | `"entityCrouch"` | [x] | |
| Event | `"entityUncrouch"` | [x] | |
| Event | `"entityEquip"` | [x] | |
| Event | `"entitySleep"` | [x] | |
| Event | `"entitySpawn"` | [x] | |
| Event | `"entityElytraFlew"` | [ ] | |
| Event | `"itemDrop"` | [ ] | No item entities |
| Event | `"playerCollect"` | [x] | |
| Event | `"entityGone"` | [x] | |
| Event | `"entityMoved"` | [x] | |
| Event | `"entityDetach"` | [x] | |
| Event | `"entityAttach"` | [x] | |
| Event | `"entityUpdate"` | [x] | |
| Event | `"entityEffect"` | [x] | |
| Event | `"entityEffectEnd"` | [x] | |
| Event | `"entityAttributes"` | [x] | |
| Event | `"playerJoined"` | [x] | |
| Event | `"playerUpdated"` | [x] | |
| Event | `"playerLeft"` | [x] | |
| Function | `bot.nearestEntity()` | [x] | |
| Method | `bot.attack(entity, swing)` | [x] | |
| Method | `bot.swingArm(hand, showHand)` | [x] | |
| Method | `bot.mount(entity)` | [x] | |
| Method | `bot.dismount()` | [x] | |
| Method | `bot.moveVehicle(left, forward)` | [x] | |
| Method | `bot.useOn(targetEntity)` | [x] | |

**Notes**: No item entities, yaw/pitch conversion needs fix

---

### experience (100%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.experience.level` | [x] | |
| Property | `bot.experience.points` | [x] | |
| Property | `bot.experience.progress` | [x] | |
| Event | `"experience"` | [x] | |

---

### explosion (0-90%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Function | `bot.getExplosionDamages()` | [ ] | Requires logical checks |

---

### fishing (0-90%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.fish()` | [ ] | 100% possible |

---

### furnace (0%)
**Dependencies**: inventory

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"update"` | [ ] | |
| Property | `furnace.fuel` | [ ] | |
| Property | `furnace.progress` | [ ] | |
| Method | `bot.openFurnace()` | [ ] | |
| Method | `furnace.takeInput()` | [ ] | |
| Method | `furnace.takeFuel()` | [ ] | |
| Method | `furnace.takeOutput()` | [ ] | |
| Method | `furnace.putInput()` | [ ] | |
| Method | `furnace.putFuel()` | [ ] | |
| Method | `furnace.inputItem()` | [ ] | |
| Method | `furnace.fuelItem()` | [ ] | |
| Method | `furnace.outputItem()` | [ ] | |

---

### game (70-100%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.game.levelType` | [x] | |
| Property | `bot.game.dimension` | [x] | |
| Property | `bot.game.difficulty` | [x] | |
| Property | `bot.game.gameMode` | [x] | |
| Property | `bot.game.hardcore` | [ ] | Not in Bedrock |
| Property | `bot.game.maxPlayers` | [x] | |
| Property | `bot.game.serverBrand` | [x] | |
| Property | `bot.game.minY` | [x] | |
| Property | `bot.game.height` | [x] | |
| Event | `"game"` | [x] | |
| Event | `"login"` | [x] | |
| Event | `"spawn"` | [x] | |
| Event | `"respawn"` | [x] | |

---

### generic_place (0%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.activateBlock()` | [ ] | Possibly implementable |

---

### health (100%) ✅ REVIEWED

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
- Unit Tests: ❌ None in bedrockTest.mts
- BDS Tests: ❌ None (needs health.test.mts)

---

### inventory (100%)

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

### kick (100%) ✅ REVIEWED

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
- Unit Tests: ❌ None in bedrockTest.mts
- BDS Tests: ❌ None

---

### particle (~90%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `Particle.id` | [x] | |
| Property | `Particle.name` | [x] | |
| Property | `Particle.position` | [x] | |
| Property | `Particle.offset` | [ ] | |
| Property | `Particle.longDistanceRender` | [ ] | |
| Property | `Particle.count` | [x] | |
| Property | `Particle.movementSpeed` | [ ] | |
| Event | `"particle"` | [x] | |

**Notes**: Needs unification with Java version

---

### physics (~70%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.physicsEnabled` | [x] | |
| Property | `bot.physics` | [x] | |
| Property | `bot.controlState` | [x] | |
| Property | `bot.fireworkRocketDuration` | [ ] | |
| Event | `"move"` | [x] | |
| Event | `"forcedMove"` | [x] | |
| Event | `"mount"` | [x] | |
| Event | `"dismount"` | [x] | |
| Event | `"usedFirework"` | [ ] | |
| Event | `"physicsTick"` | [x] | |
| Method | `bot.setControlState()` | [x] | |
| Method | `bot.getControlState()` | [x] | |
| Method | `bot.clearControlStates()` | [x] | |
| Method | `bot.lookAt()` | [x] | |
| Method | `bot.look()` | [x] | |

**Notes**: Requires blocks + minecraft-data update for effects

---

### place_block (0%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"blockPlaced"` | [ ] | |
| Method | `bot.placeBlock()` | [ ] | Requires player_auth_input |
| Method | `bot.activateBlock()` | [ ] | |
| Method | `bot.updateSign()` | [ ] | |

---

### place_entity (0-80%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Method | `bot.placeEntity()` | [ ] | 100% possible |
| Method | `bot.activateEntity()` | [ ] | |
| Method | `bot.activateEntityAt()` | [ ] | |

---

### rain (100%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.isRaining` | [x] | |
| Property | `bot.rainState` | [x] | |
| Property | `bot.thunderState` | [x] | |
| Event | `"rain"` | [x] | |
| Event | `"weatherUpdate"` | [x] | |

---

### ray_trace (100%) ✅ REVIEWED

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
- Unit Tests: ❌ None in bedrockTest.mts
- BDS Tests: ❌ None
- Java Tests: ✅ externalTests/rayTrace.js exists

---

### resource_pack (N/A) ✅ REVIEWED

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
- Unit Tests: ❌ None (N/A - stub)
- BDS Tests: ❌ None (N/A - stub)

---

### scoreboard (10%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.scoreboards` | [x] | |
| Property | `bot.scoreboard` | [x] | |
| Property | `ScoreBoard.name` | [x] | |
| Property | `ScoreBoard.title` | [x] | |
| Property | `ScoreBoard.itemsMap` | [ ] | |
| Property | `ScoreBoard.items` | [ ] | |
| Event | `"scoreboardCreated"` | [ ] | |
| Event | `"scoreboardDeleted"` | [ ] | |
| Event | `"scoreboardTitleChanged"` | [ ] | |
| Event | `"scoreUpdated"` | [ ] | |
| Event | `"scoreRemoved"` | [ ] | |
| Event | `"scoreboardPosition"` | [ ] | |

**Notes**: Badly implemented, 0 functions working

---

### settings (0%)

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

### simple_inventory (100%)

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

### sound (100%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"soundEffectHeard"` | [x] | |
| Event | `"hardcodedSoundEffectHeard"` | [x] | |
| Event | `"noteHeard"` | [x] | |

---

### spawn_point (100%) ✅ REVIEWED

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
- Unit Tests: ❌ None in bedrockTest.mts
- BDS Tests: ❌ None

---

### tablist (0%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.tablist` | [x] | |
| Property | `bot.player` | [x] | |
| Property | `bot.players` | [x] | |

**Notes**: Bedrock doesn't have native tablist, conversion possible

---

### team (0%)

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Property | `bot.teams` | [x] | |
| Property | `bot.teamMap` | [x] | |
| Property | `Team.name` | [ ] | |
| Property | `Team.friendlyFire` | [ ] | |
| Property | `Team.nameTagVisibility` | [ ] | |
| Property | `Team.collisionRule` | [ ] | |
| Property | `Team.color` | [ ] | |
| Property | `Team.prefix` | [ ] | |
| Property | `Team.suffix` | [ ] | |
| Property | `Team.members` | [ ] | |
| Event | `"teamCreated"` | [ ] | |
| Event | `"teamRemoved"` | [ ] | |
| Event | `"teamUpdated"` | [ ] | |
| Event | `"teamMemberAdded"` | [ ] | |
| Event | `"teamMemberRemoved"` | [ ] | |

**Notes**: Requires investigation

---

### time (100%) ✅ REVIEWED

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
- Unit Tests: ❌ None in bedrockTest.mts
- BDS Tests: ✅ time.test.mts (5 tests - properties, updates, day/night, moon phase, age)

---

### title (~50%) ✅ REVIEWED

**Implementation Analysis:**
- Java: 37 LOC with legacy/new packet support, `parseTitle()` function
- Bedrock: 12 LOC - **INCOMPLETE**

**Bedrock Packet Types (set_title):**
- `0: clear` - ❌ Not handled
- `1: reset` - ❌ Not handled
- `2: set_title` - ✅ Handled
- `3: set_subtitle` - ✅ Handled
- `4: action_bar_message` - ❌ Not handled
- `5: set_durations` - ❌ Not handled (has fade_in_time, stay_time, fade_out_time)
- `6-8: *_json` variants - ❌ Not handled

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
- Unit Tests: ❌ None in bedrockTest.mts
- BDS Tests: ❌ None (needs title.test.mts)

---

### villager (0%)
**Dependencies**: inventory

| Type | API | Status | Notes |
|------|-----|--------|-------|
| Event | `"ready"` | [ ] | |
| Property | `villager.trades` | [ ] | |
| Method | `bot.openVillager()` | [ ] | |
| Method | `bot.trade()` | [ ] | |
| Method | `villager.trade()` | [ ] | |

---

## Examples Verification Checklist

### How to Verify Examples

For each example, test that it works with Bedrock Edition:

1. Ensure all required plugins are implemented and enabled in loader
2. Run the example against a Bedrock server: `node packages/mineflayer/examples/<example>.js`
3. Verify the example behaves the same as with Java Edition
4. Check off when fully functional

| Example | Required Plugins | Working |
|---------|------------------|---------|
| inventory.js | inventory, simple_inventory, craft | [ ] |
| chest.js | chest, furnace, enchantment_table | [ ] |
| attack.js | entities | [ ] |
| digger.js | digging, blocks, place_block | [ ] |
| fisherman.js | fishing, simple_inventory | [ ] |
| sleeper.js | bed | [ ] |
| elytra.js | simple_inventory, physics | [ ] |
| looker.js | entities | [ ] |
| jumper.js | physics | [ ] |
| chatterbox.js | chat, entities, time, rain, sound | [ ] |
| sound.js | sound | [ ] |
| book.js | book | [ ] |
| guard.js | entities, pathfinder | [ ] |
| trader.js | villager | [ ] |
| anvil.js | anvil | [ ] |
| command_block.js | command_block | [ ] |
| place_entity.js | place_entity | [ ] |
| titles.js | title | [ ] |
| bossbar.js | boss_bar | [ ] |
| scoreboard.js | scoreboard | [ ] |
| crossbower.js | simple_inventory, entities | [ ] |
| auto_totem.js | inventory | [ ] |
| farmer.js | blocks | [ ] |
| collectblock.js | blocks, pathfinder | [ ] |

### File Locations Reference

| Type | Path |
|------|------|
| Java Plugins | `packages/mineflayer/lib/plugins/*.js` |
| Bedrock Plugins | `packages/mineflayer/lib/bedrockPlugins/*.mts` |
| Loader Config | `packages/mineflayer/lib/loader.js` |
| Unit Tests | `packages/mineflayer/test/bedrockTest.mts` |
| Inventory Tests | `packages/mineflayer/test/inventoryTest.mts` |
| BDS Tests | `packages/minecraft-bedrock-tests/test/*.test.mts` |
| Examples | `packages/mineflayer/examples/*.js` |

## BDS Integration Tests

Tests to be implemented in `packages/minecraft-bedrock-tests/test/`.

### Anvil
- [ ] Combine two items
- [ ] Combine with NBT selection two items
- [ ] Using anvil.rename
- [ ] Two item + rename

### Book
- [ ] Write and sign book

### Tab Complete
- [ ] Tab complete

### Consume
- [ ] Consume food

### Creative
- [ ] Creative inventory operations

### Dig and Build
- [ ] Dig and collect block

### Dig Everything
- [ ] Dig all diggable blocks

### Dimension Name
- [ ] Get dimension name

### Elytra
- [ ] Elytra flying

### Enchanting
- [ ] Enchanting table

### Example Bee
- [ ] Bee example

### Example Block Finder
- [ ] Block finder example

### Example Digger
- [ ] Digger example

### Example Inventory
- [ ] Inventory example

### Furnace
- [ ] Furnace smelting

### Ray Trace
- [ ] Ray trace

### Sign
- [ ] Update sign

### Command Block
- [ ] Set command block

### Crafting
- [ ] Craft items

### Fishing
- [ ] Fish

### Nether
- [ ] Nether portal

### Place Entity
- [ ] Place crystal
- [ ] Place boat
- [ ] Place summon egg
- [ ] Place armor stand

### Scoreboard
- [ ] Scoreboard

### Team
- [ ] Team

### Title
- [ ] Title

### Bed
- [ ] Bed

### Trade
- [ ] Trade

### Boss Bar
> Note: Bedrock Edition does not have the /bossbar command like Java Edition.
> Boss bars in Bedrock are created by summoning entities (Ender Dragon, Wither) or through add-ons.
- [ ] Detect boss bar creation (entity-based)
- [ ] Detect boss bar update (entity-based)
- [ ] Detect boss bar deletion (entity-based)

### Gamemode
> Note: Requires game.js plugin to handle player_game_type and set_player_game_type packets.
- [ ] Detect gamemode change to survival
- [ ] Detect gamemode change to creative
- [ ] Retain gamemode after respawn

### Held Item
> Note: Requires inventory.mts plugin to handle selected_slot packet and track held item.
- [ ] Null heldItem when inventory is empty
- [ ] Correct heldItem after receiving item
- [ ] Update heldItem when switching slots

### Inventory Window Slot Mapping (Mock Server Tests)
> Note: Failing tests in `packages/mineflayer/test/inventoryTest.mts`
- [ ] Fix `inventoryStart`/`inventoryEnd` for Bedrock - currently uses Java Edition values (9-45) but Bedrock inventory is slots 0-35. Set `inventoryStart=0`, `inventoryEnd=36` in `inventory.mts:59-61`
- [ ] Fix `findInventoryItem` returns null for hotbar items (slot 0-8) because it searches from slot 9
- [ ] Fix `count` method returns 0 for hotbar items (same root cause)
- [ ] Fix `inventory_slot` packet format in test - `full_container_name` field needs correct Bedrock protocol structure

### Particles
> Note: Requires particle plugin to handle spawn_particle_effect packet.
- [ ] Receive particle events
- [ ] Receive particle with correct position
- [ ] Receive multiple particle types

### Spawn Event
> Note: Requires spawn plugin improvements to handle Bedrock respawn packets.
- [ ] Emit spawn event on respawn after death

### Pathfinder
> Note: Requires pathfinder plugin integration with Bedrock.

#### Basic Navigation
- [ ] Move to exact position using GoalBlock
- [ ] Move within range using GoalNear
- [ ] Move to X/Z ignoring Y using GoalXZ

#### Vertical Navigation
- [ ] Climb stairs
- [ ] Drop down safely

#### Obstacle Navigation
- [ ] Navigate around a wall

#### Pathfinder Control
- [ ] Stop navigation when stop() is called
- [ ] Report isMoving() correctly

#### Events
- [ ] Emit goal_reached event
- [ ] Emit path_update events during navigation

#### Scaffolding
- [ ] Navigate across terrain with scaffolding configured

#### Edge Cases
- [ ] Handle navigation to current position
- [ ] Use GoalGetToBlock to get adjacent to a block
