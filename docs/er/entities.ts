/**
 * @module docs/er/entities
 * @description Machine-readable entity relationship diagrams for knowledge-teams-plugins.
 *
 * This is the single source of truth for all entity relationships in the codebase.
 * Optimized for Claude AI structured I/O:
 * - Deterministic ordering reduces sampling variance
 * - Enum-constrained cardinality/kind values act as guardrails
 * - Flat string references (entity IDs) prevent circular nesting
 * - Each entity maps to exactly one source file for traceability
 *
 * Human-readable diagrams are generated from this via adapter.ts.
 * MAINTAIN THIS FILE — the adapter output is derived, not authoritative.
 */

import type { ERDiagram } from "./schema.js";
import {
  Cardinality,
  RelationshipKind,
  EntityLayer,
  AttributeType,
} from "./schema.js";

// ─── Complete ER Diagram ────────────────────────────────────────────────────

export const KNOWLEDGE_TEAMS_ER: ERDiagram = {
  schemaVersion: 1,
  generatedAt: "2026-03-11T00:00:00Z",
  sourceRef: "claude/research-claude-sdk-agents-oVAul",
  title: "knowledge-teams-plugins Entity Relationship Diagram",

  entities: [
    // ════════════════════════════════════════════════════════════════════════
    // DATA LAYER — Kimball Star Schema (db/)
    // ════════════════════════════════════════════════════════════════════════

    {
      id: "db.dim_tools",
      name: "dim_tools",
      layer: EntityLayer.DATA,
      sourceFile: "db/schema.ts",
      description: "Dimension table: tool identity and MCP classification",
      attributes: [
        { name: "id", type: AttributeType.INTEGER, required: true, primaryKey: true, description: "Auto-increment PK" },
        { name: "tool_name", type: AttributeType.TEXT, required: true, description: "Unique tool identifier" },
        { name: "category", type: AttributeType.TEXT, required: false, description: "Maps to McpCategory enum" },
        { name: "origin", type: AttributeType.TEXT, required: false, description: "Maps to McpOrigin enum" },
        { name: "is_webmcp", type: AttributeType.BOOLEAN, required: true, defaultValue: "false", description: "Whether this is a WebMCP tool" },
      ],
    },
    {
      id: "db.dim_agents",
      name: "dim_agents",
      layer: EntityLayer.DATA,
      sourceFile: "db/schema.ts",
      description: "Dimension table: agent identity (name, SDK version, model)",
      attributes: [
        { name: "id", type: AttributeType.INTEGER, required: true, primaryKey: true },
        { name: "agent_name", type: AttributeType.TEXT, required: true },
        { name: "sdk_version", type: AttributeType.TEXT, required: false, description: "claude-agent-sdk version" },
        { name: "model", type: AttributeType.TEXT, required: false, description: "Claude model alias" },
      ],
    },
    {
      id: "db.dim_sessions",
      name: "dim_sessions",
      layer: EntityLayer.DATA,
      sourceFile: "db/schema.ts",
      description: "Dimension table: session context linking to branch, PR, and repo",
      attributes: [
        { name: "id", type: AttributeType.INTEGER, required: true, primaryKey: true },
        { name: "session_id", type: AttributeType.TEXT, required: true, description: "Unique session identifier" },
        { name: "branch_name", type: AttributeType.TEXT, required: false },
        { name: "pr_number", type: AttributeType.INTEGER, required: false },
        { name: "repo", type: AttributeType.TEXT, required: false },
        { name: "started_at", type: AttributeType.TIMESTAMP, required: false, defaultValue: "now()" },
      ],
    },
    {
      id: "db.fact_tool_calls",
      name: "fact_tool_calls",
      layer: EntityLayer.DATA,
      sourceFile: "db/schema.ts",
      description: "Fact table: individual agent tool call invocations with measures (duration, tokens, success)",
      attributes: [
        { name: "id", type: AttributeType.INTEGER, required: true, primaryKey: true },
        { name: "session_id", type: AttributeType.INTEGER, required: false, foreignKey: "db.dim_sessions" },
        { name: "tool_id", type: AttributeType.INTEGER, required: false, foreignKey: "db.dim_tools" },
        { name: "agent_id", type: AttributeType.INTEGER, required: false, foreignKey: "db.dim_agents" },
        { name: "tool_name", type: AttributeType.TEXT, required: true },
        { name: "input_params", type: AttributeType.JSONB, required: false },
        { name: "output_summary", type: AttributeType.TEXT, required: false },
        { name: "duration_ms", type: AttributeType.INTEGER, required: false, description: "Measure: execution duration" },
        { name: "success", type: AttributeType.BOOLEAN, required: true },
        { name: "error", type: AttributeType.TEXT, required: false },
        { name: "input_tokens", type: AttributeType.INTEGER, required: false, description: "Measure: input token consumption" },
        { name: "output_tokens", type: AttributeType.INTEGER, required: false, description: "Measure: output token consumption" },
        { name: "branch_name", type: AttributeType.TEXT, required: false },
        { name: "pr_number", type: AttributeType.INTEGER, required: false },
        { name: "created_at", type: AttributeType.TIMESTAMP, required: false, defaultValue: "now()" },
      ],
    },
    {
      id: "db.fact_org_usage",
      name: "fact_org_usage",
      layer: EntityLayer.DATA,
      sourceFile: "db/schema.ts",
      description: "Fact table: Claude Organizations API team usage metrics per model per period",
      attributes: [
        { name: "id", type: AttributeType.INTEGER, required: true, primaryKey: true },
        { name: "org_id", type: AttributeType.TEXT, required: true },
        { name: "period_start", type: AttributeType.TIMESTAMP, required: true },
        { name: "period_end", type: AttributeType.TIMESTAMP, required: true },
        { name: "input_tokens", type: AttributeType.BIGINT, required: false, description: "Measure: input tokens consumed" },
        { name: "output_tokens", type: AttributeType.BIGINT, required: false, description: "Measure: output tokens consumed" },
        { name: "cache_read_tokens", type: AttributeType.BIGINT, required: false },
        { name: "cache_creation_tokens", type: AttributeType.BIGINT, required: false },
        { name: "model", type: AttributeType.TEXT, required: false },
        { name: "fetched_at", type: AttributeType.TIMESTAMP, required: false, defaultValue: "now()" },
      ],
    },
    {
      id: "db.meta_doc_cache",
      name: "meta_doc_cache",
      layer: EntityLayer.DATA,
      sourceFile: "db/schema.ts",
      description: "Metadata table: cached llms.txt documents with SHA-256 content hashes",
      attributes: [
        { name: "id", type: AttributeType.INTEGER, required: true, primaryKey: true },
        { name: "url", type: AttributeType.TEXT, required: true, description: "Unique crawled URL" },
        { name: "content_hash", type: AttributeType.TEXT, required: true, description: "SHA-256 hex digest" },
        { name: "content", type: AttributeType.TEXT, required: true },
        { name: "last_crawled", type: AttributeType.TIMESTAMP, required: false, defaultValue: "now()" },
        { name: "parent_url", type: AttributeType.TEXT, required: false, description: "Which llms.txt entry linked here" },
      ],
    },

    // ════════════════════════════════════════════════════════════════════════
    // TYPE LAYER — Canonical TypeScript types (src/)
    // ════════════════════════════════════════════════════════════════════════

    {
      id: "type.McpServerEntry",
      name: "McpServerEntry",
      layer: EntityLayer.TYPE,
      sourceFile: "src/mcp-registry.ts",
      description: "Canonical MCP server definition with origin, transport, category, and domain classification",
      attributes: [
        { name: "id", type: AttributeType.STRING, required: true, description: "Unique server identifier" },
        { name: "name", type: AttributeType.STRING, required: true },
        { name: "description", type: AttributeType.STRING, required: true },
        { name: "origin", type: AttributeType.ENUM, required: true, enumValues: ["reference", "anthropic-first-party", "official-integration", "community"] },
        { name: "transport", type: AttributeType.ENUM, required: true, enumValues: ["stdio", "sse", "http", "streamable-http", "sdk"] },
        { name: "category", type: AttributeType.ENUM, required: true, enumValues: ["filesystem", "search", "database", "version-control", "browser", "memory", "reasoning", "productivity", "communication", "cloud", "analytics", "design", "security", "monitoring", "finance", "reference", "build-tools"] },
        { name: "npmPackage", type: AttributeType.STRING, required: false },
        { name: "pinnedVersion", type: AttributeType.STRING, required: false },
        { name: "repo", type: AttributeType.STRING, required: false },
        { name: "domains", type: AttributeType.ARRAY, required: true, description: "WorkDomain[] — which plugin layers recommend this" },
        { name: "builtIn", type: AttributeType.BOOLEAN, required: false },
        { name: "implLanguage", type: AttributeType.ENUM, required: false, enumValues: ["typescript", "javascript", "python", "rust", "go", "java", "csharp", "swift", "ruby", "php", "cpp", "c", "kotlin", "scala", "elixir", "shell"] },
        { name: "canonicalSdkPackages", type: AttributeType.ARRAY, required: false, description: "CanonicalPackage[] for this MCP's ecosystem" },
      ],
    },
    {
      id: "type.CanonicalPackage",
      name: "CanonicalPackage",
      layer: EntityLayer.TYPE,
      sourceFile: "src/mcp-registry.ts",
      description: "Pinned SDK/library package with registry and language metadata",
      attributes: [
        { name: "name", type: AttributeType.STRING, required: true },
        { name: "version", type: AttributeType.STRING, required: true },
        { name: "registry", type: AttributeType.ENUM, required: true, enumValues: ["npm", "pypi", "cargo", "go", "maven", "nuget", "rubygems"] },
        { name: "language", type: AttributeType.ENUM, required: true, enumValues: ["typescript", "javascript", "python", "rust", "go", "java", "csharp", "swift", "ruby", "php", "cpp", "c", "kotlin", "scala", "elixir", "shell"] },
        { name: "installed", type: AttributeType.BOOLEAN, required: true },
      ],
    },
    {
      id: "type.LanguageAnalyzer",
      name: "LanguageAnalyzer",
      layer: EntityLayer.TYPE,
      sourceFile: "src/language-analyzers.ts",
      description: "Language-specific package/MCP mapping for knowledge workers using Claude Agent SDK",
      attributes: [
        { name: "language", type: AttributeType.ENUM, required: true, enumValues: ["typescript", "javascript", "python", "rust", "go", "java", "csharp", "swift", "ruby", "php", "cpp", "c", "kotlin", "scala", "elixir", "shell"] },
        { name: "displayName", type: AttributeType.STRING, required: true },
        { name: "fileExtensions", type: AttributeType.ARRAY, required: true },
        { name: "agentSdkSupport", type: AttributeType.ENUM, required: true, enumValues: ["native", "sdk-available", "community", "none"] },
        { name: "anthropicSdkAvailable", type: AttributeType.BOOLEAN, required: true },
        { name: "mcpSdkAvailable", type: AttributeType.BOOLEAN, required: true },
        { name: "knowledgeWorkerPackages", type: AttributeType.ARRAY, required: true, description: "CanonicalPackage[]" },
        { name: "treeSitterSupport", type: AttributeType.BOOLEAN, required: true },
        { name: "recommendedMcps", type: AttributeType.ARRAY, required: true, description: "MCP server IDs" },
      ],
    },
    {
      id: "type.WebMCPToolDefinition",
      name: "WebMCPToolDefinition",
      layer: EntityLayer.TYPE,
      sourceFile: "webmcp/shared/register.ts",
      description: "WebMCP tool contract: name, description, Zod input schema, async handler",
      attributes: [
        { name: "name", type: AttributeType.STRING, required: true },
        { name: "description", type: AttributeType.STRING, required: true },
        { name: "inputSchema", type: AttributeType.OBJECT, required: true, description: "ZodType<T> schema" },
        { name: "handler", type: AttributeType.FUNCTION, required: true, description: "(input: T) => Promise<unknown>" },
      ],
    },
    {
      id: "type.ToolCallEvent",
      name: "ToolCallEvent",
      layer: EntityLayer.TYPE,
      sourceFile: "db/logger.ts",
      description: "Event payload for logging a tool invocation to Neon",
      attributes: [
        { name: "toolName", type: AttributeType.STRING, required: true },
        { name: "sessionId", type: AttributeType.STRING, required: false },
        { name: "inputParams", type: AttributeType.OBJECT, required: false },
        { name: "outputSummary", type: AttributeType.STRING, required: false },
        { name: "durationMs", type: AttributeType.INTEGER, required: false },
        { name: "success", type: AttributeType.BOOLEAN, required: true },
        { name: "error", type: AttributeType.STRING, required: false },
        { name: "inputTokens", type: AttributeType.INTEGER, required: false },
        { name: "outputTokens", type: AttributeType.INTEGER, required: false },
        { name: "branchName", type: AttributeType.STRING, required: false },
        { name: "prNumber", type: AttributeType.INTEGER, required: false },
      ],
    },
    {
      id: "type.TelemetryEvent",
      name: "TelemetryEvent",
      layer: EntityLayer.TYPE,
      sourceFile: "webmcp/shared/telemetry.ts",
      description: "In-memory telemetry event with optional Neon persistence",
      attributes: [
        { name: "toolName", type: AttributeType.STRING, required: true },
        { name: "timestamp", type: AttributeType.INTEGER, required: true },
        { name: "durationMs", type: AttributeType.INTEGER, required: true },
        { name: "success", type: AttributeType.BOOLEAN, required: true },
        { name: "error", type: AttributeType.STRING, required: false },
      ],
    },
    {
      id: "type.TelemetryOptions",
      name: "TelemetryOptions",
      layer: EntityLayer.TYPE,
      sourceFile: "webmcp/shared/telemetry.ts",
      description: "Configuration for telemetry persistence (Neon + session context)",
      attributes: [
        { name: "persistToNeon", type: AttributeType.BOOLEAN, required: false },
        { name: "sessionId", type: AttributeType.STRING, required: false },
        { name: "branchName", type: AttributeType.STRING, required: false },
        { name: "prNumber", type: AttributeType.INTEGER, required: false },
      ],
    },
    {
      id: "type.CachedDoc",
      name: "CachedDoc",
      layer: EntityLayer.TYPE,
      sourceFile: "lib/llms-cache.ts",
      description: "Cached llms.txt document with content hash for change detection",
      attributes: [
        { name: "url", type: AttributeType.STRING, required: true },
        { name: "content", type: AttributeType.STRING, required: true },
        { name: "contentHash", type: AttributeType.STRING, required: true, description: "SHA-256 hex" },
        { name: "lastCrawled", type: AttributeType.OBJECT, required: true, description: "Date" },
        { name: "parentUrl", type: AttributeType.STRING, required: false },
      ],
    },
    {
      id: "type.CrawlResult",
      name: "CrawlResult",
      layer: EntityLayer.TYPE,
      sourceFile: "lib/llms-crawler.ts",
      description: "Result of crawling a single URL with hash comparison and child link extraction",
      attributes: [
        { name: "url", type: AttributeType.STRING, required: true },
        { name: "contentHash", type: AttributeType.STRING, required: true },
        { name: "content", type: AttributeType.STRING, required: true },
        { name: "changed", type: AttributeType.BOOLEAN, required: true },
        { name: "childUrls", type: AttributeType.ARRAY, required: true },
      ],
    },
    {
      id: "type.SyncReport",
      name: "SyncReport",
      layer: EntityLayer.TYPE,
      sourceFile: "lib/llms-sync.ts",
      description: "Sync orchestration result summarizing updated, unchanged, and errored URLs",
      attributes: [
        { name: "updated", type: AttributeType.ARRAY, required: true, description: "string[] — URLs that changed" },
        { name: "unchanged", type: AttributeType.ARRAY, required: true, description: "string[] — URLs with same hash" },
        { name: "errors", type: AttributeType.ARRAY, required: true, description: "string[] — error messages" },
      ],
    },
    {
      id: "type.OrgUsageResponse",
      name: "OrgUsageResponse",
      layer: EntityLayer.TYPE,
      sourceFile: "db/org-usage.ts",
      description: "Claude Organizations API response with usage buckets per model",
      attributes: [
        { name: "org_id", type: AttributeType.STRING, required: true },
        { name: "period_start", type: AttributeType.STRING, required: true, description: "ISO 8601" },
        { name: "period_end", type: AttributeType.STRING, required: true, description: "ISO 8601" },
        { name: "usage", type: AttributeType.ARRAY, required: true, description: "OrgUsageBucket[]" },
      ],
    },
    {
      id: "type.OrgUsageBucket",
      name: "OrgUsageBucket",
      layer: EntityLayer.TYPE,
      sourceFile: "db/org-usage.ts",
      description: "Single model usage bucket with token counts and cache metrics",
      attributes: [
        { name: "model", type: AttributeType.STRING, required: true },
        { name: "input_tokens", type: AttributeType.INTEGER, required: true },
        { name: "output_tokens", type: AttributeType.INTEGER, required: true },
        { name: "cache_read_input_tokens", type: AttributeType.INTEGER, required: false },
        { name: "cache_creation_input_tokens", type: AttributeType.INTEGER, required: false },
      ],
    },
    {
      id: "type.UpstreamRef",
      name: "UpstreamRef",
      layer: EntityLayer.TYPE,
      sourceFile: "compose/loader.ts",
      description: "Pinned upstream repository reference (repo, commit hash, sync timestamp)",
      attributes: [
        { name: "repo", type: AttributeType.STRING, required: true },
        { name: "commit", type: AttributeType.STRING, required: true },
        { name: "syncedAt", type: AttributeType.STRING, required: true },
      ],
    },
    {
      id: "type.LoadedPlugin",
      name: "LoadedPlugin",
      layer: EntityLayer.TYPE,
      sourceFile: "compose/loader.ts",
      description: "A loaded plugin from either upstream or jade extensions with manifest, skills, and commands",
      attributes: [
        { name: "source", type: AttributeType.ENUM, required: true, enumValues: ["upstream", "jade"] },
        { name: "name", type: AttributeType.STRING, required: true },
        { name: "basePath", type: AttributeType.STRING, required: true },
        { name: "manifest", type: AttributeType.OBJECT, required: false, description: "PluginManifest | null" },
        { name: "skills", type: AttributeType.ARRAY, required: true, description: "string[] — .md file paths" },
        { name: "commands", type: AttributeType.ARRAY, required: true, description: "string[] — .md file paths" },
      ],
    },
    {
      id: "type.PluginManifest",
      name: "PluginManifest",
      layer: EntityLayer.TYPE,
      sourceFile: "compose/loader.ts",
      description: "Plugin metadata from plugin.json (name, version, description, skills, commands)",
      attributes: [
        { name: "name", type: AttributeType.STRING, required: true },
        { name: "version", type: AttributeType.STRING, required: false },
        { name: "description", type: AttributeType.STRING, required: false },
        { name: "skills", type: AttributeType.ARRAY, required: false },
        { name: "commands", type: AttributeType.ARRAY, required: false },
      ],
    },

    // ════════════════════════════════════════════════════════════════════════
    // RUNTIME LAYER — Modules and orchestrators
    // ════════════════════════════════════════════════════════════════════════

    {
      id: "runtime.db_client",
      name: "Database Client",
      layer: EntityLayer.RUNTIME,
      sourceFile: "db/client.ts",
      description: "Singleton Neon serverless Drizzle ORM client with lazy initialization",
      attributes: [
        { name: "cachedDb", type: AttributeType.OBJECT, required: false, description: "NeonHttpDatabase<schema> singleton" },
      ],
      functions: [
        { name: "getDb", params: "()", returnType: "NeonHttpDatabase<typeof schema>", description: "Returns cached Drizzle ORM instance connected to Neon" },
        { name: "hasDatabase", params: "()", returnType: "boolean", description: "Returns true if DATABASE_URL is configured" },
      ],
    },
    {
      id: "runtime.db_logger",
      name: "Tool Call Logger",
      layer: EntityLayer.RUNTIME,
      sourceFile: "db/logger.ts",
      description: "Persists agent tool call events to Neon via dimension upserts + fact inserts",
      attributes: [],
      functions: [
        { name: "ensureDimTool", params: "(toolName, category?, origin?, isWebmcp?)", returnType: "Promise<number>", description: "Upsert tool into dim_tools, returns row ID" },
        { name: "ensureDimSession", params: "(sessionId, branchName?, prNumber?, repo?)", returnType: "Promise<number>", description: "Upsert session into dim_sessions, returns row ID" },
        { name: "logToolCall", params: "(event: ToolCallEvent)", returnType: "Promise<void>", description: "Log tool call to fact_tool_calls; no-op if DATABASE_URL unset" },
      ],
    },
    {
      id: "runtime.org_usage",
      name: "Org Usage Fetcher",
      layer: EntityLayer.RUNTIME,
      sourceFile: "db/org-usage.ts",
      description: "Fetches Claude Organizations API usage and persists to fact_org_usage",
      attributes: [],
      functions: [
        { name: "fetchOrgUsage", params: "(orgId, apiKey)", returnType: "Promise<OrgUsageResponse>", description: "Fetch usage from Anthropic Organizations API" },
        { name: "persistOrgUsage", params: "(usage: OrgUsageResponse)", returnType: "Promise<number>", description: "Write usage buckets to fact_org_usage" },
        { name: "syncOrgUsage", params: "()", returnType: "Promise<{fetched, persisted}>", description: "End-to-end fetch + persist orchestrator" },
      ],
    },
    {
      id: "runtime.llms_cache",
      name: "Two-Tier Doc Cache",
      layer: EntityLayer.RUNTIME,
      sourceFile: "lib/llms-cache.ts",
      description: "LRU (in-memory, 100 entries) + Neon (persistent) cache for llms.txt docs",
      attributes: [
        { name: "lru", type: AttributeType.OBJECT, required: true, description: "LRUCache<string, CachedDoc> with max=100" },
      ],
      functions: [
        { name: "getDoc", params: "(url)", returnType: "CachedDoc | undefined", description: "LRU-only lookup" },
        { name: "getDocWithFallback", params: "(url)", returnType: "Promise<CachedDoc | undefined>", description: "LRU then Neon fallback" },
        { name: "putDoc", params: "(doc: CachedDoc)", returnType: "Promise<void>", description: "Write to both LRU and Neon" },
        { name: "refreshIfStale", params: "(url, maxAgeMs)", returnType: "Promise<CachedDoc | undefined>", description: "Return cached doc if fresh, undefined if stale" },
        { name: "clearLruCache", params: "()", returnType: "void", description: "Clear LRU (testing)" },
      ],
    },
    {
      id: "runtime.llms_crawler",
      name: "llms.txt Crawler",
      layer: EntityLayer.RUNTIME,
      sourceFile: "lib/llms-crawler.ts",
      description: "Secure allowlisted crawler for docs.anthropic.com and claude.ai llms.txt docs",
      attributes: [
        { name: "ALLOWED_DOMAINS", type: AttributeType.ARRAY, required: true, description: "[docs.anthropic.com, claude.ai]" },
        { name: "ENTRY_URLS", type: AttributeType.ARRAY, required: true, description: "llms.txt and llms-full.txt URLs" },
      ],
      functions: [
        { name: "isAllowedUrl", params: "(url)", returnType: "boolean", description: "Security boundary: only allowlisted domains" },
        { name: "getEntryUrls", params: "()", returnType: "readonly string[]", description: "Returns entry point URLs" },
        { name: "fetchLlmsTxt", params: "(url)", returnType: "Promise<string>", description: "Fetch raw text from allowlisted URL" },
        { name: "hashContent", params: "(content)", returnType: "string", description: "SHA-256 hex hash" },
        { name: "extractUrls", params: "(llmsTxt)", returnType: "string[]", description: "Extract URLs from llms.txt content" },
        { name: "crawlUrl", params: "(url, knownHash)", returnType: "Promise<CrawlResult>", description: "Crawl single URL with hash comparison" },
        { name: "crawlRecursive", params: "(entryUrl, knownHashes, maxDepth?)", returnType: "Promise<CrawlResult[]>", description: "Recursive crawl with depth limit" },
      ],
    },
    {
      id: "runtime.llms_sync",
      name: "llms.txt Sync Orchestrator",
      layer: EntityLayer.RUNTIME,
      sourceFile: "lib/llms-sync.ts",
      description: "Orchestrates crawl + cache update across all entry URLs",
      attributes: [],
      functions: [
        { name: "syncDocs", params: "()", returnType: "Promise<SyncReport>", description: "Crawl all entries, compare hashes, update cache" },
      ],
    },
    {
      id: "runtime.mcp_registry",
      name: "MCP Registry",
      layer: EntityLayer.RUNTIME,
      sourceFile: "src/mcp-registry.ts",
      description: "Dynamic MCP registry with 47 servers, canonical enums, package pinning, and cross-domain bridge mappings",
      attributes: [
        { name: "MCP_SERVERS", type: AttributeType.ARRAY, required: true, description: "McpServerEntry[] — 47 registered servers" },
        { name: "ANTHROPIC_PACKAGES", type: AttributeType.ARRAY, required: true, description: "CanonicalPackage[] — 10 @anthropic-ai packages" },
        { name: "MCP_PACKAGES", type: AttributeType.ARRAY, required: true, description: "CanonicalPackage[] — 8 @modelcontextprotocol packages" },
        { name: "MCP_SDKS_BY_LANGUAGE", type: AttributeType.OBJECT, required: true, description: "Record<SupportedLanguage, CanonicalPackage[]>" },
      ],
      functions: [
        { name: "getMcpsByDomain", params: "(domain: WorkDomain)", returnType: "McpServerEntry[]", description: "Filter servers by work domain" },
        { name: "getMcpsByCategory", params: "(category: McpCategory)", returnType: "McpServerEntry[]", description: "Filter servers by category" },
        { name: "getMcpsByOrigin", params: "(origin: McpOrigin)", returnType: "McpServerEntry[]", description: "Filter servers by origin" },
        { name: "getSdkPackagesForLanguage", params: "(lang: SupportedLanguage)", returnType: "CanonicalPackage[]", description: "Get SDK packages for a language" },
        { name: "getInstalledPackages", params: "()", returnType: "CanonicalPackage[]", description: "All installed canonical packages" },
        { name: "getMonitoredPackages", params: "()", returnType: "Array<{name, current, registry}>", description: "Packages needing version monitoring" },
        { name: "getMcpById", params: "(id: string)", returnType: "McpServerEntry | undefined", description: "Resolve MCP server by ID" },
      ],
    },
    {
      id: "runtime.language_analyzers",
      name: "Language Analyzer Registry",
      layer: EntityLayer.RUNTIME,
      sourceFile: "src/language-analyzers.ts",
      description: "14-language analyzer registry mapping file extensions to SDK support, packages, and MCP recommendations",
      attributes: [
        { name: "LANGUAGE_ANALYZERS", type: AttributeType.ARRAY, required: true, description: "LanguageAnalyzer[] — 14 entries" },
      ],
      functions: [
        { name: "getAnalyzerForExtension", params: "(ext: string)", returnType: "LanguageAnalyzer | undefined", description: "Get analyzer by file extension" },
        { name: "getNativeAgentSdkLanguages", params: "()", returnType: "LanguageAnalyzer[]", description: "Languages with native Agent SDK support" },
        { name: "getMcpSdkLanguages", params: "()", returnType: "LanguageAnalyzer[]", description: "Languages with MCP SDK available" },
        { name: "getKnowledgeWorkerStack", params: "(lang: SupportedLanguage)", returnType: "{packages, mcps, agentSdkSupport}", description: "Full stack for a language" },
      ],
    },
    {
      id: "runtime.webmcp_registry",
      name: "WebMCP Tool Registry",
      layer: EntityLayer.RUNTIME,
      sourceFile: "webmcp/shared/register.ts",
      description: "Module-level Map<string, WebMCPToolDefinition> with register/get/list operations",
      attributes: [
        { name: "registry", type: AttributeType.OBJECT, required: true, description: "Map<string, WebMCPToolDefinition>" },
      ],
      functions: [
        { name: "registerTool", params: "(tool: WebMCPToolDefinition<T>)", returnType: "void", description: "Register tool; throws on duplicate name" },
        { name: "getTool", params: "(name: string)", returnType: "WebMCPToolDefinition | undefined", description: "Retrieve tool by name" },
        { name: "listTools", params: "()", returnType: "string[]", description: "List all registered tool names" },
        { name: "clearRegistry", params: "()", returnType: "void", description: "Clear registry (testing)" },
      ],
    },
    {
      id: "runtime.telemetry",
      name: "Telemetry Recorder",
      layer: EntityLayer.RUNTIME,
      sourceFile: "webmcp/shared/telemetry.ts",
      description: "In-memory telemetry with optional Neon persistence bridge",
      attributes: [
        { name: "events", type: AttributeType.ARRAY, required: true, description: "TelemetryEvent[] — in-memory buffer" },
      ],
      functions: [
        { name: "recordInvocation", params: "(event, options?)", returnType: "void", description: "Record event; optionally persist to Neon" },
        { name: "getEvents", params: "()", returnType: "readonly TelemetryEvent[]", description: "Get all recorded events" },
        { name: "clearTelemetry", params: "()", returnType: "void", description: "Clear events (testing)" },
      ],
    },
    {
      id: "runtime.compose_loader",
      name: "Plugin Compose Loader",
      layer: EntityLayer.RUNTIME,
      sourceFile: "compose/loader.ts",
      description: "Loads and merges upstream KWP + jade extension plugins at build time",
      attributes: [],
      functions: [
        { name: "loadUpstreamRef", params: "(rootDir: string)", returnType: "UpstreamRef", description: "Load upstream-ref.json" },
        { name: "scanPluginDir", params: "(dir, source)", returnType: "LoadedPlugin[]", description: "Scan directory for plugin subdirectories" },
        { name: "loadAll", params: "(rootDir: string)", returnType: "{upstreamRef, upstream, jade}", description: "Load both upstream and jade plugins" },
      ],
    },
    {
      id: "runtime.skeptical_team",
      name: "Skeptical Codegen Team",
      layer: EntityLayer.RUNTIME,
      sourceFile: "src/teams/skeptical-codegen-team.ts",
      description: "Multi-agent code review team using @anthropic-ai/claude-agent-sdk with 3 specialist sub-agents",
      attributes: [
        { name: "agents", type: AttributeType.OBJECT, required: true, description: "Record<string, AgentDefinition> — 3 sub-agents" },
        { name: "LEAD_PROMPT", type: AttributeType.STRING, required: true, description: "System prompt for lead skeptic" },
      ],
      functions: [
        { name: "runSkepticalCodegenTeam", params: "(cwd?: string)", returnType: "Promise<void>", description: "Run full team review via query() streaming" },
      ],
    },

    // ════════════════════════════════════════════════════════════════════════
    // AGENT SDK LAYER — Claude Agent SDK entities
    // ════════════════════════════════════════════════════════════════════════

    {
      id: "agent_sdk.query",
      name: "query()",
      layer: EntityLayer.AGENT_SDK,
      sourceFile: "@anthropic-ai/claude-agent-sdk",
      description: "Primary Agent SDK entry point: creates a streaming async iterator of agent messages",
      attributes: [
        { name: "prompt", type: AttributeType.STRING, required: true, description: "Task prompt" },
        { name: "options.model", type: AttributeType.STRING, required: true, description: "Model alias: opus, sonnet, haiku, inherit" },
        { name: "options.cwd", type: AttributeType.STRING, required: false },
        { name: "options.agents", type: AttributeType.OBJECT, required: false, description: "Record<string, AgentDefinition>" },
        { name: "options.tools", type: AttributeType.ARRAY, required: false, description: "Tool names to enable" },
        { name: "options.allowedTools", type: AttributeType.ARRAY, required: false },
        { name: "options.permissionMode", type: AttributeType.STRING, required: false },
        { name: "options.maxTurns", type: AttributeType.INTEGER, required: false },
        { name: "options.systemPrompt", type: AttributeType.OBJECT, required: false },
      ],
    },
    {
      id: "agent_sdk.AgentDefinition",
      name: "AgentDefinition",
      layer: EntityLayer.AGENT_SDK,
      sourceFile: "@anthropic-ai/claude-agent-sdk",
      description: "Sub-agent definition spawnable by lead agent via the Agent tool",
      attributes: [
        { name: "description", type: AttributeType.STRING, required: true },
        { name: "model", type: AttributeType.STRING, required: true, description: "Model alias" },
        { name: "tools", type: AttributeType.ARRAY, required: true, description: "Tool names available to this sub-agent" },
        { name: "maxTurns", type: AttributeType.INTEGER, required: true },
        { name: "prompt", type: AttributeType.STRING, required: true, description: "System prompt" },
      ],
    },
    {
      id: "agent_sdk.message_types",
      name: "Agent Message Types",
      layer: EntityLayer.AGENT_SDK,
      sourceFile: "@anthropic-ai/claude-agent-sdk",
      description: "Streaming message types emitted by query() async iterator",
      attributes: [
        { name: "assistant", type: AttributeType.OBJECT, required: true, description: "msg.message.content[].text — assistant text blocks" },
        { name: "result.success", type: AttributeType.OBJECT, required: true, description: "num_turns, total_cost_usd — successful completion" },
        { name: "result.error", type: AttributeType.OBJECT, required: true, description: "subtype, errors — failure" },
      ],
    },

    // ════════════════════════════════════════════════════════════════════════
    // INFRA LAYER — CI/CD Workflows
    // ════════════════════════════════════════════════════════════════════════

    {
      id: "infra.ci",
      name: "CI Workflow",
      layer: EntityLayer.INFRA,
      sourceFile: ".github/workflows/ci.yml",
      description: "Build + test + Neon branch-per-PR on push/PR to main",
      attributes: [
        { name: "trigger", type: AttributeType.STRING, required: true, description: "push/PR to main" },
        { name: "neonBranch", type: AttributeType.STRING, required: false, description: "pr-{number} ephemeral branch" },
      ],
    },
    {
      id: "infra.neon_cleanup",
      name: "Neon Branch Cleanup",
      layer: EntityLayer.INFRA,
      sourceFile: ".github/workflows/neon-cleanup.yml",
      description: "Delete ephemeral Neon database branch on PR close",
      attributes: [
        { name: "trigger", type: AttributeType.STRING, required: true, description: "PR closed" },
      ],
    },
    {
      id: "infra.architecture_guardrails",
      name: "Architecture Guardrails",
      layer: EntityLayer.INFRA,
      sourceFile: ".github/workflows/architecture-guardrails.yml",
      description: "Claude-powered architecture review with PASS/REVISIT/BLOCK verdicts",
      attributes: [
        { name: "trigger", type: AttributeType.STRING, required: true, description: "PR opened/synchronize/reopened" },
        { name: "verdict", type: AttributeType.ENUM, required: true, enumValues: ["PASS", "PASS with follow-ups", "REVISIT", "BLOCK"] },
      ],
    },
    {
      id: "infra.staff_review",
      name: "Staff Review",
      layer: EntityLayer.INFRA,
      sourceFile: ".github/workflows/staff-review.yml",
      description: "SDK-aware code quality review (return types, coverage, naming, drift)",
      attributes: [
        { name: "trigger", type: AttributeType.STRING, required: true, description: "PR opened/synchronize/reopened" },
      ],
    },
    {
      id: "infra.ci_autofix",
      name: "CI Auto-Fix",
      layer: EntityLayer.INFRA,
      sourceFile: ".github/workflows/ci-autofix.yml",
      description: "Automatically diagnose and fix CI failures on non-main branches",
      attributes: [
        { name: "trigger", type: AttributeType.STRING, required: true, description: "CI workflow failure" },
      ],
    },
    {
      id: "infra.issue_triage",
      name: "Issue Triage",
      layer: EntityLayer.INFRA,
      sourceFile: ".github/workflows/issue-triage.yml",
      description: "Auto-categorize and label new issues (bug, feature, question, upstream, infra)",
      attributes: [
        { name: "trigger", type: AttributeType.STRING, required: true, description: "Issue opened" },
      ],
    },
    {
      id: "infra.weekly_audit",
      name: "Weekly Audit",
      layer: EntityLayer.INFRA,
      sourceFile: ".github/workflows/weekly-audit.yml",
      description: "Monday 9am UTC stale code/drift audit + llms.txt cache refresh",
      attributes: [
        { name: "trigger", type: AttributeType.STRING, required: true, description: "Cron: Monday 9am UTC + manual" },
      ],
    },

    // ════════════════════════════════════════════════════════════════════════
    // EXTERNAL LAYER — External APIs and services
    // ════════════════════════════════════════════════════════════════════════

    {
      id: "external.neon_postgres",
      name: "Neon Postgres",
      layer: EntityLayer.EXTERNAL,
      sourceFile: "db/client.ts",
      description: "Neon serverless Postgres with branch-per-PR ephemeral databases",
      attributes: [
        { name: "DATABASE_URL", type: AttributeType.STRING, required: true, description: "Connection string env var" },
        { name: "NEON_API_KEY", type: AttributeType.STRING, required: true, description: "Neon API key for branch management" },
        { name: "NEON_PROJECT_ID", type: AttributeType.STRING, required: true, description: "Neon project identifier" },
      ],
    },
    {
      id: "external.claude_organizations_api",
      name: "Claude Organizations API",
      layer: EntityLayer.EXTERNAL,
      sourceFile: "db/org-usage.ts",
      description: "Anthropic Organizations API for team usage metrics (v1/organizations/{id}/usage)",
      attributes: [
        { name: "ANTHROPIC_ORG_API_KEY", type: AttributeType.STRING, required: true },
        { name: "ANTHROPIC_ORG_ID", type: AttributeType.STRING, required: true },
        { name: "anthropic-version", type: AttributeType.STRING, required: true, description: "2023-06-01" },
      ],
    },
    {
      id: "external.anthropic_docs",
      name: "Anthropic Documentation",
      layer: EntityLayer.EXTERNAL,
      sourceFile: "lib/llms-crawler.ts",
      description: "docs.anthropic.com and claude.ai — allowlisted for llms.txt crawling",
      attributes: [
        { name: "entryUrls", type: AttributeType.ARRAY, required: true, description: "llms.txt, llms-full.txt" },
      ],
    },
    {
      id: "external.claude_code_action",
      name: "Claude Code GitHub Action",
      layer: EntityLayer.EXTERNAL,
      sourceFile: ".github/workflows/architecture-guardrails.yml",
      description: "anthropics/claude-code-action@v1 — CI/CD agent with OAuth token auth",
      attributes: [
        { name: "claude_code_oauth_token", type: AttributeType.STRING, required: true, description: "Daily-rotated OAuth token" },
      ],
    },
  ],

  relationships: [
    // ── Star Schema FK Relationships ──────────────────────────────────────

    {
      id: "rel.fact_tool_calls__dim_sessions",
      from: "db.fact_tool_calls",
      to: "db.dim_sessions",
      kind: RelationshipKind.REFERENCES,
      cardinality: Cardinality.MANY_TO_ONE,
      label: "fact_tool_calls.session_id → dim_sessions.id",
      throughAttribute: "session_id",
    },
    {
      id: "rel.fact_tool_calls__dim_tools",
      from: "db.fact_tool_calls",
      to: "db.dim_tools",
      kind: RelationshipKind.REFERENCES,
      cardinality: Cardinality.MANY_TO_ONE,
      label: "fact_tool_calls.tool_id → dim_tools.id",
      throughAttribute: "tool_id",
    },
    {
      id: "rel.fact_tool_calls__dim_agents",
      from: "db.fact_tool_calls",
      to: "db.dim_agents",
      kind: RelationshipKind.REFERENCES,
      cardinality: Cardinality.MANY_TO_ONE,
      label: "fact_tool_calls.agent_id → dim_agents.id",
      throughAttribute: "agent_id",
    },

    // ── Runtime → Data Relationships ────────────────────────────────────

    {
      id: "rel.logger__fact_tool_calls",
      from: "runtime.db_logger",
      to: "db.fact_tool_calls",
      kind: RelationshipKind.PRODUCES,
      cardinality: Cardinality.ONE_TO_MANY,
      label: "logToolCall() inserts into fact_tool_calls",
    },
    {
      id: "rel.logger__dim_tools",
      from: "runtime.db_logger",
      to: "db.dim_tools",
      kind: RelationshipKind.PRODUCES,
      cardinality: Cardinality.ONE_TO_MANY,
      label: "ensureDimTool() upserts dim_tools",
    },
    {
      id: "rel.logger__dim_sessions",
      from: "runtime.db_logger",
      to: "db.dim_sessions",
      kind: RelationshipKind.PRODUCES,
      cardinality: Cardinality.ONE_TO_MANY,
      label: "ensureDimSession() upserts dim_sessions",
    },
    {
      id: "rel.org_usage__fact_org_usage",
      from: "runtime.org_usage",
      to: "db.fact_org_usage",
      kind: RelationshipKind.PRODUCES,
      cardinality: Cardinality.ONE_TO_MANY,
      label: "persistOrgUsage() inserts into fact_org_usage",
    },
    {
      id: "rel.llms_cache__meta_doc_cache",
      from: "runtime.llms_cache",
      to: "db.meta_doc_cache",
      kind: RelationshipKind.PRODUCES,
      cardinality: Cardinality.ONE_TO_MANY,
      label: "putDoc() upserts meta_doc_cache",
    },

    // ── Runtime → Runtime Relationships ─────────────────────────────────

    {
      id: "rel.logger__db_client",
      from: "runtime.db_logger",
      to: "runtime.db_client",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.MANY_TO_ONE,
      label: "Logger calls getDb() for Drizzle instance",
    },
    {
      id: "rel.org_usage__db_client",
      from: "runtime.org_usage",
      to: "runtime.db_client",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.MANY_TO_ONE,
      label: "Org usage calls getDb() for Drizzle instance",
    },
    {
      id: "rel.llms_cache__db_client",
      from: "runtime.llms_cache",
      to: "runtime.db_client",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.MANY_TO_ONE,
      label: "Cache reads/writes via getDb()",
    },
    {
      id: "rel.llms_sync__llms_crawler",
      from: "runtime.llms_sync",
      to: "runtime.llms_crawler",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "Sync orchestrator invokes crawler",
    },
    {
      id: "rel.llms_sync__llms_cache",
      from: "runtime.llms_sync",
      to: "runtime.llms_cache",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "Sync orchestrator updates cache",
    },
    {
      id: "rel.telemetry__logger",
      from: "runtime.telemetry",
      to: "runtime.db_logger",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.MANY_TO_ONE,
      label: "recordInvocation() optionally calls logToolCall()",
    },
    {
      id: "rel.language_analyzers__mcp_registry",
      from: "runtime.language_analyzers",
      to: "runtime.mcp_registry",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.MANY_TO_ONE,
      label: "Imports SupportedLanguage, CanonicalPackage, MCP_SDKS_BY_LANGUAGE, getMcpsByDomain",
    },

    // ── Agent SDK Relationships ─────────────────────────────────────────

    {
      id: "rel.skeptical_team__query",
      from: "runtime.skeptical_team",
      to: "agent_sdk.query",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "runSkepticalCodegenTeam() calls query() with agents config",
    },
    {
      id: "rel.skeptical_team__agent_def",
      from: "runtime.skeptical_team",
      to: "agent_sdk.AgentDefinition",
      kind: RelationshipKind.COMPOSES,
      cardinality: Cardinality.ONE_TO_MANY,
      label: "Defines 3 sub-agents: type-auditor, dead-code-hunter, simplicity-enforcer",
    },
    {
      id: "rel.query__agent_def",
      from: "agent_sdk.query",
      to: "agent_sdk.AgentDefinition",
      kind: RelationshipKind.AGGREGATES,
      cardinality: Cardinality.ONE_TO_MANY,
      label: "query() options.agents receives AgentDefinition records",
    },
    {
      id: "rel.query__message_types",
      from: "agent_sdk.query",
      to: "agent_sdk.message_types",
      kind: RelationshipKind.PRODUCES,
      cardinality: Cardinality.ONE_TO_MANY,
      label: "query() async iterator yields message types",
    },

    // ── Type → Type Relationships ───────────────────────────────────────

    {
      id: "rel.McpServerEntry__CanonicalPackage",
      from: "type.McpServerEntry",
      to: "type.CanonicalPackage",
      kind: RelationshipKind.AGGREGATES,
      cardinality: Cardinality.ONE_TO_MANY,
      label: "McpServerEntry.canonicalSdkPackages → CanonicalPackage[]",
      throughAttribute: "canonicalSdkPackages",
    },
    {
      id: "rel.LanguageAnalyzer__CanonicalPackage",
      from: "type.LanguageAnalyzer",
      to: "type.CanonicalPackage",
      kind: RelationshipKind.AGGREGATES,
      cardinality: Cardinality.ONE_TO_MANY,
      label: "LanguageAnalyzer.knowledgeWorkerPackages → CanonicalPackage[]",
      throughAttribute: "knowledgeWorkerPackages",
    },
    {
      id: "rel.LanguageAnalyzer__McpServerEntry",
      from: "type.LanguageAnalyzer",
      to: "type.McpServerEntry",
      kind: RelationshipKind.REFERENCES,
      cardinality: Cardinality.MANY_TO_MANY,
      label: "LanguageAnalyzer.recommendedMcps references McpServerEntry.id",
      throughAttribute: "recommendedMcps",
    },
    {
      id: "rel.ToolCallEvent__fact_tool_calls",
      from: "type.ToolCallEvent",
      to: "db.fact_tool_calls",
      kind: RelationshipKind.PRODUCES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "ToolCallEvent maps to one fact_tool_calls row",
    },
    {
      id: "rel.TelemetryEvent__ToolCallEvent",
      from: "type.TelemetryEvent",
      to: "type.ToolCallEvent",
      kind: RelationshipKind.PRODUCES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "TelemetryEvent is converted to ToolCallEvent for Neon persistence",
    },
    {
      id: "rel.CrawlResult__CachedDoc",
      from: "type.CrawlResult",
      to: "type.CachedDoc",
      kind: RelationshipKind.PRODUCES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "CrawlResult is transformed into CachedDoc for storage",
    },
    {
      id: "rel.CachedDoc__meta_doc_cache",
      from: "type.CachedDoc",
      to: "db.meta_doc_cache",
      kind: RelationshipKind.PRODUCES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "CachedDoc maps to one meta_doc_cache row",
    },
    {
      id: "rel.OrgUsageResponse__OrgUsageBucket",
      from: "type.OrgUsageResponse",
      to: "type.OrgUsageBucket",
      kind: RelationshipKind.COMPOSES,
      cardinality: Cardinality.ONE_TO_MANY,
      label: "OrgUsageResponse.usage contains OrgUsageBucket[]",
    },
    {
      id: "rel.OrgUsageBucket__fact_org_usage",
      from: "type.OrgUsageBucket",
      to: "db.fact_org_usage",
      kind: RelationshipKind.PRODUCES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "Each OrgUsageBucket maps to one fact_org_usage row",
    },
    {
      id: "rel.LoadedPlugin__PluginManifest",
      from: "type.LoadedPlugin",
      to: "type.PluginManifest",
      kind: RelationshipKind.COMPOSES,
      cardinality: Cardinality.ZERO_OR_ONE,
      label: "LoadedPlugin.manifest contains optional PluginManifest",
      throughAttribute: "manifest",
    },

    // ── Runtime → External Relationships ────────────────────────────────

    {
      id: "rel.db_client__neon",
      from: "runtime.db_client",
      to: "external.neon_postgres",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.MANY_TO_ONE,
      label: "Drizzle ORM connects via DATABASE_URL",
    },
    {
      id: "rel.org_usage__claude_org_api",
      from: "runtime.org_usage",
      to: "external.claude_organizations_api",
      kind: RelationshipKind.CONSUMES,
      cardinality: Cardinality.MANY_TO_ONE,
      label: "fetchOrgUsage() calls Anthropic Organizations API",
    },
    {
      id: "rel.llms_crawler__anthropic_docs",
      from: "runtime.llms_crawler",
      to: "external.anthropic_docs",
      kind: RelationshipKind.CONSUMES,
      cardinality: Cardinality.MANY_TO_ONE,
      label: "Crawler fetches from docs.anthropic.com allowlist",
    },

    // ── Infra → Runtime/External Relationships ──────────────────────────

    {
      id: "rel.ci__neon",
      from: "infra.ci",
      to: "external.neon_postgres",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "CI creates ephemeral Neon branch pr-{number}",
    },
    {
      id: "rel.neon_cleanup__neon",
      from: "infra.neon_cleanup",
      to: "external.neon_postgres",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "Cleanup deletes ephemeral Neon branch on PR close",
    },
    {
      id: "rel.guardrails__claude_action",
      from: "infra.architecture_guardrails",
      to: "external.claude_code_action",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "Guardrails uses claude-code-action@v1 for review",
    },
    {
      id: "rel.staff_review__claude_action",
      from: "infra.staff_review",
      to: "external.claude_code_action",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "Staff review uses claude-code-action@v1",
    },
    {
      id: "rel.ci_autofix__claude_action",
      from: "infra.ci_autofix",
      to: "external.claude_code_action",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "Auto-fix uses claude-code-action@v1 to diagnose + fix",
    },
    {
      id: "rel.issue_triage__claude_action",
      from: "infra.issue_triage",
      to: "external.claude_code_action",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "Issue triage uses claude-code-action@v1",
    },
    {
      id: "rel.weekly_audit__claude_action",
      from: "infra.weekly_audit",
      to: "external.claude_code_action",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "Weekly audit uses claude-code-action@v1",
    },
    {
      id: "rel.weekly_audit__llms_sync",
      from: "infra.weekly_audit",
      to: "runtime.llms_sync",
      kind: RelationshipKind.USES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "Weekly audit runs npm run llms:sync",
    },
    {
      id: "rel.guardrails__mcp_registry",
      from: "infra.architecture_guardrails",
      to: "runtime.mcp_registry",
      kind: RelationshipKind.CONSUMES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "Guardrails reads mcp-registry.ts for canonical types and versions",
    },
    {
      id: "rel.staff_review__mcp_registry",
      from: "infra.staff_review",
      to: "runtime.mcp_registry",
      kind: RelationshipKind.CONSUMES,
      cardinality: Cardinality.ONE_TO_ONE,
      label: "Staff review checks package drift against ANTHROPIC_PACKAGES/MCP_PACKAGES",
    },

    // ── WebMCP Relationships ────────────────────────────────────────────

    {
      id: "rel.webmcp_registry__dim_tools",
      from: "runtime.webmcp_registry",
      to: "db.dim_tools",
      kind: RelationshipKind.REFERENCES,
      cardinality: Cardinality.ONE_TO_MANY,
      label: "WebMCP tools classified in dim_tools with is_webmcp=true",
    },
  ],
};
