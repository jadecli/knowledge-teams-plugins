/**
 * @module lib/blog-cache
 * @description Two-tier cache for customer blog posts: in-memory LRU + Neon Postgres.
 * Mirrors llms-cache.ts pattern. Reads hit LRU first, fall back to Neon. Writes go to both.
 */

import { LRUCache } from "lru-cache";
import { eq } from "drizzle-orm";
import { hasDatabase, getDb } from "../db/client.js";
import { metaBlogCache } from "../db/schema.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CachedBlogPost {
  url: string;
  slug: string;
  content: string;
  contentHash: string;
  lastCrawled: Date;
  company?: string;
  tags?: string[];
}

// ─── LRU Cache ──────────────────────────────────────────────────────────────

const lru = new LRUCache<string, CachedBlogPost>({ max: 256 });

/** Get a blog post from LRU cache only. */
export function getBlogPost(url: string): CachedBlogPost | undefined {
  return lru.get(url);
}

/** Get a blog post from LRU, falling back to Neon if not in memory. */
export async function getBlogPostWithFallback(
  url: string,
): Promise<CachedBlogPost | undefined> {
  const cached = lru.get(url);
  if (cached) return cached;

  if (!hasDatabase()) return undefined;

  const db = getDb();
  const rows = await db
    .select()
    .from(metaBlogCache)
    .where(eq(metaBlogCache.url, url))
    .limit(1);

  if (rows.length === 0) return undefined;

  const row = rows[0];
  const post: CachedBlogPost = {
    url: row.url,
    slug: row.slug,
    content: row.content,
    contentHash: row.contentHash,
    lastCrawled: row.lastCrawled ?? new Date(),
    company: row.company ?? undefined,
    tags: row.tags ? (row.tags as string[]) : undefined,
  };

  // Warm the LRU cache
  lru.set(url, post);
  return post;
}

/** Write a blog post to both LRU and Neon (upsert by unique url index). */
export async function putBlogPost(post: CachedBlogPost): Promise<void> {
  lru.set(post.url, post);

  if (!hasDatabase()) return;

  const db = getDb();

  await db
    .insert(metaBlogCache)
    .values({
      url: post.url,
      slug: post.slug,
      contentHash: post.contentHash,
      content: post.content,
      lastCrawled: post.lastCrawled,
      company: post.company,
      tags: post.tags,
    })
    .onConflictDoUpdate({
      target: metaBlogCache.url,
      set: {
        slug: post.slug,
        contentHash: post.contentHash,
        content: post.content,
        lastCrawled: post.lastCrawled,
        company: post.company,
        tags: post.tags,
      },
    });
}

/** Batch-fetch all cached content hashes in a single query. Avoids N+1. */
export async function getAllCachedHashes(): Promise<Map<string, string>> {
  const hashes = new Map<string, string>();
  if (!hasDatabase()) return hashes;

  const db = getDb();
  const rows = await db
    .select({ url: metaBlogCache.url, contentHash: metaBlogCache.contentHash })
    .from(metaBlogCache);

  for (const row of rows) {
    hashes.set(row.url, row.contentHash);
  }
  return hashes;
}

/** Clear LRU cache (for testing). */
export function clearBlogLruCache(): void {
  lru.clear();
}
