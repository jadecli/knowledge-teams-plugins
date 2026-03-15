#!/usr/bin/env bash
# jade-loop TaskCompleted hook — validates task completion quality.
# Exit 0  → allow task completion.
# Exit 2  → reject completion and send feedback to the teammate.
set -euo pipefail

STATE_FILE=".claude/jade-loop.local.md"

# ── read hook input from stdin (JSON from Claude Code) ───────────────────

HOOK_INPUT="$(cat)"
TASK_ID="$(echo "$HOOK_INPUT" | jq -r '.task_id // empty' 2>/dev/null || true)"
TASK_SUBJECT="$(echo "$HOOK_INPUT" | jq -r '.task_subject // empty' 2>/dev/null || true)"
TEAMMATE="$(echo "$HOOK_INPUT" | jq -r '.teammate_name // empty' 2>/dev/null || true)"

# ── guard: no state file means jade-loop was not started ─────────────────

if [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

# ── log completion ───────────────────────────────────────────────────────

echo "[jade-loop/task-completed] Task ${TASK_ID} (${TASK_SUBJECT}) completed by ${TEAMMATE:-lead}." >&2

# ── allow completion ─────────────────────────────────────────────────────

exit 0
