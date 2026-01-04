# Bedrock Protocol Reference

Quick reference for Bedrock Edition protocol patterns when implementing mineflayer plugins.

## Core Patterns

### Request/Response Model
Most inventory and crafting operations use paired packets:
- **Client sends**: `item_stack_request` with action list
- **Server responds**: `item_stack_response` with success/failure status

### Transaction Model
Block and entity interactions use `inventory_transaction`:
- `item_use` - Using item on block (place block, interact)
- `item_use_on_entity` - Using item on entity (attack, use)
- `item_release` - Releasing item (bow, trident)

### Start/Stop Actions
Many operations are wrapped with `player_action` packets:
- `start_item_use_on` / `stop_item_use_on` - Block placement
- `start_break` / `stop_break` - Block breaking
- `start_sneak` / `stop_sneak` - Sneaking

## Action Categories

| Category | Actions | Primary Packets |
|----------|---------|-----------------|
| **Block** | place, break, interact | `player_action`, `inventory_transaction` |
| **Entity** | interact, attack, mount | `interact`, `inventory_transaction` |
| **Inventory** | move, craft, trade | `item_stack_request`, `item_stack_response` |
| **Container** | open, close, transfer | `container_open`, `container_close` |

## Bedrock vs Java Differences

| Aspect | Java | Bedrock |
|--------|------|---------|
| Window IDs | Numeric (0, 1, 2...) | String ("inventory", "armor", "hotbar") |
| Inventory ops | `window_click` + `transaction` | `item_stack_request` + `item_stack_response` |
| Entity IDs | Single ID | `runtime_id` + `unique_id` |
| Confirmation | Implicit or transaction confirm | Response packets |
| Metadata | NBT compound | Typed key-value array |

## Common Packets

| Packet | Direction | Use |
|--------|-----------|-----|
| `inventory_transaction` | C→S | Block/entity use actions |
| `item_stack_request` | C→S | Inventory moves, crafting, trading |
| `item_stack_response` | S→C | Result of stack requests |
| `player_action` | C→S | Start/stop action wrappers |
| `interact` | C→S | Entity interactions |
| `container_open` | S→C | Window opened |
| `container_close` | Both | Close window |
| `update_block` | S→C | Block state change |
| `add_entity` | S→C | Entity spawned |
| `set_entity_data` | S→C | Entity metadata update |

## Packet Direction Convention

- **C→S**: Client to Server (bot sends)
- **S→C**: Server to Client (bot receives)

## See Also

Individual plugin docs in this folder for detailed packet structures:
- [book.md](book.md) - Book editing packets
- [villager.md](villager.md) - Trading protocol
- [place-block.md](place-block.md) - Block placement
- [place-entity.md](place-entity.md) - Entity placement
