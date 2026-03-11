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

Prerequisites: Install the [Claude GitHub App](https://github.com/apps/claude) on your repos.

```bash
# 1. Generate OAuth token for CI/CD
claude setup-token

# 2. Verify token
claude auth status

# 3. Set for all repos (or per-repo)
gh secret set CLAUDE_CODE_OAUTH_TOKEN --body "<token>"
```

Tokens expire daily — regenerate and update the secret each session.
Alternatively, use `claude auth login` if `setup-token` is unavailable.

### Workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | push/PR to main | Build + test |
| `architecture-guardrails.yml` | PR (required check) | Architecture decision framework — recommends compounding refactors |
| `staff-review.yml` | PR | SDK-aware code quality review (return types, coverage, naming, drift) |
| `ci-autofix.yml` | CI failure | Auto-fix build/test failures |
| `issue-triage.yml` | New issue | Auto-categorize and label |
| `weekly-audit.yml` | Monday 9am UTC | Stale code / drift audit |

### Architecture Decision Framework

The guardrails use a **decision framework**, not a rigid checklist. Claude acts
as a senior architect who recommends refactors that compound over time — dogfooding
the same patterns we'd recommend to knowledge-work-plugins consumers.

**Review dimensions** (both workflows):
- SDK correctness — right SDK for the job (agent-sdk vs REST sdk)
- Return types & type annotations on public exports
- Canonical naming — reuse McpServerEntry, CanonicalPackage, WorkDomain, etc.
- Package version drift vs ANTHROPIC_PACKAGES / MCP_PACKAGES
- Test coverage gaps — suggest concrete test cases, not just "add tests"
- Zod v4 API patterns, WebMCP contract, coding standards

**Verdicts** (architecture-guardrails):
- **PASS** — ship it
- **PASS with follow-ups** — ship, file issues for recommendations
- **REVISIT** — significant drift, worth a revision before compounding debt
- **BLOCK** — hardcoded secrets only (the one hard rule)

To make this a required check: Settings → Branches → Branch protection
rule for `main` → Require status checks → Add "Claude Architecture Review".
