# Ralph Loop Prompt Templates

Reusable prompt templates for common mineflayer-bedrock development tasks.

## Template Structure

Each template follows this pattern:
1. **Task description** - What to accomplish
2. **Verification step** - How to confirm success (tests, commands)
3. **Completion signal** - The `<promise>` tag to output
4. **Stuck handling** - What to do if blocked

---

## Bedrock Plugin Implementation

### Full Plugin Implementation

```bash
/ralph-loop "Implement {PLUGIN_NAME}.mts in lib/bedrockPlugins/ matching Java API in lib/plugins/{PLUGIN_NAME}.js. Requirements: (1) Same function signatures (2) Same events emitted (3) Same bot properties. Map Bedrock packets appropriately. Run 'npm run mocha_test' after changes. If stuck after 10 iterations, document blockers. Output <promise>PLUGIN_DONE</promise> when tests pass, <promise>BLOCKED</promise> if truly stuck." --max-iterations 30 --completion-promise "PLUGIN_DONE"
```

### Plugin API Compatibility Fix

```bash
/ralph-loop "Compare lib/bedrockPlugins/{PLUGIN}.mts with lib/plugins/{PLUGIN}.js. List API differences. Fix Bedrock version to match Java API exactly. Run tests. Output <promise>API_FIXED</promise> when compatible." --max-iterations 20 --completion-promise "API_FIXED"
```

---

## Testing Tasks

### Run and Fix All Tests

```bash
/ralph-loop "Run 'npm run mocha_test --workspace=mineflayer'. Fix all failing tests. Do not skip or delete tests. Output <promise>ALL_PASS</promise> when complete." --max-iterations 25 --completion-promise "ALL_PASS"
```

### Bedrock-Specific Tests

```bash
/ralph-loop "Run 'npm run test:bedrock'. Analyze failures. Fix implementation bugs (not test bugs). Output <promise>BEDROCK_PASS</promise> when all tests green." --max-iterations 20 --completion-promise "BEDROCK_PASS"
```

### BDS Integration Tests

```bash
/ralph-loop "Run 'npm run mocha_test --workspace=minecraft-bedrock-tests -- test/*.test.mts --parallel --jobs 8'. Fix failures. Output <promise>BDS_PASS</promise> when done." --max-iterations 30 --completion-promise "BDS_PASS"
```

---

## Type Checking

### Fix All TypeScript Errors

```bash
/ralph-loop "Run 'npx tsc --noEmit' in packages/mineflayer. Fix all type errors. Avoid 'any' type. Output <promise>TYPES_OK</promise> when clean." --max-iterations 20 --completion-promise "TYPES_OK"
```

### Add Types to Module

```bash
/ralph-loop "Add TypeScript types to lib/bedrockPlugins/{MODULE}.mts. Use types from index.d.ts and protocol.d.ts. Run tsc to verify. Output <promise>TYPED</promise> when no errors." --max-iterations 15 --completion-promise "TYPED"
```

---

## Packet Handling

### Implement Packet Handler

```bash
/ralph-loop "Add handler for '{PACKET_NAME}' packet in lib/bedrockPlugins/{PLUGIN}.mts. Reference Java equivalent in lib/plugins/{PLUGIN}.js. Update bot state appropriately. Add test case. Output <promise>HANDLER_DONE</promise> when tests pass." --max-iterations 20 --completion-promise "HANDLER_DONE"
```

### Debug Packet Flow

```bash
/ralph-loop "Trace {PACKET_NAME} packet handling. Add debug logging. Identify where state diverges from expected. Fix the handler. Remove debug logs. Output <promise>PACKET_FIXED</promise> when working." --max-iterations 15 --completion-promise "PACKET_FIXED"
```

---

## Refactoring

### Extract Common Logic

```bash
/ralph-loop "Extract common logic from {FILE1} and {FILE2} into shared utility. Update imports. Run tests. Output <promise>REFACTORED</promise> when tests pass." --max-iterations 15 --completion-promise "REFACTORED"
```

### Migrate to New Pattern

```bash
/ralph-loop "Migrate {MODULE} from {OLD_PATTERN} to {NEW_PATTERN}. Preserve all functionality. Run full test suite. Output <promise>MIGRATED</promise> when done." --max-iterations 25 --completion-promise "MIGRATED"
```

---

## Multi-Phase Templates

### Complete Feature Implementation

**Phase 1: Data Models**
```bash
/ralph-loop "Phase 1: Create data models for {FEATURE} in appropriate location. Add types. Output <promise>P1_MODELS</promise> when done." --max-iterations 10 --completion-promise "P1_MODELS"
```

**Phase 2: Core Logic**
```bash
/ralph-loop "Phase 2: Implement core logic for {FEATURE}. Use models from Phase 1. Output <promise>P2_LOGIC</promise> when done." --max-iterations 20 --completion-promise "P2_LOGIC"
```

**Phase 3: Integration**
```bash
/ralph-loop "Phase 3: Integrate {FEATURE} with bot. Wire up packet handlers. Output <promise>P3_INTEGRATE</promise> when done." --max-iterations 15 --completion-promise "P3_INTEGRATE"
```

**Phase 4: Testing**
```bash
/ralph-loop "Phase 4: Add tests for {FEATURE}. Achieve good coverage. Fix any bugs found. Output <promise>P4_TESTED</promise> when all pass." --max-iterations 20 --completion-promise "P4_TESTED"
```

---

## Variable Reference

Replace these placeholders in templates:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{PLUGIN_NAME}` | Plugin filename without extension | `inventory`, `health` |
| `{PLUGIN}` | Same as above | `simple_inventory` |
| `{PACKET_NAME}` | Bedrock protocol packet | `item_stack_request` |
| `{MODULE}` | Module or file path | `lib/bedrockPlugins/chat.mts` |
| `{FEATURE}` | Feature being implemented | `inventory transactions` |
| `{FILE1}`, `{FILE2}` | Files to refactor | `inventory.mts`, `simple_inventory.mts` |
| `{OLD_PATTERN}` | Pattern to migrate from | `callback-based` |
| `{NEW_PATTERN}` | Pattern to migrate to | `async/await` |
