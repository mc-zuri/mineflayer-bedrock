# Villager Plugin Implementation

**Status**: 80% Complete
**File**: `packages/mineflayer/lib/bedrockPlugins/villager.mts`
**Date**: 2026-01-04

## API (matches Java)

- `bot.openVillager(entity)` - Opens trade window and returns Villager with trades
- `bot.trade(villager, index, count)` - Execute a trade

## Protocol Notes

| Packet | Direction | Purpose |
|--------|-----------|---------|
| `interact` | C→S | Open trade window |
| `container_open` | S→C | Trade window opened |
| `update_trade` | S→C | Trade offers (NBT) |
| `item_stack_request` | C→S | Execute trade |
| `item_stack_response` | S→C | Trade result |
| `container_close` | C→S | Close trade window |

### update_trade Packet Structure

```typescript
{
  window_id: number,
  window_type: "trading",
  size: number,
  trade_tier: number,      // 0-4 (Novice to Master)
  villager_unique_id: bigint,
  display_name: string,
  new_trading_ui: boolean,
  economic_trades: boolean,
  offers: {
    type: "compound",
    value: {
      Recipes: {
        type: "list",
        value: {
          type: "compound",
          value: [TradeRecipe, ...]
        }
      },
      TierExpRequirements: { ... }
    }
  }
}
```

### Trade Recipe NBT Structure

```typescript
{
  buyA: { value: { Name: { value: "minecraft:paper" }, Count: { value: 24 } } },
  buyB: { value: { Name: { value }, Count: { value } } },  // optional
  sell: { value: { Name: { value: "minecraft:emerald" }, Count: { value: 1 } } },
  buyCountA: { value: 24 },
  buyCountB: { value: 0 },
  maxUses: { value: 16 },
  uses: { value: 0 },
  tier: { value: 0 },           // Trade tier (0-4)
  traderExp: { value: 2 },      // XP villager earns
  netId: { value: 3332 },       // Network ID for trade
  priceMultiplierA: { value: 0.05 },
  demand: { value: 0 },
  rewardExp: { value: 1 },      // Player XP reward
}
```

### Trading Flow

1. Approach villager entity
2. C→S: `interact` {action_id: "open_inventory", target_entity_id}
3. S→C: `container_open` {windowType: "trading"}
4. S→C: `update_trade` {offers: {Recipes: [...]}}
5. Parse trades from NBT structure
6. C→S: `item_stack_request` with craft_recipe action
7. S→C: `item_stack_response` {status: "ok"}
8. C→S: `container_close`

### Trade Execution Request

```typescript
// item_stack_request actions for trading
{
  request_id: number,
  actions: [
    { type_id: "craft_recipe", recipe_network_id: trade.netId },
    { type_id: "results_deprecated", result_items: [...] },
    { type_id: "consume", count, source: {hotbar_and_inventory, slot, stackId} },
    { type_id: "place", count, source: {creative_output, 50}, dest: {hotbar_and_inventory, slot} }
  ]
}
```

## Key Differences from Java

| Aspect | Java | Bedrock |
|--------|------|---------|
| Open trade | `use_entity` + window_open | `interact` + container_open |
| Trade list | `trade_list` packet/channel | `update_trade` with NBT |
| Select trade | `select_trade` packet | Not needed |
| Execute trade | Window clicks | `item_stack_request` with craft_recipe |
| Price calc | Server-side slots | Client calculates from demand/multiplier |

## Villager Types Supported

- `villager` - Regular villagers (all professions)
- `wandering_trader` - Wandering traders

## Files Changed

1. **villager.mts** - New Bedrock plugin implementation
2. **loader.js:103** - Enabled villager plugin
3. **TODO.md** - Updated villager to 80%, stats to 35/41 (85%)
4. **TASK.MD** - Added villager completion section
5. **villager.test.mts** - BDS integration tests

## Known Limitations

- Villagers need workstations claimed to have trades
- Villagers need to level up for higher-tier trades
- Trade execution uses craft_recipe which may not work for all trade types
- No automatic item selection - items must be in inventory

## Test Scenarios

From `examples/crafting-data-capture/src/main.ts`:

1. **Open Trade Window** - Walk up to villager, right-click to open
2. **Execute Simple Trade** - Trade paper for emeralds (Librarian)
3. **Execute Multiple Trades** - Trade paper → emeralds → books
4. **Trade with Different Villager** - Armorer: coal/iron → emeralds → armor
