# Examples Verification Checklist

## How to Verify Examples

For each example, test that it works with Bedrock Edition:

1. Ensure all required plugins are implemented and enabled in loader
2. Run the example against a Bedrock server: `node packages/mineflayer/examples/<example>.js`
3. Verify the example behaves the same as with Java Edition
4. Check off when fully functional

## Examples Status

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
