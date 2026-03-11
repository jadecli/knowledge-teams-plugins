/**
 * Token counting and cost estimation utilities.
 * Pricing loaded from centralized models.json.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

/** Rough token estimate using the char/4 heuristic. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

const MODELS_JSON_PATH = resolve(import.meta.dirname ?? __dirname, "..", "..", "models.json");

function loadPricing(): Record<string, { input: number; output: number }> {
  try {
    const raw = readFileSync(MODELS_JSON_PATH, "utf-8");
    const config = JSON.parse(raw) as { pricing: Record<string, ModelPricing> };
    const result: Record<string, { input: number; output: number }> = {};
    for (const [model, p] of Object.entries(config.pricing)) {
      result[model] = { input: p.inputPer1M, output: p.outputPer1M };
    }
    result["default"] = { input: 3.0, output: 15.0 };
    return result;
  } catch {
    return {
      "claude-opus-4-6": { input: 15.0, output: 75.0 },
      "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
      "claude-haiku-4-5": { input: 0.25, output: 1.25 },
      default: { input: 3.0, output: 15.0 },
    };
  }
}

/** Pricing table in USD per 1M tokens (input / output). */
const PRICING = loadPricing();

/**
 * Estimate cost in USD given token counts and model name.
 */
export function estimateCostUsd(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const prices = PRICING[model] ?? PRICING["default"]!;
  return (
    (inputTokens / 1_000_000) * prices.input +
    (outputTokens / 1_000_000) * prices.output
  );
}

/**
 * Calculate Return on Token Spend.
 *
 * @param valueDelivered - Numeric measure of value (e.g., story points, revenue $, JIRA tickets)
 * @param tokensCost - Estimated cost in USD
 * @returns ROTS ratio (value / cost), or Infinity when cost is 0
 */
export function calculateRots(
  valueDelivered: number,
  tokensCost: number
): number {
  if (tokensCost <= 0) return Infinity;
  return valueDelivered / tokensCost;
}
