/**
 * @module mcp-registry
 * @description Dynamic MCP registry with canonical enums, package pinning, and
 *              bridge mappings for knowledge-work-plugins and financial-services-plugins.
 *
 * @frontmatter
 * ---
 * dataSource: npm registry + github.com/modelcontextprotocol/servers + anthropic docs
 * lastUpdated: "2026-03-11"
 * upstreamRef: "jadecli/knowledge-work-plugins @ 477c893b"
 * generatedBy: "@jadecli/knowledge-teams-plugins mcp-registry"
 * schemaVersion: 1
 * ---
 */

// ─── Frontmatter Metadata ────────────────────────────────────────────────────

export const REGISTRY_METADATA = {
  dataSource: "npm registry + github.com/modelcontextprotocol/servers + anthropic docs",
  lastUpdated: "2026-03-11",
  upstreamRef: "jadecli/knowledge-work-plugins @ 477c893b",
  schemaVersion: 1,
} as const;

// ─── MCP Origin Enum ─────────────────────────────────────────────────────────

/** Who maintains the MCP server */
export enum McpOrigin {
  /** Maintained by MCP steering group (reference implementations) */
  REFERENCE = "reference",
  /** Maintained by Anthropic directly */
  ANTHROPIC_FIRST_PARTY = "anthropic-first-party",
  /** Official integration maintained by the platform vendor */
  OFFICIAL_INTEGRATION = "official-integration",
  /** Community-maintained */
  COMMUNITY = "community",
}

// ─── MCP Transport Enum ──────────────────────────────────────────────────────

export enum McpTransport {
  STDIO = "stdio",
  /** @deprecated Use STREAMABLE_HTTP instead */
  SSE = "sse",
  HTTP = "http",
  /** Recommended transport for remote MCP servers (replaces SSE) */
  STREAMABLE_HTTP = "streamable-http",
  SDK = "sdk",
}

// ─── MCP Category Enum ───────────────────────────────────────────────────────

export enum McpCategory {
  FILESYSTEM = "filesystem",
  SEARCH = "search",
  DATABASE = "database",
  VERSION_CONTROL = "version-control",
  BROWSER = "browser",
  MEMORY = "memory",
  REASONING = "reasoning",
  PRODUCTIVITY = "productivity",
  COMMUNICATION = "communication",
  CLOUD = "cloud",
  ANALYTICS = "analytics",
  DESIGN = "design",
  SECURITY = "security",
  MONITORING = "monitoring",
  FINANCE = "finance",
  REFERENCE = "reference",
  BUILD_TOOLS = "build-tools",
}

// ─── Work Domain Enum ────────────────────────────────────────────────────────

/** Which plugin layer recommends this MCP */
export enum WorkDomain {
  /** Recommended by knowledge-work-plugins */
  KNOWLEDGE_WORK = "knowledge-work",
  /** Recommended by financial-work-plugins */
  FINANCIAL_WORK = "financial-work",
  /** Used by both domains */
  SHARED = "shared",
  /** Infrastructure / not domain-specific */
  INFRASTRUCTURE = "infrastructure",
}

// ─── Language Enum ───────────────────────────────────────────────────────────

/**
 * Languages supported by Claude Agent SDK and language analyzers.
 * Maps to cowork-plugin-customizer language detection.
 * @see https://github.com/anthropics/knowledge-work-plugins/blob/main/cowork-plugin-management/skills/cowork-plugin-customizer
 */
export enum SupportedLanguage {
  TYPESCRIPT = "typescript",
  JAVASCRIPT = "javascript",
  PYTHON = "python",
  RUST = "rust",
  GO = "go",
  JAVA = "java",
  CSHARP = "csharp",
  SWIFT = "swift",
  RUBY = "ruby",
  PHP = "php",
  CPP = "cpp",
  C = "c",
  KOTLIN = "kotlin",
  SCALA = "scala",
  ELIXIR = "elixir",
  SHELL = "shell",
}

// ─── MCP Server Definition ───────────────────────────────────────────────────

export interface McpServerEntry {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Brief description */
  description: string;
  /** Who maintains it */
  origin: McpOrigin;
  /** Transport type */
  transport: McpTransport;
  /** Functional category */
  category: McpCategory;
  /** npm package name (if published to npm) */
  npmPackage?: string;
  /** Pinned version */
  pinnedVersion?: string;
  /** GitHub repository */
  repo?: string;
  /** Work domains that recommend this MCP */
  domains: WorkDomain[];
  /** Whether this is a Claude.ai built-in (available without config) */
  builtIn?: boolean;
  /** Language of the server implementation */
  implLanguage?: SupportedLanguage;
  /** Canonical SDK packages for this MCP's ecosystem */
  canonicalSdkPackages?: CanonicalPackage[];
}

export interface CanonicalPackage {
  /** npm (or pypi/cargo/etc.) package name */
  name: string;
  /** Pinned version */
  version: string;
  /** Package registry */
  registry: "npm" | "pypi" | "cargo" | "go" | "maven" | "nuget" | "rubygems";
  /** What language this package targets */
  language: SupportedLanguage;
  /** Is this a direct dependency we install? */
  installed: boolean;
}

// ─── Official MCP Server Registry ────────────────────────────────────────────

/**
 * @frontmatter
 * ---
 * dataSource: github.com/modelcontextprotocol/servers + npm registry
 * lastUpdated: "2026-03-11"
 * totalServers: 47
 * ---
 */
export const MCP_SERVERS: McpServerEntry[] = [
  // ── Reference Servers (MCP Steering Group) ──────────────────────────────

  {
    id: "mcp-filesystem",
    name: "Filesystem",
    description: "Secure file operations with configurable access controls",
    origin: McpOrigin.REFERENCE,
    transport: McpTransport.STDIO,
    category: McpCategory.FILESYSTEM,
    npmPackage: "@modelcontextprotocol/server-filesystem",
    pinnedVersion: "2026.1.14",
    repo: "modelcontextprotocol/servers",
    domains: [WorkDomain.SHARED],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-memory",
    name: "Memory",
    description: "Knowledge graph-based persistent memory system",
    origin: McpOrigin.REFERENCE,
    transport: McpTransport.STDIO,
    category: McpCategory.MEMORY,
    npmPackage: "@modelcontextprotocol/server-memory",
    pinnedVersion: "2026.1.26",
    repo: "modelcontextprotocol/servers",
    domains: [WorkDomain.SHARED],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-sequential-thinking",
    name: "Sequential Thinking",
    description: "Dynamic and reflective problem-solving through thought sequences",
    origin: McpOrigin.REFERENCE,
    transport: McpTransport.STDIO,
    category: McpCategory.REASONING,
    npmPackage: "@modelcontextprotocol/server-sequential-thinking",
    pinnedVersion: "2025.12.18",
    repo: "modelcontextprotocol/servers",
    domains: [WorkDomain.KNOWLEDGE_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-everything",
    name: "Everything",
    description: "Reference/test server exercising all MCP protocol features",
    origin: McpOrigin.REFERENCE,
    transport: McpTransport.STDIO,
    category: McpCategory.REFERENCE,
    npmPackage: "@modelcontextprotocol/server-everything",
    pinnedVersion: "2026.1.26",
    repo: "modelcontextprotocol/servers",
    domains: [WorkDomain.INFRASTRUCTURE],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-fetch",
    name: "Fetch",
    description: "Web content fetching and conversion for efficient LLM usage",
    origin: McpOrigin.REFERENCE,
    transport: McpTransport.STDIO,
    category: McpCategory.SEARCH,
    repo: "modelcontextprotocol/servers",
    domains: [WorkDomain.SHARED],
    implLanguage: SupportedLanguage.PYTHON,
  },
  {
    id: "mcp-git",
    name: "Git",
    description: "Tools to read, search, and manipulate Git repositories",
    origin: McpOrigin.REFERENCE,
    transport: McpTransport.STDIO,
    category: McpCategory.VERSION_CONTROL,
    repo: "modelcontextprotocol/servers",
    domains: [WorkDomain.KNOWLEDGE_WORK],
    implLanguage: SupportedLanguage.PYTHON,
  },
  {
    id: "mcp-time",
    name: "Time",
    description: "Time and timezone conversion capabilities",
    origin: McpOrigin.REFERENCE,
    transport: McpTransport.STDIO,
    category: McpCategory.PRODUCTIVITY,
    repo: "modelcontextprotocol/servers",
    domains: [WorkDomain.SHARED],
    implLanguage: SupportedLanguage.PYTHON,
  },

  // ── Official Integrations (Vendor-Maintained) ───────────────────────────

  {
    id: "mcp-github",
    name: "GitHub",
    description: "GitHub API integration — issues, PRs, repos, code search",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.VERSION_CONTROL,
    repo: "github/github-mcp-server",
    domains: [WorkDomain.KNOWLEDGE_WORK],
    implLanguage: SupportedLanguage.GO,
  },
  {
    id: "mcp-slack",
    name: "Slack",
    description: "Slack workspace integration — channels, messages, search",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.COMMUNICATION,
    repo: "anthropics/slack-mcp-server",
    domains: [WorkDomain.SHARED],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-google-drive",
    name: "Google Drive",
    description: "Google Drive file search and access",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.PRODUCTIVITY,
    repo: "anthropics/google-drive-mcp-server",
    domains: [WorkDomain.KNOWLEDGE_WORK, WorkDomain.FINANCIAL_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-google-maps",
    name: "Google Maps",
    description: "Google Maps Platform — geocoding, directions, places",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.PRODUCTIVITY,
    repo: "anthropics/google-maps-mcp-server",
    domains: [WorkDomain.INFRASTRUCTURE],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-brave-search",
    name: "Brave Search",
    description: "Web and local search using Brave's Search API",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.SEARCH,
    repo: "anthropics/brave-search-mcp-server",
    domains: [WorkDomain.SHARED],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-puppeteer",
    name: "Puppeteer",
    description: "Browser automation via Puppeteer",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.BROWSER,
    repo: "anthropics/puppeteer-mcp-server",
    domains: [WorkDomain.KNOWLEDGE_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-postgres",
    name: "PostgreSQL",
    description: "PostgreSQL database read access and schema inspection",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.DATABASE,
    repo: "anthropics/postgres-mcp-server",
    domains: [WorkDomain.SHARED],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-sqlite",
    name: "SQLite",
    description: "SQLite database operations and business intelligence",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.DATABASE,
    repo: "anthropics/sqlite-mcp-server",
    domains: [WorkDomain.FINANCIAL_WORK, WorkDomain.KNOWLEDGE_WORK],
    implLanguage: SupportedLanguage.PYTHON,
  },
  {
    id: "mcp-sentry",
    name: "Sentry",
    description: "Sentry issue tracking and error monitoring",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.MONITORING,
    repo: "getsentry/sentry-mcp-server",
    domains: [WorkDomain.KNOWLEDGE_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-linear",
    name: "Linear",
    description: "Linear project management — issues, projects, teams",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.PRODUCTIVITY,
    repo: "linear/linear-mcp-server",
    domains: [WorkDomain.KNOWLEDGE_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-notion",
    name: "Notion",
    description: "Notion workspace — pages, databases, search",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.PRODUCTIVITY,
    repo: "makenotion/notion-mcp-server",
    domains: [WorkDomain.KNOWLEDGE_WORK, WorkDomain.FINANCIAL_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-cloudflare",
    name: "Cloudflare",
    description: "Cloudflare Workers, KV, D1, R2 management",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.CLOUD,
    repo: "cloudflare/mcp-server-cloudflare",
    domains: [WorkDomain.KNOWLEDGE_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-stripe",
    name: "Stripe",
    description: "Stripe payments API — customers, charges, subscriptions",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.FINANCE,
    repo: "stripe/stripe-mcp-server",
    domains: [WorkDomain.FINANCIAL_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-plaid",
    name: "Plaid",
    description: "Plaid financial data — accounts, transactions, balances",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.FINANCE,
    repo: "plaid/plaid-mcp-server",
    domains: [WorkDomain.FINANCIAL_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-perplexity",
    name: "Perplexity",
    description: "Perplexity AI search and research assistant",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.SEARCH,
    repo: "perplexityai/modelcontextprotocol",
    domains: [WorkDomain.KNOWLEDGE_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-datadog",
    name: "Datadog",
    description: "Datadog monitoring — metrics, logs, traces, dashboards",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.MONITORING,
    repo: "DataDog/datadog-mcp-server",
    domains: [WorkDomain.KNOWLEDGE_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-figma",
    name: "Figma",
    description: "Figma design file access and inspection",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.DESIGN,
    domains: [WorkDomain.KNOWLEDGE_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-jira",
    name: "Jira",
    description: "Atlassian Jira project management integration",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.PRODUCTIVITY,
    repo: "atlassian/jira-mcp-server",
    domains: [WorkDomain.KNOWLEDGE_WORK, WorkDomain.FINANCIAL_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-confluence",
    name: "Confluence",
    description: "Atlassian Confluence documentation and wiki access",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.PRODUCTIVITY,
    repo: "atlassian/confluence-mcp-server",
    domains: [WorkDomain.KNOWLEDGE_WORK],
    implLanguage: SupportedLanguage.TYPESCRIPT,
  },
  {
    id: "mcp-aws",
    name: "AWS",
    description: "AWS services integration — S3, Lambda, CloudWatch, etc.",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STDIO,
    category: McpCategory.CLOUD,
    repo: "aws/aws-mcp-server",
    domains: [WorkDomain.KNOWLEDGE_WORK],
    implLanguage: SupportedLanguage.PYTHON,
  },

  // ── Claude.ai Built-in MCPs ─────────────────────────────────────────────

  {
    id: "mcp-web-search",
    name: "Web Search (Built-in)",
    description: "Claude.ai built-in web search capability",
    origin: McpOrigin.ANTHROPIC_FIRST_PARTY,
    transport: McpTransport.SDK,
    category: McpCategory.SEARCH,
    domains: [WorkDomain.SHARED],
    builtIn: true,
  },
  {
    id: "mcp-web-fetch",
    name: "Web Fetch (Built-in)",
    description: "Claude.ai built-in URL fetching and content extraction",
    origin: McpOrigin.ANTHROPIC_FIRST_PARTY,
    transport: McpTransport.SDK,
    category: McpCategory.SEARCH,
    domains: [WorkDomain.SHARED],
    builtIn: true,
  },

  // ── Remote Connectors (Claude.ai Connectors Directory) ──────────────────

  {
    id: "mcp-asana",
    name: "Asana",
    description: "Asana project management — tasks, projects, workspaces",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STREAMABLE_HTTP,
    category: McpCategory.PRODUCTIVITY,
    domains: [WorkDomain.KNOWLEDGE_WORK],
  },
  {
    id: "mcp-monday",
    name: "Monday.com",
    description: "Monday.com work management — boards, items, automations",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STREAMABLE_HTTP,
    category: McpCategory.PRODUCTIVITY,
    domains: [WorkDomain.KNOWLEDGE_WORK],
  },
  {
    id: "mcp-clickup",
    name: "ClickUp",
    description: "ClickUp project management — tasks, docs, goals",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STREAMABLE_HTTP,
    category: McpCategory.PRODUCTIVITY,
    domains: [WorkDomain.KNOWLEDGE_WORK],
  },
  {
    id: "mcp-box",
    name: "Box",
    description: "Box content management — files, folders, collaboration",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STREAMABLE_HTTP,
    category: McpCategory.PRODUCTIVITY,
    domains: [WorkDomain.KNOWLEDGE_WORK, WorkDomain.FINANCIAL_WORK],
  },
  {
    id: "mcp-canva",
    name: "Canva",
    description: "Canva design platform — templates, assets, collaboration",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STREAMABLE_HTTP,
    category: McpCategory.DESIGN,
    domains: [WorkDomain.KNOWLEDGE_WORK],
  },
  {
    id: "mcp-miro",
    name: "Miro",
    description: "Miro collaborative whiteboard — boards, shapes, diagrams",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STREAMABLE_HTTP,
    category: McpCategory.DESIGN,
    domains: [WorkDomain.KNOWLEDGE_WORK],
  },
  {
    id: "mcp-vercel",
    name: "Vercel",
    description: "Vercel deployment platform — projects, deployments, domains",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STREAMABLE_HTTP,
    category: McpCategory.CLOUD,
    domains: [WorkDomain.KNOWLEDGE_WORK],
  },
  {
    id: "mcp-supabase",
    name: "Supabase",
    description: "Supabase backend — database, auth, storage, edge functions",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STREAMABLE_HTTP,
    category: McpCategory.DATABASE,
    domains: [WorkDomain.KNOWLEDGE_WORK],
  },
  {
    id: "mcp-hubspot",
    name: "HubSpot",
    description: "HubSpot CRM — contacts, deals, tickets, marketing",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STREAMABLE_HTTP,
    category: McpCategory.PRODUCTIVITY,
    domains: [WorkDomain.KNOWLEDGE_WORK, WorkDomain.FINANCIAL_WORK],
  },
  {
    id: "mcp-intercom",
    name: "Intercom",
    description: "Intercom customer messaging — conversations, contacts, articles",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STREAMABLE_HTTP,
    category: McpCategory.COMMUNICATION,
    domains: [WorkDomain.KNOWLEDGE_WORK],
  },
  {
    id: "mcp-zapier",
    name: "Zapier",
    description: "Zapier automation — triggers, actions, multi-app workflows",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.STREAMABLE_HTTP,
    category: McpCategory.PRODUCTIVITY,
    domains: [WorkDomain.SHARED],
  },
  {
    id: "mcp-square",
    name: "Square",
    description: "Square payments and commerce — payments, catalog, orders",
    origin: McpOrigin.OFFICIAL_INTEGRATION,
    transport: McpTransport.SSE,
    category: McpCategory.FINANCE,
    domains: [WorkDomain.FINANCIAL_WORK],
  },
];

// ─── Anthropic Official npm Packages ─────────────────────────────────────────

/**
 * @frontmatter
 * ---
 * dataSource: npm registry (@anthropic-ai scope)
 * lastUpdated: "2026-03-11"
 * totalPackages: 10
 * ---
 */
export const ANTHROPIC_PACKAGES: CanonicalPackage[] = [
  { name: "@anthropic-ai/sdk",               version: "0.78.0",  registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@anthropic-ai/claude-agent-sdk",   version: "0.2.72",  registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@anthropic-ai/claude-code",        version: "2.1.72",  registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@anthropic-ai/bedrock-sdk",        version: "0.26.4",  registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@anthropic-ai/vertex-sdk",         version: "0.14.4",  registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@anthropic-ai/foundry-sdk",        version: "0.2.3",   registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@anthropic-ai/tokenizer",          version: "0.0.4",   registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@anthropic-ai/sandbox-runtime",    version: "0.0.40",  registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@anthropic-ai/dxt",               version: "0.2.6",   registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@anthropic-ai/mcpb",              version: "2.1.2",   registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
];

// ─── MCP Official npm Packages ───────────────────────────────────────────────

/**
 * @frontmatter
 * ---
 * dataSource: npm registry (@modelcontextprotocol scope)
 * lastUpdated: "2026-03-11"
 * totalPackages: 8
 * ---
 */
export const MCP_PACKAGES: CanonicalPackage[] = [
  { name: "@modelcontextprotocol/sdk",                       version: "1.27.1",      registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@modelcontextprotocol/ext-apps",                  version: "1.2.2",       registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@modelcontextprotocol/inspector",                 version: "0.21.1",      registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@modelcontextprotocol/conformance",               version: "0.1.15",      registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@modelcontextprotocol/server-everything",         version: "2026.1.26",   registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@modelcontextprotocol/server-filesystem",         version: "2026.1.14",   registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@modelcontextprotocol/server-memory",             version: "2026.1.26",   registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
  { name: "@modelcontextprotocol/server-sequential-thinking", version: "2025.12.18", registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
];

// ─── MCP SDK Packages by Language ────────────────────────────────────────────

/**
 * Official MCP SDKs for each language supported by Agent SDK / Anthropic ecosystem.
 *
 * @frontmatter
 * ---
 * dataSource: github.com/modelcontextprotocol org repos
 * lastUpdated: "2026-03-11"
 * ---
 *
 * Maps to the cowork-plugin-customizer language analyzers:
 * @see https://github.com/anthropics/knowledge-work-plugins/blob/main/cowork-plugin-management/skills/cowork-plugin-customizer
 */
export const MCP_SDKS_BY_LANGUAGE: Record<SupportedLanguage, CanonicalPackage[]> = {
  [SupportedLanguage.TYPESCRIPT]: [
    { name: "@modelcontextprotocol/sdk",   version: "1.27.1",  registry: "npm",     language: SupportedLanguage.TYPESCRIPT, installed: true },
    { name: "@anthropic-ai/sdk",           version: "0.78.0",  registry: "npm",     language: SupportedLanguage.TYPESCRIPT, installed: true },
    { name: "@anthropic-ai/claude-agent-sdk", version: "0.2.72", registry: "npm",   language: SupportedLanguage.TYPESCRIPT, installed: true },
  ],
  [SupportedLanguage.JAVASCRIPT]: [
    { name: "@modelcontextprotocol/sdk",   version: "1.27.1",  registry: "npm",     language: SupportedLanguage.JAVASCRIPT, installed: false },
    { name: "@anthropic-ai/sdk",           version: "0.78.0",  registry: "npm",     language: SupportedLanguage.JAVASCRIPT, installed: false },
  ],
  [SupportedLanguage.PYTHON]: [
    { name: "anthropic",                   version: "0.49.0",  registry: "pypi",    language: SupportedLanguage.PYTHON, installed: false },
    { name: "mcp",                         version: "1.8.1",   registry: "pypi",    language: SupportedLanguage.PYTHON, installed: false },
    { name: "anthropic-bedrock",           version: "0.14.0",  registry: "pypi",    language: SupportedLanguage.PYTHON, installed: false },
  ],
  [SupportedLanguage.RUST]: [
    { name: "mcp-sdk",                     version: "0.1.0",   registry: "cargo",   language: SupportedLanguage.RUST, installed: false },
  ],
  [SupportedLanguage.GO]: [
    { name: "github.com/mark3labs/mcp-go", version: "0.27.0",  registry: "go",      language: SupportedLanguage.GO, installed: false },
  ],
  [SupportedLanguage.JAVA]: [
    { name: "io.modelcontextprotocol:sdk", version: "0.10.0",  registry: "maven",   language: SupportedLanguage.JAVA, installed: false },
  ],
  [SupportedLanguage.CSHARP]: [
    { name: "ModelContextProtocol",        version: "0.5.0",   registry: "nuget",   language: SupportedLanguage.CSHARP, installed: false },
  ],
  [SupportedLanguage.SWIFT]: [
    { name: "mcp-swift-sdk",               version: "0.7.1",   registry: "npm",     language: SupportedLanguage.SWIFT, installed: false },
  ],
  [SupportedLanguage.RUBY]: [
    { name: "mcp",                         version: "0.3.1",   registry: "rubygems", language: SupportedLanguage.RUBY, installed: false },
  ],
  [SupportedLanguage.PHP]:     [],
  [SupportedLanguage.CPP]:     [],
  [SupportedLanguage.C]:       [],
  [SupportedLanguage.KOTLIN]: [
    { name: "io.modelcontextprotocol:sdk", version: "0.10.0",  registry: "maven",   language: SupportedLanguage.KOTLIN, installed: false },
  ],
  [SupportedLanguage.SCALA]:   [],
  [SupportedLanguage.ELIXIR]:  [],
  [SupportedLanguage.SHELL]:   [],
};

// ─── Bridge Enums: knowledge-work-plugins ────────────────────────────────────

/**
 * MCPs recommended by knowledge-work-plugins for knowledge workers:
 * engineers, PMs, designers, researchers.
 *
 * @frontmatter
 * ---
 * dataSource: "jadecli/knowledge-work-plugins @ 477c893b"
 * lastUpdated: "2026-03-11"
 * upstreamSkillRef: "cowork-plugin-management/skills/cowork-plugin-customizer"
 * ---
 */
export const KNOWLEDGE_WORK_RECOMMENDED_MCPS = [
  "mcp-filesystem",
  "mcp-memory",
  "mcp-sequential-thinking",
  "mcp-git",
  "mcp-github",
  "mcp-fetch",
  "mcp-brave-search",
  "mcp-slack",
  "mcp-google-drive",
  "mcp-notion",
  "mcp-linear",
  "mcp-jira",
  "mcp-confluence",
  "mcp-sentry",
  "mcp-datadog",
  "mcp-cloudflare",
  "mcp-puppeteer",
  "mcp-postgres",
  "mcp-sqlite",
  "mcp-perplexity",
  "mcp-figma",
  "mcp-aws",
  "mcp-web-search",
  "mcp-web-fetch",
] as const;

// ─── Bridge Enums: financial-work-plugins ────────────────────────────────────

/**
 * MCPs recommended by financial-work-plugins for financial workers:
 * analysts, accountants, CFOs, compliance, treasury.
 *
 * @frontmatter
 * ---
 * dataSource: "anthropics/financial-services-plugins"
 * lastUpdated: "2026-03-11"
 * ---
 */
export const FINANCIAL_WORK_RECOMMENDED_MCPS = [
  "mcp-filesystem",
  "mcp-memory",
  "mcp-fetch",
  "mcp-brave-search",
  "mcp-slack",
  "mcp-google-drive",
  "mcp-notion",
  "mcp-jira",
  "mcp-postgres",
  "mcp-sqlite",
  "mcp-stripe",
  "mcp-plaid",
  "mcp-web-search",
  "mcp-web-fetch",
] as const;

// ─── Cross-reference: MCPs appearing in both domains ─────────────────────────

export const SHARED_MCPS = KNOWLEDGE_WORK_RECOMMENDED_MCPS.filter(
  (id) => (FINANCIAL_WORK_RECOMMENDED_MCPS as readonly string[]).includes(id)
);

// ─── Query Helpers ───────────────────────────────────────────────────────────

/** Get all MCPs for a given domain */
export function getMcpsByDomain(domain: WorkDomain): McpServerEntry[] {
  return MCP_SERVERS.filter((s) => s.domains.includes(domain));
}

/** Get all MCPs by category */
export function getMcpsByCategory(category: McpCategory): McpServerEntry[] {
  return MCP_SERVERS.filter((s) => s.category === category);
}

/** Get all MCPs by origin */
export function getMcpsByOrigin(origin: McpOrigin): McpServerEntry[] {
  return MCP_SERVERS.filter((s) => s.origin === origin);
}

/** Get canonical SDK packages for a language */
export function getSdkPackagesForLanguage(lang: SupportedLanguage): CanonicalPackage[] {
  return MCP_SDKS_BY_LANGUAGE[lang] ?? [];
}

/** Get all installed canonical packages (npm dependencies we pin) */
export function getInstalledPackages(): CanonicalPackage[] {
  return [...ANTHROPIC_PACKAGES, ...MCP_PACKAGES].filter((p) => p.installed);
}

/** Get all packages that need version monitoring */
export function getMonitoredPackages(): Array<{ name: string; current: string; registry: string }> {
  return [...ANTHROPIC_PACKAGES, ...MCP_PACKAGES].map((p) => ({
    name: p.name,
    current: p.version,
    registry: p.registry,
  }));
}

/** Resolve an MCP server entry by id */
export function getMcpById(id: string): McpServerEntry | undefined {
  return MCP_SERVERS.find((s) => s.id === id);
}
