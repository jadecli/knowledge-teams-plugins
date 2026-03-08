---
description: "Cancel the current Jade Loop and record a cancellation event"
argument-hint: "[--reason TEXT]"
---

# /cancel-jade

Cancels the currently running Jade Loop.

Writes a `loop-cancelled` event to `.claude/jade-loop.local.md` with an
optional reason string, then signals the stop hook to allow the session to exit.

## Arguments

| Flag | Default | Description |
|------|---------|-------------|
| `--reason` | `user-cancelled` | Human-readable cancellation reason |

## Example

```
/cancel-jade --reason "requirements changed"
```
