export interface TelemetryEvent {
  toolName: string;
  timestamp: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

/**
 * Extended telemetry event with cost/time metrics from the Agent SDK.
 * Use this when the tool invocation is inside a query() call and cost data is available.
 */
export interface CostAwareTelemetryEvent extends TelemetryEvent {
  /** Cost in USD attributed to this invocation (from SessionCostTracker or SDKResultMessage) */
  costUSD?: number;
  /** Token counts for this invocation */
  tokenCounts?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
  };
  /** Organization ID for team-level attribution */
  organizationId?: string;
  /** Session ID for correlating across query() calls */
  sessionId?: string;
  /** Model used for this invocation */
  model?: string;
}

const MAX_EVENTS = 10_000;
const events: CostAwareTelemetryEvent[] = [];

/**
 * Record a tool invocation for usage tracking.
 * Drops oldest events when the buffer exceeds MAX_EVENTS.
 */
export function recordInvocation(event: TelemetryEvent | CostAwareTelemetryEvent): void {
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
}

/**
 * Get all recorded telemetry events.
 */
export function getEvents(): readonly CostAwareTelemetryEvent[] {
  return events;
}

/**
 * Clear telemetry (for testing).
 */
export function clearTelemetry(): void {
  events.length = 0;
}

function sumCostBy(
  keyFn: (e: CostAwareTelemetryEvent) => string | undefined,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const event of events) {
    const key = keyFn(event);
    if (event.costUSD != null && key) {
      result[key] = (result[key] ?? 0) + event.costUSD;
    }
  }
  return result;
}

/**
 * Get aggregate cost across all recorded events that have cost data.
 */
export function getAggregateCost(): { totalCostUSD: number; eventCount: number } {
  let totalCostUSD = 0;
  let eventCount = 0;
  for (const event of events) {
    if (event.costUSD != null) {
      totalCostUSD += event.costUSD;
      eventCount++;
    }
  }
  return { totalCostUSD, eventCount };
}

/**
 * Get cost breakdown by organization ID.
 */
export function getCostByOrganization(): Record<string, number> {
  return sumCostBy((e) => e.organizationId);
}

/**
 * Get cost breakdown by model.
 */
export function getCostByModel(): Record<string, number> {
  return sumCostBy((e) => e.model);
}

/**
 * Get average duration by tool name.
 */
export function getAvgDurationByTool(): Record<string, { avgMs: number; count: number }> {
  const acc: Record<string, { totalMs: number; count: number }> = {};
  for (const event of events) {
    const entry = acc[event.toolName] ?? { totalMs: 0, count: 0 };
    entry.totalMs += event.durationMs;
    entry.count++;
    acc[event.toolName] = entry;
  }
  const result: Record<string, { avgMs: number; count: number }> = {};
  for (const [tool, { totalMs, count }] of Object.entries(acc)) {
    result[tool] = { avgMs: totalMs / count, count };
  }
  return result;
}
