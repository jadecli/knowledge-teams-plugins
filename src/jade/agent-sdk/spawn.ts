/**
 * Agent spawning — bridges jade auth modes with the Anthropic SDK
 * and integrates tweakcc for installation detection.
 */

import { resolveAuth } from "../auth/resolve.js";
import { estimateCostUsd, estimateTokens } from "./tokenizer.js";
import type { AgentSpec, BudgetConfig, TaskResult } from "./types.js";

export interface SpawnConfig {
  agent: AgentSpec;
  prompt: string;
  budget?: BudgetConfig;
}

export interface SpawnResult {
  raw: TaskResult;
  installationPath?: string;
}

/**
 * Detect the active Claude Code installation path via tweakcc.
 * Returns undefined when tweakcc cannot locate an installation.
 */
async function detectInstallationPath(): Promise<string | undefined> {
  try {
    const { tryDetectInstallation } = await import("tweakcc");
    const installation = await tryDetectInstallation();
    return installation?.installPath;
  } catch {
    return undefined;
  }
}

/**
 * Spawn an agent to handle a prompt.
 *
 * - pro-max mode: delegates to Claude Code session (stub — real impl via claude-code SDK)
 * - api-key / enterprise: calls Anthropic API directly
 */
export async function spawnAgent(config: SpawnConfig): Promise<SpawnResult> {
  const auth = resolveAuth();
  const installationPath = await detectInstallationPath();

  if (auth.mode === "pro-max") {
    // Pro Max uses the Claude Code session; we cannot call the API directly.
    // Cost tracking is not available in pro-max mode — jade-loop budget enforcement
    // relies on the stop hook reading from `.claude/jade-loop.local.md` instead.
    // spawnAgent in pro-max mode is a no-op placeholder; use the jade-loop stop hook
    // for actual task execution and budget tracking.
    const inputTokens = estimateTokens(config.prompt);
    return {
      raw: {
        success: true,
        output: `[pro-max] Delegated to Claude Code session for agent: ${config.agent.name}. Cost tracking unavailable in pro-max mode; use jade-loop stop hook for budget enforcement.`,
        inputTokens,
        outputTokens: 0,
        estimatedCostUsd: 0,
        iterations: 1,
      },
      installationPath,
    };
  }

  // api-key or enterprise path: call SDK directly
  const { createAnthropicClient } = await import("../auth/resolve.js");
  const client = await createAnthropicClient(auth);
  if (!client) {
    throw new Error(`Unexpected null client for auth mode: ${auth.mode}`);
  }

  const systemPrompt =
    config.agent.systemPrompt ??
    `You are ${config.agent.name}, a specialised S-Team VP agent.`;

  const response = await client.messages.create({
    model: auth.model,
    max_tokens: config.budget?.maxTokens ?? 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: config.prompt }],
  });

  const outputText = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("\n");

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const estimatedCostUsd = estimateCostUsd(inputTokens, outputTokens, auth.model);

  return {
    raw: {
      success: true,
      output: outputText,
      inputTokens,
      outputTokens,
      estimatedCostUsd,
      iterations: 1,
    },
    installationPath,
  };
}
