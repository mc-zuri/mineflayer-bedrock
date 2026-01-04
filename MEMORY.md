# MEMORY.md - Project Knowledge Base

## Workstation Implementation (Completed 2026-01-04)

### Bedrock Workstation Protocol Patterns

Each workstation uses specific action types in `item_stack_request`:

| Workstation | Action Type | Has Recipe ID | Notes |
|-------------|-------------|---------------|-------|
| Crafting Table | `craft_recipe_auto` | Yes | Uses `results_deprecated` |
| Stonecutter | `craft_recipe` | Yes | `consume` + `place` (no cursor) |
| Smithing Table | `craft_recipe` | Yes | 3x `consume` + `take` |
| Enchanting | `craft_recipe` | Yes | Result placed BACK to input, then lapis consumed |
| Grindstone | `craft_grindstone_request` | Yes | Single input slot |
| Loom | `craft_loom_request` | **No** | Uses `times_crafted` only |
| Cartography | `optional` | No | Uses `filtered_string_index` |
| Anvil | `optional` | No | Also uses `custom_names` array |
| Furnace/Brewing | None | N/A | Auto-process on item placement |

### Container IDs

```typescript
// Core
CURSOR: 'cursor'
HOTBAR_AND_INVENTORY: 'hotbar_and_inventory'
CREATIVE_OUTPUT: 'creative_output'

// Crafting
CRAFTING_INPUT: 'crafting_input'
CRAFTING_OUTPUT: 'crafting_output'

// Workstations
STONECUTTER_INPUT: 'stonecutter_input'
SMITHING_TABLE_INPUT: 'smithing_table_input'
SMITHING_TABLE_TEMPLATE: 'smithing_table_template'
SMITHING_TABLE_MATERIAL: 'smithing_table_material'
ENCHANTING_INPUT: 'enchanting_input'
ENCHANTING_LAPIS: 'enchanting_lapis'
GRINDSTONE_INPUT: 'grindstone_input'
LOOM_INPUT: 'loom_input'
LOOM_DYE: 'loom_dye'
CARTOGRAPHY_INPUT: 'cartography_input'
CARTOGRAPHY_ADDITIONAL: 'cartography_additional'
FURNACE_INGREDIENT: 'furnace_ingredient'
FURNACE_FUEL: 'furnace_fuel'
FURNACE_RESULT: 'furnace_result'
BREWING_FUEL: 'brewing_fuel'
BREWING_INPUT: 'brewing_input'
BREWING_RESULT_0/1/2: 'brewing_result' (slots 1-3)
```

### Key Lessons Learned

1. **Enchanting Status 37 Fix**: The result must be placed BACK to `enchanting_input` slot before consuming lapis. Pattern:
   ```
   craft_recipe + results_deprecated + consume(input) + place(output→input) + consume(lapis)
   ```

2. **Loom Has No Recipe ID**: Unlike grindstone, loom's `craft_loom_request` only has `times_crafted`, no `recipe_network_id`.

3. **Stack ID Tracking**: Use `-requestId` for chained actions where new items are created (e.g., craft output placed to slot).

4. **Two-Step Transfers**: Use `twoStepTransfer()` for moving items via cursor - handles stack ID capture automatically.

5. **Progress Tracking**: Furnace and brewing use `container_set_data` packets for progress bars (fuel level, smelt/brew progress).

6. **Anvil Limitation**: Bedrock anvil doesn't send `container_open` packet - requires different approach (player_action events).
