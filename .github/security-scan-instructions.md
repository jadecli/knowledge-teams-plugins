# Jade Security Scan Instructions

Custom security policy for jadecli/knowledge-teams-plugins.

## Architecture Context

This is a multi-agent platform with:
- **WebMCP tools** (`webmcp/`) — internal intranet + external marketplace tools
- **URL-allowlisted crawler** (`lib/llms-crawler.ts`) — fetches docs from Anthropic domains only
- **Neon Postgres** (`db/`) — Kimball star schema via Drizzle ORM
- **Agent orchestration** (`src/teams/`) — Claude Agent SDK with sub-agents
- **S-team STOs** (`s-team/`) — system prompts with YAML frontmatter

## Jade-Specific Security Concerns

### WebMCP Tool Contract Violations
- All tools MUST export `{ name, description, inputSchema, handler }`
- `inputSchema` MUST be a Zod schema — never `z.any()` or `z.unknown()` without refinement
- Handlers MUST validate input via `validateInput()` from `webmcp/shared/validate.ts` BEFORE processing
- Use `.strict()` on object schemas to reject unexpected keys (prototype pollution defense)

### URL Allowlist Integrity
- `lib/llms-crawler.ts` defines `ALLOWED_DOMAINS = ["docs.anthropic.com", "claude.ai"]`
- `isAllowedUrl()` uses exact hostname match (`parsed.hostname === domain`) — NOT substring
- Protocol MUST be `https:` only — reject `http:`, `ftp:`, `javascript:`, `data:`, `file:`
- Watch for: subdomain bypass, `@` userinfo trick, URL encoding, Unicode homoglyphs, IP addresses

### Drizzle ORM Parameterization
- All database operations MUST use Drizzle ORM's query builder — NEVER raw SQL strings
- Template literals containing SQL MUST use Drizzle's `sql` tagged template (parameterized)
- JSONB fields (`inputParams` in `factToolCalls`) are serialized by Drizzle — no string interpolation

### STO Frontmatter Injection
- `s-team/*.md` files use YAML frontmatter (`role`, `model`, `safety_research`, `budget_tool_calls`)
- If any code parses this frontmatter at runtime, verify the YAML parser is not vulnerable to
  constructor injection (e.g., `!!js/function` in YAML 1.1)
- `budget_tool_calls` is a number — verify it's parsed as integer, not eval'd

### Agent SDK Security
- `@anthropic-ai/claude-agent-sdk` is correct; `@anthropic-ai/sdk` (REST API) is wrong for agents
- `permissionMode: "dontAsk"` MUST always be paired with explicit `allowedTools` whitelist
- System prompts MUST be hardcoded or from trusted config — never from user/external input
- Sub-agent prompts should not be constructible from untrusted data

### Secrets Exposure
- Hard block on: `sk-ant-*`, `xoxb-*`, `ghp_*`, `AKIA*`, `Bearer [40+ chars]`
- `.env.example` must contain only placeholder values (xxxxx patterns)
- Workflow files must reference tokens via `${{ secrets.* }}` — never inline
- `show_full_output: true` in workflows may expose secrets in logs — flag if combined with secret env vars

## OWASP Top 10 Priority Order

For this codebase, prioritize in this order:
1. **A03:2021 Injection** — SQL, command, prompt, JSONB
2. **A01:2021 Broken Access Control** — URL allowlist, input validation
3. **A02:2021 Cryptographic Failures** — hardcoded secrets, weak hashing
4. **A10:2021 SSRF** — fetch with user-controlled URLs
5. **A05:2021 Security Misconfiguration** — permissionMode, debug flags
6. **A07:2021 Identification and Authentication Failures** — Unicode homoglyphs, type coercion
7. **A08:2021 Software and Data Integrity Failures** — supply chain (package versions)
