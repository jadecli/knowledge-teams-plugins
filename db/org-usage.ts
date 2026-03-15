/**
 * @module db/org-usage
 * @description Fetches team usage metrics from the Claude Organizations API
 * and persists to fact_org_usage. Serves as a live integration test for the
 * entire Neon pipeline: if we can fetch real data and write it, it works.
 */

import { getDb, hasDatabase } from "./client.js";
import { factOrgUsage } from "./schema.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OrgUsageBucket {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

export interface OrgUsageResponse {
  org_id: string;
  period_start: string;
  period_end: string;
  usage: OrgUsageBucket[];
}

// ─── Fetch ──────────────────────────────────────────────────────────────────

/** Fetch usage metrics from Claude Organizations API. */
export async function fetchOrgUsage(
  orgId: string,
  apiKey: string,
): Promise<OrgUsageResponse> {
  const url = `https://api.anthropic.com/v1/organizations/${encodeURIComponent(orgId)}/usage`;

  const response = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Organizations API returned ${response.status}: ${await response.text()}`,
    );
  }

  return response.json() as Promise<OrgUsageResponse>;
}

// ─── Persist ────────────────────────────────────────────────────────────────

/** Write usage buckets to fact_org_usage. */
export async function persistOrgUsage(
  usage: OrgUsageResponse,
): Promise<number> {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is not set — cannot persist org usage");
  }

  const db = getDb();
  let rowsInserted = 0;

  for (const bucket of usage.usage) {
    await db.insert(factOrgUsage).values({
      orgId: usage.org_id,
      periodStart: new Date(usage.period_start),
      periodEnd: new Date(usage.period_end),
      inputTokens: bucket.input_tokens,
      outputTokens: bucket.output_tokens,
      cacheReadTokens: bucket.cache_read_input_tokens ?? 0,
      cacheCreationTokens: bucket.cache_creation_input_tokens ?? 0,
      model: bucket.model,
    });
    rowsInserted++;
  }

  return rowsInserted;
}

// ─── Orchestrator ───────────────────────────────────────────────────────────

/**
 * Fetch + persist org usage. End-to-end integration test for the Neon pipeline.
 * Requires ANTHROPIC_ORG_API_KEY and ANTHROPIC_ORG_ID env vars.
 */
export async function syncOrgUsage(): Promise<{
  fetched: boolean;
  persisted: number;
}> {
  const apiKey = process.env.ANTHROPIC_ORG_API_KEY;
  const orgId = process.env.ANTHROPIC_ORG_ID;

  if (!apiKey || !orgId) {
    return { fetched: false, persisted: 0 };
  }

  const usage = await fetchOrgUsage(orgId, apiKey);
  const persisted = await persistOrgUsage(usage);

  return { fetched: true, persisted };
}
