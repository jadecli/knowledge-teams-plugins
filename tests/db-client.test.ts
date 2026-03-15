/**
 * Tests for db/client.ts
 *
 * Tests the getDb() factory and hasDatabase() guard.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("db/client", () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    // Clear module cache to reset cached singleton
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.DATABASE_URL = originalEnv;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it("hasDatabase returns false when DATABASE_URL is unset", async () => {
    delete process.env.DATABASE_URL;
    const { hasDatabase } = await import("../db/client.js");
    expect(hasDatabase()).toBe(false);
  });

  it("hasDatabase returns true when DATABASE_URL is set", async () => {
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    const { hasDatabase } = await import("../db/client.js");
    expect(hasDatabase()).toBe(true);
  });

  it("getDb throws when DATABASE_URL is unset", async () => {
    delete process.env.DATABASE_URL;
    const { getDb } = await import("../db/client.js");
    expect(() => getDb()).toThrow("DATABASE_URL is not set");
  });
});
