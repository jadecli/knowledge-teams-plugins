# Jade Ecosystem Product Requirements

> **Status**: Draft v1.0
> **Date**: 2026-03-11
> **Scope**: Jade identity layer, Anthropic ecosystem integration, IT admin provisioning, secrets management

---

## 1. Problem Statement

Today, enterprises using Claude have fragmented tooling across multiple Anthropic repositories, SDK languages, and deployment surfaces. A team admin must manually:

- Track upstream changes across 5+ Anthropic repos (`claude-code`, `knowledge-work-plugins`, `financial-services-plugins`, `claude-plugins-official`, SDKs)
- Manage `.env` files with API keys scattered across developer machines
- Configure MCP servers per-user rather than at the team/org level
- Lack a unified agent identity that represents the company's AI assistant with consistent behavior, permissions, and context

The `knowledge-teams-plugins` repo currently scaffolds a "Jade Cofounder" identity and 13 VP agents, but needs to be restructured to cohesively integrate with the Anthropic ecosystem rather than operating as an isolated overlay.

---

## 2. Vision

**Jade** is a managed enterprise agent identity that extends Claude (never replaces, always adheres to Claude safety). Jade unifies the Anthropic ecosystem into a single provisioning surface for IT admins and a consistent experience for knowledge workers.

```
┌─────────────────────────────────────────────────────────────┐
│                     JADE IDENTITY LAYER                     │
│  (extends Claude — all Claude safety policies inherited)    │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Claude Code │  Claude API  │  Claude SDKs │  Claude Plugins│
│  (CLI agent) │  (HTTP)      │  (TS/Py/Go)  │  (KWP/FSP)    │
├──────────────┴──────────────┴──────────────┴────────────────┤
│               ANTHROPIC ECOSYSTEM PACKAGES                  │
│  @anthropic-ai/sdk  ·  anthropic (python)  ·  claude-code   │
│  knowledge-work-plugins  ·  financial-services-plugins      │
│  claude-plugins-official  ·  MCP servers                    │
└─────────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Extend, never replace** — Jade is Claude with enterprise context, not a separate AI
2. **Admin-provisioned, user-consumed** — IT admins configure once, knowledge workers run tasks
3. **Ecosystem-native** — Track and compose with all Anthropic packages, not fight them
4. **Secrets never local** — 1Password team vaults, not `.env` files
5. **Read/write separation** — RBAC at the secrets and permissions layer

---

## 3. User Personas

### 3.1 IT Admin (Provisioner)

- Manages Claude Team or Enterprise subscription
- Configures MCP connectors (GitHub, Google Workspace, Slack, Cloudflare, etc.)
- Sets up 1Password team vaults with read/write role separation
- Controls which plugins, skills, and VP agents are available to which teams
- Tracks Anthropic ecosystem versions and manages upgrades
- Uses Jade to build internal tooling and develop code in company repos

### 3.2 Knowledge Worker (Consumer)

- Runs tasks using existing Anthropic knowledge-work-plugins and financial-services-plugins
- Invokes Jade VP agents for domain-specific work (engineering, legal, finance, etc.)
- Never manages API keys or `.env` files directly
- Gets consistent Jade identity/context regardless of which Claude surface they use

### 3.3 Developer (Builder)

- Extends Jade with custom skills, commands, and VP agents
- Builds on the Anthropic SDK (TypeScript, Python) with Jade auth resolution
- Creates custom MCP servers for internal tools
- Uses Claude Code CLI with the Jade identity for AI-assigned development

---

## 4. Anthropic Ecosystem Dependency Map

### 4.1 Upstream Repositories

| Repository | Purpose | Integration Pattern | Sync Strategy |
|------------|---------|-------------------|---------------|
| `anthropics/claude-code` | CLI agent runtime | Jade runs *inside* Claude Code; tweakcc patches system prompt | Track releases via npm `@anthropic-ai/claude-code` |
| `anthropics/knowledge-work-plugins` | KW skills (coding, research, productivity) | Compose layer merges upstream + jade extensions | Pin commit in `upstream-ref.json`, periodic sync |
| `anthropics/financial-services-plugins` | Finance-specific skills | Optional addon for CFO/finance VP seat | Pin commit in `upstream-refs/financial-services.json` |
| `anthropics/claude-plugins-official` | Official plugin registry/format | Follow plugin.json schema, command/skill conventions | Track for format changes |
| `anthropics/anthropic-sdk-python` | Python SDK | Used by Python-based tools and MCP servers | Track PyPI `anthropic` package version |

### 4.2 npm/PyPI Packages to Track

| Package | Current | Purpose |
|---------|---------|---------|
| `@anthropic-ai/sdk` | `^0.78.0` | TypeScript SDK for API calls |
| `@anthropic-ai/claude-agent-sdk` | latest | Agent SDK — build agents on Claude Code |
| `@anthropic-ai/bedrock-sdk` | `v0.26.4` | AWS Bedrock Claude deployments |
| `@anthropic-ai/vertex-sdk` | `v0.14.4` | Google Vertex AI Claude |
| `@anthropic-ai/foundry-sdk` | `v0.2.3` | Azure Foundry Claude (newest) |
| `anthropic` (PyPI) | `v0.84.0` | Python SDK for MCP servers and tools |
| `tweakcc` | `^4.0.11` | Claude Code system prompt patching |
| `zod` | `^4.3.6` | Schema validation for tool inputs |

> **Note**: `@anthropic-ai/claude-code` npm package is deprecated. Claude Code is now installed via native installers (curl, brew, winget). Node.js 18+ remains a runtime dependency.

> **Note**: `@anthropic-ai/claude-agent-sdk` is the official way to build agents on Claude Code and should be evaluated against the current `src/jade/agent-sdk/spawn.ts` implementation.

### 4.3 Version Tracking Requirements

**REQ-ECO-1**: Maintain a `ecosystem-versions.json` manifest at the repo root that tracks:
- All Anthropic npm package versions (current pinned + latest available)
- All upstream repo commit hashes (current synced + latest main)
- SDK versions across languages (TypeScript, Python, Go, Java)
- Last sync date and sync status

**REQ-ECO-2**: Provide a `/jade-ecosystem-status` command that reports:
- Which upstream repos are behind and by how many commits
- Which npm packages have newer versions available
- Breaking change alerts from Anthropic changelogs

**REQ-ECO-3**: Support multiple upstream refs (not just knowledge-work-plugins):
```json
// upstream-refs.json (replaces upstream-ref.json)
{
  "knowledge-work-plugins": {
    "repo": "anthropics/knowledge-work-plugins",
    "commit": "abc123",
    "syncedAt": "2026-03-06",
    "npmPackage": null
  },
  "financial-services-plugins": {
    "repo": "anthropics/financial-services-plugins",
    "commit": null,
    "syncedAt": null,
    "npmPackage": null,
    "enabled": false
  },
  "claude-plugins-official": {
    "repo": "anthropics/claude-plugins-official",
    "commit": null,
    "syncedAt": null,
    "npmPackage": null,
    "trackFormatOnly": true
  }
}
```

---

## 5. Jade Identity Layer

### 5.1 Identity Model

Jade is **not** a separate AI model. Jade is a managed identity envelope around Claude that:

- Inherits all Claude safety policies, refusals, and guidelines
- Adds enterprise context (company name, team structure, allowed tools)
- Provides VP agent specialization (S-Team seats with domain expertise)
- Maintains consistent behavior across all Anthropic surfaces

**REQ-ID-1**: The Jade identity patch (via tweakcc) must:
- Clearly state "extends Claude" / "powered by Claude" in all surfaces
- Never claim to be a different AI or circumvent Claude's safety
- Be removable with a single command (`jade unpatch`)
- Be idempotent (safe to apply multiple times)

**REQ-ID-2**: The identity must be configurable per-org:
```json
// jade-identity.json
{
  "name": "Jade",
  "tagline": "AI Cofounder",
  "company": "Acme Corp",
  "enabledSeats": ["CEO", "CTO", "CPO", "CFO"],
  "defaultSeat": "CTO",
  "safetyPolicy": "inherit-claude",
  "customInstructions": "Always reference Acme Corp style guide..."
}
```

### 5.2 Multi-Surface Identity

| Surface | How Jade Identity is Applied |
|---------|------------------------------|
| Claude Code CLI | tweakcc system prompt patch + CLAUDE.md project instructions |
| Claude API (direct) | System prompt prepended by SDK wrapper |
| Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) | Agent system prompt composed from STO files |
| Claude Cowork (non-developers) | Plugin-based identity via knowledge-work-plugins format |
| Claude Web/Desktop | Not supported (no extensibility surface) |
| Microsoft Copilot Cowork (M365) | Potential future surface via plugin format compatibility |
| MCP Tools | Tool descriptions reference Jade context |

### 5.3 Context Window Budget

With 13 VP agents, the jade-loop engine, and MCP connections, context consumption is a critical constraint. Each active plugin's skills consume context tokens even before user prompts.

**REQ-ID-3**: Context budget management:
- Only load skills for the active VP seat (not all 13 simultaneously)
- Skills load on-demand based on activation conditions (matching Anthropic's lazy-load pattern)
- STO frontmatter field `budget_tool_calls` governs per-seat tool call limits
- Maximum of 3 VP seats active in a single session (CEO + 2 delegates)
- Track context consumption per-seat in jade-loop state file

---

## 6. IT Admin Provisioning

### 6.1 Team Configuration

**REQ-ADMIN-1**: IT admins configure Jade for their Claude Team/Enterprise via a `jade-team.json` manifest:

```json
{
  "teamId": "acme-corp",
  "plan": "enterprise",
  "identity": {
    "name": "Jade",
    "company": "Acme Corp"
  },
  "enabledPlugins": {
    "upstream": ["knowledge-work-plugins/*"],
    "jade": ["jade-cofounder", "jade-vp-engineering", "jade-vp-finance"],
    "financial-services": true
  },
  "mcpServers": {
    "managed": true,
    "servers": ["github", "google-workspace", "slack", "cloudflare"]
  },
  "secrets": {
    "provider": "1password",
    "vault": "jade-team-vault"
  },
  "rbac": {
    "roles": {
      "admin": { "read": true, "write": true, "configure": true },
      "developer": { "read": true, "write": true, "configure": false },
      "viewer": { "read": true, "write": false, "configure": false }
    }
  }
}
```

**REQ-ADMIN-2**: Provide a `/jade-admin setup` command that:
1. Validates the team configuration
2. Generates MCP server configurations from the managed list
3. Configures 1Password CLI integration
4. Syncs upstream plugin repos to pinned versions
5. Generates per-user CLAUDE.md files with team context

### 6.2 Distribution via Enterprise Private Marketplace

As of Feb 2026, Anthropic supports enterprise private marketplaces — admins can point Claude Code at private GitHub repos as plugin sources.

**REQ-ADMIN-3**: This repo (`knowledge-teams-plugins`) should be distributable as a private marketplace:
- IT admin registers `jadecli/knowledge-teams-plugins` as a private plugin source in their Claude Team/Enterprise settings
- Users install jade plugins via `claude plugin marketplace add jadecli/knowledge-teams-plugins`
- Individual plugins installable via `claude plugin install jade-cofounder@knowledge-teams-plugins`
- Version pinning at the marketplace level (admin controls which commit/tag users see)

**REQ-ADMIN-4**: Support the `partner-built/` directory pattern (from financial-services-plugins) for third-party VP plugin contributions:
```
plugins/
├── jade-cofounder/         # Core (Jade-maintained)
├── jade-vp-engineering/    # Core
├── partner-built/          # Third-party contributions
│   ├── acme-vp-compliance/ # Custom VP from partner
│   └── acme-vp-devops/     # Custom VP from partner
```

### 6.3 MCP Connector Management

**REQ-MCP-1**: Jade manages MCP server configurations centrally, not per-user:

```
jade-team/
├── mcp/
│   ├── servers.json          # Central MCP server registry
│   ├── github.json           # GitHub MCP config (repos, permissions)
│   ├── google-workspace.json # GWS MCP config (drive, docs, sheets)
│   ├── slack.json            # Slack MCP config (channels, permissions)
│   └── cloudflare.json       # Cloudflare MCP config (DNS, analytics)
```

**REQ-MCP-2**: MCP server configs must reference 1Password secret references, never raw tokens:

```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "op://jade-team-vault/github-mcp/token"
    }
  }
}
```

**REQ-MCP-3**: IT admin defines which MCP servers each role can access:

| MCP Server | admin | developer | viewer |
|------------|-------|-----------|--------|
| GitHub (read) | yes | yes | yes |
| GitHub (write) | yes | yes | no |
| Google Workspace | yes | yes | yes |
| Slack (read) | yes | yes | yes |
| Slack (post) | yes | no | no |
| Cloudflare (DNS) | yes | no | no |
| Cloudflare (analytics) | yes | yes | yes |

---

## 7. Secrets Management (1Password)

### 7.1 Design Principles

- **No `.env` files** — All secrets resolved at runtime from 1Password
- **Read/write separation** — Separate vaults or items for read-only vs write-capable tokens
- **Team-based roles** — 1Password groups map to Jade RBAC roles
- **Audit trail** — All secret access logged via 1Password audit events

### 7.2 Requirements

**REQ-SEC-1**: Replace env-var-based auth with 1Password secret references:

```typescript
// Before (current)
const apiKey = process.env["ANTHROPIC_API_KEY"];

// After (1Password-resolved)
const apiKey = await resolveSecret("op://jade-team-vault/anthropic/api-key");
```

**REQ-SEC-2**: Auth resolution (`src/jade/auth/resolve.ts`) must support a fourth mode:

| Mode | Source | Priority |
|------|--------|----------|
| `1password` | 1Password CLI (`op read`) | Highest (when configured) |
| `enterprise` | `JADE_ENTERPRISE_API_KEY` env var | High |
| `api-key` | `ANTHROPIC_API_KEY` env var | Medium |
| `pro-max` | Claude Code session | Default fallback |

**REQ-SEC-3**: 1Password vault structure:

```
jade-team-vault/
├── anthropic/
│   ├── api-key          (read: all, write: admin)
│   └── enterprise-key   (read: admin, write: admin)
├── github-mcp/
│   ├── token-read       (read: all)
│   └── token-write      (read: admin+developer)
├── google-workspace/
│   └── service-account  (read: all)
├── slack/
│   ├── bot-token        (read: all)
│   └── user-token       (read: admin)
└── cloudflare/
    ├── api-token-read   (read: admin+developer)
    └── api-token-write  (read: admin)
```

**REQ-SEC-4**: Provide a `/jade-secrets check` command that validates:
- 1Password CLI is installed and authenticated
- Required vault items exist
- Current user's role grants access to needed secrets
- No stale `.env` files exist in the workspace

---

## 8. Plugin Ecosystem Integration

### 8.1 Compose Layer Enhancements

The current compose layer (`compose/loader.ts`, `compose/resolver.ts`) handles upstream KWP + jade extensions. It needs to expand to support:

**REQ-PLUGIN-1**: Multiple upstream sources (not just knowledge-work-plugins):

```typescript
// compose/loader.ts enhancements
interface UpstreamSource {
  name: string;
  repo: string;
  localPath: string;
  enabled: boolean;
  pluginFilter?: string[];  // Allowlist of plugin names to include
}
```

**REQ-PLUGIN-2**: Plugin compatibility matrix — track which plugins work with which Claude Code version:

```json
{
  "jade-vp-engineering": {
    "minClaudeCodeVersion": "2.1.0",
    "requiredMcpServers": ["github"],
    "requiredSecrets": ["op://jade-team-vault/github-mcp/token-read"],
    "upstreamDependencies": ["knowledge-work-plugins/coding"]
  }
}
```

**REQ-PLUGIN-3**: Knowledge worker (KW) skill extension must follow Anthropic's plugin format:
- `plugin.json` with `name`, `description`, `author`, `version`
- Skills in `skills/*.md` with activation conditions
- Commands in `commands/*.md` with YAML frontmatter
- Agents in `agents/*.md` (optional, XML-structured)
- Hooks in `hooks/hooks.json` + shell scripts

### 8.2 Upstream Sync Process

**REQ-SYNC-1**: Automated upstream sync workflow:

1. `jade sync check` — Compare pinned refs against upstream HEAD
2. `jade sync pull <source>` — Fetch and update pinned commit
3. `jade sync resolve` — Run compose resolver, flag conflicts
4. `jade sync test` — Run full test suite against new upstream
5. `jade sync commit` — Commit updated refs and resolved plugins

**REQ-SYNC-2**: Breaking change detection:
- Diff upstream plugin.json schemas between pinned and latest
- Flag removed skills/commands that jade extensions depend on
- Flag changed tool input schemas that MCP wrappers depend on

---

## 9. Development Workflow (AI-Assigned)

### 9.1 IT Admin as Developer

IT admins use Jade for AI-assigned development work:

**REQ-DEV-1**: `/jade-assign` command supports targeting any repo the team has access to:

```
/jade-assign --repo acme/internal-api --seat CTO "Add rate limiting to the /users endpoint"
```

**REQ-DEV-2**: Development tasks follow the jade-loop pattern:
1. Setup: Create task context (`.claude/jade-loop.local.md`)
2. Execute: Claude Code runs with Jade identity + VP seat context
3. Budget: ROTS tracking, token budget, iteration cap
4. Review: S-Team review (optional multi-VP review for complex changes)

**REQ-DEV-3**: All development within this repo itself uses Jade VP Engineering (CTO seat) for:
- Code review of compose layer changes
- SDK codegen for new auth modes
- Architecture review for ecosystem integration changes

---

## 10. SDK & Package Requirements

### 10.1 TypeScript SDK (`src/jade/`)

**REQ-SDK-1**: The jade SDK must export cleanly for consumption:

```typescript
// Public API surface
export { resolveAuth, createAnthropicClient } from "./auth/resolve.js";
export { spawnAgent } from "./agent-sdk/spawn.js";
export { detectKW, getAllSeats } from "./kw/index.js";
export { applyCofounderIdentityPatch, removeCofounderIdentityPatch } from "./patches/cofounderIdentity.js";

// New exports needed
export { resolveSecret } from "./secrets/onepassword.js";
export { syncUpstream, checkUpstreamStatus } from "./ecosystem/sync.js";
export { generateMcpConfig } from "./mcp/generate.js";
export { validateTeamConfig } from "./admin/validate.js";
```

**REQ-SDK-2**: All SDK modules must:
- Use strict TypeScript (no `any`)
- Export Zod schemas for all configuration types
- Include JSDoc for public APIs
- Be testable with vitest

### 10.2 Cross-Language SDK Awareness

**REQ-SDK-3**: While this repo is TypeScript-first, Jade must be aware of all Anthropic SDK languages for ecosystem tracking:

| Language | Package | Usage |
|----------|---------|-------|
| TypeScript | `@anthropic-ai/sdk` | Primary SDK, agent spawning |
| Python | `anthropic` | MCP servers, data tools |
| Go | `anthropic-go` | Infrastructure tools |
| Java | `anthropic-java` | Enterprise integrations |

Track version compatibility in `ecosystem-versions.json`.

---

## 11. Repo Restructure Proposal

### 11.1 Current Structure (Flat)

```
knowledge-teams-plugins/
├── compose/
├── extensions/
├── plugins/
├── s-team/
├── src/jade/
├── webmcp/
└── docs/
```

### 11.2 Proposed Structure (Ecosystem-Aware)

```
knowledge-teams-plugins/
├── compose/                    # Plugin merge layer (enhanced)
│   ├── loader.ts
│   ├── resolver.ts
│   ├── manifest.ts
│   └── sync.ts                 # NEW: Multi-upstream sync engine
│
├── extensions/                 # Jade overlay skills/commands
│   ├── engineering/
│   ├── enterprise-lifecycle/
│   ├── jade-orchestrator/
│   └── product-management/
│
├── plugins/                    # 13 VP agent plugins
│   ├── jade-cofounder/
│   ├── jade-loop/
│   └── jade-vp-*/
│
├── s-team/                     # STO system prompts
│
├── src/jade/
│   ├── auth/
│   │   └── resolve.ts          # Enhanced: 1Password mode
│   ├── secrets/                # NEW: 1Password integration
│   │   ├── onepassword.ts
│   │   ├── vault-schema.ts
│   │   └── rbac.ts
│   ├── mcp/                    # NEW: Managed MCP generation
│   │   ├── generate.ts
│   │   ├── connectors/
│   │   │   ├── github.ts
│   │   │   ├── google-workspace.ts
│   │   │   ├── slack.ts
│   │   │   └── cloudflare.ts
│   │   └── templates/
│   ├── ecosystem/              # NEW: Upstream tracking & sync
│   │   ├── sync.ts
│   │   ├── versions.ts
│   │   └── changelog.ts
│   ├── admin/                  # NEW: IT admin provisioning
│   │   ├── validate.ts
│   │   ├── setup.ts
│   │   └── team-config.ts
│   ├── agent-sdk/
│   ├── kw/
│   └── patches/
│
├── webmcp/                     # WebMCP tool stubs
│
├── config/                     # NEW: Team configuration templates
│   ├── jade-team.example.json
│   ├── jade-identity.example.json
│   └── mcp-servers.example.json
│
├── docs/
│   ├── architecture/
│   ├── product/                # NEW: PRDs and requirements
│   │   └── ECOSYSTEM-REQUIREMENTS.md
│   └── admin/                  # NEW: IT admin guides
│       ├── setup-guide.md
│       ├── 1password-setup.md
│       └── mcp-connectors.md
│
├── upstream-refs.json          # Replaces upstream-ref.json
├── ecosystem-versions.json     # NEW: Package version tracking
└── jade-team.json              # NEW: Team config (gitignored)
```

---

## 12. Implementation Priorities

### Phase 1: Foundation Alignment (Current Block 2)

1. **Restructure upstream-ref.json → upstream-refs.json** (multi-source)
2. **Add ecosystem-versions.json** tracking all Anthropic packages
3. **Enhance compose loader** for multiple upstream sources
4. **Add `/jade-ecosystem-status` command**

### Phase 2: Secrets & Auth

5. **Implement 1Password secret resolution** (`src/jade/secrets/onepassword.ts`)
6. **Add `1password` auth mode** to `resolve.ts`
7. **Define RBAC schema** for read/write role separation
8. **Add `/jade-secrets check` command**

### Phase 3: MCP Connector Management

9. **Build MCP config generator** (`src/jade/mcp/generate.ts`)
10. **Create connector templates** (GitHub, GWS, Slack, Cloudflare)
11. **Wire MCP configs to 1Password secret references**
12. **Add `/jade-admin setup` command**

### Phase 4: Ecosystem Sync

13. **Build upstream sync engine** (`compose/sync.ts`)
14. **Breaking change detection** for upstream diffs
15. **Automated sync workflow** (check → pull → resolve → test → commit)
16. **CI integration** for upstream freshness alerts

### Phase 5: Identity Refinement

17. **Make identity configurable per-org** (`jade-identity.json`)
18. **Multi-surface identity application** (CLI, API, Agent SDK)
19. **Plugin compatibility matrix**
20. **Admin provisioning for per-team plugin allowlists**

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| Time to onboard a new team member | < 5 minutes (no .env setup) |
| Upstream sync lag | < 7 days behind anthropics/ repos |
| Secret exposure incidents | Zero (no plaintext keys in repos or env) |
| Plugin compatibility coverage | 100% of upstream KWP skills usable via compose |
| MCP connector setup time | < 10 minutes per connector (admin) |
| Knowledge worker task success rate | > 90% (tasks complete within budget) |

---

## 14. Open Questions

1. **Claude Teams API**: Does Anthropic expose a Teams/Enterprise admin API for programmatic team management, or is this console-only? (Enterprise admin controls exist for plugin restrictions and spend limits, but programmatic API unclear.)
2. **Plugin registry**: Will `claude-plugins-official` become a package registry (like npm), or remain a repo of plugin definitions? (Currently 9.7k stars, 87 commits, functions as a curated directory with "Anthropic Verified" badges.)
3. **MCP auth delegation**: Can MCP servers use OAuth delegation from Claude Teams, or do they always need explicit tokens? (MCP spec 2025-11-25 added server identity verification, but OAuth flow unclear.)
4. **tweakcc stability**: Is `tweakcc` API stable across Claude Code major versions, or should we abstract the patching layer? (Claude Code deprecated npm install; need to verify tweakcc compatibility with native installers.)
5. **Financial services plugins**: Confirmed — identical plugin format to knowledge-work-plugins (`.claude-plugin/plugin.json`, `.mcp.json`, `commands/`, `skills/`). Ships 41 skills, 38 commands, 11 MCP data connectors. Partner-built directory model worth adopting.
6. **Claude Agent SDK alignment**: Should `src/jade/agent-sdk/spawn.ts` be rebuilt on top of `@anthropic-ai/claude-agent-sdk` instead of direct Anthropic SDK calls? The official agent SDK is the canonical way to build agents on Claude Code.
7. **Claude Cowork compatibility**: Claude Cowork (launched Jan 2026) extends Claude Code to non-developers. Should jade plugins target Cowork compatibility for business-user personas?
8. **MCP security posture**: Documented risks include prompt injection, tool permission escalation, lookalike tool substitution, and data exfiltration via tool combination (April 2025 research). How should `jade-vp-security` audit MCP connections?
9. **Microsoft Copilot Cowork**: As of March 2026, Claude is available inside M365 via Copilot Cowork ($30/user/month). Is this a target distribution surface for jade-cofounder capabilities?

---

## Appendix A: Anthropic Ecosystem Package Map

```
anthropics/ GitHub org
├── claude-code                     # CLI agent — 76.4k stars, 552 commits
│                                   # Install: curl/brew/winget (npm deprecated)
├── knowledge-work-plugins          # 11 KW plugins — 8.9k stars, Apache-2.0
│                                   # Plugins: sales, legal, finance, data, marketing,
│                                   # product-mgmt, support, productivity, search,
│                                   # bio-research, plugin-management
├── financial-services-plugins      # 5 finance plugins — 5.7k stars, Apache-2.0
│                                   # 41 skills, 38 commands, 11 MCP data connectors
│                                   # Partner-built: LSEG, S&P Global
├── claude-plugins-official         # Curated marketplace — 9.7k stars
│                                   # "Anthropic Verified" badge program
│                                   # External plugin submission form
├── anthropic-sdk-python            # Python SDK — 2.9k stars, 166 semver releases
│                                   # PyPI: anthropic v0.84.0, 45.9k dependents
├── anthropic-sdk-typescript        # TypeScript SDK — npm: @anthropic-ai/sdk
├── anthropic-sdk-go                # Go SDK
├── anthropic-sdk-java              # Java SDK
├── courses                         # Educational notebooks
└── model-spec                      # Model behavior specification
```

## Appendix B: MCP Server Ecosystem

Standard MCP servers available for connector management:

| Server | Package | Purpose |
|--------|---------|---------|
| GitHub | `@modelcontextprotocol/server-github` | Repo access, PRs, issues |
| Google Drive | `@modelcontextprotocol/server-gdrive` | Doc/sheet access |
| Slack | `@modelcontextprotocol/server-slack` | Channel read/post |
| Filesystem | `@modelcontextprotocol/server-filesystem` | Local file access |
| PostgreSQL | `@modelcontextprotocol/server-postgres` | Database queries |
| 1Password | `1password/1password-mcp` | Secret retrieval |
| Cloudflare | Community MCP | DNS, Workers, Analytics |

## Appendix C: 1Password Integration Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  jade auth   │────▶│  1Password CLI   │────▶│  1Password      │
│  resolve.ts  │     │  (op read)       │     │  Team Vault     │
└──────────────┘     └──────────────────┘     └─────────────────┘
                                                      │
                     ┌────────────────────────────────┼───────┐
                     │                                │       │
              ┌──────▼──────┐  ┌──────────────┐  ┌───▼────┐
              │ read-team   │  │ write-team   │  │ admin  │
              │ vault items │  │ vault items  │  │ vault  │
              │             │  │              │  │ items  │
              │ - API keys  │  │ - GH write   │  │ - All  │
              │ - GH read   │  │ - Slack post │  │        │
              │ - GWS read  │  │ - CF DNS     │  │        │
              └─────────────┘  └──────────────┘  └────────┘
```
