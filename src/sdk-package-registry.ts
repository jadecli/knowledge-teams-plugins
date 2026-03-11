/**
 * L1: Language-Specific SDK Package Registry
 *
 * Canonical registry of npm/pip packages optimized for:
 *   - Knowledge workers using Claude Agent SDK
 *   - Anthropic SDK-supported languages (TypeScript, Python)
 *   - MCP server packages that bridge knowledge-work-plugins and financial-work-plugins
 *
 * Abstraction levels:
 *   L1 (this file): Language-specific package pinning and monitoring
 *   L2: Prebuilt telemetry for cost/token management (see sdk-cost-metrics.ts)
 *   L3: XML agent files for turn/context/skill management (see agents/)
 */

// ─── Package Scope ────────────────────────────────────────────────────────────

export type PackageScope =
  | "anthropic-sdk"       // @anthropic-ai/* packages
  | "mcp-core"           // @modelcontextprotocol/sdk
  | "mcp-server"         // @modelcontextprotocol/server-*
  | "mcp-tooling"        // MCP inspector, etc.
  | "language-analyzer"  // TS/Python language tooling for Agent SDK
  | "telemetry"          // Monitoring, OTEL, cost tracking
  | "validation"         // Schema validation (zod, etc.)
  | "runtime"            // TSX, vitest, etc.
  ;

export type SupportedLanguage = "typescript" | "python";

// ─── Package Definition ───────────────────────────────────────────────────────

export interface PinnedPackage {
  /** npm or pip package name */
  name: string;
  /** Exact pinned version */
  pinnedVersion: string;
  /** Package scope for grouping */
  scope: PackageScope;
  /** Primary language */
  language: SupportedLanguage;
  /** Whether this is a production dependency (vs dev) */
  production: boolean;
  /** Brief description */
  description: string;
  /** Optional: which MCP server IDs this supports */
  supportsMCPs?: string[];
}

// ─── Anthropic SDK Packages (TypeScript) ──────────────────────────────────────

export const ANTHROPIC_TS_PACKAGES: PinnedPackage[] = [
  {
    name: "@anthropic-ai/claude-agent-sdk",
    pinnedVersion: "0.2.72",
    scope: "anthropic-sdk",
    language: "typescript",
    production: true,
    description: "Claude Agent SDK — query(), agent orchestration, session management",
  },
  {
    name: "@anthropic-ai/sdk",
    pinnedVersion: "0.78.0",
    scope: "anthropic-sdk",
    language: "typescript",
    production: true,
    description: "Anthropic REST API client — messages, token counting, admin API",
  },
  {
    name: "@anthropic-ai/bedrock-sdk",
    pinnedVersion: "0.26.4",
    scope: "anthropic-sdk",
    language: "typescript",
    production: true,
    description: "Claude on AWS Bedrock — same API surface, Bedrock auth",
  },
  {
    name: "@anthropic-ai/vertex-sdk",
    pinnedVersion: "0.14.4",
    scope: "anthropic-sdk",
    language: "typescript",
    production: true,
    description: "Claude on Google Vertex AI — same API surface, Google auth",
  },
  {
    name: "@anthropic-ai/foundry-sdk",
    pinnedVersion: "0.2.3",
    scope: "anthropic-sdk",
    language: "typescript",
    production: true,
    description: "Claude on Anthropic Foundry — dedicated capacity, custom deployments",
  },
  {
    name: "@anthropic-ai/tokenizer",
    pinnedVersion: "0.0.4",
    scope: "anthropic-sdk",
    language: "typescript",
    production: true,
    description: "Offline tokenizer (legacy, approximate for Claude 3+ models)",
  },
  {
    name: "@anthropic-ai/dxt",
    pinnedVersion: "0.2.6",
    scope: "anthropic-sdk",
    language: "typescript",
    production: true,
    description: "Desktop Extensions (DXT) toolkit for Claude Desktop plugins",
  },
  {
    name: "@anthropic-ai/mcpb",
    pinnedVersion: "2.1.2",
    scope: "anthropic-sdk",
    language: "typescript",
    production: true,
    description: "MCP Bundles (MCPB) toolkit for packaging MCP servers",
  },
];

// ─── MCP Core Packages (TypeScript) ───────────────────────────────────────────

export const MCP_CORE_TS_PACKAGES: PinnedPackage[] = [
  {
    name: "@modelcontextprotocol/sdk",
    pinnedVersion: "1.27.1",
    scope: "mcp-core",
    language: "typescript",
    production: true,
    description: "MCP SDK — server/client implementation, tool/resource/prompt types",
  },
  {
    name: "@modelcontextprotocol/inspector",
    pinnedVersion: "0.21.1",
    scope: "mcp-tooling",
    language: "typescript",
    production: false,
    description: "MCP Inspector — debug and test MCP servers interactively",
  },
  {
    name: "@modelcontextprotocol/ext-apps",
    pinnedVersion: "1.2.2",
    scope: "mcp-core",
    language: "typescript",
    production: true,
    description: "MCP Apps SDK — enables MCP servers to display interactive UIs in clients",
  },
];

// ─── MCP Server Packages (TypeScript, npm-published) ──────────────────────────

export const MCP_SERVER_TS_PACKAGES: PinnedPackage[] = [
  {
    name: "@modelcontextprotocol/server-sequential-thinking",
    pinnedVersion: "2025.12.18",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "Sequential thinking and reflective problem-solving",
    supportsMCPs: ["sequential-thinking"],
  },
  {
    name: "@modelcontextprotocol/server-memory",
    pinnedVersion: "2026.1.26",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "Knowledge graph persistent memory",
    supportsMCPs: ["memory"],
  },
  {
    name: "@modelcontextprotocol/server-filesystem",
    pinnedVersion: "2026.1.14",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "Secure file operations with access controls",
    supportsMCPs: ["filesystem"],
  },
  {
    name: "@modelcontextprotocol/server-everything",
    pinnedVersion: "2026.1.26",
    scope: "mcp-server",
    language: "typescript",
    production: false,
    description: "Reference/test server for all MCP capabilities",
    supportsMCPs: ["everything"],
  },
  {
    name: "@modelcontextprotocol/server-github",
    pinnedVersion: "2025.4.8",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "GitHub API — repos, issues, PRs, code search",
    supportsMCPs: ["github"],
  },
  {
    name: "@modelcontextprotocol/server-gitlab",
    pinnedVersion: "2025.4.25",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "GitLab API — projects, issues, merge requests",
    supportsMCPs: ["gitlab"],
  },
  {
    name: "@modelcontextprotocol/server-brave-search",
    pinnedVersion: "0.6.2",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "Brave Search API — web and local search",
    supportsMCPs: ["brave-search"],
  },
  {
    name: "@modelcontextprotocol/server-puppeteer",
    pinnedVersion: "2025.5.12",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "Browser automation and web scraping",
    supportsMCPs: ["puppeteer"],
  },
  {
    name: "@modelcontextprotocol/server-slack",
    pinnedVersion: "2025.4.25",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "Slack workspace integration",
    supportsMCPs: ["slack"],
  },
  {
    name: "@modelcontextprotocol/server-google-maps",
    pinnedVersion: "0.6.2",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "Google Maps geocoding, directions, place search",
    supportsMCPs: ["google-maps"],
  },
  {
    name: "@modelcontextprotocol/server-postgres",
    pinnedVersion: "0.6.2",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "Read-only PostgreSQL with schema inspection",
    supportsMCPs: ["postgres"],
  },
  {
    name: "@modelcontextprotocol/server-redis",
    pinnedVersion: "0.6.2",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "Redis key-value store operations",
    supportsMCPs: ["redis"],
  },
  {
    name: "@modelcontextprotocol/server-gdrive",
    pinnedVersion: "2025.1.14",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "Google Drive file search and content access",
    supportsMCPs: ["google-drive"],
  },
  {
    name: "@modelcontextprotocol/server-aws-kb-retrieval",
    pinnedVersion: "0.6.2",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "AWS Bedrock Knowledge Base RAG retrieval",
    supportsMCPs: ["aws-kb-retrieval"],
  },
  {
    name: "@modelcontextprotocol/server-everart",
    pinnedVersion: "0.6.2",
    scope: "mcp-server",
    language: "typescript",
    production: true,
    description: "AI image generation via EverArt",
    supportsMCPs: ["everart"],
  },
];

// ─── Language Analyzer Packages ───────────────────────────────────────────────

export const LANGUAGE_ANALYZER_PACKAGES: PinnedPackage[] = [
  {
    name: "typescript",
    pinnedVersion: "5.5.0",
    scope: "language-analyzer",
    language: "typescript",
    production: false,
    description: "TypeScript compiler — type checking for Agent SDK code",
  },
  {
    name: "tsx",
    pinnedVersion: "4.19.0",
    scope: "language-analyzer",
    language: "typescript",
    production: false,
    description: "TypeScript execution via esbuild — runs Agent SDK scripts",
  },
  {
    name: "zod",
    pinnedVersion: "4.0.0",
    scope: "validation",
    language: "typescript",
    production: true,
    description: "Schema validation — MCP tool input schemas, WebMCP validation",
  },
  {
    name: "vitest",
    pinnedVersion: "2.1.0",
    scope: "runtime",
    language: "typescript",
    production: false,
    description: "Test runner for Agent SDK and MCP tool tests",
  },
];

// ─── Anthropic SDK Packages (Python) ──────────────────────────────────────────

export const ANTHROPIC_PY_PACKAGES: PinnedPackage[] = [
  {
    name: "anthropic",
    pinnedVersion: "0.49.0",
    scope: "anthropic-sdk",
    language: "python",
    production: true,
    description: "Anthropic Python SDK — messages, token counting, admin API",
  },
  {
    name: "claude-agent-sdk",
    pinnedVersion: "0.2.72",
    scope: "anthropic-sdk",
    language: "python",
    production: true,
    description: "Claude Agent SDK for Python — query(), agent orchestration",
  },
  {
    name: "mcp",
    pinnedVersion: "1.27.1",
    scope: "mcp-core",
    language: "python",
    production: true,
    description: "MCP Python SDK — server/client implementation",
  },
];

// ─── MCP Server Packages (Python, pip/uvx-published) ──────────────────────────

export const MCP_SERVER_PY_PACKAGES: PinnedPackage[] = [
  {
    name: "mcp-server-fetch",
    pinnedVersion: "2025.3.28",
    scope: "mcp-server",
    language: "python",
    production: true,
    description: "Web content fetching and Markdown conversion",
    supportsMCPs: ["fetch"],
  },
  {
    name: "mcp-server-git",
    pinnedVersion: "2025.3.28",
    scope: "mcp-server",
    language: "python",
    production: true,
    description: "Git repository read, search, and manipulation",
    supportsMCPs: ["git"],
  },
  {
    name: "mcp-server-time",
    pinnedVersion: "2025.3.28",
    scope: "mcp-server",
    language: "python",
    production: true,
    description: "Time and timezone conversion",
    supportsMCPs: ["time"],
  },
];

// ─── Full Registry ────────────────────────────────────────────────────────────

export const ALL_PINNED_PACKAGES: PinnedPackage[] = [
  ...ANTHROPIC_TS_PACKAGES,
  ...MCP_CORE_TS_PACKAGES,
  ...MCP_SERVER_TS_PACKAGES,
  ...LANGUAGE_ANALYZER_PACKAGES,
  ...ANTHROPIC_PY_PACKAGES,
  ...MCP_SERVER_PY_PACKAGES,
];

// ─── Query Helpers ────────────────────────────────────────────────────────────

export function getPackagesByScope(scope: PackageScope): PinnedPackage[] {
  return ALL_PINNED_PACKAGES.filter((p) => p.scope === scope);
}

export function getPackagesByLanguage(lang: SupportedLanguage): PinnedPackage[] {
  return ALL_PINNED_PACKAGES.filter((p) => p.language === lang);
}

export function getProductionPackages(): PinnedPackage[] {
  return ALL_PINNED_PACKAGES.filter((p) => p.production);
}

export function getPackagesForMCP(mcpId: string): PinnedPackage[] {
  return ALL_PINNED_PACKAGES.filter((p) => p.supportsMCPs?.includes(mcpId));
}

/**
 * Generate a package.json dependencies fragment from the registry.
 * Useful for scaffolding new plugin projects.
 */
export function toDependenciesFragment(
  packages: PinnedPackage[],
): Record<string, string> {
  const deps: Record<string, string> = {};
  for (const pkg of packages) {
    if (pkg.language === "typescript") {
      deps[pkg.name] = pkg.pinnedVersion;
    }
  }
  return deps;
}
