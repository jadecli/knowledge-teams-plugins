/**
 * Tests for lib/llms-sync.ts
 *
 * Tests syncDocs() orchestration with mocked crawler and cache.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/llms-crawler.js", () => ({
  getEntryUrls: vi.fn(),
  crawlRecursive: vi.fn(),
}));

vi.mock("../lib/llms-cache.js", () => ({
  getDocWithFallback: vi.fn(),
  putDoc: vi.fn(),
}));

import { getEntryUrls, crawlRecursive } from "../lib/llms-crawler.js";
import { getDocWithFallback, putDoc } from "../lib/llms-cache.js";
import { syncDocs } from "../lib/llms-sync.js";

const mockedGetEntryUrls = vi.mocked(getEntryUrls);
const mockedCrawlRecursive = vi.mocked(crawlRecursive);
const mockedGetDocWithFallback = vi.mocked(getDocWithFallback);
const mockedPutDoc = vi.mocked(putDoc);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("syncDocs", () => {
  it("reports updated URLs when content has changed", async () => {
    mockedGetEntryUrls.mockReturnValue(["https://docs.anthropic.com/llms.txt"]);
    mockedGetDocWithFallback.mockResolvedValue(undefined);
    mockedCrawlRecursive.mockResolvedValue([
      {
        url: "https://docs.anthropic.com/llms.txt",
        content: "# docs",
        contentHash: "abc123",
        changed: true,
        childUrls: [],
      },
    ]);
    mockedPutDoc.mockResolvedValue(undefined);

    const report = await syncDocs();
    expect(report.updated).toEqual(["https://docs.anthropic.com/llms.txt"]);
    expect(report.unchanged).toEqual([]);
    expect(report.errors).toEqual([]);
    expect(mockedPutDoc).toHaveBeenCalledOnce();
  });

  it("reports unchanged URLs when content hash matches", async () => {
    mockedGetEntryUrls.mockReturnValue(["https://docs.anthropic.com/llms.txt"]);
    mockedGetDocWithFallback.mockResolvedValue({
      url: "https://docs.anthropic.com/llms.txt",
      content: "# docs",
      contentHash: "abc123",
      lastCrawled: new Date(),
    });
    mockedCrawlRecursive.mockResolvedValue([
      {
        url: "https://docs.anthropic.com/llms.txt",
        content: "# docs",
        contentHash: "abc123",
        changed: false,
        childUrls: [],
      },
    ]);

    const report = await syncDocs();
    expect(report.updated).toEqual([]);
    expect(report.unchanged).toEqual(["https://docs.anthropic.com/llms.txt"]);
    expect(mockedPutDoc).not.toHaveBeenCalled();
  });

  it("catches crawl errors and reports them", async () => {
    mockedGetEntryUrls.mockReturnValue(["https://docs.anthropic.com/llms.txt"]);
    mockedGetDocWithFallback.mockRejectedValue(new Error("network down"));

    const report = await syncDocs();
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]).toContain("network down");
  });

  it("handles multiple entry URLs independently", async () => {
    mockedGetEntryUrls.mockReturnValue([
      "https://docs.anthropic.com/llms.txt",
      "https://claude.ai/llms.txt",
    ]);
    mockedGetDocWithFallback.mockResolvedValue(undefined);
    mockedCrawlRecursive.mockResolvedValue([
      { url: "test", content: "x", contentHash: "h", changed: true, childUrls: [] },
    ]);
    mockedPutDoc.mockResolvedValue(undefined);

    const report = await syncDocs();
    expect(report.updated).toHaveLength(2);
    expect(mockedCrawlRecursive).toHaveBeenCalledTimes(2);
  });
});
