import { describe, it, expect } from "vitest";
import type { ToolCallEvent } from "../db/logger.js";

describe("db/logger — ToolCallEvent shape", () => {
  it("minimal event has required fields", () => {
    const event: ToolCallEvent = {
      toolName: "get-my-tasks",
      success: true,
    };
    expect(event.toolName).toBe("get-my-tasks");
    expect(event.success).toBe(true);
  });

  it("full event includes all optional fields", () => {
    const event: ToolCallEvent = {
      toolName: "submit-artifact",
      success: false,
      error: "timeout",
      sessionId: "sess-123",
      inputParams: { query: "test" },
      outputSummary: "Failed due to timeout",
      durationMs: 5000,
      inputTokens: 1000,
      outputTokens: 200,
      branchName: "feature/test",
      prNumber: 42,
    };
    expect(event.error).toBe("timeout");
    expect(event.inputTokens).toBe(1000);
    expect(event.prNumber).toBe(42);
  });
});
