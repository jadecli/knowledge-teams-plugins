import { describe, it, expect } from "vitest";
import {
  dimTools,
  dimAgents,
  dimSessions,
  factToolCalls,
  factOrgUsage,
  metaDocCache,
} from "../db/schema.js";

describe("db/schema — Kimball dimensional model", () => {
  it("dim_tools has expected columns", () => {
    expect(dimTools.id).toBeDefined();
    expect(dimTools.toolName).toBeDefined();
    expect(dimTools.category).toBeDefined();
    expect(dimTools.origin).toBeDefined();
    expect(dimTools.isWebmcp).toBeDefined();
  });

  it("dim_agents has expected columns", () => {
    expect(dimAgents.id).toBeDefined();
    expect(dimAgents.agentName).toBeDefined();
    expect(dimAgents.sdkVersion).toBeDefined();
    expect(dimAgents.model).toBeDefined();
  });

  it("dim_sessions has expected columns", () => {
    expect(dimSessions.id).toBeDefined();
    expect(dimSessions.sessionId).toBeDefined();
    expect(dimSessions.branchName).toBeDefined();
    expect(dimSessions.prNumber).toBeDefined();
    expect(dimSessions.repo).toBeDefined();
    expect(dimSessions.startedAt).toBeDefined();
  });

  it("fact_tool_calls has dimension FKs and measures", () => {
    expect(factToolCalls.toolId).toBeDefined();
    expect(factToolCalls.sessionId).toBeDefined();
    expect(factToolCalls.agentId).toBeDefined();
    // Measures
    expect(factToolCalls.durationMs).toBeDefined();
    expect(factToolCalls.inputTokens).toBeDefined();
    expect(factToolCalls.outputTokens).toBeDefined();
    expect(factToolCalls.success).toBeDefined();
  });

  it("fact_org_usage has token measures", () => {
    expect(factOrgUsage.inputTokens).toBeDefined();
    expect(factOrgUsage.outputTokens).toBeDefined();
    expect(factOrgUsage.cacheReadTokens).toBeDefined();
    expect(factOrgUsage.cacheCreationTokens).toBeDefined();
    expect(factOrgUsage.model).toBeDefined();
  });

  it("meta_doc_cache has url, hash, and content", () => {
    expect(metaDocCache.url).toBeDefined();
    expect(metaDocCache.contentHash).toBeDefined();
    expect(metaDocCache.content).toBeDefined();
    expect(metaDocCache.lastCrawled).toBeDefined();
    expect(metaDocCache.parentUrl).toBeDefined();
  });
});
