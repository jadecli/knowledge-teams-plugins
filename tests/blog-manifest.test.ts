import { describe, it, expect } from "vitest";
import {
  BLOG_MANIFEST,
  BLOG_BASE_URL,
  BLOG_DOMAIN,
  BLOG_COUNT,
  BLOG_BY_URL,
  getBlogUrls,
  getBlogsByTag,
  getBlogBySlug,
  type BlogEntry,
} from "../lib/blog-manifest.js";

describe("lib/blog-manifest", () => {
  describe("BLOG_MANIFEST", () => {
    it("contains blog entries", () => {
      expect(BLOG_MANIFEST.length).toBeGreaterThan(0);
    });

    it("BLOG_COUNT matches manifest length", () => {
      expect(BLOG_COUNT).toBe(BLOG_MANIFEST.length);
    });

    it("every entry has required fields", () => {
      for (const entry of BLOG_MANIFEST) {
        expect(entry.company).toBeTruthy();
        expect(entry.slug).toBeTruthy();
        expect(entry.url).toBeTruthy();
        expect(entry.url).toMatch(/^https:\/\/claude\.com\/customers\//);
      }
    });

    it("every entry URL starts with BLOG_BASE_URL", () => {
      for (const entry of BLOG_MANIFEST) {
        expect(entry.url.startsWith(BLOG_BASE_URL)).toBe(true);
      }
    });

    it("no duplicate slugs", () => {
      const slugs = BLOG_MANIFEST.map((e) => e.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it("no duplicate URLs", () => {
      const urls = BLOG_MANIFEST.map((e) => e.url);
      expect(new Set(urls).size).toBe(urls.length);
    });

    it("slug matches URL path segment", () => {
      for (const entry of BLOG_MANIFEST) {
        expect(entry.url).toBe(`${BLOG_BASE_URL}/${entry.slug}`);
      }
    });
  });

  describe("BLOG_DOMAIN", () => {
    it("is claude.com", () => {
      expect(BLOG_DOMAIN).toBe("claude.com");
    });
  });

  describe("BLOG_BY_URL", () => {
    it("maps all manifest URLs", () => {
      expect(BLOG_BY_URL.size).toBe(BLOG_MANIFEST.length);
    });

    it("returns correct entry by URL", () => {
      const stripe = BLOG_BY_URL.get(`${BLOG_BASE_URL}/stripe`);
      expect(stripe).toBeDefined();
      expect(stripe!.company).toBe("Stripe");
      expect(stripe!.slug).toBe("stripe");
    });

    it("returns undefined for unknown URL", () => {
      expect(BLOG_BY_URL.get("https://claude.com/customers/nonexistent")).toBeUndefined();
    });
  });

  describe("getBlogUrls", () => {
    it("returns array of all blog URLs", () => {
      const urls = getBlogUrls();
      expect(urls).toHaveLength(BLOG_MANIFEST.length);
      expect(urls[0]).toMatch(/^https:\/\/claude\.com\/customers\//);
    });
  });

  describe("getBlogsByTag", () => {
    it("filters by existing tag", () => {
      const healthcare = getBlogsByTag("healthcare");
      expect(healthcare.length).toBeGreaterThan(0);
      for (const entry of healthcare) {
        expect(entry.tags).toContain("healthcare");
      }
    });

    it("returns empty array for unknown tag", () => {
      expect(getBlogsByTag("nonexistent-tag-xyz")).toHaveLength(0);
    });
  });

  describe("getBlogBySlug", () => {
    it("finds entry by slug", () => {
      const entry = getBlogBySlug("stripe");
      expect(entry).toBeDefined();
      expect(entry!.company).toBe("Stripe");
    });

    it("returns undefined for unknown slug", () => {
      expect(getBlogBySlug("nonexistent-slug")).toBeUndefined();
    });
  });
});
