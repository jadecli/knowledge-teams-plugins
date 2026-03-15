# knowledge-teams-plugins Entity Relationship Diagram

> Generated: 2026-03-11T00:00:00Z
> Source: `claude/research-claude-sdk-agents-oVAul`
> Schema version: 1
> Entities: 56 | Relationships: 56

## Layers

| Layer | Entities | Inbound Rels | Outbound Rels |
|-------|----------|--------------|---------------|
| data | 6 | 9 | 1 |
| type | 19 | 2 | 3 |
| runtime | 13 | 3 | 13 |
| agent-sdk | 7 | 3 | 0 |
| infra | 7 | 0 | 10 |
| external | 4 | 10 | 0 |

## Data Layer

### dim_tools

- **ID**: `db.dim_tools`
- **Source**: `db/schema.ts`
- **Description**: Dimension table: tool identity and MCP classification
- **Attributes**: 5 | **Functions**: 0

### dim_agents

- **ID**: `db.dim_agents`
- **Source**: `db/schema.ts`
- **Description**: Dimension table: agent identity (name, SDK version, model)
- **Attributes**: 4 | **Functions**: 0

### dim_sessions

- **ID**: `db.dim_sessions`
- **Source**: `db/schema.ts`
- **Description**: Dimension table: session context linking to branch, PR, and repo
- **Attributes**: 6 | **Functions**: 0

### fact_tool_calls

- **ID**: `db.fact_tool_calls`
- **Source**: `db/schema.ts`
- **Description**: Fact table: individual agent tool call invocations with measures (duration, tokens, success)
- **Attributes**: 15 | **Functions**: 0

### fact_org_usage

- **ID**: `db.fact_org_usage`
- **Source**: `db/schema.ts`
- **Description**: Fact table: Claude Organizations API team usage metrics per model per period
- **Attributes**: 10 | **Functions**: 0

### meta_doc_cache

- **ID**: `db.meta_doc_cache`
- **Source**: `db/schema.ts`
- **Description**: Metadata table: cached llms.txt documents with SHA-256 content hashes
- **Attributes**: 6 | **Functions**: 0

## Type Layer

### McpServerEntry

- **ID**: `type.McpServerEntry`
- **Source**: `src/mcp-registry.ts`
- **Description**: Canonical MCP server definition with origin, transport, category, and domain classification
- **Attributes**: 13 | **Functions**: 0

### CanonicalPackage

- **ID**: `type.CanonicalPackage`
- **Source**: `src/mcp-registry.ts`
- **Description**: Pinned SDK/library package with registry and language metadata
- **Attributes**: 5 | **Functions**: 0

### LanguageAnalyzer

- **ID**: `type.LanguageAnalyzer`
- **Source**: `src/language-analyzers.ts`
- **Description**: Language-specific package/MCP mapping for knowledge workers using Claude Agent SDK
- **Attributes**: 9 | **Functions**: 0

### WebMCPToolDefinition

- **ID**: `type.WebMCPToolDefinition`
- **Source**: `webmcp/shared/register.ts`
- **Description**: WebMCP tool contract: name, description, Zod input schema, async handler
- **Attributes**: 4 | **Functions**: 0

### ToolCallEvent

- **ID**: `type.ToolCallEvent`
- **Source**: `db/logger.ts`
- **Description**: Event payload for logging a tool invocation to Neon
- **Attributes**: 11 | **Functions**: 0

### TelemetryEvent

- **ID**: `type.TelemetryEvent`
- **Source**: `webmcp/shared/telemetry.ts`
- **Description**: In-memory telemetry event with optional Neon persistence
- **Attributes**: 5 | **Functions**: 0

### TelemetryOptions

- **ID**: `type.TelemetryOptions`
- **Source**: `webmcp/shared/telemetry.ts`
- **Description**: Configuration for telemetry persistence (Neon + session context)
- **Attributes**: 4 | **Functions**: 0

### CachedDoc

- **ID**: `type.CachedDoc`
- **Source**: `lib/llms-cache.ts`
- **Description**: Cached llms.txt document with content hash for change detection
- **Attributes**: 5 | **Functions**: 0

### CrawlResult

- **ID**: `type.CrawlResult`
- **Source**: `lib/llms-crawler.ts`
- **Description**: Result of crawling a single URL with hash comparison and child link extraction
- **Attributes**: 5 | **Functions**: 0

### SyncReport

- **ID**: `type.SyncReport`
- **Source**: `lib/llms-sync.ts`
- **Description**: Sync orchestration result summarizing updated, unchanged, and errored URLs
- **Attributes**: 3 | **Functions**: 0

### OrgUsageResponse

- **ID**: `type.OrgUsageResponse`
- **Source**: `db/org-usage.ts`
- **Description**: Claude Organizations API response with usage buckets per model
- **Attributes**: 4 | **Functions**: 0

### OrgUsageBucket

- **ID**: `type.OrgUsageBucket`
- **Source**: `db/org-usage.ts`
- **Description**: Single model usage bucket with token counts and cache metrics
- **Attributes**: 5 | **Functions**: 0

### UpstreamRef

- **ID**: `type.UpstreamRef`
- **Source**: `compose/loader.ts`
- **Description**: Pinned upstream repository reference (repo, commit hash, sync timestamp)
- **Attributes**: 3 | **Functions**: 0

### LoadedPlugin

- **ID**: `type.LoadedPlugin`
- **Source**: `compose/loader.ts`
- **Description**: A loaded plugin from either upstream or jade extensions with manifest, skills, and commands
- **Attributes**: 6 | **Functions**: 0

### PluginManifest

- **ID**: `type.PluginManifest`
- **Source**: `compose/loader.ts`
- **Description**: Plugin metadata from plugin.json (name, version, description, skills, commands)
- **Attributes**: 5 | **Functions**: 0

### SecurityTestFrontmatter

- **ID**: `type.SecurityTestFrontmatter`
- **Source**: `lib/security-tdd.ts`
- **Description**: Frontmatter per security test: OWASP category, CWE, Bayesian impact, attack vector
- **Attributes**: 13 | **Functions**: 0

### SecurityCoverageEntry

- **ID**: `type.SecurityCoverageEntry`
- **Source**: `lib/security-tdd.ts`
- **Description**: Per-OWASP-category coverage metrics with Bayesian confidence level
- **Attributes**: 6 | **Functions**: 0

### OwaspCategory

- **ID**: `type.OwaspCategory`
- **Source**: `lib/security-tdd.ts`
- **Description**: Enum: OWASP Top 10 2021 categories (A01-A10)
- **Attributes**: 4 | **Functions**: 0

### AttackVector

- **ID**: `type.AttackVector`
- **Source**: `lib/security-tdd.ts`
- **Description**: Enum: attack vector classification including prompt-injection and supply-chain
- **Attributes**: 4 | **Functions**: 0

## Runtime Layer

### Database Client

- **ID**: `runtime.db_client`
- **Source**: `db/client.ts`
- **Description**: Singleton Neon serverless Drizzle ORM client with lazy initialization
- **Attributes**: 1 | **Functions**: 2

### Tool Call Logger

- **ID**: `runtime.db_logger`
- **Source**: `db/logger.ts`
- **Description**: Persists agent tool call events to Neon via dimension upserts + fact inserts
- **Attributes**: 0 | **Functions**: 3

### Org Usage Fetcher

- **ID**: `runtime.org_usage`
- **Source**: `db/org-usage.ts`
- **Description**: Fetches Claude Organizations API usage and persists to fact_org_usage
- **Attributes**: 0 | **Functions**: 3

### Two-Tier Doc Cache

- **ID**: `runtime.llms_cache`
- **Source**: `lib/llms-cache.ts`
- **Description**: LRU (in-memory, 100 entries) + Neon (persistent) cache for llms.txt docs
- **Attributes**: 1 | **Functions**: 5

### llms.txt Crawler

- **ID**: `runtime.llms_crawler`
- **Source**: `lib/llms-crawler.ts`
- **Description**: Multi-sig governed crawler with SSRF defense, base64/SQL injection protection
- **Attributes**: 3 | **Functions**: 7

### llms.txt Sync Orchestrator

- **ID**: `runtime.llms_sync`
- **Source**: `lib/llms-sync.ts`
- **Description**: Orchestrates crawl + cache update across all entry URLs
- **Attributes**: 0 | **Functions**: 1

### MCP Registry

- **ID**: `runtime.mcp_registry`
- **Source**: `src/mcp-registry.ts`
- **Description**: Dynamic MCP registry with 47 servers, canonical enums, package pinning, and cross-domain bridge mappings
- **Attributes**: 4 | **Functions**: 7

### Language Analyzer Registry

- **ID**: `runtime.language_analyzers`
- **Source**: `src/language-analyzers.ts`
- **Description**: 14-language analyzer registry mapping file extensions to SDK support, packages, and MCP recommendations
- **Attributes**: 1 | **Functions**: 4

### WebMCP Tool Registry

- **ID**: `runtime.webmcp_registry`
- **Source**: `webmcp/shared/register.ts`
- **Description**: Module-level Map<string, WebMCPToolDefinition> with register/get/list operations
- **Attributes**: 1 | **Functions**: 4

### Telemetry Recorder

- **ID**: `runtime.telemetry`
- **Source**: `webmcp/shared/telemetry.ts`
- **Description**: In-memory telemetry with optional Neon persistence bridge
- **Attributes**: 1 | **Functions**: 3

### Plugin Compose Loader

- **ID**: `runtime.compose_loader`
- **Source**: `compose/loader.ts`
- **Description**: Loads and merges upstream KWP + jade extension plugins at build time
- **Attributes**: 0 | **Functions**: 3

### Skeptical Codegen Team

- **ID**: `runtime.skeptical_team`
- **Source**: `src/teams/skeptical-codegen-team.ts`
- **Description**: Multi-agent code review team using @anthropic-ai/claude-agent-sdk with 3 specialist sub-agents
- **Attributes**: 2 | **Functions**: 1

### Security TDD Framework

- **ID**: `runtime.security_tdd`
- **Source**: `lib/security-tdd.ts`
- **Description**: Parses security frontmatter, computes OWASP coverage matrix, Bayesian confidence scoring
- **Attributes**: 3 | **Functions**: 0

## Agent-sdk Layer

### query()

- **ID**: `agent_sdk.query`
- **Source**: `@anthropic-ai/claude-agent-sdk`
- **Description**: Primary Agent SDK entry point: creates a streaming async iterator of agent messages
- **Attributes**: 9 | **Functions**: 0

### AgentDefinition

- **ID**: `agent_sdk.AgentDefinition`
- **Source**: `@anthropic-ai/claude-agent-sdk`
- **Description**: Sub-agent definition spawnable by lead agent via the Agent tool
- **Attributes**: 5 | **Functions**: 0

### Agent Message Types

- **ID**: `agent_sdk.message_types`
- **Source**: `@anthropic-ai/claude-agent-sdk`
- **Description**: Streaming message types emitted by query() async iterator (SDKMessage union)
- **Attributes**: 7 | **Functions**: 0

### Session

- **ID**: `agent_sdk.Session`
- **Source**: `@anthropic-ai/claude-agent-sdk`
- **Description**: Persisted conversation state as .jsonl at ~/.claude/projects/<encoded-cwd>/<session-id>.jsonl
- **Attributes**: 8 | **Functions**: 2

### Session Options

- **ID**: `agent_sdk.SessionOptions`
- **Source**: `@anthropic-ai/claude-agent-sdk`
- **Description**: Session persistence and resume configuration passed via Options
- **Attributes**: 5 | **Functions**: 0

### Hook System

- **ID**: `agent_sdk.HookSystem`
- **Source**: `@anthropic-ai/claude-agent-sdk`
- **Description**: 17 lifecycle hook events with matcher-based callback registration and sync/async responses
- **Attributes**: 11 | **Functions**: 0

### Permission System

- **ID**: `agent_sdk.PermissionSystem`
- **Source**: `@anthropic-ai/claude-agent-sdk`
- **Description**: Permission modes and custom canUseTool callback for tool access control
- **Attributes**: 4 | **Functions**: 0

## Infra Layer

### CI Workflow

- **ID**: `infra.ci`
- **Source**: `.github/workflows/ci.yml`
- **Description**: Build + test + Neon branch-per-PR on push/PR to main
- **Attributes**: 2 | **Functions**: 0

### Neon Branch Cleanup

- **ID**: `infra.neon_cleanup`
- **Source**: `.github/workflows/neon-cleanup.yml`
- **Description**: Delete ephemeral Neon database branch on PR close
- **Attributes**: 1 | **Functions**: 0

### Architecture Guardrails

- **ID**: `infra.architecture_guardrails`
- **Source**: `.github/workflows/architecture-guardrails.yml`
- **Description**: Claude-powered architecture review with PASS/REVISIT/BLOCK verdicts
- **Attributes**: 2 | **Functions**: 0

### Staff Review

- **ID**: `infra.staff_review`
- **Source**: `.github/workflows/staff-review.yml`
- **Description**: SDK-aware code quality review (return types, coverage, naming, drift)
- **Attributes**: 1 | **Functions**: 0

### CI Auto-Fix

- **ID**: `infra.ci_autofix`
- **Source**: `.github/workflows/ci-autofix.yml`
- **Description**: Automatically diagnose and fix CI failures on non-main branches
- **Attributes**: 1 | **Functions**: 0

### Issue Triage

- **ID**: `infra.issue_triage`
- **Source**: `.github/workflows/issue-triage.yml`
- **Description**: Auto-categorize and label new issues (bug, feature, question, upstream, infra)
- **Attributes**: 1 | **Functions**: 0

### Weekly Audit

- **ID**: `infra.weekly_audit`
- **Source**: `.github/workflows/weekly-audit.yml`
- **Description**: Monday 9am UTC stale code/drift audit + llms.txt cache refresh
- **Attributes**: 1 | **Functions**: 0

## External Layer

### Neon Postgres

- **ID**: `external.neon_postgres`
- **Source**: `db/client.ts`
- **Description**: Neon serverless Postgres with branch-per-PR ephemeral databases
- **Attributes**: 3 | **Functions**: 0

### Claude Organizations API

- **ID**: `external.claude_organizations_api`
- **Source**: `db/org-usage.ts`
- **Description**: Anthropic Organizations API for team usage metrics (v1/organizations/{id}/usage)
- **Attributes**: 3 | **Functions**: 0

### Anthropic Documentation

- **ID**: `external.anthropic_docs`
- **Source**: `lib/llms-crawler.ts`
- **Description**: docs.anthropic.com and claude.ai — allowlisted for llms.txt crawling
- **Attributes**: 1 | **Functions**: 0

### Claude Code GitHub Action

- **ID**: `external.claude_code_action`
- **Source**: `.github/workflows/architecture-guardrails.yml`
- **Description**: anthropics/claude-code-action@v1 — CI/CD agent with OAuth token auth
- **Attributes**: 1 | **Functions**: 0

## Relationships

| From | To | Kind | Cardinality | Label |
|------|----|------|-------------|-------|
| `db.fact_tool_calls` | `db.dim_sessions` | references | N:1 | fact_tool_calls.session_id → dim_sessions.id |
| `db.fact_tool_calls` | `db.dim_tools` | references | N:1 | fact_tool_calls.tool_id → dim_tools.id |
| `db.fact_tool_calls` | `db.dim_agents` | references | N:1 | fact_tool_calls.agent_id → dim_agents.id |
| `runtime.db_logger` | `db.fact_tool_calls` | produces | 1:N | logToolCall() inserts into fact_tool_calls |
| `runtime.db_logger` | `db.dim_tools` | produces | 1:N | ensureDimTool() upserts dim_tools |
| `runtime.db_logger` | `db.dim_sessions` | produces | 1:N | ensureDimSession() upserts dim_sessions |
| `runtime.org_usage` | `db.fact_org_usage` | produces | 1:N | persistOrgUsage() inserts into fact_org_usage |
| `runtime.llms_cache` | `db.meta_doc_cache` | produces | 1:N | putDoc() upserts meta_doc_cache |
| `runtime.db_logger` | `runtime.db_client` | uses | N:1 | Logger calls getDb() for Drizzle instance |
| `runtime.org_usage` | `runtime.db_client` | uses | N:1 | Org usage calls getDb() for Drizzle instance |
| `runtime.llms_cache` | `runtime.db_client` | uses | N:1 | Cache reads/writes via getDb() |
| `runtime.llms_sync` | `runtime.llms_crawler` | uses | 1:1 | Sync orchestrator invokes crawler |
| `runtime.llms_sync` | `runtime.llms_cache` | uses | 1:1 | Sync orchestrator updates cache |
| `runtime.telemetry` | `runtime.db_logger` | uses | N:1 | recordInvocation() optionally calls logToolCall() |
| `runtime.language_analyzers` | `runtime.mcp_registry` | uses | N:1 | Imports SupportedLanguage, CanonicalPackage, MCP_SDKS_BY_LANGUAGE, getMcpsByDomain |
| `runtime.skeptical_team` | `agent_sdk.query` | uses | 1:1 | runSkepticalCodegenTeam() calls query() with agents config |
| `runtime.skeptical_team` | `agent_sdk.AgentDefinition` | composes | 1:N | Defines 3 sub-agents: type-auditor, dead-code-hunter, simplicity-enforcer |
| `agent_sdk.query` | `agent_sdk.AgentDefinition` | aggregates | 1:N | query() options.agents receives AgentDefinition records |
| `agent_sdk.query` | `agent_sdk.message_types` | produces | 1:N | query() async iterator yields message types |
| `type.McpServerEntry` | `type.CanonicalPackage` | aggregates | 1:N | McpServerEntry.canonicalSdkPackages → CanonicalPackage[] |
| `type.LanguageAnalyzer` | `type.CanonicalPackage` | aggregates | 1:N | LanguageAnalyzer.knowledgeWorkerPackages → CanonicalPackage[] |
| `type.LanguageAnalyzer` | `type.McpServerEntry` | references | N:N | LanguageAnalyzer.recommendedMcps references McpServerEntry.id |
| `type.ToolCallEvent` | `db.fact_tool_calls` | produces | 1:1 | ToolCallEvent maps to one fact_tool_calls row |
| `type.TelemetryEvent` | `type.ToolCallEvent` | produces | 1:1 | TelemetryEvent is converted to ToolCallEvent for Neon persistence |
| `type.CrawlResult` | `type.CachedDoc` | produces | 1:1 | CrawlResult is transformed into CachedDoc for storage |
| `type.CachedDoc` | `db.meta_doc_cache` | produces | 1:1 | CachedDoc maps to one meta_doc_cache row |
| `type.OrgUsageResponse` | `type.OrgUsageBucket` | composes | 1:N | OrgUsageResponse.usage contains OrgUsageBucket[] |
| `type.OrgUsageBucket` | `db.fact_org_usage` | produces | 1:1 | Each OrgUsageBucket maps to one fact_org_usage row |
| `type.LoadedPlugin` | `type.PluginManifest` | composes | 0..1 | LoadedPlugin.manifest contains optional PluginManifest |
| `runtime.db_client` | `external.neon_postgres` | uses | N:1 | Drizzle ORM connects via DATABASE_URL |
| `runtime.org_usage` | `external.claude_organizations_api` | consumes | N:1 | fetchOrgUsage() calls Anthropic Organizations API |
| `runtime.llms_crawler` | `external.anthropic_docs` | consumes | N:1 | Crawler fetches from docs.anthropic.com allowlist |
| `infra.ci` | `external.neon_postgres` | uses | 1:1 | CI creates ephemeral Neon branch pr-{number} |
| `infra.neon_cleanup` | `external.neon_postgres` | uses | 1:1 | Cleanup deletes ephemeral Neon branch on PR close |
| `infra.architecture_guardrails` | `external.claude_code_action` | uses | 1:1 | Guardrails uses claude-code-action@v1 for review |
| `infra.staff_review` | `external.claude_code_action` | uses | 1:1 | Staff review uses claude-code-action@v1 |
| `infra.ci_autofix` | `external.claude_code_action` | uses | 1:1 | Auto-fix uses claude-code-action@v1 to diagnose + fix |
| `infra.issue_triage` | `external.claude_code_action` | uses | 1:1 | Issue triage uses claude-code-action@v1 |
| `infra.weekly_audit` | `external.claude_code_action` | uses | 1:1 | Weekly audit uses claude-code-action@v1 |
| `infra.weekly_audit` | `runtime.llms_sync` | uses | 1:1 | Weekly audit runs npm run llms:sync |
| `infra.architecture_guardrails` | `runtime.mcp_registry` | consumes | 1:1 | Guardrails reads mcp-registry.ts for canonical types and versions |
| `infra.staff_review` | `runtime.mcp_registry` | consumes | 1:1 | Staff review checks package drift against ANTHROPIC_PACKAGES/MCP_PACKAGES |
| `runtime.webmcp_registry` | `db.dim_tools` | references | 1:N | WebMCP tools classified in dim_tools with is_webmcp=true |
| `agent_sdk.query` | `agent_sdk.Session` | produces | 1:1 | query() creates or resumes a Session (persisted .jsonl) |
| `agent_sdk.SessionOptions` | `agent_sdk.Session` | references | N:1 | SessionOptions.resume/continue/forkSession target a Session |
| `agent_sdk.Session` | `agent_sdk.message_types` | composes | 1:N | Session .jsonl persists ordered SDKMessage history |
| `agent_sdk.query` | `agent_sdk.HookSystem` | uses | 1:1 | query() options.hooks registers HookCallbackMatcher[] per event |
| `agent_sdk.query` | `agent_sdk.PermissionSystem` | uses | 1:1 | query() options.permissionMode + canUseTool configure access control |
| `agent_sdk.HookSystem` | `agent_sdk.Session` | references | N:1 | Hook inputs include session_id, transcript_path from BaseHookInput |
| `db.dim_sessions` | `agent_sdk.Session` | references | N:1 | dim_sessions.session_id maps to Agent SDK Session UUID |
| `runtime.security_tdd` | `type.SecurityTestFrontmatter` | produces | 1:N | parseSecurityFrontmatter() extracts SecurityTestFrontmatter from JSDoc |
| `runtime.security_tdd` | `type.SecurityCoverageEntry` | produces | 1:N | computeCoverageMatrix() groups frontmatter into per-OWASP coverage |
| `type.SecurityTestFrontmatter` | `type.OwaspCategory` | references | N:1 | Each test maps to one OWASP Top 10 category |
| `type.SecurityTestFrontmatter` | `type.AttackVector` | references | N:1 | Each test classifies one attack vector |
| `type.SecurityCoverageEntry` | `type.OwaspCategory` | references | N:1 | Each coverage entry tracks one OWASP category |
| `runtime.skeptical_team` | `runtime.security_tdd` | uses | 1:1 | security-auditor sub-agent enforces Security TDD frontmatter requirements |
