---
name: your-skill-name
description: Brief description of what this skill does and when to use it. Include trigger keywords.
allowed-tools: Read, Write, Glob, Grep, Bash
metadata:
  author: your-name
  version: "1.0"
---

# Your Skill Name

One-line overview of the skill's purpose.

## Overview

Explain what this skill does and the value it provides.

## When to use

- Trigger condition 1 (e.g., "when creating a new component")
- Trigger condition 2 (e.g., "when user mentions 'scaffold'")
- Trigger condition 3 (e.g., "for generating boilerplate")

## When NOT to use

- Exclusion 1 (e.g., "for simple one-line edits")
- Exclusion 2 (e.g., "when exploring existing code")

## Prerequisites

- Requirement 1 (e.g., "Node.js >= 18")
- Requirement 2 (e.g., "Project uses TypeScript")

## Instructions

### Step 1: Gather Information

Collect the required inputs:
- Input 1: Description
- Input 2: Description

### Step 2: Execute

Perform the main action:
1. Sub-step 1
2. Sub-step 2
3. Sub-step 3

### Step 3: Verify

Confirm the result:
- Check 1
- Check 2

## Examples

### Example 1: Basic Usage

**User says**: "Create a new widget component"

**Claude does**:
1. Creates `src/components/Widget.tsx`
2. Adds basic component structure
3. Exports from index file

### Example 2: With Options

**User says**: "Create a widget with state management"

**Claude does**:
1. Creates component with useState hooks
2. Adds state types
3. Implements state logic

## Output Format

Describe the expected output:

```
expected/
├── file1.ts
├── file2.ts
└── index.ts
```

## Common Mistakes

| Mistake | Prevention |
|---------|------------|
| Missing imports | Always check import statements |
| Wrong directory | Verify path before writing |
| Incomplete template | Use checklist to validate |

## Troubleshooting

### Issue: [Problem Description]

**Symptoms**: What the user sees

**Cause**: Why it happens

**Solution**: How to fix it

## References

| Resource | Location |
|----------|----------|
| Documentation | `references/docs.md` |
| API Reference | `references/api.md` |
| Examples | `assets/examples/` |

## Related Skills

- `related-skill-1`: For related task 1
- `related-skill-2`: For related task 2
