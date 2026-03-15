import { describe, it, expect } from "vitest";
import {
  isAllowedBlogUrl,
  extractSlug,
  hashContent,
  BLOG_ALLOWED_DOMAINS,
} from "../lib/blog-crawler.js";

describe("lib/blog-crawler", () => {
  describe("BLOG_ALLOWED_DOMAINS", () => {
    it("contains claude.com", () => {
      expect(BLOG_ALLOWED_DOMAINS).toContain("claude.com");
    });

    it("does not contain arbitrary domains", () => {
      expect(BLOG_ALLOWED_DOMAINS).not.toContain("evil.com");
      expect(BLOG_ALLOWED_DOMAINS).not.toContain("example.com");
    });
  });

  describe("isAllowedBlogUrl", () => {
    it("allows claude.com/customers/* URLs", () => {
      expect(isAllowedBlogUrl("https://claude.com/customers/stripe")).toBe(true);
      expect(isAllowedBlogUrl("https://claude.com/customers/figma")).toBe(true);
    });

    it("rejects non-/customers/ paths on claude.com", () => {
      expect(isAllowedBlogUrl("https://claude.com/about")).toBe(false);
      expect(isAllowedBlogUrl("https://claude.com/")).toBe(false);
      expect(isAllowedBlogUrl("https://claude.com/docs")).toBe(false);
    });

    it("rejects non-allowlisted domains", () => {
      expect(isAllowedBlogUrl("https://evil.com/customers/stripe")).toBe(false);
      expect(isAllowedBlogUrl("https://example.com/customers/test")).toBe(false);
    });

    it("rejects http (non-https)", () => {
      expect(isAllowedBlogUrl("http://claude.com/customers/stripe")).toBe(false);
    });

    it("rejects malformed URLs", () => {
      expect(isAllowedBlogUrl("not-a-url")).toBe(false);
      expect(isAllowedBlogUrl("")).toBe(false);
    });

    it("rejects subdomain bypass attempts", () => {
      expect(isAllowedBlogUrl("https://evil.claude.com/customers/stripe")).toBe(false);
      expect(isAllowedBlogUrl("https://sub.claude.com/customers/test")).toBe(false);
    });

    it("rejects URL encoding bypass", () => {
      expect(isAllowedBlogUrl("https://claude.com/%63ustomers/stripe")).toBe(false);
    });
  });

  describe("extractSlug", () => {
    it("extracts slug from valid customer URL", () => {
      expect(extractSlug("https://claude.com/customers/stripe")).toBe("stripe");
      expect(extractSlug("https://claude.com/customers/figma")).toBe("figma");
    });

    it("handles trailing slash", () => {
      expect(extractSlug("https://claude.com/customers/stripe/")).toBe("stripe");
    });

    it("returns empty for non-customer paths", () => {
      expect(extractSlug("https://claude.com/about")).toBe("");
      expect(extractSlug("https://claude.com/")).toBe("");
    });

    it("returns the customers segment, not deeper paths", () => {
      expect(extractSlug("https://claude.com/customers/stripe/details")).toBe("stripe");
    });

    it("returns empty for just /customers/ with no slug", () => {
      expect(extractSlug("https://claude.com/customers/")).toBe("");
    });

    it("returns empty for invalid URLs", () => {
      expect(extractSlug("not-a-url")).toBe("");
    });
  });

  describe("hashContent", () => {
    it("returns consistent SHA-256 hex", () => {
      const hash = hashContent("hello world");
      expect(hash).toHaveLength(64);
      expect(hashContent("hello world")).toBe(hash);
    });

    it("different content produces different hashes", () => {
      expect(hashContent("a")).not.toBe(hashContent("b"));
    });

    it("handles empty string", () => {
      const hash = hashContent("");
      expect(hash).toHaveLength(64);
    });
  });
});
