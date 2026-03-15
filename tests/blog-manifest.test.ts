import { describe, it, expect } from "vitest";
import {
  BLOG_MANIFEST,
  BLOG_COUNT,
  getBlogUrls,
  getBlogBySlug,
} from "../lib/blog-manifest.js";

describe("lib/blog-manifest", () => {
  it("BLOG_MANIFEST is a non-empty array", () => {
    expect(Array.isArray(BLOG_MANIFEST)).toBe(true);
    expect(BLOG_MANIFEST.length).toBeGreaterThan(0);
  });

  it("BLOG_COUNT matches BLOG_MANIFEST.length", () => {
    expect(BLOG_COUNT).toBe(BLOG_MANIFEST.length);
  });

  it("every entry has slug, title, and url", () => {
    for (const entry of BLOG_MANIFEST) {
      expect(entry.slug).toBeTruthy();
      expect(entry.title).toBeTruthy();
      expect(entry.url).toBeTruthy();
    }
  });

  it("every URL starts with https://www.anthropic.com/customers/", () => {
    for (const entry of BLOG_MANIFEST) {
      expect(entry.url).toMatch(/^https:\/\/www\.anthropic\.com\/customers\//);
    }
  });

  it("has no duplicate slugs", () => {
    const slugs = BLOG_MANIFEST.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has no duplicate URLs", () => {
    const urls = BLOG_MANIFEST.map((b) => b.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("getBlogUrls returns array matching manifest length", () => {
    const urls = getBlogUrls();
    expect(urls).toHaveLength(BLOG_MANIFEST.length);
    expect(urls[0]).toBe(BLOG_MANIFEST[0].url);
  });

  it("getBlogBySlug returns entry for known slug", () => {
    const entry = getBlogBySlug("stripe");
    expect(entry).toBeDefined();
    expect(entry!.slug).toBe("stripe");
    expect(entry!.url).toContain("stripe");
  });

  it("getBlogBySlug returns undefined for unknown slug", () => {
    expect(getBlogBySlug("nonexistent-company-xyz")).toBeUndefined();
  });
});
