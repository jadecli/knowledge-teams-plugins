#!/usr/bin/env bash
# setup-jade-loop.sh — initialises the jade-loop state file at .claude/jade-loop.local.md
set -euo pipefail

# ── defaults ──────────────────────────────────────────────────────────────────

AGENT="jade-cofounder"
BUDGET_TOKENS="200000"
BUDGET_USD="1.00"
OP1_GOAL=""
MAX_ITERATIONS="20"
COMPLETION_PROMISE=""
ESCALATION_THRESHOLD="0.80"
PROMPT_ARGS=()

# ── parse arguments ───────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent)             AGENT="$2";                shift 2 ;;
    --budget-tokens)     BUDGET_TOKENS="$2";        shift 2 ;;
    --budget-usd)        BUDGET_USD="$2";            shift 2 ;;
    --op1-goal)          OP1_GOAL="$2";              shift 2 ;;
    --max-iterations)    MAX_ITERATIONS="$2";        shift 2 ;;
    --completion-promise) COMPLETION_PROMISE="$2";  shift 2 ;;
    --escalation-threshold) ESCALATION_THRESHOLD="$2"; shift 2 ;;
    *)                   PROMPT_ARGS+=("$1");        shift ;;
  esac
done

if [[ ${#PROMPT_ARGS[@]} -eq 0 ]]; then
  echo "Usage: setup-jade-loop.sh PROMPT [--agent AGENT] [...]" >&2
  exit 1
fi

PROMPT="${PROMPT_ARGS[*]}"

# ── session ID ────────────────────────────────────────────────────────────────

SESSION_ID="${CLAUDE_SESSION_ID:-}"
if [[ -z "$SESSION_ID" ]]; then
  # Generate a UUID fallback
  if command -v uuidgen &>/dev/null; then
    SESSION_ID="$(uuidgen)"
  else
    SESSION_ID="$(cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "local-$(date +%s)")"
  fi
fi

# ── create state file ─────────────────────────────────────────────────────────

mkdir -p .claude

cat > ".claude/jade-loop.local.md" <<EOF
---
session_id: '${SESSION_ID}'
agent: '${AGENT}'
budget_tokens: ${BUDGET_TOKENS}
budget_usd: ${BUDGET_USD}
op1_goal: '${OP1_GOAL}'
max_iterations: ${MAX_ITERATIONS}
completion_promise: '${COMPLETION_PROMISE}'
escalation_threshold: ${ESCALATION_THRESHOLD}
iteration: 0
used_tokens: 0
used_usd: 0
rots: ~
cancelled: false
created_at: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")'
---
${PROMPT}
EOF

echo "[jade-loop] State file created at .claude/jade-loop.local.md" >&2
echo "[jade-loop] Session: ${SESSION_ID} | Agent: ${AGENT} | Budget: \$${BUDGET_USD} / ${BUDGET_TOKENS} tokens" >&2
echo "[jade-loop] Max iterations: ${MAX_ITERATIONS}" >&2
echo ""
echo "${PROMPT}"
