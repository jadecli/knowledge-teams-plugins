# Jade Cofounder v3 — Design Conversation Log

This document preserves the foundational design conversation that led to the
Jade Cofounder v3 architecture. It serves as the primary design rationale
document for the project.

---

## Conversation 1: Repo Structure & tweakcc Integration

**User**: I have a repo `jadecli/knowledge-teams-plugins` with this structure:
- `s-team/` — STO system prompts for each C-suite role
- `extensions/` — Jade overlay skills and commands
- `webmcp/` — WebMCP tool stubs
- `compose/` — Loader/resolver
- `tests/` — vitest tests

I want to integrate tweakcc to patch Claude Code's system prompts and build
out the full Jade Cofounder v3 architecture. How should I structure this?

**Jade Cofounder (v3 design response)**:

### S-Team Council: 13 Seats Mapped to Knowledge-Work Domains

The Jade Cofounder v3 architecture maps each C-suite role to a dedicated
Claude Code plugin. The 13-seat S-Team council covers:

| Seat | Plugin | Domain |
|------|--------|--------|
| CEO | jade-cofounder | Strategy, OP1/OP2, S-Team orchestration |
| CTO | jade-vp-engineering | Engineering, code review, SDK generation |
| CSO | jade-vp-security | Security, compliance, bloom eval gates |
| CPO | jade-vp-product | Product specs, roadmap, user research |
| CRO | jade-vp-sales | Pipeline, prospect research, deal review |
| CMO | jade-vp-marketing | Content, brand voice, campaigns |
| CFO | jade-vp-finance | Journal entries, burn tracking, unit economics |
| CDO | jade-vp-data | SQL, dashboards, WBR/MBR/QBR data |
| CCO | jade-vp-support | Ticket triage, CSAT, knowledge base |
| CLO | jade-vp-legal | Contracts, NDAs, compliance |
| CSO₂ | jade-vp-search | Cross-tool search, knowledge graph |
| CRO₂ | jade-vp-research | Deep research, literature review |
| CPO₂ | jade-vp-productivity | Daily workflow, task management |

### Jade Loop Design

The jade-loop is the core task execution engine, extending the Ralph Loop
pattern from `anthropics/claude-plugins-official/plugins/ralph-loop` with:

1. **Budget tracking** — token and USD caps with configurable escalation threshold
2. **ROTS measurement** — Return on Token Spend: `value_delivered / cost_usd`
3. **Escalation policy** — surface to human at budget threshold or on agent signal
4. **Bloom eval gates** — quality assessment at each loop iteration
5. **Session isolation** — state scoped to Claude Code session ID
6. **Completion promise** — natural-language criterion evaluated via `<promise>` tags

Loop state lives in `.claude/jade-loop.local.md` (YAML frontmatter + prompt body).
The stop hook (`stop-hook.sh`) implements all control flow logic.

### Auth Resolution: Three Modes

```
Priority 1: JADE_ENTERPRISE_API_KEY → enterprise mode (Anthropic SDK)
Priority 2: ANTHROPIC_API_KEY       → api-key mode (Anthropic SDK)
Priority 3: (default)               → pro-max mode (Claude Code session)
```

Pro Max mode uses the Claude Code session — no SDK client is created.
This enables zero-configuration use for Claude Pro Max subscribers.

### tweakcc Integration Strategy

Rather than forking tweakcc, we use it as an npm dependency:

```bash
npm install tweakcc
```

Key API calls:
- `tryDetectInstallation()` — find the active Claude Code installation
- `readContent(installation)` / `writeContent(installation, content)` — R/W
- `helpers.globalReplace(content, from, to)` — string patching

The `cofounderIdentity.ts` patch:
1. Renames "Claude Code" → "Claude Code — operating as the Jade Cofounder"
2. Appends jade identity and S-Team context blocks
3. Is idempotent and fully reversible

### Plugin Structure Convention

```
plugins/{name}/
├── .claude-plugin/plugin.json   # name, description, author, version
├── commands/{cmd}.md            # YAML frontmatter: description, argument-hint
├── skills/{skill}.md            # Activation conditions + output format
├── agents/{agent}.md            # XML-structured agent prompts
├── hooks/hooks.json + *.sh      # Stop/Pre/Post hooks (set -euo pipefail)
└── scripts/*.sh                 # Helper scripts (set -euo pipefail)
```

---

## Conversation 2: User Confirms Implementation

**User**: This looks great. Please implement all of it — jade-loop plugin,
all 13 VP plugins, auth resolution, agent SDK, tweakcc integration, CI,
and architecture docs.

**Jade Cofounder**: Confirmed. Implementing the full v3 architecture as
described. See `docs/architecture/v3-architecture.md` for the complete
technical specification.

---

## Design Principles (recorded for posterity)

### Why stop hooks instead of a standalone loop runner?

Stop hooks integrate natively with Claude Code's execution model. No
additional process management, no race conditions, no out-of-band
communication. The hook is the loop.

### Why YAML frontmatter for loop state?

Human-readable, trivially parsed by `sed` in bash, and can be inspected/
edited by the user during a running loop. No external database or process
required.

### Why three auth modes?

Claude Pro Max subscribers outnumber API key users. Making Pro Max the
default (zero configuration) maximises adoption. Enterprise mode enables
custom model endpoints and compliance requirements.

### Why 13 seats?

Mirrors the Amazon S-Team structure adapted for a software company. Each
seat maps to a recognised knowledge-work domain with clear ownership,
metrics, and decision rights. 13 is the right size for a council that
covers all domains without redundancy.

### Why tweakcc as a dependency (not fork)?

tweakcc is MIT licensed and actively maintained. Using its API insulates
us from Claude Code internal changes — the tweakcc maintainers handle
compatibility. Forking would create a maintenance burden.

---

*This document was generated from the foundational design conversation
for jade-cofounder v3. Date: 2026-03-08.*
