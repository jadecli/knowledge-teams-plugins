import { describe, it, expect } from "vitest";
import {
  estimateCostUSD,
  accumulateModelUsage,
  SessionCostTracker,
  MODEL_PRICING,
  OTEL_METRICS,
  type ModelUsage,
  type QueryResultMetrics,
} from "../src/sdk-cost-metrics.js";
import {
  traceUpstream,
  traceDownstream,
  findUninstrumented,
  printDependencyTree,
  COST_DEPENDENCY_GRAPH,
} from "../src/cost-dependency-trace.js";

// ─── Cost Estimation ──────────────────────────────────────────────────────────

describe("estimateCostUSD", () => {
  it("calculates cost for claude-opus-4-6", () => {
    const cost = estimateCostUSD("claude-opus-4-6", {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      cacheReadInputTokens: 0,
      cacheCreationInputTokens: 0,
    });
    // $5 input + $25 output = $30
    expect(cost).toBe(30);
  });

  it("includes cache token pricing", () => {
    const cost = estimateCostUSD("claude-sonnet-4-6", {
      inputTokens: 500_000,
      outputTokens: 100_000,
      cacheReadInputTokens: 200_000,
      cacheCreationInputTokens: 100_000,
    });
    // (0.5M/1M)*3 + (0.1M/1M)*15 + (0.2M/1M)*0.3 + (0.1M/1M)*3.75
    // = 1.5 + 1.5 + 0.06 + 0.375 = 3.435
    expect(cost).toBeCloseTo(3.435, 3);
  });

  it("returns NaN for unknown model", () => {
    expect(estimateCostUSD("unknown-model", {
      inputTokens: 100,
      outputTokens: 100,
      cacheReadInputTokens: 0,
      cacheCreationInputTokens: 0,
    })).toBeNaN();
  });
});

// ─── ModelUsage Accumulation ──────────────────────────────────────────────────

describe("accumulateModelUsage", () => {
  const makeUsage = (cost: number): ModelUsage => ({
    inputTokens: 1000,
    outputTokens: 500,
    cacheReadInputTokens: 100,
    cacheCreationInputTokens: 50,
    webSearchRequests: 0,
    costUSD: cost,
    contextWindow: 200_000,
    maxOutputTokens: 8192,
  });

  it("accumulates usage for existing model", () => {
    const acc: Record<string, ModelUsage> = { "opus": makeUsage(0.05) };
    accumulateModelUsage(acc, { "opus": makeUsage(0.03) });
    expect(acc["opus"].costUSD).toBeCloseTo(0.08);
    expect(acc["opus"].inputTokens).toBe(2000);
  });

  it("adds new model entries", () => {
    const acc: Record<string, ModelUsage> = {};
    accumulateModelUsage(acc, { "haiku": makeUsage(0.01) });
    expect(acc["haiku"]).toBeDefined();
    expect(acc["haiku"].costUSD).toBe(0.01);
  });
});

// ─── SessionCostTracker ───────────────────────────────────────────────────────

describe("SessionCostTracker", () => {
  const makeResult = (cost: number, turns: number): QueryResultMetrics => ({
    type: "result",
    subtype: "success",
    duration_ms: 5000,
    duration_api_ms: 3000,
    num_turns: turns,
    total_cost_usd: cost,
    usage: {
      input_tokens: 1000,
      output_tokens: 500,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    },
    modelUsage: {
      "claude-sonnet-4-6": {
        inputTokens: 1000,
        outputTokens: 500,
        cacheReadInputTokens: 0,
        cacheCreationInputTokens: 0,
        webSearchRequests: 0,
        costUSD: cost,
        contextWindow: 200_000,
        maxOutputTokens: 8192,
      },
    },
    stop_reason: "end_turn",
    is_error: false,
    session_id: "test-session",
  });

  it("tracks cumulative cost across multiple query() calls", () => {
    const tracker = new SessionCostTracker("org-123", "session-abc");
    tracker.record(makeResult(0.05, 3));
    tracker.record(makeResult(0.03, 2));

    expect(tracker.totalCostUSD).toBeCloseTo(0.08);
    expect(tracker.totalTurns).toBe(5);
    expect(tracker.queryCount).toBe(2);
    expect(tracker.totalDurationMs).toBe(10000);
  });

  it("produces a JSON snapshot with organization ID", () => {
    const tracker = new SessionCostTracker("org-456", "session-xyz");
    tracker.record(makeResult(0.10, 5));

    const snapshot = tracker.toJSON();
    expect(snapshot.organizationId).toBe("org-456");
    expect(snapshot.sessionId).toBe("session-xyz");
    expect(snapshot.totalCostUSD).toBe(0.10);
    expect(snapshot.capturedAt).toBeTruthy();
  });
});

// ─── OTEL Metrics Constants ───────────────────────────────────────────────────

describe("OTEL_METRICS", () => {
  it("has canonical metric names", () => {
    expect(OTEL_METRICS.COST_USAGE).toBe("claude_code.cost.usage");
    expect(OTEL_METRICS.TOKEN_USAGE).toBe("claude_code.token.usage");
    expect(OTEL_METRICS.ACTIVE_TIME).toBe("claude_code.active_time.total");
  });
});

// ─── Model Pricing ────────────────────────────────────────────────────────────

describe("MODEL_PRICING", () => {
  it("covers opus, sonnet, haiku", () => {
    expect(MODEL_PRICING["claude-opus-4-6"]).toBeDefined();
    expect(MODEL_PRICING["claude-sonnet-4-6"]).toBeDefined();
    expect(MODEL_PRICING["claude-haiku-4-5"]).toBeDefined();
  });

  it("fast mode is 6x standard for opus", () => {
    const standard = MODEL_PRICING["claude-opus-4-6"];
    const fast = MODEL_PRICING["claude-opus-4-6-fast"];
    expect(fast.input).toBe(standard.input * 6);
    expect(fast.output).toBe(standard.output * 6);
  });
});

// ─── Dependency Trace ─────────────────────────────────────────────────────────

describe("dependency trace", () => {
  it("traces upstream from plugin-session-tracker to API", () => {
    const chain = traceUpstream("plugin-session-tracker");
    const ids = chain.map((n) => n.id);
    expect(ids).toContain("plugin-session-tracker");
    expect(ids).toContain("agent-sdk-result");
    expect(ids).toContain("agent-sdk-step");
    expect(ids).toContain("anthropic-sdk-client");
    expect(ids).toContain("anthropic-api-messages");
  });

  it("traces downstream from agent-sdk-result", () => {
    const chain = traceDownstream("agent-sdk-result");
    const ids = chain.map((n) => n.id);
    expect(ids).toContain("agent-sdk-result");
    expect(ids).toContain("plugin-session-tracker");
    expect(ids).toContain("otel-claude-code");
    expect(ids).toContain("prometheus-grafana");
  });

  it("finds uninstrumented nodes", () => {
    const uninstrumented = findUninstrumented();
    const ids = uninstrumented.map((n) => n.id);
    // API and SDK layers are upstream — not instrumented by us
    expect(ids).toContain("anthropic-api-messages");
    expect(ids).toContain("anthropic-sdk-client");
    // Plugin layer should be instrumented
    expect(ids).not.toContain("plugin-session-tracker");
  });

  it("prints dependency tree and handles shared descendants", () => {
    const tree = printDependencyTree("agent-sdk-result", "downstream");
    expect(tree).toContain("Agent SDK");
    expect(tree).toContain("SessionCostTracker");
    // Graph has shared descendants reachable via multiple paths
    // Visited nodes are marked with ↺ — correct dedup behavior
    expect(tree).toContain("↺");
  });
});
