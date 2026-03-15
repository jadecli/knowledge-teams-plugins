import { describe, it, expect, beforeEach } from "vitest";
import { getDoc, putDoc, clearLruCache, type CachedDoc } from "../lib/llms-cache.js";

const SAMPLE_DOC: CachedDoc = {
  url: "https://docs.anthropic.com/llms.txt",
  content: "# Anthropic Docs\n\nSample content",
  contentHash: "abc123",
  lastCrawled: new Date("2026-03-11"),
};

describe("lib/llms-cache — LRU layer", () => {
  beforeEach(() => clearLruCache());

  it("returns undefined for unknown URL", () => {
    expect(getDoc("https://docs.anthropic.com/unknown")).toBeUndefined();
  });

  it("stores and retrieves a doc from LRU", async () => {
    await putDoc(SAMPLE_DOC);
    const cached = getDoc(SAMPLE_DOC.url);
    expect(cached).toBeDefined();
    expect(cached!.contentHash).toBe("abc123");
    expect(cached!.content).toContain("Anthropic Docs");
  });

  it("overwrites existing doc on put", async () => {
    await putDoc(SAMPLE_DOC);
    const updated = { ...SAMPLE_DOC, contentHash: "def456", content: "Updated" };
    await putDoc(updated);
    const cached = getDoc(SAMPLE_DOC.url);
    expect(cached!.contentHash).toBe("def456");
  });

  it("clearLruCache removes all entries", async () => {
    await putDoc(SAMPLE_DOC);
    clearLruCache();
    expect(getDoc(SAMPLE_DOC.url)).toBeUndefined();
  });
});
