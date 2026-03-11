# knowledge-teams-plugins

S-team compose layer that extends jadecli/knowledge-work-plugins (upstream fork of anthropics/knowledge-work-plugins) with jade-specific skills, WebMCP tools, and agent orchestration.

## Architecture

- `s-team/` — STO system prompts for each C-suite role
- `extensions/` — Jade overlay skills and commands that compose on top of upstream KWP plugins
- `webmcp/` — WebMCP tool stubs (internal agent intranet + external marketplace)
- `compose/` — Loader/resolver that merges upstream KWP + jade extensions at build time

## Rules

- Upstream ref pinned in `upstream-ref.json` — update commit hash when syncing
- Jade extensions always win over upstream in conflict resolution
- All WebMCP tools must export `{ name, description, inputSchema, handler }`
- STO files use frontmatter with: role, model, safety_research, fitness_function, budget_tool_calls
- Tests run with `vitest`

## CI/CD — Claude Code GitHub Actions

All workflows use `anthropics/claude-code-action@v1` with **OAuth tokens** (not API keys).

### OAuth Token Setup (daily rotation)

Both accounts (alex@jadecli.com, jade@jadecli.com) have $200/mo Max plans.
Claude Code OAuth tokens are user-scoped and must be generated locally:

```bash
# 1. Log in (or refresh) — generates OAuth token
claude auth login

# 2. Check token status
claude auth status

# 3. Set for all repos (or per-repo)
gh secret set CLAUDE_CODE_OAUTH_TOKEN --body "<token>"
```

Tokens expire daily — regenerate and update the secret each session.

### Workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | push/PR to main | Build + test |
| `architecture-guardrails.yml` | PR (required check) | **Blocks PR** if architectural violations found |
| `staff-review.yml` | PR | Soft code review (non-blocking) |
| `ci-autofix.yml` | CI failure | Auto-fix build/test failures |
| `issue-triage.yml` | New issue | Auto-categorize and label |
| `weekly-audit.yml` | Monday 9am UTC | Stale code / drift audit |

### Architecture Guardrails (blocking)

The `architecture-guardrails.yml` workflow is a **required status check**.
PRs cannot merge until all 10 guardrails pass:

1. SDK misuse (agent-sdk vs REST sdk)
2. WebMCP contract (name, description, inputSchema, handler)
3. Unpinned dependencies (@anthropic-ai/*, @modelcontextprotocol/* must be exact)
4. Secrets/credentials in source
5. Type safety (no unguarded `as any`, `@ts-ignore`)
6. STO frontmatter completeness
7. Upstream override protection
8. Registry consistency
9. Zod v4 API compliance
10. Test coverage for new exports

To make this a required check in GitHub: Settings → Branches → Branch protection
rule for `main` → Require status checks → Add "Claude Architecture Review".
