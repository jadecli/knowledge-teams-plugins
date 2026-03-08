# Daily Workflow Optimisation

## Activation

Auto-fires at the start of a session or when the user asks about priorities,
task management, or scheduling.

## Eisenhower Matrix

| | Urgent | Not Urgent |
|--|--------|-----------|
| **Important** | Do now (assign to jade-loop) | Schedule (add to backlog) |
| **Not Important** | Delegate (spawn agent) | Eliminate |

## Automatable task patterns

Tasks that score high on automation potential:
- Repetitive data transformations
- Report generation from structured data
- Code review passes
- Email drafting from templates
- Meeting summaries from transcripts

## Output format

```yaml
daily_plan:
  date: "YYYY-MM-DD"
  focus_block: "09:00-12:00"
  tasks:
    - id: T1
      title: "..."
      quadrant: urgent-important
      estimate_minutes: 30
      automatable: true
      agent: jade-vp-engineering
```
