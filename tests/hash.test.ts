import { describe, it, expect } from "vitest";
import { hashContent } from "../lib/hash.js";

describe("lib/hash", () => {
  it("returns 64-char hex string (SHA-256)", () => {
    expect(hashContent("test")).toHaveLength(64);
    expect(hashContent("test")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", () => {
    expect(hashContent("hello")).toBe(hashContent("hello"));
  });

  it("different inputs produce different hashes", () => {
    expect(hashContent("a")).not.toBe(hashContent("b"));
  });

  it("handles empty string", () => {
    const hash = hashContent("");
    expect(hash).toHaveLength(64);
    // Known SHA-256 of empty string
    expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("handles unicode content", () => {
    const hash = hashContent("日本語テスト");
    expect(hash).toHaveLength(64);
    expect(hashContent("日本語テスト")).toBe(hash);
  });
});
