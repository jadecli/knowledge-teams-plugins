import { describe, it, expect } from "vitest";
import {
  selectStrategy,
  generateExecutionReport,
} from "../src/jade/agent-sdk/parallel-tasks.js";
import type {
  Subtask,
  SubtaskResult,
  ParallelExecutionResult,
} from "../src/jade/agent-sdk/parallel-tasks.js";

// ── Helper factories ─────────────────────────────────────────────────────────

function makeSubtask(overrides: Partial<Subtask> = {}): Subtask {
  return {
    id: "task-1",
    description: "Test subtask",
    prompt: "<input><task>Test</task></input>",
    agent: {
      description: "Test agent",
      prompt: "You are a test agent.",
      tools: ["Read"],
    },
    budget: {
      maxTurns: 10,
      maxBudgetUsd: 1.0,
      timeoutMs: 30_000,
    },
    ...overrides,
  };
}

function makeResult(overrides: Partial<SubtaskResult> = {}): SubtaskResult {
  return {
    id: "task-1",
    result: 1,
    output: "Done",
    exitReason: "success",
    costUsd: 0.5,
    turnsUsed: 3,
    durationMs: 1000,
    ...overrides,
  };
}

// ── selectStrategy ───────────────────────────────────────────────────────────

describe("selectStrategy", () => {
  it("returns 'parallel' for independent subtasks", () => {
    const subtasks = [
      makeSubtask({ id: "a" }),
      makeSubtask({ id: "b" }),
      makeSubtask({ id: "c" }),
    ];
    expect(selectStrategy(subtasks)).toBe("parallel");
  });

  it("returns 'sequential' when any subtask has dependencies", () => {
    const subtasks = [
      makeSubtask({ id: "a" }),
      makeSubtask({ id: "b", dependsOn: ["a"] }),
    ];
    expect(selectStrategy(subtasks)).toBe("sequential");
  });

  it("returns 'parallel' for a single subtask without dependencies", () => {
    expect(selectStrategy([makeSubtask()])).toBe("parallel");
  });

  it("returns 'parallel' for empty subtask list", () => {
    expect(selectStrategy([])).toBe("parallel");
  });

  it("treats empty dependsOn array as no dependencies", () => {
    const subtasks = [
      makeSubtask({ id: "a", dependsOn: [] }),
      makeSubtask({ id: "b", dependsOn: [] }),
    ];
    expect(selectStrategy(subtasks)).toBe("parallel");
  });
});

// ── generateExecutionReport ──────────────────────────────────────────────────

describe("generateExecutionReport", () => {
  it("generates valid XML report with all fields", () => {
    const execResult: ParallelExecutionResult = {
      results: {
        "task-1": makeResult({ id: "task-1", result: 1 }),
        "task-2": makeResult({ id: "task-2", result: 0, exitReason: "error_max_turns" }),
      },
      overallResult: 0,
      totalCostUsd: 1.0,
      totalDurationMs: 5000,
      rots: 1.0,
    };

    const report = generateExecutionReport(execResult);
    expect(report).toContain("<execution-report>");
    expect(report).toContain("</execution-report>");
    expect(report).toContain('overall="0"');
    expect(report).toContain('tasks="2"');
    expect(report).toContain('passed="1"');
    expect(report).toContain('failed="1"');
  });

  it("includes subtask details in report", () => {
    const execResult: ParallelExecutionResult = {
      results: {
        "review": makeResult({ id: "review", output: "LGTM", exitReason: "success" }),
      },
      overallResult: 1,
      totalCostUsd: 0.5,
      totalDurationMs: 2000,
      rots: 2.0,
    };

    const report = generateExecutionReport(execResult);
    expect(report).toContain('id="review"');
    expect(report).toContain('result="1"');
    expect(report).toContain('exit="success"');
    expect(report).toContain("<output>LGTM</output>");
  });

  it("truncates long output to 2000 chars", () => {
    const longOutput = "x".repeat(5000);
    const execResult: ParallelExecutionResult = {
      results: {
        "task-1": makeResult({ output: longOutput }),
      },
      overallResult: 1,
      totalCostUsd: 0.1,
      totalDurationMs: 100,
      rots: 10,
    };

    const report = generateExecutionReport(execResult);
    // Output should be truncated to 2000 chars
    const outputMatch = report.match(/<output>(.*?)<\/output>/s);
    expect(outputMatch).toBeTruthy();
    expect(outputMatch![1]!.length).toBe(2000);
  });

  it("handles Infinity ROTS", () => {
    const execResult: ParallelExecutionResult = {
      results: {
        "task-1": makeResult({ costUsd: 0 }),
      },
      overallResult: 1,
      totalCostUsd: 0,
      totalDurationMs: 100,
      rots: Infinity,
    };

    const report = generateExecutionReport(execResult);
    expect(report).toContain('rots="∞"');
  });

  it("formats cost with 4 decimal places", () => {
    const execResult: ParallelExecutionResult = {
      results: {
        "task-1": makeResult({ costUsd: 0.123456 }),
      },
      overallResult: 1,
      totalCostUsd: 0.123456,
      totalDurationMs: 100,
      rots: 8.1,
    };

    const report = generateExecutionReport(execResult);
    expect(report).toContain('cost="0.1235"');
  });
});

// ── SubtaskResult exit reasons ───────────────────────────────────────────────

describe("SubtaskResult exit reasons", () => {
  it("supports all expected exit reason values", () => {
    const reasons: SubtaskResult["exitReason"][] = [
      "success",
      "error_max_turns",
      "error_max_budget",
      "error_timeout",
      "error_dependency",
      "error_runtime",
      "error_structured_output_retries",
    ];
    expect(reasons).toHaveLength(7);
  });
});
