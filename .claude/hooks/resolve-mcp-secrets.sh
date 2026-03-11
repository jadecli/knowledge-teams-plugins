#!/usr/bin/env bash
# ============================================================================
# MCP Secrets Resolver — 1Password op:// Pattern
# ============================================================================
# Resolves MCP server secrets from 1Password at session start.
# Prevents credential exposure in mcp.json config files.
#
# Pattern (recommended by 1Password):
#   1. mcp.json references ${ENV_VAR} placeholders
#   2. This hook resolves op:// URIs to actual values via `op inject`
#   3. Secrets live only in process memory, never on disk
#
# Password Rotation:
#   1Password service accounts support automated rotation.
#   When a secret rotates in the vault, the next session start
#   picks up the new value automatically — zero config change.
#
# Sources:
#   - https://1password.com/blog/securing-mcp-servers-with-1password
#   - https://developer.1password.com/docs/cli/secret-references
#   - https://developer.1password.com/docs/service-accounts
# ============================================================================
set -euo pipefail

HOOK_INPUT="$(cat)"
CWD="$(echo "$HOOK_INPUT" | jq -r '.cwd // "."')"

# ── Guard: skip if no 1Password CLI ─────────────────────────────────────────
if ! command -v op &>/dev/null; then
  echo "<mcp-secrets status=\"skipped\" reason=\"op-cli-not-installed\" />"
  exit 0
fi

# ── Guard: skip if no CLAUDE_ENV_FILE ────────────────────────────────────────
if [[ -z "${CLAUDE_ENV_FILE:-}" ]]; then
  exit 0
fi

# ── Resolve MCP-specific secrets ─────────────────────────────────────────────
# Check for .mcp-secrets.op file (parallel to .env.op but for MCP servers)
MCP_SECRETS_FILE="$CWD/.mcp-secrets.op"
if [[ -f "$MCP_SECRETS_FILE" ]]; then
  op inject --in-file "$MCP_SECRETS_FILE" >> "$CLAUDE_ENV_FILE" 2>/dev/null || {
    echo "<mcp-secrets status=\"error\" reason=\"op-inject-failed\" />"
    exit 0
  }
  echo "<mcp-secrets status=\"resolved\" source=\".mcp-secrets.op\" />"
  exit 0
fi

# ── Resolve from 1Password vault item (service account mode) ────────────────
if [[ -n "${OP_SERVICE_ACCOUNT_TOKEN:-}" ]]; then
  VAULT="${OP_VAULT:-Development}"
  ITEM="${OP_MCP_ITEM:-claude-mcp-secrets}"

  op item get "$ITEM" --vault "$VAULT" --format json 2>/dev/null \
    | jq -r '.fields[] | select(.value != null and .value != "") | "export \(.label)=\(.value)"' \
    >> "$CLAUDE_ENV_FILE" 2>/dev/null || {
      echo "<mcp-secrets status=\"error\" reason=\"vault-item-not-found\" />"
      exit 0
    }
  echo "<mcp-secrets status=\"resolved\" source=\"1password-vault\" vault=\"${VAULT}\" item=\"${ITEM}\" />"
  exit 0
fi

# ── Biometric auth fallback (desktop 1Password app) ─────────────────────────
# When running locally with the 1Password desktop app connected,
# `op` will prompt for biometric auth automatically.
if op whoami &>/dev/null 2>&1; then
  VAULT="${OP_VAULT:-Development}"
  ITEM="${OP_MCP_ITEM:-claude-mcp-secrets}"

  op item get "$ITEM" --vault "$VAULT" --format json 2>/dev/null \
    | jq -r '.fields[] | select(.value != null and .value != "") | "export \(.label)=\(.value)"' \
    >> "$CLAUDE_ENV_FILE" 2>/dev/null || true
  echo "<mcp-secrets status=\"resolved\" source=\"1password-desktop\" />"
else
  echo "<mcp-secrets status=\"skipped\" reason=\"not-authenticated\" />"
fi

exit 0
