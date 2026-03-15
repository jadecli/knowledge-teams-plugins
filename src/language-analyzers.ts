/**
 * @module language-analyzers
 * @description Language-specific package abstraction layer for knowledge workers
 *              using Claude Agent SDK. Maps language analyzers from
 *              cowork-plugin-customizer to canonical SDK packages and MCP servers.
 *
 * @see https://github.com/anthropics/knowledge-work-plugins/blob/main/cowork-plugin-management/skills/cowork-plugin-customizer
 *
 * @frontmatter
 * ---
 * dataSource: "knowledge-work-plugins/cowork-plugin-management + npm/pypi/cargo registries"
 * lastUpdated: "2026-03-11"
 * upstreamRef: "jadecli/knowledge-work-plugins @ 477c893b"
 * ---
 */

import {
  SupportedLanguage,
  CanonicalPackage,
  MCP_SDKS_BY_LANGUAGE,
  getMcpsByDomain,
  WorkDomain,
} from "./mcp-registry.js";

// ─── Language Analyzer Definition ────────────────────────────────────────────

export interface LanguageAnalyzer {
  /** Language identifier */
  language: SupportedLanguage;
  /** Display name */
  displayName: string;
  /** File extensions this analyzer covers */
  fileExtensions: string[];
  /** Claude Agent SDK support level */
  agentSdkSupport: "native" | "sdk-available" | "community" | "none";
  /** Anthropic SDK available for this language? */
  anthropicSdkAvailable: boolean;
  /** MCP SDK available for this language? */
  mcpSdkAvailable: boolean;
  /** Canonical packages optimized for knowledge workers in this language */
  knowledgeWorkerPackages: CanonicalPackage[];
  /** Tree-sitter grammar available in Claude Code? */
  treeSitterSupport: boolean;
  /** Recommended MCP servers for this language's ecosystem */
  recommendedMcps: string[];
}

// ─── Language Analyzer Registry ──────────────────────────────────────────────

export const LANGUAGE_ANALYZERS: LanguageAnalyzer[] = [
  {
    language: SupportedLanguage.TYPESCRIPT,
    displayName: "TypeScript",
    fileExtensions: [".ts", ".tsx", ".mts", ".cts"],
    agentSdkSupport: "native",
    anthropicSdkAvailable: true,
    mcpSdkAvailable: true,
    treeSitterSupport: true,
    knowledgeWorkerPackages: [
      ...MCP_SDKS_BY_LANGUAGE[SupportedLanguage.TYPESCRIPT],
      { name: "zod",       version: "4.0.0", registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
      { name: "tsx",       version: "4.19.0", registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
      { name: "typescript", version: "5.5.0", registry: "npm", language: SupportedLanguage.TYPESCRIPT, installed: true },
    ],
    recommendedMcps: [
      "mcp-filesystem", "mcp-memory", "mcp-github", "mcp-sequential-thinking",
      "mcp-sentry", "mcp-datadog", "mcp-cloudflare",
    ],
  },
  {
    language: SupportedLanguage.JAVASCRIPT,
    displayName: "JavaScript",
    fileExtensions: [".js", ".jsx", ".mjs", ".cjs"],
    agentSdkSupport: "native",
    anthropicSdkAvailable: true,
    mcpSdkAvailable: true,
    treeSitterSupport: true,
    knowledgeWorkerPackages: MCP_SDKS_BY_LANGUAGE[SupportedLanguage.JAVASCRIPT],
    recommendedMcps: [
      "mcp-filesystem", "mcp-memory", "mcp-github", "mcp-puppeteer",
    ],
  },
  {
    language: SupportedLanguage.PYTHON,
    displayName: "Python",
    fileExtensions: [".py", ".pyi", ".pyx"],
    agentSdkSupport: "sdk-available",
    anthropicSdkAvailable: true,
    mcpSdkAvailable: true,
    treeSitterSupport: true,
    knowledgeWorkerPackages: MCP_SDKS_BY_LANGUAGE[SupportedLanguage.PYTHON],
    recommendedMcps: [
      "mcp-filesystem", "mcp-memory", "mcp-git", "mcp-fetch",
      "mcp-postgres", "mcp-sqlite",
    ],
  },
  {
    language: SupportedLanguage.RUST,
    displayName: "Rust",
    fileExtensions: [".rs"],
    agentSdkSupport: "community",
    anthropicSdkAvailable: false,
    mcpSdkAvailable: true,
    treeSitterSupport: true,
    knowledgeWorkerPackages: MCP_SDKS_BY_LANGUAGE[SupportedLanguage.RUST],
    recommendedMcps: ["mcp-filesystem", "mcp-memory", "mcp-github"],
  },
  {
    language: SupportedLanguage.GO,
    displayName: "Go",
    fileExtensions: [".go"],
    agentSdkSupport: "community",
    anthropicSdkAvailable: false,
    mcpSdkAvailable: true,
    treeSitterSupport: true,
    knowledgeWorkerPackages: MCP_SDKS_BY_LANGUAGE[SupportedLanguage.GO],
    recommendedMcps: ["mcp-filesystem", "mcp-memory", "mcp-github"],
  },
  {
    language: SupportedLanguage.JAVA,
    displayName: "Java",
    fileExtensions: [".java"],
    agentSdkSupport: "community",
    anthropicSdkAvailable: false,
    mcpSdkAvailable: true,
    treeSitterSupport: true,
    knowledgeWorkerPackages: MCP_SDKS_BY_LANGUAGE[SupportedLanguage.JAVA],
    recommendedMcps: ["mcp-filesystem", "mcp-memory", "mcp-github", "mcp-jira"],
  },
  {
    language: SupportedLanguage.CSHARP,
    displayName: "C#",
    fileExtensions: [".cs", ".csx"],
    agentSdkSupport: "community",
    anthropicSdkAvailable: false,
    mcpSdkAvailable: true,
    treeSitterSupport: true,
    knowledgeWorkerPackages: MCP_SDKS_BY_LANGUAGE[SupportedLanguage.CSHARP],
    recommendedMcps: ["mcp-filesystem", "mcp-memory", "mcp-github", "mcp-jira"],
  },
  {
    language: SupportedLanguage.SWIFT,
    displayName: "Swift",
    fileExtensions: [".swift"],
    agentSdkSupport: "community",
    anthropicSdkAvailable: false,
    mcpSdkAvailable: true,
    treeSitterSupport: true,
    knowledgeWorkerPackages: MCP_SDKS_BY_LANGUAGE[SupportedLanguage.SWIFT],
    recommendedMcps: ["mcp-filesystem", "mcp-memory", "mcp-github"],
  },
  {
    language: SupportedLanguage.RUBY,
    displayName: "Ruby",
    fileExtensions: [".rb", ".rake", ".gemspec"],
    agentSdkSupport: "community",
    anthropicSdkAvailable: false,
    mcpSdkAvailable: true,
    treeSitterSupport: true,
    knowledgeWorkerPackages: MCP_SDKS_BY_LANGUAGE[SupportedLanguage.RUBY],
    recommendedMcps: ["mcp-filesystem", "mcp-memory", "mcp-github"],
  },
  {
    language: SupportedLanguage.PHP,
    displayName: "PHP",
    fileExtensions: [".php"],
    agentSdkSupport: "none",
    anthropicSdkAvailable: false,
    mcpSdkAvailable: false,
    treeSitterSupport: true,
    knowledgeWorkerPackages: [],
    recommendedMcps: ["mcp-filesystem", "mcp-memory"],
  },
  {
    language: SupportedLanguage.CPP,
    displayName: "C++",
    fileExtensions: [".cpp", ".cc", ".cxx", ".hpp", ".h"],
    agentSdkSupport: "none",
    anthropicSdkAvailable: false,
    mcpSdkAvailable: false,
    treeSitterSupport: true,
    knowledgeWorkerPackages: [],
    recommendedMcps: ["mcp-filesystem", "mcp-memory"],
  },
  {
    language: SupportedLanguage.C,
    displayName: "C",
    fileExtensions: [".c", ".h"],
    agentSdkSupport: "none",
    anthropicSdkAvailable: false,
    mcpSdkAvailable: false,
    treeSitterSupport: true,
    knowledgeWorkerPackages: [],
    recommendedMcps: ["mcp-filesystem", "mcp-memory"],
  },
  {
    language: SupportedLanguage.KOTLIN,
    displayName: "Kotlin",
    fileExtensions: [".kt", ".kts"],
    agentSdkSupport: "community",
    anthropicSdkAvailable: false,
    mcpSdkAvailable: true,
    treeSitterSupport: true,
    knowledgeWorkerPackages: MCP_SDKS_BY_LANGUAGE[SupportedLanguage.KOTLIN],
    recommendedMcps: ["mcp-filesystem", "mcp-memory", "mcp-github"],
  },
  {
    language: SupportedLanguage.SHELL,
    displayName: "Shell (Bash/Zsh)",
    fileExtensions: [".sh", ".bash", ".zsh"],
    agentSdkSupport: "none",
    anthropicSdkAvailable: false,
    mcpSdkAvailable: false,
    treeSitterSupport: true,
    knowledgeWorkerPackages: [],
    recommendedMcps: ["mcp-filesystem"],
  },
];

// ─── Query Helpers ───────────────────────────────────────────────────────────

/** Get analyzer for a file extension */
export function getAnalyzerForExtension(ext: string): LanguageAnalyzer | undefined {
  return LANGUAGE_ANALYZERS.find((a) => a.fileExtensions.includes(ext));
}

/** Get all languages with native Agent SDK support */
export function getNativeAgentSdkLanguages(): LanguageAnalyzer[] {
  return LANGUAGE_ANALYZERS.filter((a) => a.agentSdkSupport === "native");
}

/** Get all languages with any MCP SDK available */
export function getMcpSdkLanguages(): LanguageAnalyzer[] {
  return LANGUAGE_ANALYZERS.filter((a) => a.mcpSdkAvailable);
}

/** Get all canonical packages for a knowledge worker using a given language */
export function getKnowledgeWorkerStack(lang: SupportedLanguage): {
  packages: CanonicalPackage[];
  mcps: string[];
  agentSdkSupport: string;
} {
  const analyzer = LANGUAGE_ANALYZERS.find((a) => a.language === lang);
  if (!analyzer) return { packages: [], mcps: [], agentSdkSupport: "none" };
  return {
    packages: analyzer.knowledgeWorkerPackages,
    mcps: analyzer.recommendedMcps,
    agentSdkSupport: analyzer.agentSdkSupport,
  };
}
