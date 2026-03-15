#!/usr/bin/env bash
# jade-loop TeammateIdle hook — checks if idle teammate should pick up more work.
# Exit 0  → allow teammate to go idle.
# Exit 2  → send feedback to keep the teammate working.
set -euo pipefail

STATE_FILE=".claude/jade-loop.local.md"

# ── read hook input from stdin (JSON from Claude Code) ───────────────────

HOOK_INPUT="$(cat)"
TEAMMATE="$(echo "$HOOK_INPUT" | jq -r '.teammate_name // empty' 2>/dev/null || true)"
TEAM="$(echo "$HOOK_INPUT" | jq -r '.team_name // empty' 2>/dev/null || true)"

# ── guard: no state file means jade-loop was not started ─────────────────

if [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

# ── log idle event ───────────────────────────────────────────────────────

echo "[jade-loop/teammate-idle] Teammate ${TEAMMATE:-unknown} in team ${TEAM:-unknown} going idle." >&2

# ── allow idle ───────────────────────────────────────────────────────────

exit 0
