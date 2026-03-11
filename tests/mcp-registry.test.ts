import { describe, it, expect } from "vitest";
import {
  ALL_MCP_SERVERS,
  REFERENCE_MCP_SERVERS,
  ARCHIVED_MCP_SERVERS,
  KWP_RECOMMENDED_MCPS,
  FWP_RECOMMENDED_MCPS,
  SHARED_MCPS,
  MCPCategory,
  MCP_REGISTRY_META,
  getMCPById,
  getMCPsByCategory,
  getMCPsWithNpmPackage,
  getKWPMCPs,
  getFWPMCPs,
} from "../src/mcp-registry.js";

describe("MCP Registry", () => {
  it("has frontmatter metadata", () => {
    expect(MCP_REGISTRY_META.dataSource).toContain("modelcontextprotocol");
    expect(MCP_REGISTRY_META.lastUpdated).toBe("2026-03-11");
    expect(MCP_REGISTRY_META.mcpSdkVersion).toBe("1.27.1");
  });

  it("has 7 active reference servers", () => {
    expect(REFERENCE_MCP_SERVERS).toHaveLength(7);
    const ids = REFERENCE_MCP_SERVERS.map((s) => s.id);
    expect(ids).toContain("everything");
    expect(ids).toContain("filesystem");
    expect(ids).toContain("memory");
    expect(ids).toContain("fetch");
    expect(ids).toContain("git");
    expect(ids).toContain("sequential-thinking");
    expect(ids).toContain("time");
  });

  it("has archived servers with pinned versions", () => {
    expect(ARCHIVED_MCP_SERVERS.length).toBeGreaterThan(0);
    const github = ARCHIVED_MCP_SERVERS.find((s) => s.id === "github");
    expect(github).toBeDefined();
    expect(github!.npmPackage).toBe("@modelcontextprotocol/server-github");
    expect(github!.pinnedVersion).toBe("2025.4.8");
  });

  it("total servers = reference + archived", () => {
    expect(ALL_MCP_SERVERS.length).toBe(
      REFERENCE_MCP_SERVERS.length + ARCHIVED_MCP_SERVERS.length,
    );
  });
});

describe("MCP Bridge Enums", () => {
  it("KWP recommendations include core knowledge work MCPs", () => {
    expect(KWP_RECOMMENDED_MCPS.FILESYSTEM).toBe("filesystem");
    expect(KWP_RECOMMENDED_MCPS.MEMORY).toBe("memory");
    expect(KWP_RECOMMENDED_MCPS.GIT).toBe("git");
    expect(KWP_RECOMMENDED_MCPS.GITHUB).toBe("github");
    expect(KWP_RECOMMENDED_MCPS.GOOGLE_DRIVE).toBe("google-drive");
  });

  it("FWP recommendations include data infrastructure MCPs", () => {
    expect(FWP_RECOMMENDED_MCPS.POSTGRES).toBe("postgres");
    expect(FWP_RECOMMENDED_MCPS.REDIS).toBe("redis");
    expect(FWP_RECOMMENDED_MCPS.TIME).toBe("time");
  });

  it("SHARED_MCPS are in both KWP and FWP", () => {
    const kwpIds = new Set(Object.values(KWP_RECOMMENDED_MCPS));
    const fwpIds = new Set(Object.values(FWP_RECOMMENDED_MCPS));
    for (const shared of SHARED_MCPS) {
      expect(kwpIds.has(shared)).toBe(true);
      expect(fwpIds.has(shared)).toBe(true);
    }
  });
});

describe("MCP Lookup Helpers", () => {
  it("getMCPById returns correct server", () => {
    const mem = getMCPById("memory");
    expect(mem).toBeDefined();
    expect(mem!.name).toBe("Memory");
    expect(mem!.category).toBe(MCPCategory.MEMORY);
  });

  it("getMCPById returns undefined for unknown", () => {
    expect(getMCPById("nonexistent")).toBeUndefined();
  });

  it("getMCPsByCategory finds servers by primary and additional categories", () => {
    const dbServers = getMCPsByCategory(MCPCategory.DATABASE);
    const dbIds = dbServers.map((s) => s.id);
    expect(dbIds).toContain("postgres");
    expect(dbIds).toContain("redis");
  });

  it("getMCPsWithNpmPackage excludes Python-only servers", () => {
    const npmServers = getMCPsWithNpmPackage();
    const ids = npmServers.map((s) => s.id);
    expect(ids).not.toContain("fetch"); // Python-only
    expect(ids).not.toContain("git"); // Python-only
    expect(ids).toContain("memory"); // has npm package
  });

  it("getKWPMCPs returns knowledge work servers", () => {
    const kwpServers = getKWPMCPs();
    expect(kwpServers.length).toBe(Object.keys(KWP_RECOMMENDED_MCPS).length);
  });

  it("getFWPMCPs returns financial work servers", () => {
    const fwpServers = getFWPMCPs();
    expect(fwpServers.length).toBe(Object.keys(FWP_RECOMMENDED_MCPS).length);
  });
});
