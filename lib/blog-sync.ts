/**
 * @module lib/blog-sync
 * @description Orchestrates customer blog crawl + cache update.
 * Entry point for both programmatic use and CLI (npm run blog:sync).
 * Reuses patterns from llms-sync.ts.
 */

import { crawlBlogBatch } from "./blog-crawler.js";
import { getAllCachedHashes, putBlogPost, type CachedBlogPost } from "./blog-cache.js";
import { BLOG_MANIFEST, BLOG_BY_URL, getBlogUrls } from "./blog-manifest.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BlogSyncReport {
  updated: string[];
  unchanged: string[];
  errors: string[];
  totalManifest: number;
}

// ─── Sync ───────────────────────────────────────────────────────────────────

/** Crawl all blog URLs from manifest, compare hashes, update cache where changed. */
export async function syncBlogs(
  concurrency: number = 5,
): Promise<BlogSyncReport> {
  const report: BlogSyncReport = {
    updated: [],
    unchanged: [],
    errors: [],
    totalManifest: BLOG_MANIFEST.length,
  };

  const urls = getBlogUrls();

  // Batch-fetch all known hashes in a single query (avoids N+1)
  const knownHashes = await getAllCachedHashes();

  // Crawl in batches
  const batchSize = 20;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);

    try {
      const results = await crawlBlogBatch(batch, knownHashes, concurrency);

      for (const result of results) {
        try {
          if (result.changed) {
            // O(1) lookup from pre-built Map
            const entry = BLOG_BY_URL.get(result.url);

            const post: CachedBlogPost = {
              url: result.url,
              slug: result.slug,
              content: result.content,
              contentHash: result.contentHash,
              lastCrawled: new Date(),
              company: entry?.company,
              tags: entry?.tags ? [...entry.tags] : undefined,
            };
            await putBlogPost(post);
            report.updated.push(result.url);
          } else {
            report.unchanged.push(result.url);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          report.errors.push(`${result.url}: ${message}`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      report.errors.push(`batch ${i}-${i + batchSize}: ${message}`);
    }
  }

  return report;
}

// ─── CLI Entry Point ────────────────────────────────────────────────────────

const isCli =
  typeof process !== "undefined" &&
  process.argv[1]?.endsWith("blog-sync.ts");

if (isCli) {
  syncBlogs()
    .then((report) => {
      console.log("Blog crawl sync complete:");
      console.log(`  Manifest:  ${report.totalManifest} posts`);
      console.log(`  Updated:   ${report.updated.length}`);
      console.log(`  Unchanged: ${report.unchanged.length}`);
      console.log(`  Errors:    ${report.errors.length}`);
      if (report.errors.length > 0) {
        for (const e of report.errors) console.error(`  - ${e}`);
      }
    })
    .catch((err) => {
      console.error("Blog crawl sync failed:", err);
      process.exit(1);
    });
}
