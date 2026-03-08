# Jade Cofounder v3 Architecture

## Overview

Jade Cofounder v3 is an AI cofounder layer built on top of Claude Code and
`jadecli/knowledge-teams-plugins`. It implements a 13-seat S-Team council of
specialised VP agents, a jade-loop task execution engine, auth resolution,
and tweakcc-based system prompt customisation.

---

## S-Team Council Diagram

```
                     ┌─────────────────────┐
                     │   jade-cofounder     │
                     │       (CEO)          │
                     └──────────┬──────────┘
                                │ orchestrates
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
   ┌──────┴──────┐      ┌───────┴──────┐     ┌───────┴──────┐
   │  jade-vp-   │      │  jade-vp-    │     │  jade-vp-    │
   │ engineering │      │  security    │     │  product     │
   │   (CTO)     │      │   (CSO)      │     │   (CPO)      │
   └─────────────┘      └─────────────┘     └─────────────┘
          │                     │                     │
   ┌──────┴──────┐      ┌───────┴──────┐     ┌───────┴──────┐
   │  jade-vp-   │      │  jade-vp-    │     │  jade-vp-    │
   │    sales    │      │  marketing   │     │   finance    │
   │   (CRO)     │      │   (CMO)      │     │   (CFO)      │
   └─────────────┘      └─────────────┘     └─────────────┘
          │                     │                     │
   ┌──────┴──────┐      ┌───────┴──────┐     ┌───────┴──────┐
   │  jade-vp-   │      │  jade-vp-    │     │  jade-vp-    │
   │    data     │      │   support    │     │    legal     │
   │   (CDO)     │      │   (CCO)      │     │   (CLO)      │
   └─────────────┘      └─────────────┘     └─────────────┘
          │                     │
   ┌──────┴──────┐      ┌───────┴──────┐
   │  jade-vp-   │      │  jade-vp-    │
   │   search    │      │  research    │
   │   (CSO₂)    │      │   (CRO₂)     │
   └─────────────┘      └─────────────┘
                                │
                     ┌──────────┴──────────┐
                     │   jade-vp-          │
                     │   productivity      │
                     │   (CPO₂)            │
                     └─────────────────────┘
```

---

## S-Team Mapping Table

| Seat | Plugin | Source Plugin Domain | Key Commands | Key Skills |
|------|--------|---------------------|--------------|------------|
| CEO | jade-cofounder | Strategy & orchestration | /op1, /wbr, /mbr, /qbr, /s-team, /hire-agent | op1-planning, working-backwards, two-pizza-teams, door-decisions, rots-tracking |
| CTO | jade-vp-engineering | Engineering excellence | /code-review, /sdk-codegen | code-review, sdk-codegen, architecture-review |
| CSO | jade-vp-security | Security & compliance | /security-review | security-review, agent-prompt-injection, bloom-eval |
| CPO | jade-vp-product | Product management | /prd | product-specs |
| CRO | jade-vp-sales | Revenue operations | /prospect | prospect-research |
| CMO | jade-vp-marketing | Marketing & brand | /content-brief | brand-voice |
| CFO | jade-vp-finance | Financial operations | /burn-analysis | journal-entries |
| CDO | jade-vp-data | Data & analytics | /sql | sql-generation |
| CCO | jade-vp-support | Customer success | /triage | ticket-triage |
| CLO | jade-vp-legal | Legal & compliance | /contract-review | contract-review |
| CSO₂ | jade-vp-search | Search & knowledge | /search | cross-tool-search |
| CRO₂ | jade-vp-research | Research & innovation | /research | deep-research |
| CPO₂ | jade-vp-productivity | Productivity & tooling | /daily-plan | daily-workflow |

---

## Jade Loop Design

The jade-loop extends the Ralph Loop pattern with enterprise controls:

```
/jade-loop PROMPT
    │
    ▼
setup-jade-loop.sh
    │  creates .claude/jade-loop.local.md
    │  (YAML frontmatter + prompt body)
    │
    ▼
Claude Code executes one turn
    │
    ▼
Stop hook fires (stop-hook.sh)
    │
    ├─ <promise status="fulfilled">? ──────────────────▶ EXIT 0 (success)
    │   Calculate ROTS, write to state
    │
    ├─ <escalation> tag detected? ────────────────────▶ EXIT 0 (surface)
    │
    ├─ iteration ≥ max_iterations? ───────────────────▶ EXIT 0 (cap hit)
    │
    ├─ used_tokens ≥ budget_tokens? ──────────────────▶ EXIT 0 (budget)
    │
    ├─ used_usd ≥ budget_usd? ────────────────────────▶ EXIT 0 (budget)
    │
    └─ Continue → increment iteration ───────────────▶ EXIT 1 (loop)
                  echo original prompt
```

### ROTS Calculation

```
ROTS = value_delivered / cost_usd
```

Value is domain-specific (story points, tickets closed, etc.).
Persisted in `.claude/jade-loop.local.md` as `rots:`.

### Escalation Threshold

Default: 80% of budget. At threshold, emits warning. At 100%, exits.
Configurable via `--escalation-threshold` (0.0–1.0).

---

## Auth Resolution

```
Environment           Auth Mode     Client
─────────────────────────────────────────────────────
JADE_ENTERPRISE_API_KEY set  →  enterprise  →  Anthropic SDK
ANTHROPIC_API_KEY set        →  api-key     →  Anthropic SDK
(neither)                    →  pro-max     →  null (Claude Code session)
```

Model defaults:
- pro-max: `claude-sonnet-4-5`
- api-key: `claude-opus-4-5`
- enterprise: `claude-opus-4-5`

Override with `JADE_MODEL` env var.

---

## Plugin Structure Conventions

```
plugins/{name}/
├── .claude-plugin/
│   └── plugin.json          # Required: name, description, author, version
├── commands/
│   └── {command}.md         # YAML frontmatter with description
├── skills/
│   └── {skill}.md           # Activation conditions + output format
├── agents/
│   └── {agent}.md           # XML-structured agent prompt (optional)
├── hooks/
│   ├── hooks.json           # Stop/Pre/Post hook registration
│   └── {hook}.sh            # set -euo pipefail required
└── scripts/
    └── {script}.sh          # set -euo pipefail required
```

---

## tweakcc Integration

`tweakcc` is used as an npm dependency to patch Claude Code system prompts.

### API used

| Function | Purpose |
|----------|---------|
| `tryDetectInstallation()` | Locate active Claude Code installation |
| `readContent(installation)` | Read current system prompt content |
| `writeContent(installation, content)` | Write patched content |
| `helpers.globalReplace(content, from, to)` | String replacement across content |

### Patch applied by `src/jade/patches/cofounderIdentity.ts`

1. Renames "Claude Code" → "Claude Code — operating as the Jade Cofounder"
2. Appends jade-cofounder identity block
3. Appends S-Team context block

Patch is idempotent (skipped if already applied). Reversible via
`removeCofounderIdentityPatch()`.

---

## Implementation Phases

| Phase | Description | Est. hours |
|-------|-------------|-----------|
| 1 | Repo scaffold & tsconfig | 2 |
| 2 | Auth resolution (resolve.ts) | 3 |
| 3 | Tokenizer & ROTS | 2 |
| 4 | Agent spawn (spawn.ts) | 4 |
| 5 | tweakcc cofounder patch | 4 |
| 6 | jade-loop stop hook | 6 |
| 7 | jade-loop setup script | 3 |
| 8 | jade-loop commands & README | 2 |
| 9 | jade-cofounder commands | 4 |
| 10 | jade-cofounder skills & agent | 6 |
| 11 | jade-vp-engineering (full) | 6 |
| 12 | jade-vp-security (full) | 6 |
| 13 | 10 VP stubs | 10 |
| 14 | CI workflow | 2 |
| 15 | Tests (TypeScript modules) | 8 |
| 16 | Docs & CLAUDE.md update | 4 |
| 17 | Review & polish | 4 |
| **Total** | | **76 hours** |

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| tweakcc usage | API dep, not fork | MIT licensed API; avoids maintenance burden |
| Auth model | Three-mode resolution | Supports Pro Max, API Key, Enterprise seamlessly |
| Loop mechanism | Stop hook | Follows Ralph Loop pattern; no SDK changes |
| ROTS formula | value / cost_usd | Simple, domain-adaptable, comparable across VPs |
| State file format | YAML frontmatter + MD body | Human-readable, easily parsed by bash/sed |
| Error handling | Fail-safe (exit 0 on unknown error) | Never block the user's Claude Code session |
| Shell scripts | `set -euo pipefail` | Catch errors early; production-grade reliability |
| TypeScript | Strict mode, no `any` | Type safety across all SDK modules |
