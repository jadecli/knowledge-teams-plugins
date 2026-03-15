# Review Guidelines

## Always check
- No secrets or API keys in code
- Use `@anthropic-ai/claude-agent-sdk` (query/agents), never `@anthropic-ai/sdk` (REST client)
- No `any` types, no unsafe `as` assertions, no `@ts-ignore`
- WebMCP tools export `{ name, description, inputSchema, handler }` — no stubs
- Zod v4 API: `err.issues` not `err.errors`; `z.record(key, val)` not `z.record(val)`
- Agent runners use `permissionMode: "dontAsk"` + `tools` whitelist for headless execution
- Exported functions have explicit return types (Go-style)

## Ignore
- Generated files (package-lock.json, dist/)
- Third-party type definitions

## Follow-up Workflow (scope creep prevention)

When a PR receives **PASS with follow-ups** or **REVISIT** from architecture guardrails:

1. Claude generates `<linear-ticket-drafts>` XML in the PR comment
2. Each `<ticket>` is a structured follow-up with title, priority, affected files, and semver subtasks
3. **Jade or Alex** reviews and approves tickets into the Linear sprint queue
4. Approved tickets become tasks with semver subtask breakdown
5. Follow-ups are tracked separately — they do not block the current PR (only secrets block)

This prevents scope creep: the PR ships with its focused changes, and compounding improvements are queued as discrete tasks.
