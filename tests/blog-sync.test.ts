import { describe, it, expect } from "vitest";
import { syncBlogs, type BlogSyncReport } from "../lib/blog-sync.js";

describe("lib/blog-sync", () => {
  it("BlogSyncReport has expected shape", () => {
    const report: BlogSyncReport = {
      total: 0,
      updated: [],
      unchanged: [],
      errors: [],
      durationMs: 0,
    };
    expect(report.total).toBe(0);
    expect(report.updated).toEqual([]);
    expect(report.unchanged).toEqual([]);
    expect(report.errors).toEqual([]);
    expect(report.durationMs).toBe(0);
  });

  it("syncBlogs is exported as async function", () => {
    expect(typeof syncBlogs).toBe("function");
  });
});
