import { describe, it, expect, beforeEach } from "vitest";
import { recordInvocation, getEvents, clearTelemetry } from "../webmcp/shared/telemetry.js";

beforeEach(() => clearTelemetry());

describe("telemetry bounded buffer", () => {
  it("drops oldest events when exceeding 1000", () => {
    for (let i = 0; i < 1005; i++) {
      recordInvocation({
        toolName: `tool-${i}`,
        timestamp: i,
        durationMs: 1,
        success: true,
      });
    }
    const events = getEvents();
    expect(events).toHaveLength(1000);
    // oldest 5 should be dropped
    expect(events[0].toolName).toBe("tool-5");
    expect(events[999].toolName).toBe("tool-1004");
  });

  it("records error events", () => {
    recordInvocation({
      toolName: "failing-tool",
      timestamp: Date.now(),
      durationMs: 50,
      success: false,
      error: "connection refused",
    });
    const events = getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].success).toBe(false);
    expect(events[0].error).toBe("connection refused");
  });
});
