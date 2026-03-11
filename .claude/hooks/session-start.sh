#!/usr/bin/env bash
# ============================================================================
# Generalized Stateless SessionStart Hook for Claude Code Web
# ============================================================================
# Idempotent bootstrap: installs deps, sets env, loads context.
# Runs on every session start (startup, resume, clear, compact).
#
# Sources:
#   - https://code.claude.com/docs/en/hooks (SessionStart reference)
#   - https://code.claude.com/docs/en/best-practices (context management)
#   - https://1password.com/blog/securing-mcp-servers-with-1password (op:// pattern)
#
# Usage:
#   Configured via .claude/settings.json SessionStart hook.
#   Receives JSON on stdin with: session_id, source, model, cwd, etc.
#   Writes env vars to $CLAUDE_ENV_FILE for all subsequent Bash commands.
#   stdout is injected as context Claude can see and act on.
# ============================================================================
set -euo pipefail

# ── Parse hook input ─────────────────────────────────────────────────────────
HOOK_INPUT="$(cat)"
SESSION_SOURCE="$(echo "$HOOK_INPUT" | jq -r '.source // "startup"')"
SESSION_ID="$(echo "$HOOK_INPUT" | jq -r '.session_id // "unknown"')"
SESSION_MODEL="$(echo "$HOOK_INPUT" | jq -r '.model // "unknown"')"
CWD="$(echo "$HOOK_INPUT" | jq -r '.cwd // "."')"
IS_REMOTE="${CLAUDE_CODE_REMOTE:-false}"

# ── Detect environment surface ───────────────────────────────────────────────
# Claude Code web runs in short-lived remote VMs ($CLAUDE_CODE_REMOTE=true).
# Local CLI sessions do not set this variable.
if [[ "$IS_REMOTE" == "true" ]]; then
  SURFACE="web"
else
  SURFACE="local"
fi

# ── Idempotent dependency installation ───────────────────────────────────────
# Only install on fresh startup (not resume/compact) to keep hook fast.
install_deps() {
  if [[ "$SESSION_SOURCE" != "startup" ]]; then
    return 0
  fi

  # Node.js project detection
  if [[ -f "$CWD/package.json" ]]; then
    if [[ ! -d "$CWD/node_modules" ]]; then
      npm install --prefer-offline --no-audit --no-fund 2>/dev/null || true
    fi
  fi

  # Python project detection
  if [[ -f "$CWD/requirements.txt" ]] || [[ -f "$CWD/pyproject.toml" ]]; then
    if [[ -f "$CWD/requirements.txt" ]] && ! python3 -c "import pkg_resources" 2>/dev/null; then
      pip install -r "$CWD/requirements.txt" --quiet 2>/dev/null || true
    fi
    if [[ -f "$CWD/pyproject.toml" ]] && command -v uv &>/dev/null; then
      uv sync --quiet 2>/dev/null || true
    fi
  fi

  # Rust project detection
  if [[ -f "$CWD/Cargo.toml" ]] && command -v cargo &>/dev/null; then
    cargo check --quiet 2>/dev/null || true
  fi

  # Go project detection
  if [[ -f "$CWD/go.mod" ]] && command -v go &>/dev/null; then
    go mod download 2>/dev/null || true
  fi
}

install_deps &

# ── 1Password secrets resolution ─────────────────────────────────────────────
# Pattern: Use op:// references instead of .env files.
# Requires: 1Password CLI (op) with service account or desktop app auth.
# See: https://1password.com/blog/securing-mcp-servers-with-1password
#
# If an .env.op file exists, resolve op:// references via `op run`.
# This injects secrets at runtime without persisting plaintext.
resolve_secrets() {
  if [[ -z "$CLAUDE_ENV_FILE" ]]; then
    return 0
  fi

  # Strategy 1: .env.op file with op:// references (recommended)
  if [[ -f "$CWD/.env.op" ]] && command -v op &>/dev/null; then
    # op inject resolves op:// URIs to actual values, writing to CLAUDE_ENV_FILE
    op inject --in-file "$CWD/.env.op" >> "$CLAUDE_ENV_FILE" 2>/dev/null || true
    return 0
  fi

  # Strategy 2: 1Password service account (CI/CD and web sessions)
  if [[ -n "${OP_SERVICE_ACCOUNT_TOKEN:-}" ]] && command -v op &>/dev/null; then
    # Load secrets from a predefined vault item
    local vault="${OP_VAULT:-Development}"
    local item="${OP_ITEM:-claude-code-env}"
    # Read all fields from the item as KEY=VALUE pairs
    op item get "$item" --vault "$vault" --format json 2>/dev/null \
      | jq -r '.fields[] | select(.value != null and .value != "") | "export \(.label)=\(.value)"' \
      >> "$CLAUDE_ENV_FILE" 2>/dev/null || true
    return 0
  fi

  # Strategy 3: Fallback to standard .env (least secure, local dev only)
  if [[ -f "$CWD/.env" ]] && [[ "$SURFACE" == "local" ]]; then
    while IFS= read -r line; do
      # Skip comments and empty lines
      [[ "$line" =~ ^[[:space:]]*# ]] && continue
      [[ -z "${line// }" ]] && continue
      # Ensure export prefix
      if [[ "$line" != export\ * ]]; then
        echo "export $line" >> "$CLAUDE_ENV_FILE"
      else
        echo "$line" >> "$CLAUDE_ENV_FILE"
      fi
    done < "$CWD/.env"
  fi
}

resolve_secrets

# ── Persist environment variables ────────────────────────────────────────────
# CLAUDE_ENV_FILE makes vars available to all subsequent Bash commands.
if [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
  {
    echo "export CLAUDE_SESSION_SURFACE=$SURFACE"
    echo "export CLAUDE_SESSION_SOURCE=$SESSION_SOURCE"
    echo "export CLAUDE_SESSION_ID=$SESSION_ID"
    # Default NODE_ENV for web sessions
    if [[ "$SURFACE" == "web" ]]; then
      echo "export NODE_ENV=${NODE_ENV:-development}"
      echo "export CI=true"
    fi
  } >> "$CLAUDE_ENV_FILE"
fi

# ── Wait for background dep install ─────────────────────────────────────────
wait 2>/dev/null || true

# ── Emit structured context for Claude ───────────────────────────────────────
# stdout from SessionStart hooks is injected as context Claude can see.
# Use structured XML for Claude to parse reliably.
cat <<CONTEXT
<session-context>
  <surface>${SURFACE}</surface>
  <source>${SESSION_SOURCE}</source>
  <model>${SESSION_MODEL}</model>
  <session-id>${SESSION_ID}</session-id>
  <working-directory>${CWD}</working-directory>
  <secrets-provider>$(command -v op &>/dev/null && echo "1password" || echo "env-file")</secrets-provider>
  <timestamp>$(date -u +%Y-%m-%dT%H:%M:%SZ)</timestamp>
</session-context>
CONTEXT

exit 0
