/**
 * @module lib/blog-crawler
 * @description Fetches and hashes Anthropic customer blog posts from claude.com/customers/*.
 * Security: only crawls claude.com — no arbitrary URLs.
 * Reuses patterns from llms-crawler.ts. Each function does one thing.
 */

import { createHash } from "node:crypto";
import { BLOG_DOMAIN } from "./blog-manifest.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BlogCrawlResult {
  url: string;
  contentHash: string;
  content: string;
  changed: boolean;
  /** Company slug extracted from URL */
  slug: string;
}

// ─── Allowlist ──────────────────────────────────────────────────────────────
// MULTI-SIG REQUIREMENT: Changes to BLOG_ALLOWED_DOMAINS require:
//   1. PR approved by a human reviewer (not just CI)
//   2. All CI/CD checks pass
//   3. Architecture guardrails review passes
//   4. No force-pushes — commits must go through PR flow
// Agents MUST NOT modify this allowlist without human approval.

/** Approved domains for blog crawling. Only claude.com is permitted. */
export const BLOG_ALLOWED_DOMAINS: readonly string[] = [BLOG_DOMAIN] as const;

/** Security boundary: only crawl allowlisted blog domains. */
export function isAllowedBlogUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      BLOG_ALLOWED_DOMAINS.some((d) => parsed.hostname === d) &&
      parsed.pathname.startsWith("/customers/")
    );
  } catch {
    return false;
  }
}

/** Extract slug from a customer blog URL. */
export function extractSlug(url: string): string {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);
  // /customers/stripe → "stripe"
  return parts[parts.length - 1] ?? "";
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/** SHA-256 hex hash of content string. Deterministic. */
export function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

/** Fetch raw HTML content from a customer blog URL. */
export async function fetchBlogPost(url: string): Promise<string> {
  if (!isAllowedBlogUrl(url)) {
    throw new Error(`Blocked: ${url} is not on the blog allowlist`);
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "jadecli/blog-crawler knowledge-teams-plugins",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  return response.text();
}

/** Crawl a single blog URL. Compare against known hash to detect changes. */
export async function crawlBlogPost(
  url: string,
  knownHash: string | null,
): Promise<BlogCrawlResult> {
  const content = await fetchBlogPost(url);
  const contentHash = hashContent(content);
  const changed = knownHash !== contentHash;
  const slug = extractSlug(url);

  return { url, contentHash, content, changed, slug };
}

/**
 * Crawl a batch of blog URLs with concurrency control.
 * Returns results for all successfully crawled posts.
 */
export async function crawlBlogBatch(
  urls: string[],
  knownHashes: Map<string, string>,
  concurrency: number = 5,
): Promise<BlogCrawlResult[]> {
  const results: BlogCrawlResult[] = [];
  const queue = [...urls];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) break;

      try {
        const result = await crawlBlogPost(url, knownHashes.get(url) ?? null);
        results.push(result);
      } catch {
        // Skip failed URLs, continue crawling others
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker());
  await Promise.all(workers);

  return results;
}
