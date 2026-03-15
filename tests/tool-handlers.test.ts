import { describe, it, expect, beforeEach } from "vitest";
import { clearRegistry } from "../webmcp/shared/register.js";

beforeEach(() => clearRegistry());

describe("internal tool handlers", () => {
  it("claim-task handler returns expected shape", async () => {
    const { claimTask } = await import("../webmcp/internal/tools/claim-task.js");
    const result = await claimTask.handler({
      taskId: "task-1",
      agentId: "agent-1",
      role: "cto",
    });
    expect(result).toMatchObject({
      taskId: "task-1",
      claimedBy: "agent-1",
      role: "cto",
      success: true,
    });
    expect(result.claimedAt).toBeTruthy();
  });

  it("get-my-tasks handler returns empty tasks", async () => {
    const { getMyTasks } = await import("../webmcp/internal/tools/get-my-tasks.js");
    const result = await getMyTasks.handler({
      agentId: "agent-1",
      status: "active",
    });
    expect(result).toEqual({
      agentId: "agent-1",
      tasks: [],
      filter: "active",
    });
  });

  it("submit-artifact handler returns artifact id", async () => {
    const { submitArtifact } = await import("../webmcp/internal/tools/submit-artifact.js");
    const result = await submitArtifact.handler({
      taskId: "task-1",
      artifactType: "report",
      content: "some content",
    });
    expect(result.taskId).toBe("task-1");
    expect(result.type).toBe("report");
    expect(result.accepted).toBe(true);
    expect(result.artifactId).toMatch(/^art_\d+$/);
  });

  it("submit-artifact handler accepts optional metadata", async () => {
    const { submitArtifact } = await import("../webmcp/internal/tools/submit-artifact.js");
    const result = await submitArtifact.handler({
      taskId: "task-2",
      artifactType: "code",
      content: "fn main() {}",
      metadata: { model: "opus", tokenCount: 100, toolCallsUsed: 5 },
    });
    expect(result.accepted).toBe(true);
  });

  it("request-checkpoint handler returns checkpoint id", async () => {
    const { requestCheckpoint } = await import("../webmcp/internal/tools/request-checkpoint.js");
    const result = await requestCheckpoint.handler({
      taskId: "task-1",
      budgetUsed: 10,
      summary: "half done",
    });
    expect(result.checkpointId).toMatch(/^cp_\d+$/);
    expect(result.budgetExtended).toBe(0);
    expect(result.approved).toBe(true);
  });

  it("request-checkpoint handler handles budget extension", async () => {
    const { requestCheckpoint } = await import("../webmcp/internal/tools/request-checkpoint.js");
    const result = await requestCheckpoint.handler({
      taskId: "task-1",
      budgetUsed: 10,
      summary: "need more",
      requestBudgetExtension: 50,
    });
    expect(result.budgetExtended).toBe(50);
  });

  it("get-team-status handler returns empty agents", async () => {
    const { getTeamStatus } = await import("../webmcp/internal/tools/get-team-status.js");
    const result = await getTeamStatus.handler({});
    expect(result).toEqual({
      filter: "all",
      agents: [],
      activeTasks: 0,
      totalBudgetUsed: 0,
    });
  });

  it("get-team-status handler respects teamFilter", async () => {
    const { getTeamStatus } = await import("../webmcp/internal/tools/get-team-status.js");
    const result = await getTeamStatus.handler({ teamFilter: "cto" });
    expect(result.filter).toBe("cto");
  });
});

describe("external tool handlers", () => {
  it("discover-tools handler returns empty tools", async () => {
    const { discoverTools } = await import("../webmcp/external/tools/discover-tools.js");
    const result = await discoverTools.handler({
      limit: 10,
      query: "test",
      category: "dev",
    });
    expect(result).toEqual({
      tools: [],
      total: 0,
      query: "test",
      category: "dev",
    });
  });

  it("get-tool-schema handler returns not found", async () => {
    const { getToolSchema } = await import("../webmcp/external/tools/get-tool-schema.js");
    const result = await getToolSchema.handler({ toolName: "my-tool" });
    expect(result).toEqual({
      toolName: "my-tool",
      version: "latest",
      schema: null,
      found: false,
    });
  });

  it("get-tool-schema handler respects version", async () => {
    const { getToolSchema } = await import("../webmcp/external/tools/get-tool-schema.js");
    const result = await getToolSchema.handler({ toolName: "t", version: "2.0" });
    expect(result.version).toBe("2.0");
  });

  it("invoke-tool handler returns stub status", async () => {
    const { invokeTool } = await import("../webmcp/external/tools/invoke-tool.js");
    const result = await invokeTool.handler({
      toolName: "my-tool",
      input: { key: "val" },
    });
    expect(result.status).toBe("stub");
    expect(result.result).toBeNull();
    expect(result.invokedAt).toBeTruthy();
  });

  it("get-usage handler returns zero stats", async () => {
    const { getUsage } = await import("../webmcp/external/tools/get-usage.js");
    const result = await getUsage.handler({ period: "week" });
    expect(result).toEqual({
      toolName: "all",
      period: "week",
      invocations: 0,
      uniqueAgents: 0,
      avgDurationMs: 0,
    });
  });

  it("get-usage handler respects toolName filter", async () => {
    const { getUsage } = await import("../webmcp/external/tools/get-usage.js");
    const result = await getUsage.handler({ toolName: "specific", period: "day" });
    expect(result.toolName).toBe("specific");
  });
});
