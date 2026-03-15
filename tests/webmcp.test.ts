import { describe, it, expect, beforeEach } from "vitest";
import { registerTool, getTool, listTools, clearRegistry } from "../webmcp/shared/register.js";
import { validateInput } from "../webmcp/shared/validate.js";
import { recordInvocation, getEvents, clearTelemetry } from "../webmcp/shared/telemetry.js";
import { z } from "zod";

describe("webmcp/register", () => {
  beforeEach(() => clearRegistry());

  it("registers and retrieves a tool", () => {
    const tool = {
      name: "test-tool",
      description: "A test tool",
      inputSchema: z.object({ x: z.number() }),
      handler: async (input: { x: number }) => input.x * 2,
    };
    registerTool(tool);
    expect(getTool("test-tool")).toBeDefined();
    expect(getTool("test-tool")!.name).toBe("test-tool");
  });

  it("lists registered tools", () => {
    registerTool({
      name: "tool-a",
      description: "A",
      inputSchema: z.object({}),
      handler: async () => null,
    });
    registerTool({
      name: "tool-b",
      description: "B",
      inputSchema: z.object({}),
      handler: async () => null,
    });
    expect(listTools()).toEqual(["tool-a", "tool-b"]);
  });

  it("throws on duplicate registration", () => {
    const tool = {
      name: "dup",
      description: "D",
      inputSchema: z.object({}),
      handler: async () => null,
    };
    registerTool(tool);
    expect(() => registerTool(tool)).toThrow('Tool "dup" is already registered');
  });

  it("returns undefined for unknown tool", () => {
    expect(getTool("nonexistent")).toBeUndefined();
  });
});

describe("webmcp/validate", () => {
  it("validates correct input", () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = validateInput(schema, { name: "jade", age: 1 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: "jade", age: 1 });
  });

  it("rejects invalid input", () => {
    const schema = z.object({ name: z.string() });
    const result = validateInput(schema, { name: 42 });
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });
});

describe("webmcp/telemetry", () => {
  beforeEach(() => clearTelemetry());

  it("records and retrieves events", () => {
    recordInvocation({
      toolName: "test-tool",
      timestamp: Date.now(),
      durationMs: 150,
      success: true,
    });
    const events = getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].toolName).toBe("test-tool");
    expect(events[0].durationMs).toBe(150);
  });

  it("clears telemetry", () => {
    recordInvocation({
      toolName: "t",
      timestamp: 0,
      durationMs: 0,
      success: false,
      error: "fail",
    });
    clearTelemetry();
    expect(getEvents()).toHaveLength(0);
  });
});

describe("webmcp/tools registration", () => {
  beforeEach(() => clearRegistry());

  it("internal tools register with correct names", async () => {
    // Dynamic import triggers registerTool side effects
    await import("../webmcp/internal/tools/get-my-tasks.js");
    await import("../webmcp/internal/tools/claim-task.js");
    await import("../webmcp/internal/tools/submit-artifact.js");
    await import("../webmcp/internal/tools/request-checkpoint.js");
    await import("../webmcp/internal/tools/get-team-status.js");
    await import("../webmcp/internal/tools/run-crawl.js");
    await import("../webmcp/internal/tools/schedule-crawl.js");
    await import("../webmcp/internal/tools/get-crawl-status.js");

    const names = listTools();
    expect(names).toContain("get-my-tasks");
    expect(names).toContain("claim-task");
    expect(names).toContain("submit-artifact");
    expect(names).toContain("request-checkpoint");
    expect(names).toContain("get-team-status");
    expect(names).toContain("run-crawl");
    expect(names).toContain("schedule-crawl");
    expect(names).toContain("get-crawl-status");
  });

  it("external tools register with correct names", async () => {
    await import("../webmcp/external/tools/discover-tools.js");
    await import("../webmcp/external/tools/get-tool-schema.js");
    await import("../webmcp/external/tools/invoke-tool.js");
    await import("../webmcp/external/tools/get-usage.js");

    const names = listTools();
    expect(names).toContain("discover-tools");
    expect(names).toContain("get-tool-schema");
    expect(names).toContain("invoke-tool");
    expect(names).toContain("get-usage");
  });
});
