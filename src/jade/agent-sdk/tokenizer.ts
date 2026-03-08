/**
 * Token counting and cost estimation utilities.
 */

/** Rough token estimate using the char/4 heuristic. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Pricing table in USD per 1M tokens (input / output). */
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-5": { input: 15.0, output: 75.0 },
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 0.25, output: 1.25 },
  // Fallback for unknown models
  default: { input: 3.0, output: 15.0 },
};

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
