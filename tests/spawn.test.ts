import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { spawnAgent } from "../src/jade/agent-sdk/spawn.js";
import type { SpawnConfig, SpawnResult } from "../src/jade/agent-sdk/spawn.js";

describe("spawnAgent", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Ensure pro-max mode (no API keys set)
    delete process.env["ANTHROPIC_API_KEY"];
    delete process.env["JADE_ENTERPRISE_API_KEY"];
  });

  afterEach(() => {
    process.env["ANTHROPIC_API_KEY"] = originalEnv["ANTHROPIC_API_KEY"];
    process.env["JADE_ENTERPRISE_API_KEY"] = originalEnv["JADE_ENTERPRISE_API_KEY"];
  });

  it("returns delegation stub in pro-max mode", async () => {
    const config: SpawnConfig = {
      agent: { name: "test-vp", model: "claude-sonnet-4-6", systemPrompt: "You are a test agent." },
      prompt: "Hello world",
    };

    const result: SpawnResult = await spawnAgent(config);
    expect(result.raw.success).toBe(true);
    expect(result.raw.output).toContain("[pro-max]");
    expect(result.raw.output).toContain("test-vp");
    expect(result.raw.estimatedCostUsd).toBe(0);
    expect(result.raw.iterations).toBe(1);
  });

  it("estimates input tokens from prompt length", async () => {
    const shortPrompt = "Hi";
    const longPrompt = "x".repeat(400);

    const shortResult = await spawnAgent({
      agent: { name: "a", model: "sonnet" },
      prompt: shortPrompt,
    });

    const longResult = await spawnAgent({
      agent: { name: "a", model: "sonnet" },
      prompt: longPrompt,
    });

    expect(longResult.raw.inputTokens).toBeGreaterThan(shortResult.raw.inputTokens);
  });

  it("returns zero output tokens in pro-max mode", async () => {
    const result = await spawnAgent({
      agent: { name: "a", model: "sonnet" },
      prompt: "test",
    });
    expect(result.raw.outputTokens).toBe(0);
  });

  it("includes installationPath when tweakcc is available", async () => {
    const result = await spawnAgent({
      agent: { name: "a", model: "sonnet" },
      prompt: "test",
    });
    // installationPath may or may not be present depending on environment
    // but the field should exist on the result type
    expect("installationPath" in result).toBe(true);
  });
});
