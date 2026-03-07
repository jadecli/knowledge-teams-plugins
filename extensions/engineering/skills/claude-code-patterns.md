# Claude Code Patterns

Extends upstream `engineering` plugin with jade-specific Claude Code development patterns.

## When to apply

Use these patterns when writing code that will be executed by or interacts with Claude Code agents.

## Patterns

1. **Tool-first design** — Prefer exposing functionality as WebMCP tools over embedding logic in system prompts. Tools are testable; prompt instructions are not.

2. **Contract context** — Every agent interaction must include a contract context (task ID, budget remaining, checkpoint requirements) so the agent can self-regulate.

3. **Checkpoint protocol** — Long-running tasks must call `request-checkpoint` at natural boundaries. Never let an agent run more than 20 tool calls without a checkpoint.

4. **Artifact submission** — All agent outputs go through `submit-artifact` which records provenance (model, token count, tool calls used).

5. **Compose-safe extensions** — When adding skills that overlay upstream KWP, ensure the skill file name matches the upstream pattern so the resolver can detect conflicts.
