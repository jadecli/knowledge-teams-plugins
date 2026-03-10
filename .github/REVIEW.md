# Review Guidelines

## Always check
- No secrets or API keys in code
- Use `@anthropic-ai/claude-agent-sdk` (query/agents), never `@anthropic-ai/sdk` (REST client)
- No `any` types, no unsafe `as` assertions, no `@ts-ignore`
- WebMCP tools export `{ name, description, inputSchema, handler }` — no stubs
- Zod v4 API: `err.issues` not `err.errors`; `z.record(key, val)` not `z.record(val)`
- Agent runners use `permissionMode: "dontAsk"` + `tools` whitelist for headless execution

## Ignore
- Generated files (package-lock.json, dist/)
- Third-party type definitions
