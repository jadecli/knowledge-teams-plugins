/**
 * @module lib/blog-crawler
 * @description Fetches and hashes Anthropic customer blog posts.
 * Extends the llms-crawler pattern with blog-specific allowlist and
 * structured fact extraction.
 *
 * Security: only crawls anthropic.com/customers/* — no arbitrary URLs.
 * Reuses hashContent from llms-crawler for consistent hashing.
 */

import { hashContent } from "./llms-crawler.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BlogCrawlResult {
  slug: string;
  url: string;
  title: string;
  contentHash: string;
  content: string;
  changed: boolean;
  httpStatus: number;
  crawlDurationMs: number;
}

// ─── Allowlist ──────────────────────────────────────────────────────────────

const ALLOWED_BLOG_PREFIX = "https://www.anthropic.com/customers/" as const;

/** Security boundary: only crawl anthropic.com customer blog posts. */
export function isAllowedBlogUrl(url: string): boolean {
  try {
    new URL(url); // validate URL format
    return url.startsWith(ALLOWED_BLOG_PREFIX);
  } catch {
    return false;
  }
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/** Fetch raw content from a blog URL. Returns { content, httpStatus }. */
export async function fetchBlogPost(url: string): Promise<{
  content: string;
  httpStatus: number;
}> {
  if (!isAllowedBlogUrl(url)) {
    throw new Error(`Blocked: ${url} is not an Anthropic customer blog URL`);
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "jadecli/blog-crawler",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  return {
    content: await response.text(),
    httpStatus: response.status,
  };
}

/** Crawl a single blog post. Compare against known hash to detect changes. */
export async function crawlBlogPost(
  slug: string,
  url: string,
  title: string,
  knownHash: string | null,
): Promise<BlogCrawlResult> {
  const start = Date.now();
  const { content, httpStatus } = await fetchBlogPost(url);
  const crawlDurationMs = Date.now() - start;
  const contentHash = hashContent(content);
  const changed = knownHash !== contentHash;

  return { slug, url, title, contentHash, content, changed, httpStatus, crawlDurationMs };
}

/**
 * Crawl a batch of blog posts with concurrency control.
 * Mirrors the recursive pattern from llms-crawler but uses
 * parallel batching since blog posts are independent (no link tree).
 */
export async function crawlBlogBatch(
  entries: ReadonlyArray<{ slug: string; url: string; title: string }>,
  knownHashes: Map<string, string>,
  concurrency: number = 5,
): Promise<BlogCrawlResult[]> {
  const results: BlogCrawlResult[] = [];

  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((entry) =>
        crawlBlogPost(
          entry.slug,
          entry.url,
          entry.title,
          knownHashes.get(entry.slug) ?? null,
        ),
      ),
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
      // Skip failed URLs, continue crawling others (same as llms-crawler)
    }
  }

  return results;
}
