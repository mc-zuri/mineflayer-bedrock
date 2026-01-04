# Crafting Data Capture Example

Interactive packet capture for Bedrock workstation operations.

## Setup

```bash
npm install
```

## Running

```bash
npm start
```

## How It Works

1. **Select workstation** from menu (1-13)
2. Server starts with that workstation placed
3. **Connect Minecraft** to the proxy
4. Server gives items for **scenario 1** and shows instructions
5. **Perform the action**, then type `done` in chat
6. Server gives items for **scenario 2**, shows instructions
7. Repeat until all scenarios complete
8. **Disconnect** to save logs

## Example Session

```
=== SELECT WORKSTATION ===

  1. CRAFTING TABLE (3 scenarios)
  2. FURNACE (2 scenarios)
  3. STONECUTTER (2 scenarios)
  ...

Enter number (1-11): 7

==================================================
  Capturing: LOOM
==================================================
  Version: 1.21.130
  Scenarios: 2
  Output: ./temp/crafting-capture
==================================================

  READY FOR CONNECTION
  Connect Minecraft to: 0.0.0.0:19192

  Starting scenario 1/2: Apply Stripe Pattern
  Completed: Apply Stripe Pattern

  Starting scenario 2/2: Apply Cross Pattern
  Completed: Apply Cross Pattern

  All 2 scenarios complete!
```

## Workstations

| # | Workstation | Scenarios |
|---|-------------|-----------|
| 1 | CRAFTING TABLE | Craft Planks, Craft Sticks, Craft Iron Pickaxe |
| 2 | FURNACE | Smelt Iron, Cook Beef |
| 3 | STONECUTTER | Cut Stone to Bricks, Cut Stone to Slabs |
| 4 | SMITHING TABLE | Upgrade Pickaxe, Upgrade Sword |
| 5 | ANVIL | Rename Item, Repair Item |
| 6 | GRINDSTONE | Disenchant Sword, Disenchant Pickaxe |
| 7 | LOOM | Apply Stripe Pattern, Apply Cross Pattern |
| 8 | CARTOGRAPHY TABLE | Clone Map, Extend Map, Lock Map |
| 9 | BREWING STAND | Brew Awkward Potion, Brew Speed Potion |
| 10 | ENCHANTING TABLE | Enchant Sword Level 1, Enchant Pickaxe Level 3 |
| 11 | BEACON | Activate Speed, Activate Haste |
| 12 | BED | Place Bed (4 directions), Sleep From Foot, Sleep From Side |
| 13 | FISHING | Cast and Catch Fish, Cast and Cancel, Catch Multiple |
| 14 | VILLAGER | Open Trade Window, Execute Simple Trade, Multiple Trades, Different Villager |
| 15 | BOOK | Write in Book, Sign Book, Place on Lectern, Read Lectern |
| 16 | PLACE BLOCK | Place Stone, Place/Edit Sign, Place Containers, Redstone Components |
| 17 | PLACE ENTITY | Place Boat, Place Minecart, Place Armor Stand, Place Item Frame |

## Output Files

Logs saved to `./temp/crafting-capture/`:

```
1.21.130-LOOM-2025-01-04-1230-crafting.jsonl
1.21.130-LOOM-2025-01-04-1230-inventory.jsonl
1.21.130-LOOM-2025-01-04-1230.bin
```

## Log Format

Each scenario is marked in logs:

```json
{"p":"text","message":"=== LOOM (1/2) ==="}
{"p":"text","message":"Apply Stripe Pattern"}
... action packets ...
{"p":"text","message":"done"}
{"p":"text","message":"✓ Apply Stripe Pattern DONE"}
```

## Expected Packets per Workstation

| Workstation | Key Packets |
|-------------|-------------|
| Crafting Table | `item_stack_request` with `craft_recipe` |
| Furnace | `item_stack_request` with `place`/`take` |
| Stonecutter | `item_stack_request` with `craft_recipe_optional` |
| Smithing Table | `item_stack_request` with `craft_recipe` + `results_deprecated` |
| Anvil | `item_stack_request` with `optional` action |
| Grindstone | `item_stack_request` with `craft_grindstone_request` |
| Loom | `item_stack_request` with `craft_loom_request` |
| Cartography Table | `item_stack_request` with `optional` |
| Brewing Stand | `item_stack_request` for placing items |
| Enchanting Table | `player_enchant_options`, `item_stack_request` |
| Beacon | `item_stack_request` with `beacon_payment` |
| Bed | `player_action` (place), `player_action` (sleep), `animate` |
| Fishing | `inventory_transaction` (cast), `add_entity` (bobber), `entity_event` (bite), `remove_entity` |
| Villager | `interact` (open), `update_trade`, `item_stack_request` (trade) |
| Book | `book_edit` (write/sign), `lectern_update` (page), `block_actor_data` (lectern NBT) |
| Place Block | `inventory_transaction` (item_use), `update_block`, `block_actor_data` (signs) |
| Place Entity | `inventory_transaction` (item_use), `add_entity`, `set_entity_data`, `interact` |
