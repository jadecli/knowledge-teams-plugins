/**
 * Tests for src/teams/skeptical-codegen-team.ts
 *
 * Tests the module's structure and agent definitions without invoking
 * the Agent SDK (which requires auth + remote execution).
 */

import { describe, it, expect, vi } from "vitest";

// Mock the Agent SDK before import — we test structure, not execution
vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
  query: vi.fn(),
}));

describe("skeptical-codegen-team module", () => {
  it("exports runSkepticalCodegenTeam as async function", async () => {
    const mod = await import("../src/teams/skeptical-codegen-team.js");
    expect(typeof mod.runSkepticalCodegenTeam).toBe("function");
  });

  it("runSkepticalCodegenTeam calls query with correct structure", async () => {
    const { query } = await import("@anthropic-ai/claude-agent-sdk");
    const mockedQuery = vi.mocked(query);

    // Make query return an async iterable that yields a result message
    const mockIterable = {
      async *[Symbol.asyncIterator]() {
        yield {
          type: "result" as const,
          subtype: "success" as const,
          num_turns: 1,
          total_cost_usd: 0.01,
        };
      },
    };
    mockedQuery.mockReturnValue(mockIterable as ReturnType<typeof query>);

    const { runSkepticalCodegenTeam } = await import(
      "../src/teams/skeptical-codegen-team.js"
    );
    await runSkepticalCodegenTeam("/tmp/test-cwd");

    expect(mockedQuery).toHaveBeenCalledOnce();
    const callArgs = mockedQuery.mock.calls[0][0];
    expect(callArgs).toHaveProperty("prompt");
    expect(callArgs).toHaveProperty("options");
    const opts = callArgs.options!;
    expect(opts).toMatchObject({
      model: "claude-opus-4-6",
      cwd: "/tmp/test-cwd",
      permissionMode: "dontAsk",
    });
    // Verify agents are defined
    expect(opts.agents).toHaveProperty("type-auditor");
    expect(opts.agents).toHaveProperty("dead-code-hunter");
    expect(opts.agents).toHaveProperty("simplicity-enforcer");
    expect(opts.agents).toHaveProperty("security-auditor");
  });

  it("security-auditor references security-scan-instructions.md", async () => {
    const { query } = await import("@anthropic-ai/claude-agent-sdk");
    const mockedQuery = vi.mocked(query);
    const mockIterable = {
      async *[Symbol.asyncIterator]() {
        yield { type: "result" as const, subtype: "success" as const, num_turns: 1, total_cost_usd: 0 };
      },
    };
    mockedQuery.mockReturnValue(mockIterable as ReturnType<typeof query>);

    const { runSkepticalCodegenTeam } = await import("../src/teams/skeptical-codegen-team.js");
    await runSkepticalCodegenTeam();

    const agents = mockedQuery.mock.calls[0][0].options!.agents;
    const securityPrompt = (agents as Record<string, { prompt: string }>)["security-auditor"].prompt;
    expect(securityPrompt).toContain("security-scan-instructions.md");
  });
});
