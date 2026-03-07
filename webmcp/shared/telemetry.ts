export interface TelemetryEvent {
  toolName: string;
  timestamp: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

const events: TelemetryEvent[] = [];

/**
 * Record a tool invocation for usage tracking.
 */
export function recordInvocation(event: TelemetryEvent): void {
  events.push(event);
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
