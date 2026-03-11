/**
 * @module db/logger
 * @description Persists agent tool call events to Neon Postgres.
 * Each function does one thing. No magic. Explicit return types.
 */

import { eq } from "drizzle-orm";
import { getDb, hasDatabase } from "./client.js";
import { factToolCalls, dimTools, dimSessions } from "./schema.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ToolCallEvent {
  toolName: string;
  sessionId?: string;
  inputParams?: Record<string, unknown>;
  outputSummary?: string;
  durationMs?: number;
  success: boolean;
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
  branchName?: string;
  prNumber?: number;
}

// ─── Dimension Upserts ──────────────────────────────────────────────────────

/** Upsert a tool into dim_tools. Returns the tool's row id. */
export async function ensureDimTool(
  toolName: string,
  category?: string,
  origin?: string,
  isWebmcp?: boolean,
): Promise<number> {
  const db = getDb();

  const existing = await db
    .select({ id: dimTools.id })
    .from(dimTools)
    .where(eq(dimTools.toolName, toolName))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const inserted = await db
    .insert(dimTools)
    .values({ toolName, category, origin, isWebmcp: isWebmcp ?? false })
    .returning({ id: dimTools.id });

  return inserted[0].id;
}

/** Upsert a session into dim_sessions. Returns the session's row id. */
export async function ensureDimSession(
  sessionId: string,
  branchName?: string,
  prNumber?: number,
  repo?: string,
): Promise<number> {
  const db = getDb();

  const existing = await db
    .select({ id: dimSessions.id })
    .from(dimSessions)
    .where(eq(dimSessions.sessionId, sessionId))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const inserted = await db
    .insert(dimSessions)
    .values({ sessionId, branchName, prNumber, repo })
    .returning({ id: dimSessions.id });

  return inserted[0].id;
}

// ─── Fact Insert ────────────────────────────────────────────────────────────

/** Log a tool call event to fact_tool_calls. No-op if DATABASE_URL is unset. */
export async function logToolCall(event: ToolCallEvent): Promise<void> {
  if (!hasDatabase()) return;

  const db = getDb();

  const toolId = await ensureDimTool(event.toolName);
  const sessionId = event.sessionId
    ? await ensureDimSession(
        event.sessionId,
        event.branchName,
        event.prNumber,
      )
    : null;

  await db.insert(factToolCalls).values({
    toolId,
    sessionId,
    toolName: event.toolName,
    inputParams: event.inputParams,
    outputSummary: event.outputSummary,
    durationMs: event.durationMs,
    success: event.success,
    error: event.error,
    inputTokens: event.inputTokens,
    outputTokens: event.outputTokens,
    branchName: event.branchName,
    prNumber: event.prNumber,
  });
}
