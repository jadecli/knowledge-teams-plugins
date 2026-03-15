export interface TelemetryEvent {
  toolName: string;
  timestamp: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

const MAX_EVENTS = 1000;
const events: TelemetryEvent[] = [];

/**
 * Record a tool invocation for usage tracking.
 * Drops the oldest event when the buffer exceeds MAX_EVENTS.
 */
export function recordInvocation(event: TelemetryEvent): void {
  if (events.length >= MAX_EVENTS) {
    events.shift();
  }
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
