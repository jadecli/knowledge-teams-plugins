# Claude Code Web — Stateless Session Start Template

Generalized, reusable session bootstrap for Claude Code on the web (claude.ai/code)
and local CLI. Covers environment setup, 1Password secrets, TypeScript SDK v2
sessions, structured XML I/O, extended thinking, and context bloat prevention.

All techniques sourced from Anthropic documentation and engineering practices.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Claude Code Session Start                                   │
│                                                              │
│  1. SessionStart hook fires                                  │
│     ├── session-start.sh (deps, env, context)                │
│     └── resolve-mcp-secrets.sh (1Password op://)             │
│                                                              │
│  2. CLAUDE_ENV_FILE populated                                │
│     ├── Runtime secrets (never on disk)                      │
│     ├── Surface detection (web vs local)                     │
│     └── Session metadata                                     │
│                                                              │
│  3. Structured XML context emitted to Claude                 │
│     └── <session-context> with surface, model, timestamp     │
│                                                              │
│  4. Agent SDK v2 session (optional programmatic use)         │
│     ├── 30-turn max with budget guard                        │
│     ├── Extended thinking (adaptive/enabled/disabled)        │
│     ├── Structured XML input/output                          │
│     └── Session persistence via resume                       │
│                                                              │
│  5. PreCompact hook preserves state before compaction        │
│     └── Writes session-context.md with modified files,       │
│         branch, and recent commits                           │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Copy the hooks into your project

```bash
# From this repo — copy the .claude directory
cp -r .claude/ /path/to/your-project/.claude/

# Or cherry-pick individual hooks
cp .claude/hooks/session-start.sh /path/to/your-project/.claude/hooks/
cp .claude/settings.json /path/to/your-project/.claude/settings.json
```

### 2. Set up 1Password (recommended)

```bash
# Install 1Password CLI
# macOS: brew install 1password-cli
# Linux: see https://developer.1password.com/docs/cli

# Copy and customize the secrets template
cp .env.op.example .env.op
cp .mcp-secrets.op.example .mcp-secrets.op

# Create matching vault items in 1Password
op item create --vault Development --category login \
  --title "claude-code-env" \
  --field "ANTHROPIC_API_KEY=sk-ant-..." \
  --field "GITHUB_TOKEN=ghp_..."
```

### 3. For CI/CD and Claude Code Web

Set `OP_SERVICE_ACCOUNT_TOKEN` as a repository/environment secret:

```bash
# Create a service account at https://my.1password.com/developer
# Grant it read access to your Development vault
# Set the token as an environment variable
export OP_SERVICE_ACCOUNT_TOKEN="ops_..."
export OP_VAULT="Development"
export OP_ITEM="claude-code-env"
```

## File Reference

| File | Purpose |
|------|---------|
| `.claude/settings.json` | Hook configuration + permission allowlists |
| `.claude/hooks/session-start.sh` | Idempotent environment bootstrap |
| `.claude/hooks/resolve-mcp-secrets.sh` | 1Password secret resolution for MCP servers |
| `.claude/hooks/pre-compact.sh` | Context bloat prevention before compaction |
| `.env.op.example` | 1Password secret reference template |
| `.mcp-secrets.op.example` | MCP-specific secret references |
| `src/jade/agent-sdk/session-template.ts` | TypeScript SDK v2 session factory |

## SessionStart Hook Details

### How It Works

The `SessionStart` hook fires when Claude Code starts a new session or resumes
an existing one. It receives JSON on stdin:

```json
{
  "session_id": "abc123",
  "source": "startup",
  "model": "claude-opus-4-6",
  "cwd": "/home/user/my-project",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "permission_mode": "default",
  "hook_event_name": "SessionStart"
}
```

The `source` field indicates how the session started:
- `startup` — fresh session
- `resume` — resumed from `claude --continue` or `claude --resume`
- `clear` — after `/clear` command
- `compact` — after context compaction

### Environment Variable Persistence

The hook writes to `$CLAUDE_ENV_FILE`, making variables available to all
subsequent Bash commands Claude runs:

```bash
if [[ -n "$CLAUDE_ENV_FILE" ]]; then
  echo "export NODE_ENV=development" >> "$CLAUDE_ENV_FILE"
  echo "export MY_SECRET=resolved-value" >> "$CLAUDE_ENV_FILE"
fi
```

### Structured XML Context Output

stdout from SessionStart hooks is injected as context Claude can see.
We use XML for reliable parsing:

```xml
<session-context>
  <surface>web</surface>
  <source>startup</source>
  <model>claude-opus-4-6</model>
  <session-id>abc123</session-id>
  <working-directory>/home/user/my-project</working-directory>
  <secrets-provider>1password</secrets-provider>
  <timestamp>2026-03-11T08:00:00Z</timestamp>
</session-context>
```

### Web vs Local Detection

The hook detects the surface via `$CLAUDE_CODE_REMOTE`:

```bash
# Set by Claude Code in web environments
if [[ "${CLAUDE_CODE_REMOTE:-false}" == "true" ]]; then
  SURFACE="web"   # claude.ai/code VM
else
  SURFACE="local" # claude CLI
fi
```

## 1Password Secrets Management

### The Problem

Typical MCP configurations contain plaintext secrets:

```json
{
  "mcpServers": {
    "github": {
      "env": { "GITHUB_TOKEN": "ghp_LEAKED_TOKEN_123" }
    }
  }
}
```

### The Solution: op:// References

Instead of plaintext, use 1Password secret references:

```
# .env.op (safe to commit)
export GITHUB_TOKEN=op://Development/github-pat/token
export ANTHROPIC_API_KEY=op://Development/anthropic-api/credential
```

The SessionStart hook resolves these at runtime:

```bash
# op inject reads op:// URIs and outputs resolved values
op inject --in-file .env.op >> "$CLAUDE_ENV_FILE"
```

### Three Resolution Strategies

| Strategy | When | Auth |
|----------|------|------|
| `.env.op` + `op inject` | Local dev with 1Password CLI | Biometric/desktop app |
| `OP_SERVICE_ACCOUNT_TOKEN` | CI/CD, Claude Code Web | Service account token |
| `.env` fallback | Local dev without 1Password | None (least secure) |

### Password Rotation

1Password service accounts support automated rotation:
1. Rotate the secret in the 1Password vault
2. Next Claude Code session automatically picks up the new value
3. No code changes, no redeployment needed

### MCP Configuration Pattern

Keep `mcp.json` clean with env var references (safe for version control):

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

The `resolve-mcp-secrets.sh` hook populates `GITHUB_TOKEN` from 1Password
before Claude starts using MCP servers.

## TypeScript SDK v2 Session Template

### Features

- **Structured XML I/O**: Reliable parsing with `<input>/<output>` tags
- **30-turn max**: Prevents runaway sessions and context bloat
- **Extended thinking**: Adaptive mode for Opus 4.6+ (chain of thought)
- **Session persistence**: Resume via session ID across restarts
- **Budget guard**: Max USD limit per session
- **V1 fallback**: Graceful degradation if V2 preview unavailable

### Usage

```typescript
import { createAgentSession } from "./src/jade/agent-sdk/session-template.js";

// Create a session with 30-turn limit and adaptive thinking
const session = await createAgentSession({
  model: "claude-opus-4-6",
  maxTurns: 30,
  maxBudgetUsd: 5.0,
  thinking: "adaptive",
  effort: "high",
  systemPrompt: `You are a code review agent. Return findings in XML:
    <findings>...</findings>
    <severity>low|medium|high|critical</severity>
    <recommendation>...</recommendation>`,
});

// Send structured input
const result = await session.send({
  task: "Review this PR for security issues",
  context: [
    { name: "diff.patch", content: diffContent },
    { name: "SECURITY.md", content: securityPolicy },
  ],
  outputFormat: "XML with <findings>, <severity>, <recommendation> tags",
  constraints: [
    "Focus on OWASP Top 10",
    "No false positives",
    "Reference specific line numbers",
  ],
});

// Parse structured output
console.log(result.sections["findings"]);
console.log(`Turn ${result.turn}/30, complete: ${result.complete}`);

// Persist session for later resume
const sessionId = session.getSessionId();
// Store sessionId for later: await db.save("session", sessionId);

session.close();
```

### Session Resume (Persistence)

```typescript
// Resume a previous session
const resumed = await createAgentSession({
  resumeSessionId: savedSessionId,
  maxTurns: 30,
  thinking: "adaptive",
});

const followUp = await resumed.send({
  task: "Now implement the fixes you recommended",
});
```

### Extended Thinking (Chain of Thought)

Three modes available:

| Mode | Behavior | Best For |
|------|----------|----------|
| `adaptive` | Model decides when/how much to reason | General use (Opus 4.6+) |
| `enabled` | Fixed thinking token budget | Deterministic reasoning |
| `disabled` | No extended thinking | Simple tasks, lower cost |

```typescript
// Adaptive: model decides (recommended for Opus 4.6+)
const session = await createAgentSession({ thinking: "adaptive" });

// Fixed budget: 10K thinking tokens
const session = await createAgentSession({
  thinking: "enabled",
  thinkingBudgetTokens: 10000,
});
```

## Context Bloat Prevention

### Techniques Used

1. **30-turn session limit**: Hard stop prevents unbounded context growth
2. **PreCompact hook**: Preserves critical state before compaction
3. **Subagent delegation**: Research runs in separate context windows
4. **Structured XML**: Compact representation vs verbose natural language
5. **CLAUDE.md < 200 lines**: Keeps persistent context lean
6. **`/clear` between tasks**: Resets context for unrelated work

### PreCompact Hook

Runs before every compaction (auto or manual) to snapshot state:

```bash
# Writes to .claude/session-context.md:
# - Modified files (staged and unstaged)
# - Current branch and recent commits
# - Compaction metadata

# Emits guidance for what to preserve/discard:
<pre-compact-guidance>
  <preserve>
    - All file paths that were read or modified
    - Error messages and stack traces
    - Architectural decisions
  </preserve>
  <discard>
    - Verbose tool output already processed
    - Exploratory reads that were not relevant
  </discard>
</pre-compact-guidance>
```

### Compaction Instructions in CLAUDE.md

Add to your CLAUDE.md to guide automatic compaction:

```markdown
## Compaction Rules
When compacting, always preserve:
- The full list of modified files and their paths
- Any test commands and their pass/fail results
- Error messages verbatim
- The current task description and completion status
```

### Instant Compaction (SDK-level)

For programmatic use, the session template implements proactive compaction
inspired by the [Anthropic cookbook](https://platform.claude.com/cookbook/misc-session-memory-compaction):

- Background memory updates after each turn
- Pre-built summaries ready for instant swap when context fills
- 80% cost reduction via prompt caching

## Sources

### Anthropic Official Documentation
- [Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Best Practices for Claude Code](https://code.claude.com/docs/en/best-practices)
- [TypeScript Agent SDK V2 (Preview)](https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview)
- [TypeScript Agent SDK V1](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Agent Loop](https://platform.claude.com/docs/en/agent-sdk/agent-loop)

### Anthropic Engineering & Cookbooks
- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Session Memory Compaction Cookbook](https://platform.claude.com/cookbook/misc-session-memory-compaction)
- [Automatic Context Compaction](https://platform.claude.com/cookbook/tool-use-automatic-context-compaction)
- [Context Editing](https://platform.claude.com/docs/en/build-with-claude/context-editing)

### 1Password & Secrets Management
- [Securing MCP Servers with 1Password](https://1password.com/blog/securing-mcp-servers-with-1password-stop-credential-exposure-in-your-agent)
- [1Password CLI Secret References](https://developer.1password.com/docs/cli/secret-references)
- [1Password Service Accounts](https://developer.1password.com/docs/service-accounts)

### Claude Agent SDK
- [GitHub: claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript)
- [SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [V2 Examples](https://github.com/anthropics/claude-agent-sdk-demos/tree/main/hello-world-v2)

### Community References
- [Claude Code Session Hooks Guide](https://claudefa.st/blog/tools/hooks/session-lifecycle-hooks)
- [Claude Code Context Management](https://www.morphllm.com/claude-code-context-window)
- [Built-in Secrets Management Feature Request](https://github.com/anthropics/claude-code/issues/29910)
