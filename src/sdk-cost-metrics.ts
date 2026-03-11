/**
 * Canonical Cost & Time Metrics — Claude Agent SDK + Anthropic API
 *
 * Consolidates every cost/time data structure available across:
 *   1. @anthropic-ai/claude-agent-sdk (Agent SDK) — query()-level metrics
 *   2. @anthropic-ai/sdk (REST SDK) — per-message Usage from /v1/messages
 *   3. Anthropic Admin API — /v1/organizations/{usage_report,cost_report}
 *   4. Claude Code OTEL telemetry — claude_code.cost.usage, claude_code.token.usage
 *
 * Source docs (canonical):
 *   - https://platform.claude.com/docs/en/agent-sdk/cost-tracking
 *   - https://platform.claude.com/docs/en/agent-sdk/typescript
 *   - https://platform.claude.com/docs/en/api/usage-cost-api
 *   - https://code.claude.com/docs/en/costs
 */

// ─── 1. Anthropic REST API Usage (from @anthropic-ai/sdk BetaMessage) ─────────

/**
 * Token usage from a single /v1/messages response.
 * Canonical source: @anthropic-ai/sdk → BetaMessage.usage
 */
export interface AnthropicAPIUsage {
  input_tokens: number | null;
  output_tokens: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

/**
 * Non-nullable version used in SDKResultMessage.usage.
 */
export type NonNullableUsage = {
  [K in keyof AnthropicAPIUsage]-?: NonNullable<AnthropicAPIUsage[K]>;
};

// ─── 2. Agent SDK Result-Level Metrics ────────────────────────────────────────

/**
 * Per-model token + cost breakdown from SDKResultMessage.modelUsage.
 * Canonical source: @anthropic-ai/claude-agent-sdk → SDKResultMessage
 */
export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  webSearchRequests: number;
  costUSD: number;
  contextWindow: number;
  maxOutputTokens: number;
}

/**
 * Authoritative cost/time fields from SDKResultMessage (emitted at end of every query() call).
 *
 * SDKResultMessage is the SINGLE SOURCE OF TRUTH for cost.
 * Per-step assistant messages also carry usage but must be deduplicated by message.id.
 */
export interface QueryResultMetrics {
  /** Discriminator — always "result" */
  type: "result";

  /** "success" | "error_max_turns" | "error_during_execution" | "error_max_budget_usd" | "error_max_structured_output_retries" */
  subtype: string;

  /** Wall-clock duration of the entire query() call (ms) */
  duration_ms: number;

  /** Cumulative API latency across all steps (ms) */
  duration_api_ms: number;

  /** Number of agentic turns (tool-use round trips) */
  num_turns: number;

  /** Cumulative USD cost — AUTHORITATIVE for billing */
  total_cost_usd: number;

  /** Aggregate token counts across all steps */
  usage: NonNullableUsage;

  /** Per-model breakdown: { [modelName]: ModelUsage } */
  modelUsage: Record<string, ModelUsage>;

  /** Stop reason (e.g., "end_turn", "max_tokens") */
  stop_reason: string | null;

  /** Whether the query ended in error */
  is_error: boolean;

  /** Session UUID */
  session_id: string;
}

// ─── 3. Per-Step Usage (TypeScript SDK only) ──────────────────────────────────

/**
 * Per-step token usage from assistant messages.
 * IMPORTANT: parallel tool calls share the same message.id — deduplicate!
 */
export interface StepUsage {
  /** BetaMessage.id — deduplicate by this field */
  messageId: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}

// ─── 4. Anthropic Admin API — Organization Usage & Cost Reports ───────────────

/**
 * Query params for GET /v1/organizations/usage_report/messages
 * Requires Admin API key (sk-ant-admin...) with organization admin role.
 */
export interface UsageReportParams {
  starting_at: string;                      // ISO 8601
  ending_at: string;                        // ISO 8601
  bucket_width: "1m" | "1h" | "1d";        // granularity
  group_by?: UsageGroupByDimension[];
  /** Filters */
  models?: string[];
  api_key_ids?: string[];
  workspace_ids?: string[];
  service_tiers?: ("standard" | "batch" | "priority")[];
  context_window?: ("0-200k" | "200k-1m")[];
  inference_geos?: ("global" | "us" | "not_available")[];
  speeds?: ("standard" | "fast")[];
  /** Pagination */
  limit?: number;
  page?: string;
}

export type UsageGroupByDimension =
  | "model"
  | "api_key_id"
  | "workspace_id"
  | "service_tier"
  | "context_window"
  | "inference_geo"
  | "speed";

/**
 * Single bucket in the usage report response.
 */
export interface UsageReportBucket {
  started_at: string;
  ended_at: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  /** Populated when group_by includes the dimension */
  model?: string;
  api_key_id?: string | null;
  workspace_id?: string | null;
  service_tier?: string;
  context_window?: string;
  inference_geo?: string;
  speed?: string;
}

export interface UsageReportResponse {
  data: UsageReportBucket[];
  has_more: boolean;
  next_page?: string;
}

/**
 * Query params for GET /v1/organizations/cost_report
 * Costs in USD as decimal strings in lowest units (cents).
 */
export interface CostReportParams {
  starting_at: string;    // ISO 8601
  ending_at: string;      // ISO 8601
  bucket_width: "1d";     // only daily
  group_by?: ("workspace_id" | "description")[];
  limit?: number;
  page?: string;
}

export interface CostReportBucket {
  started_at: string;
  ended_at: string;
  /** Cost in cents as a decimal string */
  cost: string;
  workspace_id?: string | null;
  description?: string;
  /** Parsed from description when group_by includes "description" */
  model?: string;
  inference_geo?: string;
}

export interface CostReportResponse {
  data: CostReportBucket[];
  has_more: boolean;
  next_page?: string;
}

// ─── 5. Claude Code OTEL Telemetry Metrics ────────────────────────────────────

/**
 * OpenTelemetry metric names emitted by Claude Code when CLAUDE_CODE_ENABLE_TELEMETRY=1.
 * Labels on every signal: session.id, user.id, user.email, organization.id, app.version, terminal.type
 */
export const OTEL_METRICS = {
  /** Session cost in USD (counter) */
  COST_USAGE: "claude_code.cost.usage",
  /** Token count by type (counter, label: type) */
  TOKEN_USAGE: "claude_code.token.usage",
  /** Code edit decisions: accept/reject (counter, label: decision) */
  CODE_EDIT_DECISION: "claude_code.code_edit_tool.decision",
  /** Total active time in seconds (gauge) */
  ACTIVE_TIME: "claude_code.active_time.total",
} as const;

/**
 * Common OTEL labels attached to every metric signal.
 */
export interface OTELCommonLabels {
  "session.id": string;
  "user.id": string;
  "user.email": string;
  "organization.id": string;
  "app.version": string;
  "terminal.type": string;
  model?: string;
}

// ─── 6. Pricing Constants (as of 2026-03) ─────────────────────────────────────

/** Per-million-token pricing (USD). */
export const MODEL_PRICING = {
  "claude-opus-4-6": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  "claude-sonnet-4-6": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
  "claude-opus-4-6-fast": { input: 30, output: 150, cacheRead: 3, cacheWrite: 37.5 },
} as const;

export type KnownModel = keyof typeof MODEL_PRICING;

// ─── 7. Cost Calculation Helpers ──────────────────────────────────────────────

export interface TokenCounts {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

/**
 * Estimate cost from token counts and a model name.
 * Returns NaN for unknown models.
 */
export function estimateCostUSD(model: string, tokens: TokenCounts): number {
  const pricing = MODEL_PRICING[model as KnownModel];
  if (!pricing) return NaN;

  const perM = 1_000_000;
  return (
    (tokens.inputTokens / perM) * pricing.input +
    (tokens.outputTokens / perM) * pricing.output +
    (tokens.cacheReadInputTokens / perM) * pricing.cacheRead +
    (tokens.cacheCreationInputTokens / perM) * pricing.cacheWrite
  );
}

/**
 * Accumulate ModelUsage from an SDKResultMessage.modelUsage map.
 * Useful for multi-query() session cost tracking (the SDK doesn't aggregate across calls).
 */
export function accumulateModelUsage(
  accumulator: Record<string, ModelUsage>,
  incoming: Record<string, ModelUsage>,
): void {
  for (const [model, usage] of Object.entries(incoming)) {
    const existing = accumulator[model];
    if (existing) {
      existing.inputTokens += usage.inputTokens;
      existing.outputTokens += usage.outputTokens;
      existing.cacheReadInputTokens += usage.cacheReadInputTokens;
      existing.cacheCreationInputTokens += usage.cacheCreationInputTokens;
      existing.webSearchRequests += usage.webSearchRequests;
      existing.costUSD += usage.costUSD;
    } else {
      accumulator[model] = { ...usage };
    }
  }
}

// ─── 8. Session-Level Cost Tracker ────────────────────────────────────────────

/**
 * Tracks cost across multiple query() calls in a session.
 * The Agent SDK does NOT aggregate across calls — this fills that gap.
 */
export class SessionCostTracker {
  readonly organizationId: string;
  readonly sessionId: string;
  private _totalCostUSD = 0;
  private _totalDurationMs = 0;
  private _totalDurationApiMs = 0;
  private _totalTurns = 0;
  private _queryCount = 0;
  private _modelUsage: Record<string, ModelUsage> = {};
  private _queries: QueryResultMetrics[] = [];

  constructor(organizationId: string, sessionId: string) {
    this.organizationId = organizationId;
    this.sessionId = sessionId;
  }

  /** Record a completed query() result. */
  record(result: QueryResultMetrics): void {
    this._totalCostUSD += result.total_cost_usd;
    this._totalDurationMs += result.duration_ms;
    this._totalDurationApiMs += result.duration_api_ms;
    this._totalTurns += result.num_turns;
    this._queryCount++;
    accumulateModelUsage(this._modelUsage, result.modelUsage);
    this._queries.push(result);
  }

  get totalCostUSD(): number {
    return this._totalCostUSD;
  }
  get totalDurationMs(): number {
    return this._totalDurationMs;
  }
  get totalDurationApiMs(): number {
    return this._totalDurationApiMs;
  }
  get totalTurns(): number {
    return this._totalTurns;
  }
  get queryCount(): number {
    return this._queryCount;
  }
  get modelUsage(): Readonly<Record<string, ModelUsage>> {
    return this._modelUsage;
  }
  get queries(): readonly QueryResultMetrics[] {
    return this._queries;
  }

  /** Snapshot suitable for persistence or reporting. */
  toJSON(): SessionCostSnapshot {
    return {
      organizationId: this.organizationId,
      sessionId: this.sessionId,
      totalCostUSD: this._totalCostUSD,
      totalDurationMs: this._totalDurationMs,
      totalDurationApiMs: this._totalDurationApiMs,
      totalTurns: this._totalTurns,
      queryCount: this._queryCount,
      modelUsage: { ...this._modelUsage },
      capturedAt: new Date().toISOString(),
    };
  }
}

export interface SessionCostSnapshot {
  organizationId: string;
  sessionId: string;
  totalCostUSD: number;
  totalDurationMs: number;
  totalDurationApiMs: number;
  totalTurns: number;
  queryCount: number;
  modelUsage: Record<string, ModelUsage>;
  capturedAt: string;
}
