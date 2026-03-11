/**
 * @module db/schema
 * @description Kimball dimensional model for agent observability.
 *
 * Follows Ralph Kimball's star schema pattern:
 * - Fact tables record measurable events (tool calls, org usage)
 * - Dimension tables provide context (who, what, where)
 * - Metadata tables track system state (doc cache)
 *
 * All enums align with canonical types from src/mcp-registry.ts.
 */

import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  bigint,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Dimension Tables ───────────────────────────────────────────────────────

/** Dimension: tool identity and classification */
export const dimTools = pgTable(
  "dim_tools",
  {
    id: serial("id").primaryKey(),
    toolName: text("tool_name").notNull(),
    /** Maps to McpCategory enum from src/mcp-registry.ts */
    category: text("category"),
    /** Maps to McpOrigin enum from src/mcp-registry.ts */
    origin: text("origin"),
    isWebmcp: boolean("is_webmcp").notNull().default(false),
  },
  (table) => [uniqueIndex("dim_tools_name_idx").on(table.toolName)],
);

/** Dimension: agent identity */
export const dimAgents = pgTable("dim_agents", {
  id: serial("id").primaryKey(),
  agentName: text("agent_name").notNull(),
  sdkVersion: text("sdk_version"),
  model: text("model"),
});

/** Dimension: session context (branch, PR, repo) */
export const dimSessions = pgTable(
  "dim_sessions",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    branchName: text("branch_name"),
    prNumber: integer("pr_number"),
    repo: text("repo"),
    startedAt: timestamp("started_at").defaultNow(),
  },
  (table) => [uniqueIndex("dim_sessions_sid_idx").on(table.sessionId)],
);

// ─── Fact Tables ────────────────────────────────────────────────────────────

/** Fact: individual agent tool call invocations */
export const factToolCalls = pgTable("fact_tool_calls", {
  id: serial("id").primaryKey(),
  /** FK to dim_sessions */
  sessionId: integer("session_id"),
  /** FK to dim_tools */
  toolId: integer("tool_id"),
  /** FK to dim_agents */
  agentId: integer("agent_id"),
  toolName: text("tool_name").notNull(),
  inputParams: jsonb("input_params"),
  outputSummary: text("output_summary"),
  /** Measure: execution duration in milliseconds */
  durationMs: integer("duration_ms"),
  success: boolean("success").notNull(),
  error: text("error"),
  /** Measure: input token consumption */
  inputTokens: integer("input_tokens"),
  /** Measure: output token consumption */
  outputTokens: integer("output_tokens"),
  branchName: text("branch_name"),
  prNumber: integer("pr_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

/** Fact: Claude Organizations API usage metrics */
export const factOrgUsage = pgTable("fact_org_usage", {
  id: serial("id").primaryKey(),
  orgId: text("org_id").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  /** Measure: input tokens consumed */
  inputTokens: bigint("input_tokens", { mode: "number" }),
  /** Measure: output tokens consumed */
  outputTokens: bigint("output_tokens", { mode: "number" }),
  /** Measure: cache read tokens */
  cacheReadTokens: bigint("cache_read_tokens", { mode: "number" }),
  /** Measure: cache creation tokens */
  cacheCreationTokens: bigint("cache_creation_tokens", { mode: "number" }),
  model: text("model"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
});

// ─── Metadata Tables ────────────────────────────────────────────────────────

/** Metadata: cached llms.txt documents */
export const metaDocCache = pgTable(
  "meta_doc_cache",
  {
    id: serial("id").primaryKey(),
    url: text("url").notNull(),
    contentHash: text("content_hash").notNull(),
    content: text("content").notNull(),
    lastCrawled: timestamp("last_crawled").defaultNow(),
    /** Which llms.txt entry linked to this URL */
    parentUrl: text("parent_url"),
  },
  (table) => [uniqueIndex("meta_doc_cache_url_idx").on(table.url)],
);
