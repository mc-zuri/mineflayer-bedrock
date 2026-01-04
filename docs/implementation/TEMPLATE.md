# [Plugin Name] Implementation

**Status**: [Not Started | In Progress (X%) | Complete (100%)]
**Plugin File**: `packages/mineflayer/lib/bedrockPlugins/[name].mts`
**Java Reference**: `packages/mineflayer/lib/plugins/[name].js`
**Date**: YYYY-MM-DD

## Overview

Brief description of what this plugin does and its purpose in the bot framework.

## API (matches Java)

### Methods

- `bot.methodName(params)` - Description of what it does
- `bot._privateMethod(params)` - Internal method with options

### Events

- `bot.on('eventName', (data) => {})` - When this event fires
- `bot.on('anotherEvent', () => {})` - Description

### Properties

- `bot.property` - Type and description

## Protocol Notes

| Packet | Direction | Purpose |
|--------|-----------|---------|
| `packet_name` | C→S | What client sends |
| `response_packet` | S→C | What server responds |

### [Action] Flow

Step-by-step sequence of packets for the main action:

1. Client initiates action
2. C→S: `packet_name` {fields}
3. S→C: `response_packet` {fields}
4. Action complete

### Packet Structures

```typescript
// packet_name structure
{
  field_name: type,        // Description
  nested: {
    sub_field: type        // Description
  }
}
```

### Example Packet Capture

```
C→S: packet_name {
  field: "actual_value",
  number_field: 42
}

S→C: response_packet {
  status: "ok",
  result: {...}
}
```

## Key Differences from Java

| Aspect | Java | Bedrock |
|--------|------|---------|
| Packet name | `java_packet` | `bedrock_packet` |
| Data format | NBT | Action-based |
| Confirmation | Transaction | Response packet |

## Implementation Plan

1. **Create plugin file**:
   - Implement main method
   - Handle packet listeners
   - Emit events

2. **Dependencies**:
   - `dependency.mts` for X functionality
   - `another.mts` for Y

3. **State management**:
   - Track X state
   - Handle Y cleanup

## Test Data

Captured packet logs available at:
- `examples/crafting-data-capture/temp/[feature]/version-FEATURE-date.bin`
- `examples/crafting-data-capture/temp/[feature]/version-FEATURE-date-[feature].jsonl`

Scenarios to test:
1. Basic functionality
2. Edge case handling
3. Error conditions

## Known Limitations

- Limitation 1 and workaround
- Limitation 2 - not yet resolved
