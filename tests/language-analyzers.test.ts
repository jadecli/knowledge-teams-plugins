/**
 * Tests for src/language-analyzers.ts
 *
 * Covers exported query functions and registry data integrity.
 */

import { describe, it, expect } from "vitest";
import {
  LANGUAGE_ANALYZERS,
  getAnalyzerForExtension,
  getNativeAgentSdkLanguages,
  getMcpSdkLanguages,
  getKnowledgeWorkerStack,
} from "../src/language-analyzers.js";
import { SupportedLanguage } from "../src/mcp-registry.js";

describe("LANGUAGE_ANALYZERS registry", () => {
  it("contains an entry for every SupportedLanguage", () => {
    const registeredLanguages = new Set(LANGUAGE_ANALYZERS.map((a) => a.language));
    for (const lang of Object.values(SupportedLanguage)) {
      expect(registeredLanguages.has(lang), `Missing analyzer for ${lang}`).toBe(true);
    }
  });

  it("every analyzer has non-empty fileExtensions", () => {
    for (const analyzer of LANGUAGE_ANALYZERS) {
      expect(analyzer.fileExtensions.length, `${analyzer.language} has no extensions`).toBeGreaterThan(0);
    }
  });

  it("every analyzer has at least one recommendedMcp", () => {
    for (const analyzer of LANGUAGE_ANALYZERS) {
      expect(analyzer.recommendedMcps.length, `${analyzer.language} has no MCPs`).toBeGreaterThan(0);
    }
  });

  it("no duplicate file extensions across analyzers", () => {
    const seen = new Map<string, string>();
    for (const analyzer of LANGUAGE_ANALYZERS) {
      for (const ext of analyzer.fileExtensions) {
        // .h is shared by C and C++ — allow it
        if (ext === ".h") continue;
        expect(seen.has(ext), `${ext} claimed by both ${seen.get(ext)} and ${analyzer.language}`).toBe(false);
        seen.set(ext, analyzer.language);
      }
    }
  });
});

describe("getAnalyzerForExtension", () => {
  it("returns TypeScript analyzer for .ts", () => {
    const result = getAnalyzerForExtension(".ts");
    expect(result?.language).toBe(SupportedLanguage.TYPESCRIPT);
  });

  it("returns Python analyzer for .py", () => {
    const result = getAnalyzerForExtension(".py");
    expect(result?.language).toBe(SupportedLanguage.PYTHON);
  });

  it("returns undefined for unknown extension", () => {
    expect(getAnalyzerForExtension(".xyz")).toBeUndefined();
  });
});

describe("getNativeAgentSdkLanguages", () => {
  it("returns only languages with native support", () => {
    const result = getNativeAgentSdkLanguages();
    expect(result.length).toBeGreaterThan(0);
    for (const analyzer of result) {
      expect(analyzer.agentSdkSupport).toBe("native");
    }
  });

  it("includes TypeScript (has native Agent SDK)", () => {
    const languages = getNativeAgentSdkLanguages().map((a) => a.language);
    expect(languages).toContain(SupportedLanguage.TYPESCRIPT);
  });
});

describe("getMcpSdkLanguages", () => {
  it("returns only languages with MCP SDK available", () => {
    const result = getMcpSdkLanguages();
    for (const analyzer of result) {
      expect(analyzer.mcpSdkAvailable).toBe(true);
    }
  });

  it("excludes languages without MCP SDK", () => {
    const result = getMcpSdkLanguages();
    const languages = result.map((a) => a.language);
    // PHP has no MCP SDK per registry
    expect(languages).not.toContain(SupportedLanguage.PHP);
  });
});

describe("getKnowledgeWorkerStack", () => {
  it("returns packages and mcps for TypeScript", () => {
    const stack = getKnowledgeWorkerStack(SupportedLanguage.TYPESCRIPT);
    expect(stack.packages.length).toBeGreaterThan(0);
    expect(stack.mcps.length).toBeGreaterThan(0);
    expect(stack.agentSdkSupport).toBe("native");
  });

  it("returns empty for unknown language", () => {
    const stack = getKnowledgeWorkerStack("unknown" as SupportedLanguage);
    expect(stack).toEqual({ packages: [], mcps: [], agentSdkSupport: "none" });
  });
});
