/**
 * @module lib/llms-crawler
 * @description Fetches and hashes llms.txt documents from allowlisted domains.
 * Security: only crawls docs.anthropic.com and claude.ai — no arbitrary URLs.
 * Each function does one thing. No classes.
 */

import { createHash } from "node:crypto";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CrawlResult {
  url: string;
  contentHash: string;
  content: string;
  changed: boolean;
  childUrls: string[];
}

// ─── Allowlist ──────────────────────────────────────────────────────────────
// MULTI-SIG REQUIREMENT: Changes to ALLOWED_DOMAINS or ENTRY_URLS require:
//   1. PR approved by a human reviewer (not just CI)
//   2. All CI/CD checks pass
//   3. Architecture guardrails review passes
//   4. No force-pushes — commits must go through PR flow
// Agents MUST NOT modify this allowlist without human approval.
// Each domain must serve verified llms.txt documentation from a known provider.

/** Approved crawler source categories and their verified domains. */
export const CRAWLER_ALLOWLIST = {
  /** Claude platform and Claude Code documentation */
  "claude-platform": ["docs.anthropic.com", "claude.ai"],
  /** Neon serverless Postgres documentation */
  "neon-database": ["neon.tech"],
  /** Vercel platform documentation */
  "vercel-platform": ["vercel.com"],
} as const;

/** Flattened domain allowlist derived from CRAWLER_ALLOWLIST categories. */
const ALLOWED_DOMAINS: readonly string[] = Object.values(CRAWLER_ALLOWLIST).flat();

const ENTRY_URLS = [
  "https://docs.anthropic.com/llms.txt",
  "https://docs.anthropic.com/llms-full.txt",
  "https://neon.tech/llms.txt",
  "https://vercel.com/llms.txt",
] as const;

/** Security boundary: only crawl allowlisted Anthropic domains. */
export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      ALLOWED_DOMAINS.some((d) => parsed.hostname === d)
    );
  } catch {
    return false;
  }
}

/** Returns the entry point URLs for crawling. */
export function getEntryUrls(): readonly string[] {
  return ENTRY_URLS;
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/** Fetch raw text content from a URL. */
export async function fetchLlmsTxt(url: string): Promise<string> {
  if (!isAllowedUrl(url)) {
    throw new Error(`Blocked: ${url} is not on the allowlist`);
  }

  const response = await fetch(url, {
    headers: { "User-Agent": "jadecli/knowledge-teams-plugins llms-crawler" },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  return response.text();
}

/** SHA-256 hex hash of content string. Deterministic. */
export function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

/** Extract URLs from llms.txt content (lines starting with http). */
export function extractUrls(llmsTxt: string): string[] {
  const urls: string[] = [];
  for (const line of llmsTxt.split("\n")) {
    const trimmed = line.trim();
    // Match markdown links [text](url) or bare URLs
    const mdMatch = trimmed.match(/\[.*?\]\((https:\/\/[^\s)]+)\)/);
    if (mdMatch && isAllowedUrl(mdMatch[1])) {
      urls.push(mdMatch[1]);
      continue;
    }
    if (trimmed.startsWith("https://") && isAllowedUrl(trimmed)) {
      urls.push(trimmed);
    }
  }
  return urls;
}

/** Crawl a single URL. Compare against known hash to detect changes. */
export async function crawlUrl(
  url: string,
  knownHash: string | null,
): Promise<CrawlResult> {
  const content = await fetchLlmsTxt(url);
  const contentHash = hashContent(content);
  const changed = knownHash !== contentHash;
  const childUrls = extractUrls(content);

  return { url, contentHash, content, changed, childUrls };
}

/** Recursively crawl from an entry URL, following child links up to depth. */
export async function crawlRecursive(
  entryUrl: string,
  knownHashes: Map<string, string>,
  maxDepth: number = 2,
): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];
  const visited = new Set<string>();

  async function visit(url: string, depth: number): Promise<void> {
    if (depth > maxDepth || visited.has(url) || !isAllowedUrl(url)) return;
    visited.add(url);

    try {
      const result = await crawlUrl(url, knownHashes.get(url) ?? null);
      results.push(result);

      for (const child of result.childUrls) {
        await visit(child, depth + 1);
      }
    } catch {
      // Skip failed URLs, continue crawling others
    }
  }

  await visit(entryUrl, 0);
  return results;
}
