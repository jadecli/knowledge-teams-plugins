---
description: "Analyze Claude Code costs, spending limits, and optimization opportunities"
argument-hint: "[--period YYYY-MM] [--org ORG_ID] [--budget USD] [--optimize]"
---

# /admin-costs

Analyzes Claude Code spending, compares against budgets, and identifies
cost optimization opportunities.

## Options

- `--period YYYY-MM` — Reporting month (default: current month)
- `--org ORG_ID` — Organization identifier
- `--budget USD` — Monthly budget target for comparison
- `--optimize` — Include detailed optimization recommendations

## Output

Produces a cost report with: total spend, breakdown by model and team,
budget variance, prompt caching savings, model routing recommendations,
and prioritized optimization actions with estimated savings.
