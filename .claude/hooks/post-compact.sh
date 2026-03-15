#!/usr/bin/env bash
# ============================================================================
# PostCompact Hook — Restore Session State After Compaction
# ============================================================================
# Runs after context compaction completes. Reloads preserved state so Claude
# can seamlessly continue work without losing critical context.
#
# New in Claude Code v2.1.x — PostCompact hook fires after compaction is done.
# ============================================================================
set -euo pipefail

HOOK_INPUT="$(cat)"
CWD="$(echo "$HOOK_INPUT" | jq -r '.cwd // "."')"

STATE_DIR="$CWD/.claude"
CONTEXT_FILE="$STATE_DIR/session-context.md"

# ── Reload session context ───────────────────────────────────────────────

if [[ -f "$CONTEXT_FILE" ]]; then
  echo "[post-compact] Restoring session context from ${CONTEXT_FILE}" >&2
  cat "$CONTEXT_FILE"
else
  echo "[post-compact] No session context file found. Starting fresh." >&2
fi

exit 0
