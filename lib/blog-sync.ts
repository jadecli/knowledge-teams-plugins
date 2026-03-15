/**
 * @module lib/blog-sync
 * @description Orchestrates blog crawl + cache update.
 * Mirrors llms-sync.ts pattern: crawl all entries, compare hashes, update cache.
 * Entry point for both programmatic use and CLI (npm run blog:sync).
 */

import { BLOG_MANIFEST } from "./blog-manifest.js";
import { crawlBlogBatch, type BlogCrawlResult } from "./blog-crawler.js";
import { hasDatabase, getDb } from "../db/client.js";
import { metaBlogCache } from "../db/schema.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BlogSyncReport {
  total: number;
  updated: string[];
  unchanged: string[];
  errors: string[];
  durationMs: number;
}

// ─── Cache Layer ────────────────────────────────────────────────────────────

/** Load known content hashes from Neon for change detection. */
async function loadKnownHashes(): Promise<Map<string, string>> {
  const hashes = new Map<string, string>();
  if (!hasDatabase()) return hashes;

  const db = getDb();
  const rows = await db
    .select({ slug: metaBlogCache.slug, contentHash: metaBlogCache.contentHash })
    .from(metaBlogCache);

  for (const row of rows) {
    hashes.set(row.slug, row.contentHash);
  }
  return hashes;
}

/** Upsert a crawled blog post into the cache. Atomic single-query operation. */
async function upsertBlogCache(result: BlogCrawlResult): Promise<void> {
  if (!hasDatabase()) return;

  const db = getDb();
  const values = {
    slug: result.slug,
    url: result.url,
    title: result.title,
    contentHash: result.contentHash,
    content: result.content,
    lastCrawled: new Date(),
    httpStatus: result.httpStatus,
    crawlDurationMs: result.crawlDurationMs,
  };

  await db
    .insert(metaBlogCache)
    .values(values)
    .onConflictDoUpdate({
      target: metaBlogCache.slug,
      set: values,
    });
}

// ─── Sync ───────────────────────────────────────────────────────────────────

/** Crawl all blog posts, compare hashes, update cache where changed. */
export async function syncBlogs(
  concurrency: number = 5,
): Promise<BlogSyncReport> {
  const start = Date.now();
  const report: BlogSyncReport = {
    total: BLOG_MANIFEST.length,
    updated: [],
    unchanged: [],
    errors: [],
    durationMs: 0,
  };

  const knownHashes = await loadKnownHashes();
  const results = await crawlBlogBatch(BLOG_MANIFEST, knownHashes, concurrency);

  for (const result of results) {
    try {
      if (result.httpStatus >= 400) {
        report.errors.push(`${result.slug}: HTTP ${result.httpStatus}`);
        continue;
      }

      if (result.changed) {
        await upsertBlogCache(result);
        report.updated.push(result.slug);
      } else {
        report.unchanged.push(result.slug);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      report.errors.push(`${result.slug}: ${message}`);
    }
  }

  // Count entries that failed to crawl at all (not in results)
  const crawledSlugs = new Set(results.map((r) => r.slug));
  for (const entry of BLOG_MANIFEST) {
    if (!crawledSlugs.has(entry.slug)) {
      report.errors.push(`${entry.slug}: crawl failed`);
    }
  }

  report.durationMs = Date.now() - start;
  return report;
}

// ─── CLI Entry Point ────────────────────────────────────────────────────────

const isCli =
  typeof process !== "undefined" &&
  process.argv[1]?.endsWith("blog-sync.ts");

if (isCli) {
  const concurrency = parseInt(process.argv[2] ?? "5", 10);

  syncBlogs(concurrency)
    .then((report) => {
      console.log("Blog crawl sync complete:");
      console.log(`  Total:     ${report.total}`);
      console.log(`  Updated:   ${report.updated.length}`);
      console.log(`  Unchanged: ${report.unchanged.length}`);
      console.log(`  Errors:    ${report.errors.length}`);
      console.log(`  Duration:  ${(report.durationMs / 1000).toFixed(1)}s`);
      if (report.errors.length > 0) {
        console.log("\nErrors:");
        for (const e of report.errors) console.error(`  - ${e}`);
      }
    })
    .catch((err) => {
      console.error("Blog crawl sync failed:", err);
      process.exit(1);
    });
}
