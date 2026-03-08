---
description: "Hire (spawn) a new VP agent for a specific task"
argument-hint: "ROLE TASK [--budget-usd N] [--op1-goal REF]"
---

# /hire-agent

Spawns a new S-Team VP agent to handle a specific task.

Delegates to `spawnAgent()` from `src/jade/agent-sdk/spawn.ts` using the
resolved auth mode (Pro Max / API Key / Enterprise).

## Arguments

| Arg | Description |
|-----|-------------|
| `ROLE` | VP role slug (e.g. `jade-vp-engineering`) |
| `TASK` | Task description |
| `--budget-usd` | USD budget cap (default: 1.00) |
| `--op1-goal` | OP1 goal reference for ROTS tracking |

## Example

```
/hire-agent jade-vp-security "Review the auth module for vulnerabilities" \
  --budget-usd 0.50 \
  --op1-goal op1-2026-q1-g2
```
