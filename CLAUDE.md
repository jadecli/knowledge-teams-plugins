# knowledge-teams-plugins

S-team compose layer that extends jadecli/knowledge-work-plugins (upstream fork of anthropics/knowledge-work-plugins) with jade-specific skills, WebMCP tools, and agent orchestration.

**Jade Cofounder v3** — AI cofounder powered by a 13-seat S-Team council of
specialised VP agents, a jade-loop task execution engine, and tweakcc-based
system prompt customisation.

## Architecture

- `s-team/` — STO system prompts for each C-suite role
- `extensions/` — Jade overlay skills and commands that compose on top of upstream KWP plugins
- `webmcp/` — WebMCP tool stubs (internal agent intranet + external marketplace)
- `compose/` — Loader/resolver that merges upstream KWP + jade extensions at build time
- `plugins/` — Jade Cofounder v3 plugins (jade-loop, jade-cofounder, 13 VP agents)
- `src/jade/` — TypeScript SDK: auth resolution, tokenizer, agent spawning, tweakcc patches
- `docs/architecture/` — Design documents and conversation log

## 13 VP Plugins

| Plugin | Seat | Domain |
|--------|------|--------|
| `jade-cofounder` | CEO | Strategy, OP1/OP2, S-Team orchestration |
| `jade-vp-engineering` | CTO | Code review, SDK codegen, architecture |
| `jade-vp-security` | CSO | Security review, prompt injection, bloom evals |
| `jade-vp-product` | CPO | PRDs, roadmap, user research |
| `jade-vp-sales` | CRO | Prospect research, pipeline, deal review |
| `jade-vp-marketing` | CMO | Content, brand voice, campaigns |
| `jade-vp-finance` | CFO | Journal entries, burn analysis, unit economics |
| `jade-vp-data` | CDO | SQL generation, dashboards, WBR/MBR/QBR data |
| `jade-vp-support` | CCO | Ticket triage, CSAT, KB articles |
| `jade-vp-legal` | CLO | Contract review, NDAs, compliance |
| `jade-vp-search` | CSO₂ | Cross-tool search, knowledge aggregation |
| `jade-vp-research` | CRO₂ | Deep research, literature review |
| `jade-vp-productivity` | CPO₂ | Daily workflow, task management |

## tweakcc Integration

`tweakcc` is an npm dependency (not a fork). Used to inject jade-cofounder
identity into Claude Code system prompts.

```typescript
import { tryDetectInstallation, readContent, writeContent, helpers } from 'tweakcc';
```

Key API: `tryDetectInstallation()`, `readContent()`, `writeContent()`, `helpers.globalReplace()`.
See `src/jade/patches/cofounderIdentity.ts` for the implementation.

## Auth Resolution

Three modes resolved from environment variables (see `src/jade/auth/resolve.ts`):
- `pro-max` — Claude Code session (default, zero config)
- `api-key` — `ANTHROPIC_API_KEY` set
- `enterprise` — `JADE_ENTERPRISE_API_KEY` set

## Agent SDK (v0.2.76+)

Uses `@anthropic-ai/claude-agent-sdk` for programmatic agent orchestration:
- `query()` — V1 async generator for single-shot agent runs
- `unstable_v2_createSession()` / `unstable_v2_resumeSession()` — V2 session-based API (preview)
- `forkSession()` — Branch conversations from a point (v0.2.76+)
- `renameSession()` — Rename session files (v0.2.76+)
- `agentProgressSummaries` option — Periodic AI-generated progress summaries (v0.2.76+)
- `settingSources` — Control which settings are loaded (`["project"]`, `["user"]`)
- Result subtypes: `success`, `error_max_turns`, `error_max_budget_usd`, `error_during_execution`, `error_max_structured_output_retries`

## Hooks

Configured in `.claude/settings.json` and `plugins/*/hooks/hooks.json`:
- `SessionStart` — Bootstrap environment and resolve MCP secrets
- `PreCompact` — Persist session state before context compaction
- `PostCompact` — Restore session state after compaction (v2.1.x+)
- `InstructionsLoaded` — Log when CLAUDE.md or rules files are loaded (v2.1.x+)
- `PostToolUse` — TypeScript type-checking on Edit/Write
- `Stop` — jade-loop continuation logic
- `TaskCompleted` — Validate agent team task completion (v2.1.x+)
- `TeammateIdle` — Handle idle teammates in agent teams (v2.1.x+)

## Rules

- Upstream ref pinned in `upstream-ref.json` — update commit hash when syncing
- Jade extensions always win over upstream in conflict resolution
- All WebMCP tools must export `{ name, description, inputSchema, handler }`
- STO files use frontmatter with: role, model, safety_research, fitness_function, budget_tool_calls
- All shell scripts must use `set -euo pipefail`
- All TypeScript must use strict mode (no `any`)
- All plugin.json files must have: name, description, author, version
- Tests run with `vitest`
