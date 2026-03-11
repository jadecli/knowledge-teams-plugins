/**
 * Claude SDK Tasks — Canonical Data Structures & Dependency Map
 *
 * Research date: 2026-03-11
 * Sources:
 *   - Claude Code npm: @anthropic-ai/claude-code@2.1.72 (latest; 2.7.2 does NOT exist)
 *   - Claude Agent SDK: @anthropic-ai/claude-agent-sdk@0.2.72
 *   - Anthropic TS SDK: @anthropic-ai/sdk@0.78.0
 *   - Docs: platform.claude.com/docs/en/agent-sdk/typescript
 *   - GitHub: github.com/anthropics/claude-agent-sdk-typescript
 *
 * This file documents every task-related type across the three SDK layers,
 * their upstream/downstream dependency chains, and telemetry touch-points.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: VERSION MATRIX
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * IMPORTANT: Claude Code version 2.7.2 does NOT exist.
 * The versioning is in the 2.1.x range. Latest: 2.1.72.
 * The "Tasks" feature was introduced in v2.1.16 (January 2026).
 *
 * @telemetry-note Version mismatch — user referenced 2.7.2; actual is 2.1.72.
 *                 Possible confusion with internal build number or docs version.
 */
export const VERSION_MATRIX = {
  claudeCode: {
    package: "@anthropic-ai/claude-code",
    latest: "2.1.72",
    tasksIntroducedIn: "2.1.16",
    note: "Version 2.7.2 does NOT exist. Versioning is 2.1.x.",
  },
  claudeAgentSdk: {
    package: "@anthropic-ai/claude-agent-sdk",
    latest: "0.2.72",
    peerDependencies: { zod: "^3.24.1 || ^4.0.0" },
    runtimeRequirement: "Node.js 18+",
  },
  anthropicSdk: {
    package: "@anthropic-ai/sdk",
    latest: "0.78.0",
    dependencies: { "json-schema-to-ts": "^3.1.1" },
    peerDependencies: { zod: "^3.25.0 || ^4.0.0" },
    note: "No Tasks API — only Message Batches for async work.",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: @anthropic-ai/sdk (REST API) — NO TASKS API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The Anthropic REST SDK has NO "Tasks API".
 * The closest async primitive is the Message Batches API.
 * Agentic "task execution" is achieved through the tool-use loop pattern.
 *
 * @telemetry-note Confirmed absence of Tasks API in @anthropic-ai/sdk@0.78.0.
 *                 Traced all endpoints: /v1/messages, /v1/messages/batches, /v1/models.
 */

/** Message Batch — the only "async job" type in the REST API. */
export interface AnthropicMessageBatch {
  id: string;
  type: "message_batch";
  processing_status:
    | "processing"
    | "succeeded"
    | "canceled"
    | "expired"
    | "errored";
  request_counts: {
    succeeded: number;
    errored: number;
    canceled: number;
    pending: number;
    expired: number;
  };
}

/** Tool use block — the mechanism for agentic task execution. */
export interface AnthropicToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/** Tool result block — returned after executing a tool. */
export interface AnthropicToolResultBlockParam {
  type: "tool_result";
  tool_use_id: string;
  content: string | unknown;
  is_error?: boolean;
}

/**
 * REST API Endpoints (exhaustive as of v0.78.0):
 *
 * GA:
 *   POST   /v1/messages                          → client.messages.create()
 *   POST   /v1/messages/count_tokens             → client.messages.countTokens()
 *   POST   /v1/messages/batches                  → client.messages.batches.create()
 *   GET    /v1/messages/batches                  → client.messages.batches.list()
 *   GET    /v1/messages/batches/{id}             → client.messages.batches.retrieve()
 *   GET    /v1/messages/batches/{id}/results     → client.messages.batches.results()
 *   DELETE /v1/messages/batches/{id}             → client.messages.batches.delete()
 *   POST   /v1/messages/batches/{id}/cancel      → client.messages.batches.cancel()
 *   GET    /v1/models                            → client.models.list()
 *   GET    /v1/models/{id}                       → client.models.retrieve()
 *
 * Beta:
 *   POST   /v1/files                             → Files API
 *   POST   /v1/skills                            → Skills API
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: CLAUDE CODE — TodoWrite (Legacy) & Tasks API (Current)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 3a. TodoWrite (Legacy, still available in Agent SDK) ─────────────────────

/** TodoWrite input — the original ephemeral task tracking. */
export interface TodoWriteInput {
  todos: TodoItem[];
}

export interface TodoItem {
  /** Imperative form: "Run tests", "Fix authentication bug" */
  content: string;
  /** Present continuous: "Running tests", "Fixing authentication bug" */
  activeForm: string;
  /** Task lifecycle state */
  status: "pending" | "in_progress" | "completed";
}

/**
 * TodoWrite characteristics:
 * - Ephemeral: lives only in conversation context, vanishes on session close
 * - No persistence: cannot be shared across sessions
 * - No dependency graph: flat list only
 * - No cross-agent coordination
 * - Still used by Agent SDK for programmatic control
 *
 * @telemetry-note TodoWrite is still the tool name in the Agent SDK.
 *                 The Tasks API tools (TaskCreate, etc.) are Claude Code CLI only.
 */

// ─── 3b. Tasks API (Current, introduced v2.1.16) ─────────────────────────────

/**
 * Opt-in/Opt-out:
 *   CLAUDE_CODE_ENABLE_TASKS=false → revert to TodoWrite
 *   CLAUDE_CODE_TASK_LIST_ID       → share task list across sessions
 *   CLAUDE_CODE_DISABLE_CRON       → disable scheduled/loop tasks
 *   CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS → enable agent teams
 */

/** TaskCreate input schema — creates a new persistent task. */
export interface TaskCreateInput {
  /** Short task title */
  subject: string;
  /** Detailed requirements (optional) */
  description?: string;
  /** Initial status, defaults to "pending" */
  status?: TaskStatus;
  /** DAG edges: IDs of tasks this one depends on */
  dependencies?: string[];
  /** Alias for dependencies */
  blockedBy?: string[];
  /** Arbitrary metadata */
  metadata?: TaskMetadata;
}

/** TaskUpdate input — modifies an existing task. */
export interface TaskUpdateInput {
  /** Immutable task identifier */
  taskId: string;
  /** Updated status */
  status?: TaskStatus;
  /** Updated title */
  subject?: string;
  /** Updated description */
  description?: string;
  /** Updated metadata */
  metadata?: TaskMetadata;
  /** Updated dependencies */
  dependencies?: string[];
}

/** TaskList output — lightweight view of all tasks. */
export interface TaskListOutput {
  tasks: Array<{
    id: string;
    subject: string;
    status: TaskStatus;
    owner?: string;
    blockedBy?: string[];
  }>;
}

/** TaskGet output — full task record. */
export interface TaskGetOutput {
  id: string;
  subject: string;
  description?: string;
  status: TaskStatus;
  owner?: string;
  blockedBy?: string[];
  blocks?: string[];
  metadata?: TaskMetadata;
}

export type TaskStatus = "pending" | "in_progress" | "completed";

/**
 * Task metadata — arbitrary key/value pairs.
 * Common fields observed in the wild:
 */
export interface TaskMetadata {
  priority?: "low" | "medium" | "high" | "critical";
  estimated_duration?: string;
  files?: string[];
  started_at?: string;
  completed_at?: string;
  related_issue?: string;
  test_results?: unknown;
  [key: string]: unknown;
}

/**
 * Storage:
 *   ~/.claude/tasks/<TASK_LIST_ID>/tasks.json   (JSONL format)
 *   File locking for concurrent access (cross-session)
 *
 * Known issues:
 *   - TaskCreate/TaskUpdate/TaskList/TaskGet silently disabled in VS Code extension
 *     due to process.stdout.isTTY check (GitHub issue #23874)
 *   - metadata field not fully exposed in TaskList (only via TaskGet)
 *     (GitHub issue #21356)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: @anthropic-ai/claude-agent-sdk — Canonical Types
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 4a. Core query() function ────────────────────────────────────────────────

/**
 * query() — primary entry point for the Agent SDK.
 *
 * ```typescript
 * import { query } from "@anthropic-ai/claude-agent-sdk";
 *
 * const q = query({ prompt: "...", options: { ... } });
 * for await (const msg of q) { ... }
 * ```
 */
export interface QueryInput {
  prompt: string; // | AsyncIterable<SDKUserMessage> for streaming mode
  options?: AgentSDKOptions;
}

// ─── 4b. Options (30+ fields) ─────────────────────────────────────────────────

export interface AgentSDKOptions {
  abortController?: AbortController;
  additionalDirectories?: string[];
  agent?: string;
  agents?: Record<string, AgentDefinition>;
  allowDangerouslySkipPermissions?: boolean;
  allowedTools?: string[];
  betas?: string[];
  canUseTool?: CanUseToolFn;
  continue?: boolean;
  cwd?: string;
  debug?: boolean;
  debugFile?: string;
  disallowedTools?: string[];
  effort?: "low" | "medium" | "high" | "max";
  enableFileCheckpointing?: boolean;
  env?: Record<string, string | undefined>;
  executable?: "bun" | "deno" | "node";
  executableArgs?: string[];
  extraArgs?: Record<string, string | null>;
  fallbackModel?: string;
  forkSession?: boolean;
  hooks?: Partial<Record<HookEvent, HookCallbackMatcher[]>>;
  includePartialMessages?: boolean;
  maxBudgetUsd?: number;
  maxTurns?: number;
  mcpServers?: Record<string, McpServerConfig>;
  model?: string;
  outputFormat?: { type: "json_schema"; schema: unknown };
  pathToClaudeCodeExecutable?: string;
  permissionMode?: PermissionMode;
  permissionPromptToolName?: string;
  persistSession?: boolean;
  plugins?: Array<{ type: "local"; path: string }>;
  promptSuggestions?: boolean;
  resume?: string;
  resumeSessionAt?: string;
  sandbox?: SandboxSettings;
  sessionId?: string;
  settingSources?: SettingSource[];
  spawnClaudeCodeProcess?: (options: unknown) => unknown;
  stderr?: (data: string) => void;
  strictMcpConfig?: boolean;
  systemPrompt?:
    | string
    | { type: "preset"; preset: "claude_code"; append?: string };
  thinking?: ThinkingConfig;
  toolConfig?: { askUserQuestion?: { previewFormat?: "markdown" | "html" } };
  tools?: string[] | { type: "preset"; preset: "claude_code" };
}

// ─── 4c. AgentDefinition — subagent configuration ────────────────────────────

export interface AgentDefinition {
  /** Natural language description of when to use this agent */
  description: string;
  /** The agent's system prompt */
  prompt: string;
  /** Allowed tool names. Omit to inherit all tools from parent */
  tools?: string[];
  /** Tools to explicitly deny */
  disallowedTools?: string[];
  /** Model alias: "sonnet" | "opus" | "haiku" | "inherit" (NOT full model IDs) */
  model?: "sonnet" | "opus" | "haiku" | "inherit";
  /** MCP servers for this agent */
  mcpServers?: AgentMcpServerSpec[];
  /** Skill names to preload */
  skills?: string[];
  /** Max agentic turns before stopping */
  maxTurns?: number;
  /** Experimental: critical system reminder */
  criticalSystemReminder_EXPERIMENTAL?: string;
}

export type AgentMcpServerSpec = string | Record<string, McpServerConfig>;

// ─── 4d. SDKMessage — complete union ──────────────────────────────────────────

/**
 * All possible message types from the query() async generator.
 * Task-related messages are marked with @task-relevant.
 */
export type SDKMessage =
  | SDKAssistantMessage
  | SDKUserMessage
  | SDKUserMessageReplay
  | SDKResultMessage
  | SDKSystemMessage
  | SDKPartialAssistantMessage
  | SDKCompactBoundaryMessage
  | SDKStatusMessage
  | SDKHookStartedMessage
  | SDKHookProgressMessage
  | SDKHookResponseMessage
  | SDKToolProgressMessage
  | SDKAuthStatusMessage
  | SDKTaskNotificationMessage // @task-relevant
  | SDKTaskStartedMessage // @task-relevant
  | SDKTaskProgressMessage // @task-relevant
  | SDKFilesPersistedEvent
  | SDKToolUseSummaryMessage
  | SDKRateLimitEvent
  | SDKPromptSuggestionMessage;

/**
 * @task-relevant — Task notification from agent teams.
 * Emitted when task state changes in a shared task list.
 */
export interface SDKTaskNotificationMessage {
  type: "task_notification";
  task_id: string;
  subject: string;
  status: TaskStatus;
  teammate_name?: string;
  team_name?: string;
}

/**
 * @task-relevant — Emitted when a background task starts.
 */
export interface SDKTaskStartedMessage {
  type: "task_started";
  task_id: string;
  subject: string;
}

/**
 * @task-relevant — Emitted periodically for running tasks.
 */
export interface SDKTaskProgressMessage {
  type: "task_progress";
  task_id: string;
  progress: string;
}

export interface SDKAssistantMessage {
  type: "assistant";
  uuid: string;
  session_id: string;
  message: unknown; // BetaMessage from @anthropic-ai/sdk
  parent_tool_use_id: string | null;
  error?: string;
}

export interface SDKUserMessage {
  type: "user";
  uuid?: string;
  session_id: string;
  message: unknown; // MessageParam from @anthropic-ai/sdk
  parent_tool_use_id: string | null;
  isSynthetic?: boolean;
  tool_use_result?: unknown;
}

export type SDKUserMessageReplay = SDKUserMessage & {
  uuid: string;
  isReplay: true;
};

export interface SDKResultMessage {
  type: "result";
  subtype:
    | "success"
    | "error_max_turns"
    | "error_during_execution"
    | "error_max_budget_usd"
    | "error_max_structured_output_retries";
  uuid: string;
  session_id: string;
  duration_ms: number;
  duration_api_ms: number;
  is_error: boolean;
  num_turns: number;
  result?: string; // only on success
  stop_reason: string | null;
  total_cost_usd: number;
  usage: Record<string, number>;
  modelUsage: Record<string, unknown>;
  permission_denials: Array<{
    tool_name: string;
    tool_use_id: string;
    tool_input: Record<string, unknown>;
  }>;
  structured_output?: unknown;
  errors?: string[]; // only on error subtypes
}

export interface SDKSystemMessage {
  type: "system";
  subtype: "init";
  uuid: string;
  session_id: string;
  agents?: string[];
  claude_code_version: string;
  cwd: string;
  tools: string[];
  model: string;
  permissionMode: PermissionMode;
  skills: string[];
  plugins: Array<{ name: string; path: string }>;
}

export interface SDKCompactBoundaryMessage {
  type: "system";
  subtype: "compact_boundary";
  uuid: string;
  session_id: string;
  compact_metadata: { trigger: "manual" | "auto"; pre_tokens: number };
}

// Stub types for completeness
export interface SDKPartialAssistantMessage {
  type: "stream_event";
}
export interface SDKStatusMessage {
  type: "status";
}
export interface SDKHookStartedMessage {
  type: "hook_started";
}
export interface SDKHookProgressMessage {
  type: "hook_progress";
}
export interface SDKHookResponseMessage {
  type: "hook_response";
}
export interface SDKToolProgressMessage {
  type: "tool_progress";
}
export interface SDKAuthStatusMessage {
  type: "auth_status";
}
export interface SDKFilesPersistedEvent {
  type: "files_persisted";
}
export interface SDKToolUseSummaryMessage {
  type: "tool_use_summary";
}
export interface SDKRateLimitEvent {
  type: "rate_limit";
}
export interface SDKPromptSuggestionMessage {
  type: "prompt_suggestion";
}

// ─── 4e. Query object — methods ───────────────────────────────────────────────

/**
 * The Query object returned by query() extends AsyncGenerator<SDKMessage>.
 *
 * Task-relevant methods:
 *   stopTask(taskId: string): Promise<void>  — stops a background task by ID
 *
 * Other methods:
 *   interrupt(), rewindFiles(), setPermissionMode(), setModel(),
 *   setMaxThinkingTokens(), initializationResult(), supportedCommands(),
 *   supportedModels(), supportedAgents(), mcpServerStatus(), accountInfo(),
 *   reconnectMcpServer(), toggleMcpServer(), setMcpServers(),
 *   streamInput(), close()
 */

// ─── 4f. Hook Events (task-related) ──────────────────────────────────────────

export type HookEvent =
  | "PreToolUse"
  | "PostToolUse"
  | "PostToolUseFailure"
  | "Notification"
  | "UserPromptSubmit"
  | "SessionStart"
  | "SessionEnd"
  | "Stop"
  | "SubagentStart"
  | "SubagentStop"
  | "PreCompact"
  | "PermissionRequest"
  | "Setup"
  | "TeammateIdle" // @task-relevant — agent teams
  | "TaskCompleted" // @task-relevant — agent teams
  | "ConfigChange"
  | "WorktreeCreate"
  | "WorktreeRemove";

/** Fired when a task is marked completed in agent teams. */
export interface TaskCompletedHookInput {
  hook_event_name: "TaskCompleted";
  session_id: string;
  transcript_path: string;
  cwd: string;
  task_id: string;
  task_subject: string;
  task_description?: string;
  teammate_name?: string;
  team_name?: string;
}

/** Fired when a teammate runs out of tasks. */
export interface TeammateIdleHookInput {
  hook_event_name: "TeammateIdle";
  session_id: string;
  transcript_path: string;
  cwd: string;
  teammate_name: string;
  team_name: string;
}

// ─── 4g. Session management ──────────────────────────────────────────────────

export interface SDKSessionInfo {
  sessionId: string;
  summary: string;
  lastModified: number;
  fileSize: number;
  customTitle?: string;
  firstPrompt?: string;
  gitBranch?: string;
  cwd?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: DEPENDENCY GRAPH (Recursive Trace)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │                     DEPENDENCY GRAPH                                 │
 * │                                                                      │
 * │  UPSTREAM (what things depend ON)                                    │
 * │  ──────────────────────────────────                                  │
 * │                                                                      │
 * │  @anthropic-ai/sdk@0.78.0                                           │
 * │    └─ json-schema-to-ts@^3.1.1  (only prod dep)                    │
 * │    └─ zod@^3.25.0||^4.0.0       (peer, optional)                   │
 * │                                                                      │
 * │  @anthropic-ai/claude-agent-sdk@0.2.72                              │
 * │    └─ zod@^3.24.1||^4.0.0       (peer)                             │
 * │    └─ Node.js >= 18             (runtime)                           │
 * │    └─ @anthropic-ai/claude-code  (ships as embedded binary)         │
 * │       └─ @anthropic-ai/sdk      (internal, for API calls)          │
 * │                                                                      │
 * │  @anthropic-ai/claude-code@2.1.72                                   │
 * │    └─ @anthropic-ai/sdk         (internal, for API calls)          │
 * │    └─ Node.js >= 18             (runtime)                           │
 * │                                                                      │
 * │  DOWNSTREAM (what depends on THESE)                                  │
 * │  ──────────────────────────────────                                  │
 * │                                                                      │
 * │  @jadecli/knowledge-teams-plugins@0.1.0 (THIS REPO)                │
 * │    └─ @anthropic-ai/claude-agent-sdk@latest                         │
 * │    └─ zod@^4.0.0                                                    │
 * │                                                                      │
 * │  Other known consumers:                                              │
 * │    - @anthropic-ai/bedrock-sdk   (wraps @anthropic-ai/sdk)          │
 * │    - @anthropic-ai/vertex-sdk    (wraps @anthropic-ai/sdk)          │
 * │    - @anthropic-ai/foundry-sdk   (wraps @anthropic-ai/sdk)          │
 * │                                                                      │
 * │  CROSS-LAYER DEPENDENCY:                                             │
 * │                                                                      │
 * │  Claude Code CLI (2.1.72)                                           │
 * │    │                                                                 │
 * │    ├─ TodoWrite tool ──→ TodoItem[] (in-context, ephemeral)         │
 * │    │                                                                 │
 * │    ├─ TaskCreate/TaskUpdate/TaskList/TaskGet tools                   │
 * │    │   └─ ~/.claude/tasks/<ID>/tasks.json (persistent, JSONL)       │
 * │    │   └─ File locking for cross-session access                     │
 * │    │                                                                 │
 * │    └─ Agent Teams (experimental)                                     │
 * │        ├─ Shared task list                                           │
 * │        ├─ Mailbox messaging                                          │
 * │        ├─ TeammateIdle hook                                          │
 * │        └─ TaskCompleted hook                                         │
 * │                                                                      │
 * │  Agent SDK (0.2.72) → spawns Claude Code process                    │
 * │    │                                                                 │
 * │    ├─ query() → async generator of SDKMessage                       │
 * │    │   ├─ SDKTaskNotificationMessage                                │
 * │    │   ├─ SDKTaskStartedMessage                                     │
 * │    │   └─ SDKTaskProgressMessage                                    │
 * │    │                                                                 │
 * │    ├─ stopTask(taskId) → stops background task                      │
 * │    │                                                                 │
 * │    └─ hooks: TeammateIdle, TaskCompleted                            │
 * │                                                                      │
 * │  Anthropic SDK (0.78.0) ── NO tasks API ──                          │
 * │    └─ Message Batches API is the only async primitive                │
 * │    └─ Tool-use loop is the agentic execution pattern                │
 * │                                                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: THIS REPO'S TASK-RELATED STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The knowledge-teams-plugins repo has its own task-related WebMCP tools.
 * These are stubs that would integrate with a jadecli.app task API.
 *
 * WebMCP Internal Tools (task-related):
 *   - claim-task       → Claims unassigned task for an agent
 *   - get-my-tasks     → Retrieves tasks assigned to an agent
 *   - submit-artifact  → Submits completed work product for a task
 *   - request-checkpoint → Requests progress checkpoint / budget extension
 *   - get-team-status  → Gets S-team agent session status
 *
 * @telemetry-note ALL handlers are stubs returning hardcoded data.
 *                 No actual API integration exists yet.
 */

// Re-documenting the local task schemas for cross-reference:

/** claim-task input (from webmcp/internal/tools/claim-task.ts) */
export interface ClaimTaskInput {
  taskId: string;
  agentId: string;
  role: string; // S-team role
}

/** claim-task output */
export interface ClaimTaskOutput {
  taskId: string;
  claimedBy: string;
  role: string;
  claimedAt: string; // ISO 8601
  success: boolean;
}

/** get-my-tasks input (from webmcp/internal/tools/get-my-tasks.ts) */
export interface GetMyTasksInput {
  agentId: string;
  status: "active" | "paused" | "completed" | "all";
}

/** get-my-tasks output */
export interface GetMyTasksOutput {
  agentId: string;
  tasks: unknown[]; // Stub: always empty
  filter: string;
}

/** submit-artifact input (from webmcp/internal/tools/submit-artifact.ts) */
export interface SubmitArtifactInput {
  taskId: string;
  artifactType: string; // "report" | "code" | "analysis" | etc.
  content: string;
  metadata?: {
    model: string;
    tokenCount: number;
    toolCallsUsed: number;
  };
}

/** submit-artifact output */
export interface SubmitArtifactOutput {
  taskId: string;
  artifactId: string; // "art_<timestamp>"
  type: string;
  submittedAt: string;
  accepted: boolean;
}

/** request-checkpoint input (from webmcp/internal/tools/request-checkpoint.ts) */
export interface RequestCheckpointInput {
  taskId: string;
  budgetUsed: number;
  summary: string;
  requestBudgetExtension?: number;
}

/** request-checkpoint output */
export interface RequestCheckpointOutput {
  taskId: string;
  checkpointId: string; // "cp_<timestamp>"
  budgetUsed: number;
  budgetExtended: number;
  approved: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: TELEMETRY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Telemetry touch-points across the stack:
 *
 * 1. @anthropic-ai/sdk — Usage tracking via response headers:
 *    - x-ratelimit-limit-requests, x-ratelimit-remaining-requests
 *    - x-ratelimit-limit-tokens, x-ratelimit-remaining-tokens
 *    - Message.usage: { input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens }
 *
 * 2. @anthropic-ai/claude-agent-sdk — SDKResultMessage:
 *    - duration_ms, duration_api_ms, num_turns, total_cost_usd
 *    - usage: { input_tokens, output_tokens }
 *    - modelUsage: per-model breakdown
 *    - permission_denials: array of denied tool calls
 *    - SDKRateLimitEvent: emitted on rate limit hits
 *
 * 3. Claude Code CLI — Tasks:
 *    - TaskCompletedHookInput: fires on task completion
 *    - TeammateIdleHookInput: fires when agent has no tasks
 *    - Budget tracking: request-checkpoint tool for budget management
 *
 * 4. This repo (webmcp/shared/telemetry.ts):
 *    - TelemetryEvent: { toolName, timestamp, durationMs, success, error? }
 *    - recordInvocation() / getEvents() / clearTelemetry()
 *    - In-memory only; no persistence or export
 *
 * @telemetry-note The local telemetry system (Section 4) does NOT integrate
 *                 with any of the upstream telemetry systems (Sections 1-3).
 *                 It records tool invocations but nothing consumes the data.
 *                 Recommendation: Bridge to SDKResultMessage.modelUsage or
 *                 export via an MCP tool for external consumption.
 */

/** Re-export the local telemetry type for cross-reference. */
export interface LocalTelemetryEvent {
  toolName: string;
  timestamp: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: ENVIRONMENT VARIABLES & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Task-related environment variables in Claude Code:
 *
 * | Variable                              | Purpose                                         |
 * |---------------------------------------|-------------------------------------------------|
 * | CLAUDE_CODE_ENABLE_TASKS              | false → revert to TodoWrite                     |
 * | CLAUDE_CODE_TASK_LIST_ID              | Share task list across sessions                  |
 * | CLAUDE_CODE_DISABLE_CRON              | Disable scheduled/loop tasks                     |
 * | CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS  | Enable agent teams feature                       |
 * | CLAUDE_AGENT_SDK_CLIENT_APP           | Identify your app in User-Agent header           |
 *
 * CLI flags:
 *   --teammate-mode in-process|tmux   Control agent team display mode
 *
 * Slash commands:
 *   /loop <interval> <prompt>         Schedule recurring task execution
 *
 * Storage paths:
 *   ~/.claude/tasks/<TASK_LIST_ID>/tasks.json    Task persistence
 *   ~/.claude/teams/{team-name}/config.json      Team configuration
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type PermissionMode =
  | "default"
  | "acceptEdits"
  | "bypassPermissions"
  | "plan"
  | "dontAsk";

export type SettingSource = "user" | "project" | "local";

export type ThinkingConfig =
  | { type: "adaptive" }
  | { type: "enabled"; budgetTokens?: number }
  | { type: "disabled" };

export type McpServerConfig =
  | { type?: "stdio"; command: string; args?: string[]; env?: Record<string, string> }
  | { type: "sse"; url: string; headers?: Record<string, string> }
  | { type: "http"; url: string; headers?: Record<string, string> }
  | { type: "sdk"; name: string; instance: unknown };

export type SandboxSettings = unknown; // Opaque — configure sandbox behavior

export interface HookCallbackMatcher {
  matcher?: string;
  hooks: Array<(input: unknown, toolUseID: string | undefined, options: { signal: AbortSignal }) => Promise<unknown>>;
  timeout?: number;
}

type CanUseToolFn = (
  toolName: string,
  input: Record<string, unknown>,
  options: {
    signal: AbortSignal;
    suggestions?: unknown[];
    blockedPath?: string;
    decisionReason?: string;
    toolUseID: string;
    agentID?: string;
  },
) => Promise<{ behavior: "allow" | "deny"; [key: string]: unknown }>;
