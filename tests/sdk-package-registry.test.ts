import { describe, it, expect } from "vitest";
import {
  ALL_PINNED_PACKAGES,
  ANTHROPIC_TS_PACKAGES,
  MCP_CORE_TS_PACKAGES,
  MCP_SERVER_TS_PACKAGES,
  LANGUAGE_ANALYZER_PACKAGES,
  ANTHROPIC_PY_PACKAGES,
  MCP_SERVER_PY_PACKAGES,
  getPackagesByScope,
  getPackagesByLanguage,
  getProductionPackages,
  getPackagesForMCP,
  toDependenciesFragment,
} from "../src/sdk-package-registry.js";

describe("SDK Package Registry", () => {
  it("has all Anthropic TS packages pinned", () => {
    const names = ANTHROPIC_TS_PACKAGES.map((p) => p.name);
    expect(names).toContain("@anthropic-ai/claude-agent-sdk");
    expect(names).toContain("@anthropic-ai/sdk");
    expect(names).toContain("@anthropic-ai/bedrock-sdk");
    expect(names).toContain("@anthropic-ai/vertex-sdk");
    expect(names).toContain("@anthropic-ai/foundry-sdk");
    expect(names).toContain("@anthropic-ai/tokenizer");
    expect(names).toContain("@anthropic-ai/dxt");
    expect(names).toContain("@anthropic-ai/mcpb");
  });

  it("pins exact versions (no ^ or ~ prefixes)", () => {
    for (const pkg of ANTHROPIC_TS_PACKAGES) {
      expect(pkg.pinnedVersion).not.toMatch(/^[\^~]/);
    }
  });

  it("has MCP core packages", () => {
    const names = MCP_CORE_TS_PACKAGES.map((p) => p.name);
    expect(names).toContain("@modelcontextprotocol/sdk");
    expect(names).toContain("@modelcontextprotocol/inspector");
  });

  it("MCP server packages reference their MCP IDs", () => {
    for (const pkg of MCP_SERVER_TS_PACKAGES) {
      expect(pkg.supportsMCPs).toBeDefined();
      expect(pkg.supportsMCPs!.length).toBeGreaterThan(0);
    }
  });

  it("total packages covers all registries", () => {
    const expected =
      ANTHROPIC_TS_PACKAGES.length +
      MCP_CORE_TS_PACKAGES.length +
      MCP_SERVER_TS_PACKAGES.length +
      LANGUAGE_ANALYZER_PACKAGES.length +
      ANTHROPIC_PY_PACKAGES.length +
      MCP_SERVER_PY_PACKAGES.length;
    expect(ALL_PINNED_PACKAGES.length).toBe(expected);
  });
});

describe("Package Registry Queries", () => {
  it("getPackagesByScope returns correct packages", () => {
    const sdkPkgs = getPackagesByScope("anthropic-sdk");
    expect(sdkPkgs.length).toBeGreaterThanOrEqual(8); // 8 TS + 2 Python
    for (const pkg of sdkPkgs) {
      expect(pkg.scope).toBe("anthropic-sdk");
    }
  });

  it("getPackagesByLanguage filters by language", () => {
    const tsPkgs = getPackagesByLanguage("typescript");
    for (const pkg of tsPkgs) {
      expect(pkg.language).toBe("typescript");
    }

    const pyPkgs = getPackagesByLanguage("python");
    for (const pkg of pyPkgs) {
      expect(pkg.language).toBe("python");
    }
  });

  it("getProductionPackages excludes dev-only packages", () => {
    const prodPkgs = getProductionPackages();
    for (const pkg of prodPkgs) {
      expect(pkg.production).toBe(true);
    }
    // inspector and vitest should be excluded
    const names = prodPkgs.map((p) => p.name);
    expect(names).not.toContain("@modelcontextprotocol/inspector");
    expect(names).not.toContain("vitest");
  });

  it("getPackagesForMCP returns packages supporting a specific MCP", () => {
    const memPkgs = getPackagesForMCP("memory");
    expect(memPkgs.length).toBeGreaterThanOrEqual(1);
    expect(memPkgs[0].name).toBe("@modelcontextprotocol/server-memory");
  });

  it("toDependenciesFragment generates package.json fragment", () => {
    const fragment = toDependenciesFragment(ANTHROPIC_TS_PACKAGES);
    expect(fragment["@anthropic-ai/sdk"]).toBe("0.78.0");
    expect(fragment["@anthropic-ai/claude-agent-sdk"]).toBe("0.2.72");
    // Python packages should be excluded
    expect(fragment["anthropic"]).toBeUndefined();
  });
});
