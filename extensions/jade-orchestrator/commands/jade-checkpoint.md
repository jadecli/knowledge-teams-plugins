# /jade-checkpoint

Creates a checkpoint for an active agent session, saving progress and optionally adjusting budget.

## Usage

```
/jade-checkpoint <task-id> [--extend-budget <number>] [--note <string>]
```

## Parameters

- `task-id` — The task to checkpoint
- `--extend-budget` — Additional tool calls to add to the budget
- `--note` — Human note to attach to the checkpoint

## Behavior

1. Save current session state (artifacts produced, tool calls used, last output)
2. If `--extend-budget` is provided, increase the remaining budget
3. Record checkpoint timestamp
4. Return summary of progress since last checkpoint
