/**
 * @module lib/hash
 * @description Shared content hashing utility.
 * SHA-256 hex digest — used by both llms-crawler and blog-crawler.
 */

import { createHash } from "node:crypto";

/** SHA-256 hex hash of a content string. Deterministic. */
export function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}
