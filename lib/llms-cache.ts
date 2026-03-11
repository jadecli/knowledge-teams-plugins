/**
 * @module lib/llms-cache
 * @description Two-tier cache: in-memory LRU (fast) + Neon Postgres (persistent).
 * Reads hit LRU first, fall back to Neon. Writes go to both.
 */

import { LRUCache } from "lru-cache";
import { eq } from "drizzle-orm";
import { hasDatabase, getDb } from "../db/client.js";
import { metaDocCache } from "../db/schema.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CachedDoc {
  url: string;
  content: string;
  contentHash: string;
  lastCrawled: Date;
  parentUrl?: string;
}

// ─── LRU Cache ──────────────────────────────────────────────────────────────

const lru = new LRUCache<string, CachedDoc>({ max: 100 });

/** Get a doc from LRU cache only. */
export function getDoc(url: string): CachedDoc | undefined {
  return lru.get(url);
}

/** Get a doc from LRU, falling back to Neon if not in memory. */
export async function getDocWithFallback(
  url: string,
): Promise<CachedDoc | undefined> {
  const cached = lru.get(url);
  if (cached) return cached;

  if (!hasDatabase()) return undefined;

  const db = getDb();
  const rows = await db
    .select()
    .from(metaDocCache)
    .where(eq(metaDocCache.url, url))
    .limit(1);

  if (rows.length === 0) return undefined;

  const row = rows[0];
  const doc: CachedDoc = {
    url: row.url,
    content: row.content,
    contentHash: row.contentHash,
    lastCrawled: row.lastCrawled ?? new Date(),
    parentUrl: row.parentUrl ?? undefined,
  };

  // Warm the LRU cache
  lru.set(url, doc);
  return doc;
}

/** Write a doc to both LRU and Neon. */
export async function putDoc(doc: CachedDoc): Promise<void> {
  lru.set(doc.url, doc);

  if (!hasDatabase()) return;

  const db = getDb();

  // Upsert: delete existing + insert (Drizzle onConflictDoUpdate requires unique constraint)
  const existing = await db
    .select({ id: metaDocCache.id })
    .from(metaDocCache)
    .where(eq(metaDocCache.url, doc.url))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(metaDocCache)
      .where(eq(metaDocCache.url, doc.url));
  }

  await db.insert(metaDocCache).values({
    url: doc.url,
    contentHash: doc.contentHash,
    content: doc.content,
    lastCrawled: doc.lastCrawled,
    parentUrl: doc.parentUrl,
  });
}

/** Refresh a doc if it's older than maxAgeMs. Returns the cached doc. */
export async function refreshIfStale(
  url: string,
  maxAgeMs: number,
): Promise<CachedDoc | undefined> {
  const doc = await getDocWithFallback(url);
  if (!doc) return undefined;

  const age = Date.now() - doc.lastCrawled.getTime();
  if (age > maxAgeMs) return undefined; // Caller should re-crawl

  return doc;
}

/** Clear LRU cache (for testing). */
export function clearLruCache(): void {
  lru.clear();
}
