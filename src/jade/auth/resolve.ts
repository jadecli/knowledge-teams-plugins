/**
 * Auth resolution for jade-cofounder.
 * Determines whether to use Pro Max (Claude Code session),
 * direct API key, or Enterprise route.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

export type AuthMode = "pro-max" | "api-key" | "enterprise";

export interface AuthConfig {
  mode: AuthMode;
  /** Present only when mode === 'api-key' or 'enterprise' */
  apiKey?: string;
  model: string;
}

interface ModelsConfig {
  models: Record<string, string>;
  defaults: Record<string, string>;
  pricing: Record<string, { inputPer1M: number; outputPer1M: number }>;
}

const MODELS_JSON_PATH = resolve(import.meta.dirname ?? __dirname, "..", "models.json");

function loadModelsConfig(): ModelsConfig {
  const raw = readFileSync(MODELS_JSON_PATH, "utf-8");
  return JSON.parse(raw) as ModelsConfig;
}

const DEFAULT_MODELS: Record<AuthMode, string> = (() => {
  try {
    const config = loadModelsConfig();
    return {
      "pro-max": config.defaults["pro-max"] ?? "claude-sonnet-4-6",
      "api-key": config.defaults["api-key"] ?? "claude-opus-4-6",
      enterprise: config.defaults["enterprise"] ?? "claude-opus-4-6",
    };
  } catch {
    return {
      "pro-max": "claude-sonnet-4-6",
      "api-key": "claude-opus-4-6",
      enterprise: "claude-opus-4-6",
    };
  }
})();

/**
 * Resolve authentication configuration from environment variables.
 *
 * Priority:
 *   1. JADE_ENTERPRISE_API_KEY  → enterprise
 *   2. ANTHROPIC_API_KEY        → api-key
 *   3. (default)                → pro-max (Claude Code session)
 */
export function resolveAuth(): AuthConfig {
  const enterpriseKey = process.env["JADE_ENTERPRISE_API_KEY"];
  if (enterpriseKey) {
    return {
      mode: "enterprise",
      apiKey: enterpriseKey,
      model: process.env["JADE_MODEL"] ?? DEFAULT_MODELS["enterprise"],
    };
  }

  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (apiKey) {
    return {
      mode: "api-key",
      apiKey,
      model: process.env["JADE_MODEL"] ?? DEFAULT_MODELS["api-key"],
    };
  }

  return {
    mode: "pro-max",
    model: process.env["JADE_MODEL"] ?? DEFAULT_MODELS["pro-max"],
  };
}

/**
 * Create an Anthropic SDK client based on resolved auth config.
 * Returns null for pro-max mode (uses Claude Code session instead).
 */
export async function createAnthropicClient(
  config: AuthConfig
): Promise<import("@anthropic-ai/sdk").default | null> {
  if (config.mode === "pro-max") {
    return null;
  }
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  return new Anthropic({ apiKey: config.apiKey });
}
