---
description: "Start a Jade Loop with budget tracking and escalation"
argument-hint: "PROMPT [--agent AGENT] [--budget-tokens N] [--budget-usd N] [--op1-goal REF] [--max-iterations N] [--completion-promise TEXT]"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/setup-jade-loop.sh:*)"]
hide-from-slash-command-tool: "true"
---

# /jade-loop

Starts a Jade Loop — an enterprise-grade task execution loop that wraps Claude
Code's Stop hook to enforce budgets, track ROTS, and escalate gracefully.

## How it works

1. **Setup** — Calls `setup-jade-loop.sh` to write `.claude/jade-loop.local.md`
   with your prompt, budget limits, and session metadata.
2. **Loop** — After each Claude Code turn, the Stop hook (`stop-hook.sh`)
   evaluates whether to continue or exit:
   - If the task is complete (`<promise>` tag in last output), exits cleanly.
   - If budget is exhausted (tokens or USD), escalates or exits.
   - If `<escalation` tag is detected, surfaces for human review.
   - If max-iterations reached, exits with a summary.
3. **ROTS** — On completion, ROTS is calculated as `value_delivered / cost_usd`
   and written to the state file for later reporting.

## Arguments

| Flag | Default | Description |
|------|---------|-------------|
| `PROMPT` | required | The task prompt for the agent |
| `--agent` | `jade-cofounder` | Which VP agent runs the loop |
| `--budget-tokens` | `200000` | Max input+output tokens |
| `--budget-usd` | `1.00` | Max spend in USD |
| `--op1-goal` | — | OP1 goal reference (e.g. `op1-2026-q1-g3`) |
| `--max-iterations` | `20` | Hard iteration cap |
| `--completion-promise` | — | Natural-language completion criterion |

## Budget & Escalation

- At **80%** of budget (configurable via `--escalation-threshold`), the loop
  emits an `<escalation type="budget-warning">` event and pauses for input.
- If the agent emits `<escalation type="blocked">`, the loop escalates
  immediately regardless of budget.
- Exceeding the hard budget cap always exits and writes a `budget-exceeded`
  event to telemetry.

## Completion Promise

If `--completion-promise` is set, the loop evaluates the last agent output
against the promise text. When the agent wraps its response in `<promise>` tags
with `status="fulfilled"`, the loop exits successfully.

## Example

```
/jade-loop "Implement the auth module from the spec" \
  --agent jade-vp-engineering \
  --budget-usd 2.00 \
  --op1-goal op1-2026-q1-g1 \
  --completion-promise "auth.ts passes all tests"
```
