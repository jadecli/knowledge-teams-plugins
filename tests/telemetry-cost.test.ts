import { describe, it, expect, beforeEach } from "vitest";
import {
  recordInvocation,
  getEvents,
  clearTelemetry,
  getAggregateCost,
  getCostByOrganization,
  getCostByModel,
  getAvgDurationByTool,
  type CostAwareTelemetryEvent,
} from "../webmcp/shared/telemetry.js";

describe("enhanced telemetry — cost-aware", () => {
  beforeEach(() => clearTelemetry());

  it("records cost-aware events alongside basic events", () => {
    // Basic event (backwards compatible)
    recordInvocation({
      toolName: "basic-tool",
      timestamp: Date.now(),
      durationMs: 100,
      success: true,
    });

    // Cost-aware event
    const costEvent: CostAwareTelemetryEvent = {
      toolName: "agent-query",
      timestamp: Date.now(),
      durationMs: 5000,
      success: true,
      costUSD: 0.05,
      tokenCounts: {
        inputTokens: 1000,
        outputTokens: 500,
        cacheReadInputTokens: 200,
        cacheCreationInputTokens: 0,
      },
      organizationId: "org-123",
      sessionId: "session-abc",
      model: "claude-sonnet-4-6",
    };
    recordInvocation(costEvent);

    expect(getEvents()).toHaveLength(2);
    expect(getEvents()[1].costUSD).toBe(0.05);
  });

  it("calculates aggregate cost", () => {
    recordInvocation({
      toolName: "t1",
      timestamp: 0,
      durationMs: 100,
      success: true,
      costUSD: 0.03,
    });
    recordInvocation({
      toolName: "t2",
      timestamp: 0,
      durationMs: 200,
      success: true,
      costUSD: 0.07,
    });
    recordInvocation({
      toolName: "t3",
      timestamp: 0,
      durationMs: 50,
      success: true,
      // No cost — should not count
    });

    const agg = getAggregateCost();
    expect(agg.totalCostUSD).toBeCloseTo(0.10);
    expect(agg.eventCount).toBe(2);
  });

  it("breaks down cost by organization", () => {
    recordInvocation({
      toolName: "t1",
      timestamp: 0,
      durationMs: 100,
      success: true,
      costUSD: 0.05,
      organizationId: "org-A",
    });
    recordInvocation({
      toolName: "t2",
      timestamp: 0,
      durationMs: 100,
      success: true,
      costUSD: 0.03,
      organizationId: "org-B",
    });
    recordInvocation({
      toolName: "t3",
      timestamp: 0,
      durationMs: 100,
      success: true,
      costUSD: 0.02,
      organizationId: "org-A",
    });

    const byOrg = getCostByOrganization();
    expect(byOrg["org-A"]).toBeCloseTo(0.07);
    expect(byOrg["org-B"]).toBeCloseTo(0.03);
  });

  it("breaks down cost by model", () => {
    recordInvocation({
      toolName: "t1",
      timestamp: 0,
      durationMs: 100,
      success: true,
      costUSD: 0.10,
      model: "claude-opus-4-6",
    });
    recordInvocation({
      toolName: "t2",
      timestamp: 0,
      durationMs: 100,
      success: true,
      costUSD: 0.02,
      model: "claude-haiku-4-5",
    });

    const byModel = getCostByModel();
    expect(byModel["claude-opus-4-6"]).toBeCloseTo(0.10);
    expect(byModel["claude-haiku-4-5"]).toBeCloseTo(0.02);
  });

  it("calculates average duration by tool", () => {
    recordInvocation({ toolName: "read", timestamp: 0, durationMs: 100, success: true });
    recordInvocation({ toolName: "read", timestamp: 0, durationMs: 200, success: true });
    recordInvocation({ toolName: "write", timestamp: 0, durationMs: 50, success: true });

    const avg = getAvgDurationByTool();
    expect(avg["read"].avgMs).toBe(150);
    expect(avg["read"].count).toBe(2);
    expect(avg["write"].avgMs).toBe(50);
  });
});
