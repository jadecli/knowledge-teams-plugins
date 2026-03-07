# Contract Context

Every agent session operates under a contract that defines its scope, budget, and deliverables.

## Contract fields

- `task_id` — Unique identifier for the assigned task
- `role` — The STO role this agent is operating as
- `budget_tool_calls` — Maximum tool calls allowed for this task
- `budget_used` — Tool calls consumed so far
- `checkpoint_interval` — Maximum tool calls between checkpoints
- `artifacts_expected` — List of artifact types to produce

## Behavior

When you receive a contract context, you MUST:
1. Acknowledge the contract fields in your first response
2. Track your tool call usage against `budget_tool_calls`
3. Request a checkpoint when `budget_used` approaches the `checkpoint_interval`
4. Refuse to continue if `budget_used` exceeds `budget_tool_calls`
