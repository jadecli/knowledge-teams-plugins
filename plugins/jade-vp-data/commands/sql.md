---
description: "Generate SQL for a business question"
argument-hint: "QUESTION [--db postgres|mysql|sqlite] [--schema FILE]"
---

# /sql

Translates a natural-language business question into optimised SQL.

## Arguments

| Arg | Description |
|-----|-------------|
| `QUESTION` | Business question in plain English |
| `--db` | Database dialect (default: postgres) |
| `--schema` | Path to schema file for context |

## Example

```
/sql "What is the MoM revenue growth for the last 6 months?" --db postgres
```
