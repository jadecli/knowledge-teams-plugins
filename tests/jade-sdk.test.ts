import { describe, it, expect } from "vitest";
import { resolveAuth } from "../src/jade/auth/resolve.js";
import { estimateTokens, estimateCostUsd, calculateRots } from "../src/jade/agent-sdk/tokenizer.js";

describe("src/jade/auth/resolve", () => {
  it("defaults to pro-max when no env vars set", () => {
    const orig = {
      ANTHROPIC_API_KEY: process.env["ANTHROPIC_API_KEY"],
      JADE_ENTERPRISE_API_KEY: process.env["JADE_ENTERPRISE_API_KEY"],
    };
    delete process.env["ANTHROPIC_API_KEY"];
    delete process.env["JADE_ENTERPRISE_API_KEY"];

    const config = resolveAuth();
    expect(config.mode).toBe("pro-max");
    expect(config.apiKey).toBeUndefined();
    expect(config.model).toBeTruthy();

    // restore
    if (orig.ANTHROPIC_API_KEY) process.env["ANTHROPIC_API_KEY"] = orig.ANTHROPIC_API_KEY;
    if (orig.JADE_ENTERPRISE_API_KEY)
      process.env["JADE_ENTERPRISE_API_KEY"] = orig.JADE_ENTERPRISE_API_KEY;
  });

  it("resolves to api-key when ANTHROPIC_API_KEY is set", () => {
    const orig = process.env["ANTHROPIC_API_KEY"];
    process.env["ANTHROPIC_API_KEY"] = "sk-test-key";
    delete process.env["JADE_ENTERPRISE_API_KEY"];

    const config = resolveAuth();
    expect(config.mode).toBe("api-key");
    expect(config.apiKey).toBe("sk-test-key");

    if (orig) process.env["ANTHROPIC_API_KEY"] = orig;
    else delete process.env["ANTHROPIC_API_KEY"];
  });

  it("enterprise key takes priority over api key", () => {
    const origApi = process.env["ANTHROPIC_API_KEY"];
    const origEnt = process.env["JADE_ENTERPRISE_API_KEY"];
    process.env["ANTHROPIC_API_KEY"] = "sk-api-key";
    process.env["JADE_ENTERPRISE_API_KEY"] = "sk-enterprise-key";

    const config = resolveAuth();
    expect(config.mode).toBe("enterprise");
    expect(config.apiKey).toBe("sk-enterprise-key");

    if (origApi) process.env["ANTHROPIC_API_KEY"] = origApi;
    else delete process.env["ANTHROPIC_API_KEY"];
    if (origEnt) process.env["JADE_ENTERPRISE_API_KEY"] = origEnt;
    else delete process.env["JADE_ENTERPRISE_API_KEY"];
  });

  it("JADE_MODEL env var overrides model", () => {
    const orig = process.env["JADE_MODEL"];
    delete process.env["ANTHROPIC_API_KEY"];
    delete process.env["JADE_ENTERPRISE_API_KEY"];
    process.env["JADE_MODEL"] = "claude-haiku-4-5";

    const config = resolveAuth();
    expect(config.model).toBe("claude-haiku-4-5");

    if (orig) process.env["JADE_MODEL"] = orig;
    else delete process.env["JADE_MODEL"];
  });
});

describe("src/jade/agent-sdk/tokenizer", () => {
  it("estimateTokens returns ceil(len/4)", () => {
    expect(estimateTokens("1234")).toBe(1);
    expect(estimateTokens("12345")).toBe(2);
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("a".repeat(100))).toBe(25);
  });

  it("estimateCostUsd uses correct per-model pricing", () => {
    // opus: $15/M input, $75/M output
    const cost = estimateCostUsd(1_000_000, 1_000_000, "claude-opus-4-6");
    expect(cost).toBeCloseTo(90, 2);
  });

  it("estimateCostUsd falls back to default for unknown model", () => {
    // default: $3/M input, $15/M output
    const cost = estimateCostUsd(1_000_000, 1_000_000, "unknown-model");
    expect(cost).toBeCloseTo(18, 2);
  });

  it("estimateCostUsd returns 0 for 0 tokens", () => {
    expect(estimateCostUsd(0, 0, "claude-opus-4-6")).toBe(0);
  });

  it("calculateRots divides value by cost", () => {
    expect(calculateRots(100, 2)).toBe(50);
    expect(calculateRots(0, 1)).toBe(0);
  });

  it("calculateRots returns Infinity for zero cost", () => {
    expect(calculateRots(10, 0)).toBe(Infinity);
  });
});
