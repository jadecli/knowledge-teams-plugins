#!/usr/bin/env bash
# ============================================================================
# PreCompact Hook — Context Bloat Prevention
# ============================================================================
# Runs before context compaction to persist state that must survive.
# Writes critical references to dev-docs files so they can be reloaded
# after compaction without loss.
#
# Source: https://platform.claude.com/cookbook/misc-session-memory-compaction
# Source: https://code.claude.com/docs/en/best-practices
# ============================================================================
set -euo pipefail

HOOK_INPUT="$(cat)"
COMPACT_SOURCE="$(echo "$HOOK_INPUT" | jq -r '.source // "auto"')"
SESSION_ID="$(echo "$HOOK_INPUT" | jq -r '.session_id // "unknown"')"
CWD="$(echo "$HOOK_INPUT" | jq -r '.cwd // "."')"

STATE_DIR="$CWD/.claude"
CONTEXT_FILE="$STATE_DIR/session-context.md"

mkdir -p "$STATE_DIR"

# ── Snapshot modified files ──────────────────────────────────────────────────
# Preserve the list of files changed in this session so Claude can
# find its way back after compaction.
MODIFIED_FILES="$(git diff --name-only HEAD 2>/dev/null || echo "none")"
STAGED_FILES="$(git diff --cached --name-only 2>/dev/null || echo "none")"

# ── Write context snapshot ───────────────────────────────────────────────────
cat > "$CONTEXT_FILE" <<EOF
# Session Context (auto-generated before compaction)
<!-- compaction_source: ${COMPACT_SOURCE} -->
<!-- session_id: ${SESSION_ID} -->
<!-- timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ) -->

## Modified Files (unstaged)
\`\`\`
${MODIFIED_FILES}
\`\`\`

## Staged Files
\`\`\`
${STAGED_FILES}
\`\`\`

## Current Branch
\`\`\`
$(git branch --show-current 2>/dev/null || echo "unknown")
\`\`\`

## Recent Commits (this branch)
\`\`\`
$(git log --oneline -5 2>/dev/null || echo "none")
\`\`\`
EOF

# ── Emit compaction guidance ─────────────────────────────────────────────────
cat <<CONTEXT
<pre-compact-guidance>
  <preserve>
    - All file paths that were read or modified
    - Error messages and stack traces encountered
    - Architectural decisions made during this session
    - The current task and its completion status
    - Test commands and their results
  </preserve>
  <discard>
    - Verbose tool output that has been processed
    - Exploratory file reads that were not relevant
    - Repeated failed attempts that have been resolved
  </discard>
  <session-state-file>${CONTEXT_FILE}</session-state-file>
</pre-compact-guidance>
CONTEXT

exit 0
