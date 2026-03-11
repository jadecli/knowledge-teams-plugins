---
description: "Audit and configure Claude Code settings across the organization"
argument-hint: "[--scope managed|project|user] [--org ORG_ID] [--export FILE]"
---

# /admin-settings

Audits the current Claude Code settings hierarchy, identifies gaps in managed
policy enforcement, and generates a settings configuration for the specified scope.

## Modes

- `--scope managed` — Review and generate managed settings JSON
- `--scope project` — Review and generate `.claude/settings.json` for a repository
- `--scope user` — Review individual user settings
- `--export FILE` — Export current effective settings to a file

## Output

Produces a settings audit with: current configuration per tier, lockdown flag
status, permission rules summary, MCP server policy, and recommended hardening
actions ranked by priority.
