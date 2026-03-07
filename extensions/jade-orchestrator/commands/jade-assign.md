# /jade-assign

Assigns a task to an S-team agent role.

## Usage

```
/jade-assign <role> <task-description> [--budget <number>] [--checkpoint <number>]
```

## Parameters

- `role` — S-team role key (cpo, cto, cro, cco, gc, cfo, chro, coo, cdo, cso)
- `task-description` — Natural language description of the task
- `--budget` — Tool call budget (default: role's `budget_tool_calls` from STO)
- `--checkpoint` — Checkpoint interval (default: 10)

## Behavior

1. Load the STO file for the specified role
2. Create a contract context with task ID, budget, and checkpoint interval
3. Inject the STO system prompt + contract context into a new agent session
4. Return the task ID for tracking
