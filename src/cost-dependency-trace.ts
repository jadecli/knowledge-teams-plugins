/**
 * Recursive Dependency Trace — Cost & Time Metrics
 *
 * Maps every upstream and downstream dependency that touches cost/time data,
 * from the Anthropic API response through the Agent SDK, into this codebase,
 * and out to OTEL collectors and Admin API consumers.
 *
 * Use this module to understand WHERE cost data originates, HOW it flows,
 * and WHAT each layer adds or transforms.
 */

// ─── Dependency Node ──────────────────────────────────────────────────────────

export interface DependencyNode {
  /** Unique key for this node */
  id: string;
  /** Human-readable name */
  name: string;
  /** npm package, API endpoint, or internal module */
  source: string;
  /** What cost/time fields this node produces or consumes */
  fields: string[];
  /** Nodes this depends on (upstream) */
  dependsOn: string[];
  /** Nodes that depend on this (downstream) */
  dependedBy: string[];
  /** Layer in the architecture */
  layer: "api" | "sdk" | "agent-sdk" | "plugin" | "telemetry" | "admin-api";
  /** Whether this node has telemetry instrumentation */
  hasTelemetry: boolean;
}

// ─── Full Dependency Graph ────────────────────────────────────────────────────

/**
 * Static dependency graph for cost/time metrics.
 * Traced recursively from API → SDK → Agent SDK → this codebase → OTEL/Admin.
 */
export const COST_DEPENDENCY_GRAPH: Record<string, DependencyNode> = {
  // ── Layer 0: Anthropic API ──────────────────────────────────────────────
  "anthropic-api-messages": {
    id: "anthropic-api-messages",
    name: "Anthropic Messages API",
    source: "POST /v1/messages",
    fields: [
      "usage.input_tokens",
      "usage.output_tokens",
      "usage.cache_creation_input_tokens",
      "usage.cache_read_input_tokens",
    ],
    dependsOn: [],
    dependedBy: ["anthropic-sdk-client", "agent-sdk-step"],
    layer: "api",
    hasTelemetry: false,
  },

  "anthropic-api-token-count": {
    id: "anthropic-api-token-count",
    name: "Token Counting API",
    source: "POST /v1/messages/count_tokens",
    fields: ["input_tokens"],
    dependsOn: [],
    dependedBy: ["anthropic-sdk-client"],
    layer: "api",
    hasTelemetry: false,
  },

  // ── Layer 1: Anthropic TypeScript SDK ───────────────────────────────────
  "anthropic-sdk-client": {
    id: "anthropic-sdk-client",
    name: "@anthropic-ai/sdk",
    source: "npm:@anthropic-ai/sdk",
    fields: [
      "BetaMessage.usage",
      "BetaMessage.id",
      "BetaMessage.model",
      "Usage.input_tokens",
      "Usage.output_tokens",
      "Usage.cache_creation_input_tokens",
      "Usage.cache_read_input_tokens",
    ],
    dependsOn: ["anthropic-api-messages", "anthropic-api-token-count"],
    dependedBy: ["agent-sdk-step"],
    layer: "sdk",
    hasTelemetry: false,
  },

  // ── Layer 2: Claude Agent SDK ───────────────────────────────────────────
  "agent-sdk-step": {
    id: "agent-sdk-step",
    name: "Agent SDK — Per-Step Usage",
    source: "npm:@anthropic-ai/claude-agent-sdk → SDKAssistantMessage",
    fields: [
      "message.message.id (deduplicate parallel tool calls)",
      "message.message.usage.input_tokens",
      "message.message.usage.output_tokens",
      "message.message.usage.cache_creation_input_tokens",
      "message.message.usage.cache_read_input_tokens",
    ],
    dependsOn: ["anthropic-sdk-client"],
    dependedBy: ["agent-sdk-result", "agent-sdk-subagent-output"],
    layer: "agent-sdk",
    hasTelemetry: false,
  },

  "agent-sdk-subagent-output": {
    id: "agent-sdk-subagent-output",
    name: "Agent SDK — SubagentOutputMetrics (AgentOutput)",
    source: "npm:@anthropic-ai/claude-agent-sdk → Agent tool result",
    fields: [
      "totalDurationMs (subagent wall-clock)",
      "totalTokens",
      "totalToolUseCount",
      "usage: AnthropicAPIUsage (full incl. server_tool_use, cache_creation TTL)",
      "agentId",
    ],
    dependsOn: ["agent-sdk-step"],
    dependedBy: ["plugin-session-tracker"],
    layer: "agent-sdk",
    hasTelemetry: false,
  },

  "agent-sdk-result": {
    id: "agent-sdk-result",
    name: "Agent SDK — SDKResultMessage (authoritative)",
    source: "npm:@anthropic-ai/claude-agent-sdk → SDKResultMessage",
    fields: [
      "total_cost_usd (AUTHORITATIVE)",
      "duration_ms",
      "duration_api_ms",
      "num_turns",
      "usage: NonNullableUsage",
      "modelUsage: Record<string, ModelUsage>",
      "ModelUsage.inputTokens",
      "ModelUsage.outputTokens",
      "ModelUsage.cacheReadInputTokens",
      "ModelUsage.cacheCreationInputTokens",
      "ModelUsage.webSearchRequests",
      "ModelUsage.costUSD",
      "ModelUsage.contextWindow",
      "ModelUsage.maxOutputTokens",
    ],
    dependsOn: ["agent-sdk-step"],
    dependedBy: [
      "plugin-session-tracker",
      "plugin-team-status",
      "otel-claude-code",
    ],
    layer: "agent-sdk",
    hasTelemetry: false,
  },

  // ── Layer 3: This Codebase (knowledge-teams-plugins) ────────────────────
  "plugin-session-tracker": {
    id: "plugin-session-tracker",
    name: "SessionCostTracker",
    source: "src/sdk-cost-metrics.ts → SessionCostTracker",
    fields: [
      "totalCostUSD (accumulated across query() calls)",
      "totalDurationMs",
      "totalDurationApiMs",
      "totalTurns",
      "queryCount",
      "modelUsage (per-model accumulated)",
      "organizationId",
      "sessionId",
    ],
    dependsOn: ["agent-sdk-result"],
    dependedBy: ["plugin-telemetry-enhanced", "plugin-team-status"],
    layer: "plugin",
    hasTelemetry: true,
  },

  "plugin-telemetry-enhanced": {
    id: "plugin-telemetry-enhanced",
    name: "Enhanced Telemetry Module",
    source: "webmcp/shared/telemetry.ts → CostAwareTelemetryEvent",
    fields: [
      "toolName",
      "timestamp",
      "durationMs",
      "success",
      "error",
      "costUSD (new — from SessionCostTracker)",
      "tokenCounts (new — input/output/cache)",
      "organizationId (new)",
      "sessionId (new)",
      "model (new)",
    ],
    dependsOn: ["plugin-session-tracker"],
    dependedBy: ["otel-claude-code"],
    layer: "plugin",
    hasTelemetry: true,
  },

  "plugin-team-status": {
    id: "plugin-team-status",
    name: "WebMCP get-team-status",
    source: "webmcp/internal/tools/get-team-status.ts",
    fields: [
      "per-agent cost",
      "per-agent duration",
      "team aggregate cost",
    ],
    dependsOn: ["agent-sdk-result", "plugin-session-tracker"],
    dependedBy: ["plugin-budget-enforcement"],
    layer: "plugin",
    hasTelemetry: true,
  },

  "plugin-budget-enforcement": {
    id: "plugin-budget-enforcement",
    name: "Budget Enforcement (STO frontmatter)",
    source: "extensions/jade-orchestrator/skills/budget-enforcement.md",
    fields: [
      "budget_tool_calls (from STO frontmatter)",
      "budgetUsed (from request-checkpoint)",
      "requestBudgetExtension",
    ],
    dependsOn: ["plugin-team-status"],
    dependedBy: [],
    layer: "plugin",
    hasTelemetry: true,
  },

  // ── Layer 4: External Consumers ─────────────────────────────────────────
  "otel-claude-code": {
    id: "otel-claude-code",
    name: "Claude Code OTEL Telemetry",
    source: "CLAUDE_CODE_ENABLE_TELEMETRY=1 → OpenTelemetry Collector",
    fields: [
      "claude_code.cost.usage (USD, by session/model)",
      "claude_code.token.usage (count, by type)",
      "claude_code.code_edit_tool.decision",
      "claude_code.active_time.total",
      "Labels: session.id, user.id, user.email, organization.id, app.version, terminal.type",
    ],
    dependsOn: ["agent-sdk-result", "plugin-telemetry-enhanced"],
    dependedBy: ["prometheus-grafana"],
    layer: "telemetry",
    hasTelemetry: true,
  },

  "prometheus-grafana": {
    id: "prometheus-grafana",
    name: "Prometheus + Grafana Dashboards",
    source: "OTLP → Prometheus → Grafana",
    fields: [
      "sum(claude_code_cost_usage_USD_total)",
      "sum(claude_code_token_usage_tokens_total) by (type)",
      "sum(claude_code_cost_usage_USD_total) by (model)",
    ],
    dependsOn: ["otel-claude-code"],
    dependedBy: [],
    layer: "telemetry",
    hasTelemetry: true,
  },

  "admin-api-usage": {
    id: "admin-api-usage",
    name: "Anthropic Admin API — Usage Report",
    source: "GET /v1/organizations/usage_report/messages",
    fields: [
      "input_tokens, output_tokens per bucket",
      "cache_creation_input_tokens, cache_read_input_tokens",
      "group_by: model, api_key_id, workspace_id, service_tier, context_window, inference_geo, speed",
      "bucket_width: 1m | 1h | 1d",
    ],
    dependsOn: [],
    dependedBy: ["admin-api-consumer"],
    layer: "admin-api",
    hasTelemetry: false,
  },

  "admin-api-cost": {
    id: "admin-api-cost",
    name: "Anthropic Admin API — Cost Report",
    source: "GET /v1/organizations/cost_report",
    fields: [
      "cost (USD cents as decimal string)",
      "group_by: workspace_id, description",
      "description includes model + inference_geo",
      "Covers: token usage, web search, code execution",
    ],
    dependsOn: [],
    dependedBy: ["admin-api-consumer"],
    layer: "admin-api",
    hasTelemetry: false,
  },

  "admin-api-claude-code-analytics": {
    id: "admin-api-claude-code-analytics",
    name: "Anthropic Admin API — Claude Code Analytics",
    source: "GET /v1/organizations/usage_report/claude_code",
    fields: [
      "Per-user daily: num_sessions, lines_of_code, commits, PRs",
      "Tool actions: edit/write/notebook_edit/multi_edit accept/reject rates",
      "model_breakdown[]: tokens (input/output/cache_read/cache_creation) + estimated_cost",
      "actor: user_actor.email_address or api_actor.api_key_name",
      "organization_id, terminal_type, customer_type",
      "Data freshness: ~1 hour",
    ],
    dependsOn: [],
    dependedBy: ["admin-api-consumer"],
    layer: "admin-api",
    hasTelemetry: false,
  },

  "admin-api-consumer": {
    id: "admin-api-consumer",
    name: "Organization Cost Dashboard / Finance",
    source: "Console → Cost & Usage pages, or custom integrations",
    fields: [
      "Per-workspace cost attribution",
      "Per-model usage breakdown",
      "Cache efficiency metrics",
      "Budget monitoring and alerts",
    ],
    dependsOn: ["admin-api-usage", "admin-api-cost", "admin-api-claude-code-analytics"],
    dependedBy: [],
    layer: "admin-api",
    hasTelemetry: false,
  },
};

// ─── Recursive Trace Functions ────────────────────────────────────────────────

/**
 * Trace all upstream dependencies recursively from a starting node.
 */
export function traceUpstream(
  nodeId: string,
  graph: Record<string, DependencyNode> = COST_DEPENDENCY_GRAPH,
  visited = new Set<string>(),
): DependencyNode[] {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);

  const node = graph[nodeId];
  if (!node) return [];

  const result: DependencyNode[] = [node];
  for (const depId of node.dependsOn) {
    result.push(...traceUpstream(depId, graph, visited));
  }
  return result;
}

/**
 * Trace all downstream dependents recursively from a starting node.
 */
export function traceDownstream(
  nodeId: string,
  graph: Record<string, DependencyNode> = COST_DEPENDENCY_GRAPH,
  visited = new Set<string>(),
): DependencyNode[] {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);

  const node = graph[nodeId];
  if (!node) return [];

  const result: DependencyNode[] = [node];
  for (const depId of node.dependedBy) {
    result.push(...traceDownstream(depId, graph, visited));
  }
  return result;
}

/**
 * Find all nodes missing telemetry instrumentation.
 */
export function findUninstrumented(
  graph: Record<string, DependencyNode> = COST_DEPENDENCY_GRAPH,
): DependencyNode[] {
  return Object.values(graph).filter((n) => !n.hasTelemetry);
}

/**
 * Print the dependency graph as a text tree for debugging.
 */
export function printDependencyTree(
  nodeId: string,
  direction: "upstream" | "downstream" = "downstream",
  graph: Record<string, DependencyNode> = COST_DEPENDENCY_GRAPH,
  indent = 0,
  visited = new Set<string>(),
): string {
  if (visited.has(nodeId)) return `${"  ".repeat(indent)}↺ ${nodeId} (cycle)\n`;
  visited.add(nodeId);

  const node = graph[nodeId];
  if (!node) return `${"  ".repeat(indent)}? ${nodeId} (unknown)\n`;

  const telemetryMarker = node.hasTelemetry ? "✓" : "✗";
  let output = `${"  ".repeat(indent)}[${telemetryMarker}] ${node.name} (${node.layer})\n`;

  const children = direction === "downstream" ? node.dependedBy : node.dependsOn;
  for (const childId of children) {
    output += printDependencyTree(childId, direction, graph, indent + 1, visited);
  }

  return output;
}
