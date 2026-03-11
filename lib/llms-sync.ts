/**
 * @module lib/llms-sync
 * @description Orchestrates llms.txt crawl + cache update.
 * Entry point for both programmatic use and CLI (npm run llms:sync).
 */

import { getEntryUrls, crawlRecursive } from "./llms-crawler.js";
import { getDocWithFallback, putDoc, type CachedDoc } from "./llms-cache.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SyncReport {
  updated: string[];
  unchanged: string[];
  errors: string[];
}

// ─── Sync ───────────────────────────────────────────────────────────────────

/** Crawl all entry URLs, compare hashes, update cache where changed. */
export async function syncDocs(): Promise<SyncReport> {
  const report: SyncReport = { updated: [], unchanged: [], errors: [] };

  for (const entryUrl of getEntryUrls()) {
    try {
      // Build known hashes from cache
      const knownHashes = new Map<string, string>();
      const existing = await getDocWithFallback(entryUrl);
      if (existing) {
        knownHashes.set(entryUrl, existing.contentHash);
      }

      const results = await crawlRecursive(entryUrl, knownHashes);

      for (const result of results) {
        if (result.changed) {
          const doc: CachedDoc = {
            url: result.url,
            content: result.content,
            contentHash: result.contentHash,
            lastCrawled: new Date(),
            parentUrl: result.url === entryUrl ? undefined : entryUrl,
          };
          await putDoc(doc);
          report.updated.push(result.url);
        } else {
          report.unchanged.push(result.url);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      report.errors.push(`${entryUrl}: ${message}`);
    }
  }

  return report;
}

// ─── CLI Entry Point ────────────────────────────────────────────────────────

const isCli =
  typeof process !== "undefined" &&
  process.argv[1]?.endsWith("llms-sync.ts");

if (isCli) {
  syncDocs()
    .then((report) => {
      console.log("llms.txt sync complete:");
      console.log(`  Updated:   ${report.updated.length}`);
      console.log(`  Unchanged: ${report.unchanged.length}`);
      console.log(`  Errors:    ${report.errors.length}`);
      if (report.errors.length > 0) {
        for (const e of report.errors) console.error(`  - ${e}`);
      }
    })
    .catch((err) => {
      console.error("llms.txt sync failed:", err);
      process.exit(1);
    });
}
