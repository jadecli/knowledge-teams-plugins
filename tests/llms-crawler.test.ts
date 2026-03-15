import { describe, it, expect } from "vitest";
import {
  isAllowedUrl,
  hashContent,
  extractUrls,
  getEntryUrls,
} from "../lib/llms-crawler.js";

describe("lib/llms-crawler", () => {
  describe("isAllowedUrl", () => {
    it("allows docs.anthropic.com", () => {
      expect(isAllowedUrl("https://docs.anthropic.com/llms.txt")).toBe(true);
      expect(isAllowedUrl("https://docs.anthropic.com/llms-full.txt")).toBe(true);
      expect(isAllowedUrl("https://docs.anthropic.com/en/docs/overview")).toBe(true);
    });

    it("allows claude.ai", () => {
      expect(isAllowedUrl("https://claude.ai/code/llms.txt")).toBe(true);
    });

    it("rejects non-allowlisted domains", () => {
      expect(isAllowedUrl("https://evil.com/llms.txt")).toBe(false);
      expect(isAllowedUrl("https://example.com/")).toBe(false);
      expect(isAllowedUrl("https://fake-anthropic.com/llms.txt")).toBe(false);
    });

    it("rejects http (non-https)", () => {
      expect(isAllowedUrl("http://docs.anthropic.com/llms.txt")).toBe(false);
    });

    it("rejects malformed URLs", () => {
      expect(isAllowedUrl("not-a-url")).toBe(false);
      expect(isAllowedUrl("")).toBe(false);
    });
  });

  describe("hashContent", () => {
    it("returns consistent SHA-256 hex", () => {
      const hash = hashContent("hello world");
      expect(hash).toHaveLength(64); // SHA-256 hex = 64 chars
      expect(hashContent("hello world")).toBe(hash); // Deterministic
    });

    it("different content produces different hashes", () => {
      expect(hashContent("a")).not.toBe(hashContent("b"));
    });
  });

  describe("extractUrls", () => {
    it("extracts bare HTTPS URLs on allowlisted domains", () => {
      const txt = `Some docs
https://docs.anthropic.com/en/docs/overview
Other text
https://docs.anthropic.com/en/docs/build
`;
      const urls = extractUrls(txt);
      expect(urls).toContain("https://docs.anthropic.com/en/docs/overview");
      expect(urls).toContain("https://docs.anthropic.com/en/docs/build");
    });

    it("extracts markdown-style links", () => {
      const txt = `- [Overview](https://docs.anthropic.com/en/docs/overview)`;
      const urls = extractUrls(txt);
      expect(urls).toContain("https://docs.anthropic.com/en/docs/overview");
    });

    it("skips non-allowlisted URLs", () => {
      const txt = `https://evil.com/steal-data
https://docs.anthropic.com/safe`;
      const urls = extractUrls(txt);
      expect(urls).toHaveLength(1);
      expect(urls[0]).toBe("https://docs.anthropic.com/safe");
    });
  });

  describe("getEntryUrls", () => {
    it("returns anthropic doc entry points", () => {
      const urls = getEntryUrls();
      expect(urls.length).toBeGreaterThanOrEqual(2);
      expect(urls).toContain("https://docs.anthropic.com/llms.txt");
      expect(urls).toContain("https://docs.anthropic.com/llms-full.txt");
    });
  });
});
