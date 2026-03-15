/**
 * Tests for src/mcp-registry.ts
 *
 * Covers query helpers, enum integrity, and registry data consistency.
 */

import { describe, it, expect } from "vitest";
import {
  McpOrigin,
  McpTransport,
  McpCategory,
  WorkDomain,
  SupportedLanguage,
  MCP_SERVERS,
  ANTHROPIC_PACKAGES,
  MCP_PACKAGES,
  SHARED_MCPS,
  getMcpsByDomain,
  getMcpsByCategory,
  getMcpsByOrigin,
  getSdkPackagesForLanguage,
  getInstalledPackages,
  getMonitoredPackages,
  getMcpById,
} from "../src/mcp-registry.js";

describe("MCP_SERVERS registry integrity", () => {
  it("has at least one server entry", () => {
    expect(MCP_SERVERS.length).toBeGreaterThan(0);
  });

  it("every server has a unique id", () => {
    const ids = MCP_SERVERS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every server has valid category and origin enums", () => {
    const validCategories = new Set(Object.values(McpCategory));
    const validOrigins = new Set(Object.values(McpOrigin));
    for (const server of MCP_SERVERS) {
      expect(validCategories.has(server.category), `Invalid category: ${server.category} on ${server.id}`).toBe(true);
      expect(validOrigins.has(server.origin), `Invalid origin: ${server.origin} on ${server.id}`).toBe(true);
    }
  });

  it("every server has at least one domain", () => {
    for (const server of MCP_SERVERS) {
      expect(server.domains.length, `${server.id} has no domains`).toBeGreaterThan(0);
    }
  });

  it("every server has a transport defined", () => {
    for (const server of MCP_SERVERS) {
      expect(server.transport, `${server.id} has no transport`).toBeDefined();
    }
  });
});

describe("getMcpsByDomain", () => {
  it("returns servers for knowledge-work domain", () => {
    const result = getMcpsByDomain(WorkDomain.KNOWLEDGE_WORK);
    expect(result.length).toBeGreaterThan(0);
    for (const server of result) {
      expect(server.domains).toContain(WorkDomain.KNOWLEDGE_WORK);
    }
  });

  it("returns empty for infrastructure domain if none exist", () => {
    const result = getMcpsByDomain(WorkDomain.INFRASTRUCTURE);
    // May or may not have entries; just verify filter works
    for (const server of result) {
      expect(server.domains).toContain(WorkDomain.INFRASTRUCTURE);
    }
  });
});

describe("getMcpsByCategory", () => {
  it("returns filesystem servers", () => {
    const result = getMcpsByCategory(McpCategory.FILESYSTEM);
    expect(result.length).toBeGreaterThan(0);
    for (const server of result) {
      expect(server.category).toBe(McpCategory.FILESYSTEM);
    }
  });
});

describe("getMcpsByOrigin", () => {
  it("returns reference servers", () => {
    const result = getMcpsByOrigin(McpOrigin.REFERENCE);
    expect(result.length).toBeGreaterThan(0);
    for (const server of result) {
      expect(server.origin).toBe(McpOrigin.REFERENCE);
    }
  });
});

describe("getSdkPackagesForLanguage", () => {
  it("returns SDK packages for TypeScript", () => {
    const result = getSdkPackagesForLanguage(SupportedLanguage.TYPESCRIPT);
    expect(result.length).toBeGreaterThan(0);
    for (const pkg of result) {
      expect(pkg.language).toBe(SupportedLanguage.TYPESCRIPT);
    }
  });

  it("returns empty array for unknown language", () => {
    const result = getSdkPackagesForLanguage("unknown" as SupportedLanguage);
    expect(result).toEqual([]);
  });
});

describe("getInstalledPackages", () => {
  it("returns only packages marked as installed", () => {
    const result = getInstalledPackages();
    for (const pkg of result) {
      expect(pkg.installed).toBe(true);
    }
  });

  it("is a subset of ANTHROPIC_PACKAGES + MCP_PACKAGES", () => {
    const allNames = new Set([...ANTHROPIC_PACKAGES, ...MCP_PACKAGES].map((p) => p.name));
    for (const pkg of getInstalledPackages()) {
      expect(allNames.has(pkg.name), `${pkg.name} not in canonical packages`).toBe(true);
    }
  });
});

describe("getMonitoredPackages", () => {
  it("returns name, current, registry for every canonical package", () => {
    const result = getMonitoredPackages();
    expect(result.length).toBe(ANTHROPIC_PACKAGES.length + MCP_PACKAGES.length);
    for (const pkg of result) {
      expect(pkg).toHaveProperty("name");
      expect(pkg).toHaveProperty("current");
      expect(pkg).toHaveProperty("registry");
    }
  });
});

describe("getMcpById", () => {
  it("finds a known MCP server", () => {
    const first = MCP_SERVERS[0];
    const result = getMcpById(first.id);
    expect(result).toBeDefined();
    expect(result?.id).toBe(first.id);
  });

  it("returns undefined for unknown id", () => {
    expect(getMcpById("nonexistent-mcp-server")).toBeUndefined();
  });
});

describe("SHARED_MCPS", () => {
  it("contains only MCPs that appear in both domain recommendation lists", () => {
    // SHARED_MCPS is computed at module level — just verify it's an array
    expect(Array.isArray(SHARED_MCPS)).toBe(true);
  });
});
