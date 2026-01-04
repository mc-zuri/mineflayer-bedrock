# Chat Plugin Implementation

**Status**: 100% Complete
**Plugin File**: `packages/mineflayer/lib/bedrockPlugins/chat.mts`
**Java Reference**: `packages/mineflayer/lib/plugins/chat.js`
**Date**: 2026-01-04

## Overview

Handles sending and receiving chat messages, commands, whispers, and custom chat patterns. Converts Bedrock's `text` packet format to the same events as Java Edition.

## API (matches Java)

### Methods

- `bot.chat(message)` - Send chat message or command (commands start with `/`)
- `bot.whisper(username, message)` - Send private message via `/tell`
- `bot.tabComplete(text, assumeCommand?, sendBlockInSight?, timeout?)` - **Not implemented** (Bedrock limitation)
- `bot.awaitMessage(...patterns)` - Wait for message matching string or RegExp
- `bot.addChatPattern(name, pattern, opts?)` - Add pattern to trigger `chat:name` event
- `bot.addChatPatternSet(name, patterns, opts?)` - Multi-line pattern matching
- `bot.removeChatPattern(name)` - Remove pattern by name or index
- `bot.chatAddPattern(pattern, type)` - **Deprecated**, use `addChatPattern`

### Events

- `bot.on('message', (msg, position, sender, verified) => {})` - Any message received
- `bot.on('messagestr', (msg, position, originalMsg, sender, verified) => {})` - String version
- `bot.on('actionBar', (msg) => {})` - Action bar / popup messages
- `bot.on('chat:patternName', (matches) => {})` - Custom pattern matched
- `bot.on('chat', (username, message) => {})` - Default chat pattern (deprecated)
- `bot.on('whisper', (username, message) => {})` - Default whisper pattern (deprecated)

### Properties

- None (patterns stored internally)

## Protocol Notes

| Packet | Direction | Purpose |
|--------|-----------|---------|
| `text` | Both | All chat/system messages |
| `command_request` | C→S | Slash commands |

### Receiving Messages (S→C)

Bedrock uses a single `text` packet with a `type` field:

```typescript
// text packet structure (S→C)
{
  type: "chat" | "whisper" | "announcement" | "json" | "json_whisper" |
        "json_announcement" | "popup" | "jukebox_popup" | "translation",
  needs_translation: boolean,
  source_name: string,      // Sender username
  message: string,          // Content or JSON
  parameters?: string[],    // For translation type
  xuid: string,
  platform_chat_id: string,
}
```

### Message Type Mapping

| Bedrock Type | Emitted Event | Position |
|--------------|---------------|----------|
| `chat`, `whisper`, `announcement` | `message` | "chat" |
| `json_whisper`, `json_announcement` | `message` | "chat" |
| `json` | `message` | "system" |
| `popup`, `jukebox_popup` | `actionBar` | - |
| `translation` | `message` | varies |

### Sending Chat (C→S)

```
C→S: text {
  type: "chat",
  needs_translation: false,
  category: "authored",
  source_name: "BotName",
  message: "Hello world",
  xuid: "",
  platform_chat_id: "",
  has_filtered_message: false
}
```

### Sending Commands (C→S)

```
C→S: command_request {
  command: "/gamemode creative",  // Includes leading slash
  origin: {
    type: "player",
    uuid: "player-uuid",
    request_id: "",
    player_entity_id: 0n
  },
  internal: false,
  version: "latest"
}
```

### JSON Message Handling

Bedrock uses `rawtext` format for JSON messages:

```json
{
  "rawtext": [
    {"text": "Hello "},
    {"selector": "@p"},
    {"translate": "chat.type.text", "with": ["arg1"]}
  ]
}
```

Converted to Java-compatible format for `prismarine-chat`:

```json
{
  "text": "",
  "extra": [
    {"text": "Hello "},
    {"text": "@p"},
    {"translate": "chat.type.text", "with": ["arg1"]}
  ]
}
```

## Key Differences from Java

| Aspect | Java | Bedrock |
|--------|------|---------|
| Chat packet | `playerChat` / `systemChat` | `text` (single packet) |
| Command packet | `chat` with `/` prefix | `command_request` |
| Message type | Separate packets | `type` field in `text` |
| JSON format | Standard MC JSON | `rawtext` array |
| Tab complete | `tab_complete` packet | Not supported |
| Chat signing | Cryptographic verification | None (Xbox auth) |

## Implementation Details

### Message Parsing

1. Check `type` field to determine message category
2. For `translation` type: resolve `%` parameters from registry
3. For `json*` types: parse JSON and convert `rawtext` to `extra`
4. Create `ChatMessage` using `prismarine-chat`
5. Emit appropriate events based on type

### Command Handling

Commands (messages starting with `/`) use `command_request` instead of `text`:
- Command string includes the leading `/`
- Origin specifies player context
- No response packet (success/failure via chat messages)

### Chat Patterns

Same implementation as Java - patterns match against `messagestr` event:
- Single patterns emit on first match
- Pattern sets require all patterns to match in sequence
- `deprecated: true` for legacy `chat`/`whisper` patterns

## Known Limitations

- **tabComplete**: Not implemented - Bedrock command system doesn't support client-side tab completion
- **Chat verification**: Bedrock doesn't have cryptographic chat signing (uses Xbox Live auth instead)
- **Chat length**: Limited to 256 characters (100 for older versions)

## Test Scenarios

1. Send/receive regular chat messages
2. Send commands (`/gamemode`, `/tp`, etc.)
3. Receive JSON/rawtext messages (tellraw)
4. Receive translation messages
5. Whisper to players
6. Custom chat patterns
7. Action bar messages
