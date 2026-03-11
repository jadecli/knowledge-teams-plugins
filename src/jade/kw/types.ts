/**
 * KW (Knowledge Worker) seat types for the S-Team VP council.
 *
 * KW IDs map to VP plugin seats, not repos. Repos are routed to seats
 * via the repoMap in seats.json, giving each session the correct model,
 * effort level, and budget configuration.
 */

/** Effort level derived from model tier. */
export type EffortLevel = "low" | "medium" | "high";

/** A VP seat in the S-Team council. */
export interface KWSeat {
  kwId: string;
  plugin: string;
  title: string;
  /** STO filename (without .md extension), null for seats without STO files. */
  sto: string | null;
}

/** Parsed YAML frontmatter from s-team/*.md STO files. */
export interface STOFrontmatter {
  role: string;
  model: string;
  safetyResearch: string;
  fitnessFunction: string;
  budgetToolCalls: number;
}

/** Result returned by detectKW(). */
export interface KWDetectionResult {
  kwId: string;
  plugin: string;
  title: string;
  model: string;
  budgetToolCalls: number;
  effort: EffortLevel;
  fitnessFunction: string | null;
  /** True when the repo was explicitly mapped; false for default fallback. */
  mapped: boolean;
}

/** Shape of seats.json. */
export interface KWSeatsConfig {
  seats: KWSeat[];
  repoMap: Record<string, string>;
  defaults: {
    kwId: string;
    plugin: string;
    title: string;
    model: string;
    budgetToolCalls: number;
    effort: EffortLevel;
  };
}
