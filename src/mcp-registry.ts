/**
 * MCP Registry — Dynamic enums for all officially supported Anthropic MCPs
 *
 * Provides:
 *   - MCPServer enum with frontmatter (data source, last updated)
 *   - Bridge enums mapping MCPs to knowledge-work-plugins and financial-work-plugins
 *   - npm package pinning for MCP servers with TypeScript packages
 *   - Category-based discovery aligned with upstream cowork-plugin-customizer
 *
 * Upstream ref: anthropics/knowledge-work-plugins → cowork-plugin-management/skills/cowork-plugin-customizer
 * MCP spec ref: https://github.com/modelcontextprotocol/servers
 */

// ─── Frontmatter ──────────────────────────────────────────────────────────────

export const MCP_REGISTRY_META = {
  dataSource: "https://github.com/modelcontextprotocol/servers + npm registry",
  lastUpdated: "2026-03-11",
  mcpSdkVersion: "1.27.1",
  registryUrl: "https://registry.modelcontextprotocol.io",
} as const;

// ─── MCP Server Status ────────────────────────────────────────────────────────

export type MCPServerStatus = "active" | "archived" | "third-party";

// ─── MCP Category (aligned with upstream cowork-plugin-customizer) ────────────

export const MCPCategory = {
  PROJECT_MANAGEMENT: "project-management",
  SOFTWARE_CODING: "software-coding",
  CHAT: "chat",
  DOCUMENTS: "documents",
  CALENDAR: "calendar",
  EMAIL: "email",
  DESIGN_GRAPHICS: "design-graphics",
  ANALYTICS_BI: "analytics-bi",
  CRM: "crm",
  WIKI_KNOWLEDGE_BASE: "wiki-knowledge-base",
  DATA_WAREHOUSE: "data-warehouse",
  CONVERSATION_INTELLIGENCE: "conversation-intelligence",
  FILESYSTEM: "filesystem",
  DATABASE: "database",
  SEARCH: "search",
  MEMORY: "memory",
  REASONING: "reasoning",
  TIME: "time",
  BROWSER: "browser",
  FINANCE: "finance",
  OBSERVABILITY: "observability",
  TESTING: "testing",
} as const;

export type MCPCategoryValue = (typeof MCPCategory)[keyof typeof MCPCategory];

// ─── MCP Server Definition ────────────────────────────────────────────────────

export interface MCPServerDefinition {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Short description */
  description: string;
  /** npm package name (null if Python-only or not on npm) */
  npmPackage: string | null;
  /** Pinned version (null if not on npm) */
  pinnedVersion: string | null;
  /** Python package name via pip/uvx (null if TS-only) */
  pythonPackage: string | null;
  /** Primary category */
  category: MCPCategoryValue;
  /** Additional categories */
  additionalCategories: MCPCategoryValue[];
  /** active = current reference, archived = servers-archived repo, third-party = company-maintained */
  status: MCPServerStatus;
  /** Maintained by */
  maintainer: string;
  /** Source repository URL */
  sourceUrl: string;
}

// ─── Reference MCP Servers (active, maintained by MCP steering group) ─────────

export const REFERENCE_MCP_SERVERS: MCPServerDefinition[] = [
  {
    id: "everything",
    name: "Everything",
    description: "Reference/test server with prompts, resources, and tools",
    npmPackage: "@modelcontextprotocol/server-everything",
    pinnedVersion: "2026.1.26",
    pythonPackage: null,
    category: MCPCategory.TESTING,
    additionalCategories: [],
    status: "active",
    maintainer: "MCP Steering Group",
    sourceUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/everything",
  },
  {
    id: "filesystem",
    name: "Filesystem",
    description: "Secure file operations with configurable access controls",
    npmPackage: "@modelcontextprotocol/server-filesystem",
    pinnedVersion: "2026.1.14",
    pythonPackage: null,
    category: MCPCategory.FILESYSTEM,
    additionalCategories: [MCPCategory.DOCUMENTS],
    status: "active",
    maintainer: "MCP Steering Group",
    sourceUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
  },
  {
    id: "memory",
    name: "Memory",
    description: "Knowledge graph-based persistent memory system",
    npmPackage: "@modelcontextprotocol/server-memory",
    pinnedVersion: "2026.1.26",
    pythonPackage: null,
    category: MCPCategory.MEMORY,
    additionalCategories: [MCPCategory.WIKI_KNOWLEDGE_BASE],
    status: "active",
    maintainer: "MCP Steering Group",
    sourceUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
  },
  {
    id: "fetch",
    name: "Fetch",
    description: "Web content fetching and conversion for efficient LLM usage",
    npmPackage: null, // Python-only (mcp-server-fetch)
    pinnedVersion: null,
    pythonPackage: "mcp-server-fetch",
    category: MCPCategory.SEARCH,
    additionalCategories: [MCPCategory.DOCUMENTS],
    status: "active",
    maintainer: "MCP Steering Group",
    sourceUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
  },
  {
    id: "git",
    name: "Git",
    description: "Tools to read, search, and manipulate Git repositories",
    npmPackage: null, // Python-only (mcp-server-git)
    pinnedVersion: null,
    pythonPackage: "mcp-server-git",
    category: MCPCategory.SOFTWARE_CODING,
    additionalCategories: [MCPCategory.FILESYSTEM],
    status: "active",
    maintainer: "MCP Steering Group",
    sourceUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/git",
  },
  {
    id: "sequential-thinking",
    name: "Sequential Thinking",
    description: "Dynamic and reflective problem-solving through thought sequences",
    npmPackage: null, // Not published to npm
    pinnedVersion: null,
    pythonPackage: null,
    category: MCPCategory.REASONING,
    additionalCategories: [],
    status: "active",
    maintainer: "MCP Steering Group",
    sourceUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
  },
  {
    id: "time",
    name: "Time",
    description: "Time and timezone conversion capabilities",
    npmPackage: null, // Python-only
    pinnedVersion: null,
    pythonPackage: "mcp-server-time",
    category: MCPCategory.TIME,
    additionalCategories: [MCPCategory.CALENDAR],
    status: "active",
    maintainer: "MCP Steering Group",
    sourceUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/time",
  },
];

// ─── Archived MCP Servers (moved to servers-archived, still functional) ───────

export const ARCHIVED_MCP_SERVERS: MCPServerDefinition[] = [
  {
    id: "github",
    name: "GitHub",
    description: "GitHub API integration for repos, issues, PRs, and more",
    npmPackage: "@modelcontextprotocol/server-github",
    pinnedVersion: "2025.4.8",
    pythonPackage: null,
    category: MCPCategory.SOFTWARE_CODING,
    additionalCategories: [MCPCategory.PROJECT_MANAGEMENT],
    status: "archived",
    maintainer: "MCP Steering Group (archived)",
    sourceUrl: "https://github.com/modelcontextprotocol/servers-archived",
  },
  {
    id: "gitlab",
    name: "GitLab",
    description: "GitLab API integration for projects, issues, and merge requests",
    npmPackage: "@modelcontextprotocol/server-gitlab",
    pinnedVersion: "2025.4.25",
    pythonPackage: null,
    category: MCPCategory.SOFTWARE_CODING,
    additionalCategories: [MCPCategory.PROJECT_MANAGEMENT],
    status: "archived",
    maintainer: "MCP Steering Group (archived)",
    sourceUrl: "https://github.com/modelcontextprotocol/servers-archived",
  },
  {
    id: "brave-search",
    name: "Brave Search",
    description: "Web and local search using the Brave Search API",
    npmPackage: "@modelcontextprotocol/server-brave-search",
    pinnedVersion: "0.6.2",
    pythonPackage: null,
    category: MCPCategory.SEARCH,
    additionalCategories: [],
    status: "archived",
    maintainer: "MCP Steering Group (archived)",
    sourceUrl: "https://github.com/modelcontextprotocol/servers-archived",
  },
  {
    id: "puppeteer",
    name: "Puppeteer",
    description: "Browser automation and web scraping via Puppeteer",
    npmPackage: "@modelcontextprotocol/server-puppeteer",
    pinnedVersion: "2025.5.12",
    pythonPackage: null,
    category: MCPCategory.BROWSER,
    additionalCategories: [MCPCategory.TESTING],
    status: "archived",
    maintainer: "MCP Steering Group (archived)",
    sourceUrl: "https://github.com/modelcontextprotocol/servers-archived",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Slack workspace integration for channels, messages, and users",
    npmPackage: "@modelcontextprotocol/server-slack",
    pinnedVersion: "2025.4.25",
    pythonPackage: null,
    category: MCPCategory.CHAT,
    additionalCategories: [MCPCategory.CONVERSATION_INTELLIGENCE],
    status: "archived",
    maintainer: "MCP Steering Group (archived)",
    sourceUrl: "https://github.com/modelcontextprotocol/servers-archived",
  },
  {
    id: "google-maps",
    name: "Google Maps",
    description: "Google Maps geocoding, directions, and place search",
    npmPackage: "@modelcontextprotocol/server-google-maps",
    pinnedVersion: "0.6.2",
    pythonPackage: null,
    category: MCPCategory.SEARCH,
    additionalCategories: [],
    status: "archived",
    maintainer: "MCP Steering Group (archived)",
    sourceUrl: "https://github.com/modelcontextprotocol/servers-archived",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "Read-only PostgreSQL database access with schema inspection",
    npmPackage: "@modelcontextprotocol/server-postgres",
    pinnedVersion: "0.6.2",
    pythonPackage: null,
    category: MCPCategory.DATABASE,
    additionalCategories: [MCPCategory.DATA_WAREHOUSE, MCPCategory.ANALYTICS_BI],
    status: "archived",
    maintainer: "MCP Steering Group (archived)",
    sourceUrl: "https://github.com/modelcontextprotocol/servers-archived",
  },
  {
    id: "redis",
    name: "Redis",
    description: "Redis key-value store operations",
    npmPackage: "@modelcontextprotocol/server-redis",
    pinnedVersion: "0.6.2",
    pythonPackage: null,
    category: MCPCategory.DATABASE,
    additionalCategories: [MCPCategory.MEMORY],
    status: "archived",
    maintainer: "MCP Steering Group (archived)",
    sourceUrl: "https://github.com/modelcontextprotocol/servers-archived",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Google Drive file search and content access",
    npmPackage: "@modelcontextprotocol/server-gdrive",
    pinnedVersion: "2025.1.14",
    pythonPackage: null,
    category: MCPCategory.DOCUMENTS,
    additionalCategories: [MCPCategory.FILESYSTEM],
    status: "archived",
    maintainer: "MCP Steering Group (archived)",
    sourceUrl: "https://github.com/modelcontextprotocol/servers-archived",
  },
  {
    id: "aws-kb-retrieval",
    name: "AWS Knowledge Base Retrieval",
    description: "AWS Bedrock Knowledge Base retrieval via RAG",
    npmPackage: "@modelcontextprotocol/server-aws-kb-retrieval",
    pinnedVersion: "0.6.2",
    pythonPackage: null,
    category: MCPCategory.WIKI_KNOWLEDGE_BASE,
    additionalCategories: [MCPCategory.SEARCH],
    status: "archived",
    maintainer: "MCP Steering Group (archived)",
    sourceUrl: "https://github.com/modelcontextprotocol/servers-archived",
  },
  {
    id: "everart",
    name: "EverArt",
    description: "AI image generation via EverArt models",
    npmPackage: "@modelcontextprotocol/server-everart",
    pinnedVersion: "0.6.2",
    pythonPackage: null,
    category: MCPCategory.DESIGN_GRAPHICS,
    additionalCategories: [],
    status: "archived",
    maintainer: "MCP Steering Group (archived)",
    sourceUrl: "https://github.com/modelcontextprotocol/servers-archived",
  },
];

// ─── All MCP Servers ──────────────────────────────────────────────────────────

export const ALL_MCP_SERVERS: MCPServerDefinition[] = [
  ...REFERENCE_MCP_SERVERS,
  ...ARCHIVED_MCP_SERVERS,
];

// ─── Bridge Enums: Knowledge-Work-Plugins Recommendations ─────────────────────

/**
 * MCPs recommended for knowledge-work-plugins (upstream: anthropics/knowledge-work-plugins).
 * These support research, writing, code review, documentation, and knowledge management.
 */
export const KWP_RECOMMENDED_MCPS = {
  /** Core knowledge work */
  FILESYSTEM: "filesystem",
  MEMORY: "memory",
  FETCH: "fetch",
  GIT: "git",
  GITHUB: "github",
  SEQUENTIAL_THINKING: "sequential-thinking",
  /** Documents & collaboration */
  GOOGLE_DRIVE: "google-drive",
  SLACK: "slack",
  /** Search & research */
  BRAVE_SEARCH: "brave-search",
  PUPPETEER: "puppeteer",
  /** Knowledge bases */
  AWS_KB_RETRIEVAL: "aws-kb-retrieval",
} as const;

export type KWPRecommendedMCP = (typeof KWP_RECOMMENDED_MCPS)[keyof typeof KWP_RECOMMENDED_MCPS];

/**
 * MCPs recommended for financial-work-plugins.
 * These support data analysis, database access, financial APIs, and reporting.
 */
export const FWP_RECOMMENDED_MCPS = {
  /** Data infrastructure */
  POSTGRES: "postgres",
  REDIS: "redis",
  FILESYSTEM: "filesystem",
  /** Research & data */
  FETCH: "fetch",
  BRAVE_SEARCH: "brave-search",
  MEMORY: "memory",
  /** Code & automation */
  GIT: "git",
  GITHUB: "github",
  PUPPETEER: "puppeteer",
  /** Time-sensitive operations */
  TIME: "time",
} as const;

export type FWPRecommendedMCP = (typeof FWP_RECOMMENDED_MCPS)[keyof typeof FWP_RECOMMENDED_MCPS];

/**
 * MCPs that appear in BOTH knowledge-work and financial-work plugin sets.
 */
export const SHARED_MCPS = [
  "filesystem",
  "memory",
  "fetch",
  "git",
  "github",
  "brave-search",
  "puppeteer",
] as const;

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

export function getMCPById(id: string): MCPServerDefinition | undefined {
  return ALL_MCP_SERVERS.find((s) => s.id === id);
}

export function getMCPsByCategory(category: MCPCategoryValue): MCPServerDefinition[] {
  return ALL_MCP_SERVERS.filter(
    (s) => s.category === category || s.additionalCategories.includes(category),
  );
}

export function getMCPsWithNpmPackage(): MCPServerDefinition[] {
  return ALL_MCP_SERVERS.filter((s) => s.npmPackage !== null);
}

export function getKWPMCPs(): MCPServerDefinition[] {
  const ids = new Set(Object.values(KWP_RECOMMENDED_MCPS));
  return ALL_MCP_SERVERS.filter((s) => ids.has(s.id as KWPRecommendedMCP));
}

export function getFWPMCPs(): MCPServerDefinition[] {
  const ids = new Set(Object.values(FWP_RECOMMENDED_MCPS));
  return ALL_MCP_SERVERS.filter((s) => ids.has(s.id as FWPRecommendedMCP));
}
