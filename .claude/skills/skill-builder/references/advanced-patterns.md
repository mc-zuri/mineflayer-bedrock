# Advanced Skill Patterns

Extended patterns and techniques for complex skills.

## Progressive Disclosure

Skills use progressive disclosure to minimize context usage:

1. **Startup**: Only `name` and `description` loaded (~100 tokens each)
2. **Activation**: Full SKILL.md body loaded
3. **On-demand**: References and scripts loaded when explicitly needed

### Implications

- Put critical info in SKILL.md body
- Move detailed docs to `references/`
- Keep main file under 500 lines

## Multi-Step Workflows

For complex workflows, structure as state machine:

```markdown
## Workflow States

### State: Initialize
- Check prerequisites
- Gather required inputs
- Transition to: Validate

### State: Validate
- Verify inputs are correct
- Check permissions
- Transition to: Execute (success) or Error (failure)

### State: Execute
- Perform main action
- Log progress
- Transition to: Verify

### State: Verify
- Confirm results
- Run validation checks
- Transition to: Complete (success) or Rollback (failure)
```

## Error Handling

Include recovery procedures:

```markdown
## Error Recovery

### Missing Dependencies
**Symptom**: Error about missing package
**Fix**: Run `npm install {package}` or `pip install {package}`

### Permission Denied
**Symptom**: Cannot write to directory
**Fix**: Check file permissions, run with appropriate access

### API Rate Limit
**Symptom**: 429 response from API
**Fix**: Wait 60 seconds, then retry
```

## Conditional Execution

Use decision trees for branching logic:

```markdown
## Decision Tree

Is this a new feature?
├── Yes: Use feature template
│   └── Does it need API calls?
│       ├── Yes: Include error handling
│       └── No: Use simple template
└── No: Is this a bug fix?
    ├── Yes: Use fix template
    └── No: Use refactor template
```

## Integration with MCP

When skill requires MCP servers:

```markdown
## Required MCP Servers

| Server | Purpose | Configuration |
|--------|---------|---------------|
| github | Repository access | `gh auth login` |
| notion | Documentation | API key in env |

## Checking MCP Availability

Before using MCP tools, verify connection:
1. Check server is in available tools list
2. If missing, prompt user to configure
3. Provide fallback for offline mode
```

## Script Integration

For repeatable automation:

```markdown
## Using Scripts

### scripts/process.py

Call with:
```bash
python scripts/process.py --input {file} --output {dest}
```

Arguments:
- `--input`: Source file path
- `--output`: Destination path
- `--format`: Output format (json, csv)

### scripts/validate.sh

Call with:
```bash
bash scripts/validate.sh {directory}
```

Returns exit code 0 on success, 1 on failure.
```

## Context Management

Keep context efficient:

1. **Summarize** long outputs before adding to context
2. **Reference** files instead of including full content
3. **Chunk** large operations into smaller steps
4. **Clean up** temporary data after use

## Testing Patterns

### Unit Testing Skills

Test each section independently:
1. Verify trigger conditions match description
2. Test each instruction step in isolation
3. Validate example outputs

### Integration Testing

Test full workflow:
1. Fresh Claude session
2. Natural language request
3. Verify skill activates
4. Check all steps complete
5. Validate final output

### Edge Cases

Document known edge cases:
```markdown
## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Empty input | Return helpful error message |
| Very large file | Process in chunks |
| Network timeout | Retry with backoff |
```

## Versioning

Track skill versions:

```yaml
metadata:
  version: "1.2.0"
  changelog: |
    1.2.0: Added support for new format
    1.1.0: Improved error handling
    1.0.0: Initial release
```

## Composition

Skills can reference other skills:

```markdown
## Related Skills

For related tasks, consider:
- `data-export`: Export data to various formats
- `api-client`: Generate API client code
- `test-generator`: Create test cases
```

## Metrics and Logging

Include observability:

```markdown
## Success Metrics

Track these to measure skill effectiveness:
- Activation rate (triggers / opportunities)
- Completion rate (success / activations)
- Error rate (failures / activations)
- User satisfaction (explicit feedback)
```
