import { describe, it, expect, beforeEach } from "vitest";
import {
  getBlogPost,
  putBlogPost,
  clearBlogLruCache,
  type CachedBlogPost,
} from "../lib/blog-cache.js";

const SAMPLE_POST: CachedBlogPost = {
  url: "https://claude.com/customers/stripe",
  slug: "stripe",
  content: "<html><body>Stripe case study</body></html>",
  contentHash: "abc123def456",
  lastCrawled: new Date("2026-03-11"),
  company: "Stripe",
  tags: ["developer-tools", "enterprise"],
};

describe("lib/blog-cache — LRU layer", () => {
  beforeEach(() => clearBlogLruCache());

  it("returns undefined for unknown URL", () => {
    expect(getBlogPost("https://claude.com/customers/unknown")).toBeUndefined();
  });

  it("stores and retrieves a post from LRU", async () => {
    await putBlogPost(SAMPLE_POST);
    const cached = getBlogPost(SAMPLE_POST.url);
    expect(cached).toBeDefined();
    expect(cached!.slug).toBe("stripe");
    expect(cached!.company).toBe("Stripe");
    expect(cached!.contentHash).toBe("abc123def456");
    expect(cached!.tags).toEqual(["developer-tools", "enterprise"]);
  });

  it("overwrites existing post on put", async () => {
    await putBlogPost(SAMPLE_POST);
    const updated: CachedBlogPost = {
      ...SAMPLE_POST,
      contentHash: "updated789",
      content: "Updated content",
    };
    await putBlogPost(updated);
    const cached = getBlogPost(SAMPLE_POST.url);
    expect(cached!.contentHash).toBe("updated789");
    expect(cached!.content).toBe("Updated content");
  });

  it("stores post without optional fields", async () => {
    const minimal: CachedBlogPost = {
      url: "https://claude.com/customers/test",
      slug: "test",
      content: "test content",
      contentHash: "hash123",
      lastCrawled: new Date(),
    };
    await putBlogPost(minimal);
    const cached = getBlogPost(minimal.url);
    expect(cached).toBeDefined();
    expect(cached!.company).toBeUndefined();
    expect(cached!.tags).toBeUndefined();
  });

  it("clearBlogLruCache removes all entries", async () => {
    await putBlogPost(SAMPLE_POST);
    clearBlogLruCache();
    expect(getBlogPost(SAMPLE_POST.url)).toBeUndefined();
  });

  it("stores multiple posts independently", async () => {
    await putBlogPost(SAMPLE_POST);
    const second: CachedBlogPost = {
      ...SAMPLE_POST,
      url: "https://claude.com/customers/figma",
      slug: "figma",
      company: "Figma",
    };
    await putBlogPost(second);

    expect(getBlogPost(SAMPLE_POST.url)!.company).toBe("Stripe");
    expect(getBlogPost(second.url)!.company).toBe("Figma");
  });
});
