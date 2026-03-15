import { describe, it, expect } from "vitest";
import { isAllowedBlogUrl, crawlBlogBatch } from "../lib/blog-crawler.js";

describe("lib/blog-crawler — isAllowedBlogUrl", () => {
  it("allows anthropic.com/customers/* URLs", () => {
    expect(isAllowedBlogUrl("https://www.anthropic.com/customers/stripe")).toBe(true);
    expect(isAllowedBlogUrl("https://www.anthropic.com/customers/spotify")).toBe(true);
  });

  it("rejects non-anthropic domains", () => {
    expect(isAllowedBlogUrl("https://evil.com/customers/stripe")).toBe(false);
    expect(isAllowedBlogUrl("https://docs.anthropic.com/llms.txt")).toBe(false);
  });

  it("rejects http (non-https)", () => {
    expect(isAllowedBlogUrl("http://www.anthropic.com/customers/stripe")).toBe(false);
  });

  it("rejects anthropic.com without /customers/ path", () => {
    expect(isAllowedBlogUrl("https://www.anthropic.com/research")).toBe(false);
    expect(isAllowedBlogUrl("https://www.anthropic.com/")).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isAllowedBlogUrl("not-a-url")).toBe(false);
    expect(isAllowedBlogUrl("://missing-scheme")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isAllowedBlogUrl("")).toBe(false);
  });
});

describe("lib/blog-crawler — crawlBlogBatch", () => {
  it("returns empty array for empty entries", async () => {
    const results = await crawlBlogBatch([], new Map(), 5);
    expect(results).toEqual([]);
  });
});
