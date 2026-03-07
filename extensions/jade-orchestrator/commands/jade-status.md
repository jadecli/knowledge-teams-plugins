# /jade-status

Shows the status of active S-team agent sessions.

## Usage

```
/jade-status [--task <task-id>] [--role <role>]
```

## Parameters

- `--task` — Filter by specific task ID
- `--role` — Filter by S-team role

## Output

For each active session:
- Task ID
- Role
- Budget used / total
- Last checkpoint time
- Artifacts submitted
- Current status (active, paused, completed, budget_exhausted)
