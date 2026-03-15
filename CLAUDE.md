# knowledge-teams-plugins

S-team compose layer that extends jadecli/knowledge-work-plugins (upstream fork of anthropics/knowledge-work-plugins) with jade-specific skills, WebMCP tools, and agent orchestration.

## Architecture

- `s-team/` — STO system prompts for each C-suite role
- `extensions/` — Jade overlay skills and commands that compose on top of upstream KWP plugins
- `webmcp/` — WebMCP tool stubs (internal agent intranet + external marketplace)
- `compose/` — Loader/resolver that merges upstream KWP + jade extensions at build time
- `db/` — Drizzle ORM schema (Kimball star schema), Neon client, tool call logger, org usage
- `lib/` — llms.txt crawler + two-tier cache (LRU + Neon)

## Rules

- Upstream ref pinned in `upstream-ref.json` — update commit hash when syncing
- Jade extensions always win over upstream in conflict resolution
- All WebMCP tools must export `{ name, description, inputSchema, handler }`
- STO files use frontmatter with: role, model, safety_research, fitness_function, budget_tool_calls
- Tests run with `vitest`
- Go-style coding standards: small interfaces, explicit return types, functions do one thing
- Exported functions must have explicit return types; internal helpers can use inference

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
| `ci.yml` | push/PR to main | Build + test + Neon branch-per-PR |
| `neon-cleanup.yml` | PR closed | Delete ephemeral Neon branch |
| `architecture-guardrails.yml` | PR (required check) | Architecture decision framework — recommends compounding refactors |
| `staff-review.yml` | PR | SDK-aware code quality review (return types, coverage, naming, drift) |
| `ci-autofix.yml` | CI failure | Auto-fix build/test failures |
| `issue-triage.yml` | New issue | Auto-categorize and label |
| `weekly-audit.yml` | Monday 9am UTC | Stale code / drift audit |
| `security-review.yml` | PR | Layered security review (OAuth scan + API key security review) |

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

## Data Layer — Neon Postgres + Drizzle ORM

### Kimball Star Schema

Agent observability uses a dimensional model (`db/schema.ts`):

| Table | Type | Purpose |
|---|---|---|
| `fact_tool_calls` | Fact | Agent tool call events (measures: duration, tokens, success) |
| `fact_org_usage` | Fact | Claude Organizations API team usage metrics |
| `dim_tools` | Dimension | Tool identity + McpCategory/McpOrigin classification |
| `dim_agents` | Dimension | Agent name, SDK version, model |
| `dim_sessions` | Dimension | Session → branch → PR → repo context |
| `meta_doc_cache` | Metadata | llms.txt cached content + content hashes |

### Neon Branch-per-PR

Each PR gets an ephemeral Neon database branch (copy of main/production data).
Agents can safely CREATE/DROP tables, ALTER columns, and test migrations.
CI validates schema changes pass before merging. Branch is deleted on PR close.

Required GitHub secrets: `NEON_API_KEY`, `NEON_PROJECT_ID`, `DATABASE_URL`.

### Scripts

- `npm run db:push` — Push schema to Neon (drizzle-kit push)
- `npm run db:generate` — Generate migration SQL
- `npm run db:studio` — Open Drizzle Studio
- `npm run llms:sync` — Crawl + cache llms.txt docs

## llms.txt Doc Cache

Secure crawler for Claude/Anthropic documentation (`lib/`):

- **Allowlist**: only `docs.anthropic.com` and `claude.ai` (prompt injection defense)
- **Two-tier cache**: in-memory LRU (100 entries) + Neon persistence
- **Hash-based change detection**: SHA-256 content hash, only re-caches on change
- **Recursive crawl**: follows hyperlinks inside llms.txt (depth-limited)
- **Weekly refresh**: `weekly-audit.yml` runs `npm run llms:sync`

Agents reference cached docs instead of repeated WebFetch calls.

## Security TDD

Jade prioritizes **Security Test-Driven Development** — writing security tests first
reduces the Bayesian prior probability that vulnerabilities exist in production code.

### Convention

- Security test files use `*.security.test.ts` suffix in `tests/security/`
- Each `describe` block opens with a `@security-test` JSDoc frontmatter block
- Frontmatter is validated by `tests/security/security-frontmatter.ts`

### Required Frontmatter Fields

```typescript
/**
 * @security-test
 * ---
 * threat-model: Description of the threat being tested
 * owasp-category: A03:2021 Injection (OWASP 2021 format)
 * attack-vector: How an attacker would exploit this
 * bayesian-prior: 0.15 (P(vuln) before test exists)
 * bayesian-posterior: 0.02 (P(vuln) after test passes)
 * cve-reference: CVE-XXXX-XXXXX or N/A (preventive)
 * ---
 */
```

### Bayesian Probability Model

Each security test documents two probabilities:
- **Prior** `P(vuln|no_test)` — estimated probability the vulnerability exists without this test
- **Posterior** `P(vuln|test_passes)` — reduced probability after the test passes

Compound reduction across N tests: `P_final = P_0 * Product(posterior_i / prior_i)`

The lower the compound reduction, the more secure the codebase. This makes security
posture measurable and auditable — not just a checklist.

### Running Security Tests

```bash
npm run test:security     # Run security tests only
npm run test:coverage     # Run all tests with coverage
npm test                  # Run all tests (includes security)
```

### CI Enforcement

Security is enforced via `security-review.yml` with layered defense:
1. **Layer 1**: `claude-code-action@v1` with custom security prompt (OAuth token)
2. **Layer 2**: `claude-code-security-review@main` (Anthropic API key)

Required GitHub secrets: `CLAUDE_CODE_OAUTH_TOKEN` (existing), `CLAUDE_API_KEY` (new).

### Security Test Coverage

Current attack surfaces with tests in `tests/security/`:

| Test File | Attack Surface | OWASP Categories |
|---|---|---|
| `input-validation.security.test.ts` | WebMCP Zod schemas | A03, A05, A07 |
| `url-allowlist.security.test.ts` | llms-crawler URL allowlist | A01, A10 |
| `schema-injection.security.test.ts` | Drizzle ORM / Postgres | A03, A07 |
| `secrets-detection.security.test.ts` | Hardcoded secrets in repo | A02 |

When adding new attack surfaces (new WebMCP tools, new external fetchers, new DB tables),
write security tests FIRST before implementing the feature.

## Semver Subtask Conventions

Refactors are broken into modular tasks with semver subtasks:

```
feat(v0.1.0): add Neon/Drizzle deps
feat(v0.2.0): Kimball dimensional schema
feat(v0.3.0): tool call logger
feat(v0.4.0): Neon branch-per-PR CI
feat(v0.5.0): llms.txt crawler
feat(v0.6.0): org usage fetcher
test(v0.7.0): tests
docs(v0.8.0): documentation
```

Over time, completed subtask patterns are logged in `fact_tool_calls` with
session metadata. Agents can query past patterns ("how did we add a dimension
table last time?") to reduce token usage by referencing cached patterns.
