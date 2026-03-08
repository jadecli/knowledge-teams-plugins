---
description: "Show jade-loop help and current loop status"
---

# /help (jade-loop)

Displays jade-loop documentation and, if a loop is active, the current
budget consumption and iteration count.

## Available commands

| Command | Description |
|---------|-------------|
| `/jade-loop PROMPT` | Start a new Jade Loop |
| `/cancel-jade` | Cancel the current loop |
| `/help` | Show this help message |

## State file

Loop state is stored in `.claude/jade-loop.local.md`. YAML frontmatter
tracks session metadata; the file body contains the original prompt and
accumulated output summaries.

## Escalation tags

The loop recognises two XML tags in agent output:

- `<promise status="fulfilled">EXPLANATION</promise>` — task complete, exit loop
- `<escalation type="TYPE">DETAIL</escalation>` — pause and surface to human
