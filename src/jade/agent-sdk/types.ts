/**
 * Shared type definitions for the jade agent SDK.
 */

/** Authentication mode for agent spawning. */
export type AuthMode = "pro-max" | "api-key" | "enterprise";

/** A single turn in an agent conversation. */
export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

/** Budget limits for a jade-loop run. */
export interface BudgetConfig {
  maxTokens?: number;
  maxUsd?: number;
  maxIterations?: number;
  escalationThresholdFraction?: number;
}

/** Result returned after an agent completes a task. */
export interface TaskResult {
  success: boolean;
  output: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  /** Return on Token Spend: value delivered / cost */
  rots?: number;
  iterations: number;
}

/** Agent specification for spawning. */
export interface AgentSpec {
  name: string;
  model: string;
  systemPrompt?: string;
}
