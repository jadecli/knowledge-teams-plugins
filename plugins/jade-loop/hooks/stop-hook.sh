#!/usr/bin/env bash
# jade-loop stop hook — decides whether to continue or exit the loop.
# Exit 0  → allow Claude Code to exit (loop complete or budget exceeded).
# Exit 1  → block exit (continue loop by re-injecting the prompt).
set -euo pipefail

STATE_FILE=".claude/jade-loop.local.md"

# ── helpers ──────────────────────────────────────────────────────────────────

die() { echo "[jade-loop/stop-hook] ERROR: $*" >&2; exit 0; }

yaml_field() {
  # Extract a YAML frontmatter field value from the state file.
  # Usage: yaml_field KEY
  local key="$1"
  sed -n "/^---$/,/^---$/{/^${key}:/s/^${key}:[[:space:]]*//p}" "$STATE_FILE" \
    | head -1 | tr -d "'\""
}

# ── guard: no state file means jade-loop was not started ─────────────────────

if [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

# ── read hook input from stdin (JSON from Claude Code) ───────────────────────

HOOK_INPUT="$(cat)"
HOOK_SESSION_ID="$(echo "$HOOK_INPUT" | jq -r '.session_id // empty' 2>/dev/null || true)"

# ── session isolation ─────────────────────────────────────────────────────────

STATE_SESSION_ID="$(yaml_field session_id)"
if [[ -n "$HOOK_SESSION_ID" && -n "$STATE_SESSION_ID" ]]; then
  if [[ "$HOOK_SESSION_ID" != "$STATE_SESSION_ID" ]]; then
    # Different session — not our loop, let it exit.
    exit 0
  fi
fi

# ── read state ────────────────────────────────────────────────────────────────

ITERATION="$(yaml_field iteration)"
MAX_ITERATIONS="$(yaml_field max_iterations)"
BUDGET_TOKENS="$(yaml_field budget_tokens)"
BUDGET_USD="$(yaml_field budget_usd)"
ESCALATION_THRESHOLD="$(yaml_field escalation_threshold)"
USED_TOKENS="$(yaml_field used_tokens)"
USED_USD="$(yaml_field used_usd)"
CANCELLED="$(yaml_field cancelled)"

ITERATION="${ITERATION:-0}"
MAX_ITERATIONS="${MAX_ITERATIONS:-20}"
BUDGET_TOKENS="${BUDGET_TOKENS:-200000}"
BUDGET_USD="${BUDGET_USD:-1.00}"
ESCALATION_THRESHOLD="${ESCALATION_THRESHOLD:-0.80}"
USED_TOKENS="${USED_TOKENS:-0}"
USED_USD="${USED_USD:-0}"
CANCELLED="${CANCELLED:-false}"

# ── check cancellation ────────────────────────────────────────────────────────

if [[ "$CANCELLED" == "true" ]]; then
  echo "[jade-loop] Loop cancelled. Exiting." >&2
  exit 0
fi

# ── extract last agent output ─────────────────────────────────────────────────

LAST_OUTPUT="$(echo "$HOOK_INPUT" | jq -r '.last_output // empty' 2>/dev/null || true)"

# ── check completion promise ──────────────────────────────────────────────────

if echo "$LAST_OUTPUT" | grep -q '<promise[^>]*status="fulfilled"'; then
  # Task complete — extract ROTS value from output if provided, else record as pending.
  # Agents may embed a rots_value in the promise tag: <promise status="fulfilled" rots_value="42.5">
  ROTS_FROM_OUTPUT="$(echo "$LAST_OUTPUT" | grep -o 'rots_value="[^"]*"' | head -1 | sed 's/rots_value="//;s/"//')"
  COST="${USED_USD:-0}"
  if [[ -n "$ROTS_FROM_OUTPUT" ]]; then
    ROTS="$ROTS_FROM_OUTPUT"
  elif command -v python3 &>/dev/null && [[ "$COST" != "0" && "$COST" != "0.00" ]]; then
    # Fallback: ROTS = 1 unit of value / cost. Override rots_value in promise tag for meaningful numbers.
    ROTS="$(python3 -c "print(round(1.0 / float('${COST}'), 4))" 2>/dev/null || echo "pending")"
  else
    ROTS="pending"
  fi
  echo "[jade-loop] Task complete. ROTS=${ROTS}. Iterations=${ITERATION}." >&2
  # Persist ROTS to state file (portable sed — temp file approach for macOS compat)
  TMP_STATE="$(mktemp)"
  sed "s/^rots:.*/rots: ${ROTS}/" "$STATE_FILE" > "$TMP_STATE" && mv "$TMP_STATE" "$STATE_FILE" || rm -f "$TMP_STATE"
  exit 0
fi

# ── check escalation tags ─────────────────────────────────────────────────────

if echo "$LAST_OUTPUT" | grep -q '<escalation'; then
  echo "[jade-loop] Agent escalated. Surfacing for human review." >&2
  exit 0
fi

# ── check max iterations ──────────────────────────────────────────────────────

if (( ITERATION >= MAX_ITERATIONS )); then
  echo "[jade-loop] Max iterations (${MAX_ITERATIONS}) reached. Exiting." >&2
  exit 0
fi

# ── check budget ─────────────────────────────────────────────────────────────

if (( USED_TOKENS > 0 && BUDGET_TOKENS > 0 )); then
  THRESHOLD_TOKENS=$(python3 -c "print(int(${BUDGET_TOKENS} * ${ESCALATION_THRESHOLD}))" 2>/dev/null || echo "$BUDGET_TOKENS")
  if (( USED_TOKENS >= BUDGET_TOKENS )); then
    echo "[jade-loop] Token budget exhausted (${USED_TOKENS}/${BUDGET_TOKENS}). Exiting." >&2
    exit 0
  fi
  if (( USED_TOKENS >= THRESHOLD_TOKENS )); then
    echo "[jade-loop] WARNING: ${USED_TOKENS}/${BUDGET_TOKENS} tokens used (escalation threshold)." >&2
  fi
fi

if command -v python3 &>/dev/null; then
  OVER_USD="$(python3 -c "print(1 if float('${USED_USD}') >= float('${BUDGET_USD}') else 0)" 2>/dev/null || echo "0")"
  if [[ "$OVER_USD" == "1" ]]; then
    echo "[jade-loop] USD budget exhausted (\$${USED_USD}/\$${BUDGET_USD}). Exiting." >&2
    exit 0
  fi
fi

# ── continue loop ─────────────────────────────────────────────────────────────

NEW_ITERATION=$(( ITERATION + 1 ))
# Portable in-place edit via temp file (works on both Linux and macOS)
TMP_STATE="$(mktemp)"
sed "s/^iteration:.*/iteration: ${NEW_ITERATION}/" "$STATE_FILE" > "$TMP_STATE" && mv "$TMP_STATE" "$STATE_FILE" || rm -f "$TMP_STATE"

# Output the original prompt (body after second ---) to re-drive the agent.
PROMPT="$(awk '/^---$/{n++; if(n==2){found=1; next}} found{print}' "$STATE_FILE")"
echo "$PROMPT"

# Exit 1 to block the Stop hook — Claude Code will continue with the echoed prompt.
exit 1
