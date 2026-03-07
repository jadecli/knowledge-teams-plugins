# knowledge-teams-plugins

S-team compose layer + WebMCP tools — extends Anthropic's [knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) with jade-specific skills, agent orchestration, and tool infrastructure.

## What this does

1. **S-team STOs** — System prompts for 10 C-suite agent roles (CPO, CTO, CRO, etc.), each mapped to a safety-research repo and fitness function.

2. **Compose layer** — Loads upstream KWP plugins and overlays jade extensions. Jade skills/commands win in conflict resolution.

3. **WebMCP tools** — TypeScript tool stubs for the agent intranet (jadecli.app) and marketplace (jadecli.com).

## Upstream

Upstream fork: `jadecli/knowledge-work-plugins` (synced to `anthropics/knowledge-work-plugins` at commit `477c893b`).

The `upstream-ref.json` file pins the exact commit. The compose loader reads this to locate upstream plugin definitions.

## Development

```bash
npm install
npm test
npm run build
```

## Structure

```
s-team/          # STO system prompts (10 C-suite roles)
extensions/      # Jade overlay skills + commands
webmcp/          # WebMCP tool definitions
compose/         # Loader, resolver, manifest generator
tests/           # vitest test suite
```
