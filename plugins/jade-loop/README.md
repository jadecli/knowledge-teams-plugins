# jade-loop

**Enterprise Ralph Loop** — a Claude Code stop-hook plugin that wraps task
execution with budget tracking, ROTS measurement, escalation policy, and bloom
eval gates.

## Overview

`jade-loop` extends the Ralph Loop pattern from
`anthropics/claude-plugins-official/plugins/ralph-loop` with production-grade
controls needed for autonomous S-Team VP agents:

| Feature | Description |
|---------|-------------|
| **Budget tracking** | Hard caps on token spend and USD cost |
| **Escalation policy** | Surface to human at threshold (default 80%) or on agent `<escalation>` tag |
| **ROTS measurement** | Return on Token Spend calculated on completion |
| **Iteration cap** | Hard limit to prevent runaway loops |
| **Completion promise** | Natural-language criterion evaluated via `<promise>` tags |
| **Session isolation** | State file scoped to Claude Code session ID |

## Usage

```bash
/jade-loop "Build the auth module from the spec" \
  --agent jade-vp-engineering \
  --budget-usd 2.00 \
  --budget-tokens 400000 \
  --max-iterations 30 \
  --op1-goal op1-2026-q1-g1 \
  --completion-promise "all tests pass"
```

## State file

Loop state is stored in `.claude/jade-loop.local.md` with YAML frontmatter:

```yaml
---
session_id: 'abc-123'
agent: 'jade-vp-engineering'
budget_tokens: 400000
budget_usd: 2.00
op1_goal: 'op1-2026-q1-g1'
max_iterations: 30
completion_promise: 'all tests pass'
escalation_threshold: 0.80
iteration: 0
used_tokens: 0
used_usd: 0
rots: ~
cancelled: false
created_at: '2026-03-08T19:00:00Z'
---
Build the auth module from the spec
```

## Architecture

```
/jade-loop PROMPT
    └─▶ setup-jade-loop.sh  (writes state file, echoes prompt)
            └─▶ Claude Code executes one turn
                    └─▶ Stop hook fires
                            ├─ complete?   → exit 0  (loop ends)
                            ├─ escalation? → exit 0  (surface to human)
                            ├─ over budget?→ exit 0  (budget exceeded)
                            ├─ max iters?  → exit 0  (iteration limit)
                            └─ continue    → exit 1  (re-inject prompt)
```

## License

Apache 2.0 — see [LICENSE](./LICENSE)
