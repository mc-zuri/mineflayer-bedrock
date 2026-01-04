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
| anvil | 60% | [x] | [x] | [ ] | [x] | [x] | Tests skipped (position sync issue) - anvil DOES send container_open, needs rewrite to use bot.openBlock() |
| bed | 100% | [x] | [x] | [ ] | [x] | [x] | sleep/wake via animate packet, spawnReset via set_spawn_position |
| block_actions | 40% | [x] | [x] | [ ] | [x] | [x] | destroyStage unavailable, client-side calc needed |
| blocks | 80% | [x] | [x] | [ ] | [x] | [x] | WIP world loader, doors BBS issues |
| book | 100% | [x] | [x] | [ ] | [ ] | [x] | writeBook/signBook via book_edit packet |
| boss_bar | 0-80% | [x] | [x] | [ ] | [ ] | [x] | Entity-based in Bedrock |
| breath | 100% | [x] | [x] | [ ] | [x] | [x] | - |
| chat | 100% | [x] | [x] | [ ] | [x] | [x] | Fixed for 1.21.130 |
| chest | 100% | [x] | [x] | [ ] | [x] | [x] | openContainer, deposit, withdraw working |
| command_block | 0% | [ ] | [ ] | [ ] | [ ] | [ ] | Requires inventory |
| craft | 95% | [x] | [x] | [ ] | [x] | [x] | recipesFor, recipesAll, craft + workstation execution tests |
| creative | 50% | [x] | [x] | [ ] | [x] | [x] | Flying works, setInventorySlot pending (status 7 error in craft_creative) |
| digging | 100% | [x] | [x] | [x] | [x] | [x] | Uses player_auth_input block_action |
| enchantment_table | 90% | [x] | [x] | [ ] | [x] | [x] | Full enchant flow working (zigzag encoding fix applied) |
| entities | ~90% | [x] | [x] | [ ] | [x] | [x] | No item entities, yaw/pitch conversion issues |
| experience | 100% | [x] | [x] | [ ] | [x] | [x] | - |
| explosion | 0-90% | [ ] | [ ] | [ ] | [ ] | [ ] | Requires logical checks |
| fishing | 100% | [x] | [x] | [ ] | [x] | [x] | Uses entity_event fish_hook_hook |
| furnace | 85% | [x] | [x] | [ ] | [x] | [x] | Full API: putIngredient, putFuel, takeInput, takeFuel, takeOutput, progress tracking |
| game | 70-100% | [x] | [x] | [ ] | [ ] | [x] | Requires other plugin implementations |
| generic_place | 0% | [x] | [ ] | [ ] | [ ] | [ ] | Bedrock uses inventory_transaction instead of block_place packet |
| health | 100% | [x] | [x] | [ ] | [ ] | [x] | Properly adapted for Bedrock protocol |
| inventory | 100% | [x] | [x] | [x] | [x] | [x] | Full click modes (0-4), containers, transfers |
| kick | 100% | [x] | [x] | [ ] | [ ] | [x] | Adapted for Bedrock disconnect packet |
| particle | ~90% | [x] | [x] | [ ] | [ ] | [x] | Needs unification |
| physics | ~70% | [x] | [x] | [ ] | [ ] | [x] | Requires blocks + minecraft-data update |
| place_block | 100% | [x] | [x] | [ ] | [x] | [x] | Uses inventory.mts activateBlock. 7 BDS tests pass |
| place_entity | 50% | [x] | [x] | [ ] | [x] | [x] | Uses inventory.mts. Minecart works, boats pending |
| rain | 100% | [x] | [x] | [ ] | [x] | [x] | - |
| ray_trace | 100% | [x] | [x] | [ ] | [ ] | [x] | Shared Java plugin - no Bedrock changes needed |
| resource_pack | N/A | [x] | [x] | [ ] | [ ] | [x] | Handled by bedrock-protocol at login |
| scoreboard | 10% | [x] | [x] | [ ] | [ ] | [x] | Badly implemented, 0 functions working |
| settings | 0% | [ ] | [ ] | [ ] | [ ] | [ ] | Only some settings exposed |
| simple_inventory | 100% | [x] | [x] | [x] | [ ] | [x] | Requires inventory |
| sound | 100% | [x] | [x] | [ ] | [x] | [x] | - |
| spawn_point | 100% | [x] | [x] | [ ] | [ ] | [x] | Properly adapted for Bedrock |
| tablist | 0% | [x] | [x] | [ ] | [ ] | [x] | Bedrock doesn't have natively, conversion possible |
| team | 0% | [x] | [x] | [ ] | [ ] | [x] | Requires investigation |
| time | 100% | [x] | [x] | [ ] | [x] | [x] | Properly adapted - age via tick_sync |
| title | ~50% | [x] | [x] | [ ] | [ ] | [x] | Missing title_times, title_clear events |
| villager | 80% | [x] | [x] | [ ] | [x] | [x] | openVillager, trade using item_stack_request |

### Checklist Column Definitions

- **Reviewed**: Plugin has been reviewed and all checkboxes verified
- **Bedrock Impl**: `.mts` file exists in `packages/mineflayer/lib/bedrockPlugins/`
- **Unit Tests**: Tests in `packages/mineflayer/test/bedrockTest.mts` or `inventoryTest.mts`
- **BDS Tests**: Tests in `packages/minecraft-bedrock-tests/test/`
- **Loader Enabled**: Plugin enabled (not commented) in `packages/mineflayer/lib/loader.js`

---

## Summary Statistics

**Total Plugins**: 41

**Bedrock Implementation**: 36/41 (88%)
- Completed: anvil, bed, block_actions, blocks, book, boss_bar, breath, chat, chest, craft, creative, digging, enchantment_table, entities, experience, fishing, furnace, game, health, inventory, kick, particle, physics, rain, ray_trace, resource_pack, scoreboard, simple_inventory, sound, spawn_point, tablist, team, time, title, villager
- Missing: command_block, explosion, generic_place, place_block, place_entity, settings

**Unit Tests**: 3/41 (7%)
- Completed: digging, inventory, simple_inventory
- Missing: 38 plugins need unit tests

**BDS Integration Tests**: 19/41 (46%)
- Completed: anvil, bed, block_actions, blocks, breath, chat, chest, craft, creative, digging, enchantment_table, entities, experience, fishing, furnace, inventory, rain, sound, time, villager
- Missing: 22 plugins need BDS tests

**Loader Enabled**: 36/41 (88%)
- Enabled: anvil, bed, block_actions, blocks, book, boss_bar, breath, chat, chest, craft, creative, digging, enchantment_table, entities, experience, fishing, furnace, game, health, inventory, kick, particle, physics, rain, ray_trace, resource_pack, scoreboard, simple_inventory, sound, spawn_point, tablist, team, time, title, villager
- Disabled: command_block, explosion, generic_place, place_block, place_entity, settings

**Fully Reviewed**: 27/41 (66%)
- anvil, bed, book, breath, chat, chest, craft, creative, digging, enchantment_table, experience, fishing, furnace, generic_place, health, inventory, kick, place_block, place_entity, rain, ray_trace, resource_pack, simple_inventory, sound, spawn_point, time, title, villager

---

## Detailed Documentation

- [Plugin API Status](./plugin-api-status.md) - Detailed API implementation status per plugin
- [Examples Checklist](./examples-checklist.md) - Examples verification status
- [BDS Tests Checklist](./bds-tests-checklist.md) - Integration test items to implement

---

## File Locations Reference

| Type | Path |
|------|------|
| Java Plugins | `packages/mineflayer/lib/plugins/*.js` |
| Bedrock Plugins | `packages/mineflayer/lib/bedrockPlugins/*.mts` |
| Loader Config | `packages/mineflayer/lib/loader.js` |
| Unit Tests | `packages/mineflayer/test/bedrockTest.mts` |
| Inventory Tests | `packages/mineflayer/test/inventoryTest.mts` |
| BDS Tests | `packages/minecraft-bedrock-tests/test/*.test.mts` |
| Examples | `packages/mineflayer/examples/*.js` |

## Protocol Issues

See [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) for documented protocol bugs, encoding issues, and workarounds.
