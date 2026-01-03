# TODO

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
