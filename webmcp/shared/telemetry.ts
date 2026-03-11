import { logToolCall } from "../../db/logger.js";

export interface TelemetryEvent {
  toolName: string;
  timestamp: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface TelemetryOptions {
  /** When true, persist to Neon Postgres via db/logger. Defaults to false. */
  persistToNeon?: boolean;
  /** Session context for Neon persistence. */
  sessionId?: string;
  branchName?: string;
  prNumber?: number;
}

const events: TelemetryEvent[] = [];

/**
 * Record a tool invocation for usage tracking.
 * Always records in-memory. Optionally persists to Neon if configured.
 */
export function recordInvocation(
  event: TelemetryEvent,
  options?: TelemetryOptions,
): void {
  events.push(event);

  if (options?.persistToNeon) {
    logToolCall({
      toolName: event.toolName,
      durationMs: event.durationMs,
      success: event.success,
      error: event.error,
      sessionId: options.sessionId,
      branchName: options.branchName,
      prNumber: options.prNumber,
    }).catch(() => {
      // Graceful fallback: if Neon persistence fails, in-memory still works.
    });
  }
}

/**
 * Get all recorded telemetry events.
 */
export function getEvents(): readonly TelemetryEvent[] {
  return events;
}

/**
 * Clear telemetry (for testing).
 */
export function clearTelemetry(): void {
  events.length = 0;
}
