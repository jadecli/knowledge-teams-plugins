---
description: "Generate usage analytics and monitoring reports for Claude Code"
argument-hint: "[--period YYYY-MM] [--team TEAM_ID] [--org ORG_ID] [--format yaml|json|table]"
---

# /admin-usage

Generates a usage analytics report covering sessions, tokens, costs, and
productivity metrics for the specified period and scope.

## Options

- `--period YYYY-MM` — Reporting month (default: current month)
- `--team TEAM_ID` — Filter to a specific team
- `--org ORG_ID` — Organization identifier
- `--format yaml|json|table` — Output format (default: yaml)

## Output

Produces a usage report with: session counts, token consumption by model,
cost breakdown by team/user, PR and commit velocity, and recommendations
for optimizing telemetry coverage.
