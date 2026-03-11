# Claude SDK Canonical Reference

> Comprehensive documentation of data structures, APIs, and dependencies for Claude Code,
> Claude Agent SDK, Anthropic SDK, MCP, Agent Teams, and telemetry.
>
> Generated: 2026-03-11 | Upstream ref: jadecli/knowledge-work-plugins @ `477c893b`

---

## Table of Contents

1. [Package Versions & Dependency Graph](#1-package-versions--dependency-graph)
2. [Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)](#2-claude-agent-sdk)
3. [Canonical Data Structures](#3-canonical-data-structures)
   - [Agents](#31-agents)
   - [Tools](#32-tools)
   - [Skills & Slash Commands](#33-skills--slash-commands)
   - [MCP (Model Context Protocol)](#34-mcp-model-context-protocol)
   - [Hooks](#35-hooks)
   - [Permissions](#36-permissions)
4. [Agent Teams (Experimental)](#4-agent-teams-experimental)
5. [Turn Management & Session Control](#5-turn-management--session-control)
6. [Model Routing](#6-model-routing)
7. [Organization & Team Features](#7-organization--team-features)
8. [Telemetry & Observability](#8-telemetry--observability)
9. [Upstream / Downstream Dependency Trace](#9-upstream--downstream-dependency-trace)
10. [Anthropic API (`@anthropic-ai/sdk`)](#10-anthropic-api)

---

## 1. Package Versions & Dependency Graph

| Package | Version | Published | Notes |
|---|---|---|---|
| `@anthropic-ai/claude-agent-sdk` | **0.2.71** (latest 0.2.72) | 2026-03-08 | Bundles Claude Code 2.1.71 |
| `@anthropic-ai/sdk` | **0.78.0** | 2026-02-20 | Core Anthropic API client |
| `@modelcontextprotocol/sdk` | **1.27.1** | 2026-02-26 | MCP TypeScript SDK |
| `zod` | **^4.0.0** | peer dep | Schema validation (v4 mini) |
| Claude Code CLI | **2.1.71** | 2026-03-08 | Latest stable release |

> **Note**: There is no Claude Code 2.7.2 — the current version numbering is 2.1.x.
> The `claudeCodeVersion` field in the agent SDK package.json confirms `"2.1.71"`.

### Recursive Dependency Tree

```
@jadecli/knowledge-teams-plugins@0.1.0
├── @anthropic-ai/claude-agent-sdk@0.2.71
│   ├── peer: zod@^4.0.0
│   ├── optional: @img/sharp-*@^0.34.2 (platform-specific image processing)
│   ├── bundled (types only):
│   │   ├── @anthropic-ai/sdk (BetaMessage, BetaUsage, MessageParam, etc.)
│   │   ├── @modelcontextprotocol/sdk (CallToolResult, McpServer, ToolAnnotations, etc.)
│   │   └── crypto (UUID)
│   └── runtime: node >= 18.0.0
├── zod@^4.0.0
│   └── zod/v4 (mini runtime)
├── devDependencies:
│   ├── @types/node@^25.4.0
│   ├── tsx@^4.19.0
│   ├── typescript@^5.5.0
│   └── vitest@^2.1.0
└── upstream: jadecli/knowledge-work-plugins @ 477c893b
```

---

## 2. Claude Agent SDK

**Package**: `@anthropic-ai/claude-agent-sdk`
**Repository**: https://github.com/anthropics/claude-agent-sdk-typescript
**Entry point**: `sdk.mjs` (types: `sdk.d.ts`)
**Embed export**: `./embed` → path to Claude Code CLI binary

### Core Exports

```typescript
// Main query function — single-turn or streaming
export function query(params: { prompt: string | AsyncIterable<SDKUserMessage>; options?: Options }): Query;

// V2 API (UNSTABLE / @alpha) — multi-turn session
export interface SDKSession { ... }

// Session management
export function listSessions(options?: ListSessionsOptions): Promise<SDKSessionInfo[]>;
export function getSessionMessages(sessionId: string, options?: GetSessionMessagesOptions): Promise<SessionMessage[]>;

// MCP server creation (in-process)
export function createSdkMcpServer(options: CreateSdkMcpServerOptions): McpSdkServerConfigWithInstance;
```

---

## 3. Canonical Data Structures

### 3.1 Agents

#### AgentDefinition

Defines a custom subagent that can be invoked via the Agent tool.

```typescript
type AgentDefinition = {
  /** Natural language description of when to use this agent */
  description: string;
  /** Array of allowed tool names. If omitted, inherits all tools from parent */
  tools?: string[];
  /** Array of tool names to explicitly disallow for this agent */
  disallowedTools?: string[];
  /** The agent's system prompt */
  prompt: string;
  /** Model to use. If omitted or 'inherit', uses the main model */
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
  /** MCP servers available to this agent */
  mcpServers?: AgentMcpServerSpec[];
  /** Experimental: Critical reminder added to system prompt */
  criticalSystemReminder_EXPERIMENTAL?: string;
  /** Array of skill names to preload into the agent context */
  skills?: string[];
  /** Maximum number of agentic turns (API round-trips) before stopping */
  maxTurns?: number;
};
```

#### AgentInfo

Information about an available subagent returned by `supportedAgents()`.

```typescript
type AgentInfo = {
  name: string;        // e.g., "Explore", "general-purpose"
  description: string; // When to use this agent
  model?: string;      // Model alias (inherits parent if omitted)
};
```

#### AgentInput (Tool Schema)

Input schema for the Agent tool invocation:

```typescript
interface AgentInput {
  description: string;       // 3-5 word task description
  prompt: string;            // Full task prompt
  subagent_type?: string;    // Specialized agent type
  resume?: string;           // Agent ID to resume from
  run_in_background?: boolean;
  name?: string;             // Spawned agent name
  team_name?: string;        // Team name for spawning (agent teams)
  mode?: 'acceptEdits' | 'bypassPermissions' | 'default' | 'dontAsk' | 'plan';
  isolation?: 'worktree';   // Git worktree isolation
}
```

#### AgentOutput

```typescript
type AgentOutput =
  | {  // Completed synchronously
      agentId: string;
      content: { type: 'text'; text: string }[];
      totalToolUseCount: number;
      totalDurationMs: number;
      totalTokens: number;
      usage: {
        input_tokens: number;
        output_tokens: number;
        cache_creation_input_tokens: number | null;
        cache_read_input_tokens: number | null;
        server_tool_use: { web_search_requests: number; web_fetch_requests: number } | null;
        service_tier: ('standard' | 'priority' | 'batch') | null;
        cache_creation: { ephemeral_1h_input_tokens: number; ephemeral_5m_input_tokens: number } | null;
      };
      status: 'completed';
      prompt: string;
    }
  | {  // Launched asynchronously
      status: 'async_launched';
      agentId: string;
      description: string;
      prompt: string;
      outputFile: string;
      canReadOutputFile?: boolean;
    };
```

### 3.2 Tools

#### Built-in Tool Input/Output Schemas

All tool schemas are exported from `sdk-tools.d.ts`:

```typescript
// Union of all tool input schemas
type ToolInputSchemas =
  | AgentInput | BashInput | TaskOutputInput | ExitPlanModeInput
  | FileEditInput | FileReadInput | FileWriteInput | GlobInput
  | GrepInput | TaskStopInput | ListMcpResourcesInput | McpInput
  | NotebookEditInput | ReadMcpResourceInput | SubscribeMcpResourceInput
  | UnsubscribeMcpResourceInput | SubscribePollingInput | UnsubscribePollingInput
  | TodoWriteInput | WebFetchInput | WebSearchInput | AskUserQuestionInput
  | ConfigInput | EnterWorktreeInput;

// Union of all tool output schemas
type ToolOutputSchemas =
  | AgentOutput | BashOutput | ExitPlanModeOutput | FileEditOutput
  | FileReadOutput | FileWriteOutput | GlobOutput | GrepOutput
  | TaskStopOutput | ListMcpResourcesOutput | McpOutput | NotebookEditOutput
  | ReadMcpResourceOutput | SubscribeMcpResourceOutput | UnsubscribeMcpResourceOutput
  | SubscribePollingOutput | UnsubscribePollingOutput | TodoWriteOutput
  | WebFetchOutput | WebSearchOutput | AskUserQuestionOutput | ConfigOutput
  | EnterWorktreeOutput;
```

#### Key Tool Input Schemas

| Tool | Key Fields | Description |
|---|---|---|
| `BashInput` | `command`, `timeout?`, `description?`, `run_in_background?`, `dangerouslyDisableSandbox?` | Execute shell commands |
| `FileReadInput` | `file_path`, `offset?`, `limit?`, `pages?` | Read files (text, image, PDF, notebook) |
| `FileEditInput` | `file_path`, `old_string`, `new_string`, `replace_all?` | String replacement in files |
| `FileWriteInput` | `file_path`, `content` | Create/overwrite files |
| `GlobInput` | `pattern`, `path?` | File pattern matching |
| `GrepInput` | `pattern`, `path?`, `glob?`, `output_mode?`, `type?`, `multiline?` | Content search (ripgrep) |
| `WebFetchInput` | `url`, `prompt` | Fetch and analyze web content |
| `WebSearchInput` | `query`, `allowed_domains?`, `blocked_domains?` | Web search |
| `TodoWriteInput` | `todos[]` with `content`, `status`, `activeForm` | Task list management |
| `NotebookEditInput` | `notebook_path`, `new_source`, `cell_id?`, `cell_type?`, `edit_mode?` | Jupyter notebook editing |
| `McpInput` | `[key: string]: unknown` | MCP tool execution (dynamic schema) |

#### SdkMcpToolDefinition — Custom Tool Creation

```typescript
type SdkMcpToolDefinition<Schema extends AnyZodRawShape> = {
  name: string;
  description: string;
  inputSchema: Schema;                    // Zod 3 or Zod 4 raw shape
  annotations?: ToolAnnotations;          // MCP tool annotations
  handler: (args: InferShape<Schema>, extra: unknown) => Promise<CallToolResult>;
};
```

#### CreateSdkMcpServerOptions

```typescript
type CreateSdkMcpServerOptions = {
  name: string;
  version?: string;
  tools?: Array<SdkMcpToolDefinition<any>>;
};
```

### 3.3 Skills & Slash Commands

```typescript
type SlashCommand = {
  // Exact shape is internal but returned by supportedCommands()
  // Examples: /commit, /review-pr, /simplify, /batch, /plan, /help
};
```

Skills are preloaded into agent context via `AgentDefinition.skills: string[]`.
The SDK init message (`SDKSystemMessage`) includes:
- `skills: string[]` — loaded skill names
- `slash_commands: string[]` — available slash commands
- `plugins: { name: string; path: string }[]` — loaded plugins

#### Plugin Configuration

```typescript
type SdkPluginConfig = {
  type: 'local';   // Currently only 'local' is supported
  path: string;    // Absolute or relative path to the plugin directory
};
```

### 3.4 MCP (Model Context Protocol)

#### MCP Server Configuration Types

```typescript
// stdio transport (most common)
type McpStdioServerConfig = {
  type?: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
};

// SSE transport (legacy)
type McpSSEServerConfig = {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
};

// HTTP Streamable transport
type McpHttpServerConfig = {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
};

// In-process SDK server
type McpSdkServerConfig = {
  type: 'sdk';
  name: string;
};

// SDK server with live instance (non-serializable)
type McpSdkServerConfigWithInstance = McpSdkServerConfig & {
  instance: McpServer;  // from @modelcontextprotocol/sdk
};

// Claude.ai proxy server
type McpClaudeAIProxyServerConfig = {
  type: 'claudeai-proxy';
  url: string;
  id: string;
};

// Serializable union (process transports)
type McpServerConfigForProcessTransport =
  | McpStdioServerConfig | McpSSEServerConfig | McpHttpServerConfig | McpSdkServerConfig;

// Full union including non-serializable
type McpServerConfig =
  | McpStdioServerConfig | McpSSEServerConfig | McpHttpServerConfig | McpSdkServerConfigWithInstance;
```

#### MCP Server Status

```typescript
type McpServerStatus = {
  name: string;
  status: 'connected' | 'failed' | 'needs-auth' | 'pending' | 'disabled';
  serverInfo?: { name: string; version: string };
  error?: string;
  config?: McpServerStatusConfig;
  scope?: string;  // 'project' | 'user' | 'local' | 'claudeai' | 'managed'
  tools?: {
    name: string;
    description?: string;
    annotations?: { readOnly?: boolean; destructive?: boolean; openWorld?: boolean };
  }[];
};
```

#### MCP Set Servers Result

```typescript
type McpSetServersResult = {
  added: string[];
  removed: string[];
  errors: Record<string, string>;
};
```

#### WebMCP Tool Convention (this repo)

All WebMCP tools in this repository export:

```typescript
export const tool = {
  name: string;
  description: string;
  inputSchema: ZodSchema;
  handler: (args: InferredInput) => Promise<CallToolResult>;
};
```

### 3.5 Hooks

#### Hook Events (21 total)

```typescript
const HOOK_EVENTS = [
  'PreToolUse', 'PostToolUse', 'PostToolUseFailure',
  'Notification', 'UserPromptSubmit',
  'SessionStart', 'SessionEnd', 'Stop',
  'SubagentStart', 'SubagentStop',
  'PreCompact', 'PermissionRequest',
  'Setup', 'TeammateIdle', 'TaskCompleted',
  'Elicitation', 'ElicitationResult',
  'ConfigChange', 'WorktreeCreate', 'WorktreeRemove',
  'InstructionsLoaded'
] as const;

type HookEvent = typeof HOOK_EVENTS[number];
```

#### Hook Input Base

```typescript
type BaseHookInput = {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  agent_id?: string;     // Present when firing from a subagent
  agent_type?: string;   // Agent type name
};
```

#### Key Hook Inputs

| Event | Extra Fields | Purpose |
|---|---|---|
| `PreToolUse` | `tool_name`, `tool_input`, `tool_use_id` | Intercept before tool execution |
| `PostToolUse` | `tool_name`, `tool_input`, `tool_response`, `tool_use_id` | React after tool execution |
| `SessionStart` | `source` ('startup'/'resume'/'clear'/'compact'), `agent_type?`, `model?` | Session lifecycle |
| `TeammateIdle` | _(base only)_ | Agent teams: teammate about to idle |
| `TaskCompleted` | _(base only)_ | Agent teams: task being marked complete |
| `ConfigChange` | `source`, `file_path?` | Settings changed |
| `InstructionsLoaded` | `file_path`, `memory_type`, `load_reason`, `globs?` | CLAUDE.md loaded |

#### Hook Configuration in Settings

```typescript
// Four hook types in settings.json:
type CommandHook = { type: 'command'; command: string; timeout?: number; statusMessage?: string; once?: boolean; async?: boolean; asyncRewake?: boolean };
type PromptHook = { type: 'prompt'; prompt: string; timeout?: number; model?: string; statusMessage?: string; once?: boolean };
type AgentHook = { type: 'agent'; prompt: string; timeout?: number; model?: string; statusMessage?: string; once?: boolean };
type HttpHook = { type: 'http'; url: string; headers?: Record<string, string>; timeout?: number; statusMessage?: string; allowedEnvVars?: string[] };
```

#### SDK Hook Callback

```typescript
type HookCallback = (
  input: HookInput,
  toolUseID: string | undefined,
  options: { signal: AbortSignal }
) => Promise<HookJSONOutput>;

interface HookCallbackMatcher {
  matcher?: string;
  hooks: HookCallback[];
  timeout?: number;
}
```

### 3.6 Permissions

```typescript
type PermissionMode = 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'dontAsk';

type PermissionBehavior = 'allow' | 'deny' | 'ask';

type PermissionResult =
  | { behavior: 'allow'; updatedInput?: Record<string, unknown>; updatedPermissions?: PermissionUpdate[]; toolUseID?: string }
  | { behavior: 'deny'; message: string; interrupt?: boolean; toolUseID?: string };

type PermissionUpdate =
  | { type: 'addRules'; rules: PermissionRuleValue[]; behavior: PermissionBehavior; destination: PermissionUpdateDestination }
  | { type: 'replaceRules'; ... }
  | { type: 'removeRules'; ... }
  | { type: 'setMode'; mode: PermissionMode; destination: PermissionUpdateDestination }
  | { type: 'addDirectories'; directories: string[]; destination: PermissionUpdateDestination }
  | { type: 'removeDirectories'; ... };

type PermissionUpdateDestination = 'userSettings' | 'projectSettings' | 'localSettings' | 'session' | 'cliArg';
```

---

## 4. Agent Teams (Experimental)

> **Status**: Research preview. Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

### Architecture

| Component | Role |
|---|---|
| **Team Lead** | Main Claude Code session; creates team, spawns teammates, coordinates work |
| **Teammates** | Separate Claude Code instances; each has its own context window |
| **Task List** | Shared list of work items; tasks have states: pending → in_progress → completed |
| **Mailbox** | Messaging system for direct inter-agent communication |

### Storage

- Team config: `~/.claude/teams/{team-name}/config.json`
- Task list: `~/.claude/tasks/{team-name}/`
- Config contains `members` array: `{ name, agentId, agentType }`

### AgentInput Team Fields

```typescript
// Fields on AgentInput specific to teams:
team_name?: string;  // Team name for spawning
mode?: 'acceptEdits' | 'bypassPermissions' | 'default' | 'dontAsk' | 'plan';
isolation?: 'worktree';  // Git worktree isolation
```

### Team Hooks

| Hook | Trigger | Use |
|---|---|---|
| `TeammateIdle` | Teammate about to go idle | Exit code 2 → sends feedback, keeps working |
| `TaskCompleted` | Task being marked complete | Exit code 2 → prevents completion, sends feedback |
| `SubagentStart` | Subagent/teammate spawned | Inspect/modify subagent configuration |
| `SubagentStop` | Subagent/teammate stopped | Cleanup, logging |

### Display Modes

| Mode | Setting | Behavior |
|---|---|---|
| `auto` (default) | `teammateMode: "auto"` | Split panes if in tmux, else in-process |
| `in-process` | `teammateMode: "in-process"` | All in main terminal; Shift+Down to cycle |
| `tmux` | `teammateMode: "tmux"` | Each teammate gets own pane |

### Task Coordination

- Tasks have three states: **pending**, **in_progress**, **completed**
- Tasks can have dependencies (blocked until dependencies complete)
- Task claiming uses **file locking** to prevent race conditions
- Teammates self-claim next unassigned, unblocked task after finishing

### Communication

- **message**: send to one specific teammate
- **broadcast**: send to all teammates (costs scale with team size)
- Automatic message delivery (no polling)
- Idle notifications are automatic

### Limitations

- No session resumption with in-process teammates
- One team per session
- No nested teams (teammates cannot spawn teams)
- Lead is fixed (cannot transfer leadership)
- Permissions set at spawn (inherits lead's mode)
- Split panes require tmux or iTerm2

---

## 5. Turn Management & Session Control

### Query Interface

```typescript
interface Query extends AsyncGenerator<SDKMessage, void> {
  // Control methods
  interrupt(): Promise<void>;
  setPermissionMode(mode: PermissionMode): Promise<void>;
  setModel(model?: string): Promise<void>;
  setMaxThinkingTokens(maxThinkingTokens: number | null): Promise<void>;

  // Introspection
  initializationResult(): Promise<SDKControlInitializeResponse>;
  supportedCommands(): Promise<SlashCommand[]>;
  supportedModels(): Promise<ModelInfo[]>;
  supportedAgents(): Promise<AgentInfo[]>;
  mcpServerStatus(): Promise<McpServerStatus[]>;
  accountInfo(): Promise<AccountInfo>;

  // File management
  rewindFiles(userMessageId: string, options?: { dryRun?: boolean }): Promise<RewindFilesResult>;

  // MCP management
  reconnectMcpServer(serverName: string): Promise<void>;
  toggleMcpServer(serverName: string, enabled: boolean): Promise<void>;
  setMcpServers(servers: Record<string, McpServerConfig>): Promise<McpSetServersResult>;

  // Streaming / multi-turn
  streamInput(stream: AsyncIterable<SDKUserMessage>): Promise<void>;
  stopTask(taskId: string): Promise<void>;
  close(): void;
}
```

### Options (Turn Configuration)

```typescript
type Options = {
  // Identity & context
  cwd?: string;
  additionalDirectories?: string[];
  agent?: string;                    // Agent name for main thread
  agents?: Record<string, AgentDefinition>;
  systemPrompt?: string | { type: 'preset'; preset: 'claude_code'; append?: string };

  // Tool control
  tools?: string[] | { type: 'preset'; preset: 'claude_code' };
  allowedTools?: string[];
  disallowedTools?: string[];
  toolConfig?: ToolConfig;
  canUseTool?: CanUseTool;

  // Model & thinking
  model?: string;
  fallbackModel?: string;
  thinking?: ThinkingConfig;
  effort?: 'low' | 'medium' | 'high' | 'max';
  maxThinkingTokens?: number;  // deprecated → use thinking

  // Limits
  maxTurns?: number;
  maxBudgetUsd?: number;

  // MCP
  mcpServers?: Record<string, McpServerConfig>;
  strictMcpConfig?: boolean;

  // Session
  continue?: boolean;
  resume?: string;
  resumeSessionAt?: string;
  sessionId?: string;
  forkSession?: boolean;
  persistSession?: boolean;

  // Permissions
  permissionMode?: PermissionMode;
  allowDangerouslySkipPermissions?: boolean;
  permissionPromptToolName?: string;

  // Plugins & extensions
  plugins?: SdkPluginConfig[];
  betas?: SdkBeta[];    // 'context-1m-2025-08-07'
  hooks?: Partial<Record<HookEvent, HookCallbackMatcher[]>>;

  // Output
  outputFormat?: OutputFormat;    // { type: 'json_schema'; schema: ... }
  includePartialMessages?: boolean;
  promptSuggestions?: boolean;

  // Process control
  abortController?: AbortController;
  env?: Record<string, string | undefined>;
  executable?: 'bun' | 'deno' | 'node';
  executableArgs?: string[];
  extraArgs?: Record<string, string | null>;
  debug?: boolean;
  debugFile?: string;
  stderr?: (data: string) => void;

  // Sandbox
  sandbox?: SandboxSettings;

  // Settings
  settings?: string | Settings;
  settingSources?: SettingSource[];    // 'user' | 'project' | 'local'

  // File checkpointing
  enableFileCheckpointing?: boolean;

  // Elicitation
  onElicitation?: OnElicitation;

  // Remote execution
  spawnClaudeCodeProcess?: (options: SpawnOptions) => SpawnedProcess;
  pathToClaudeCodeExecutable?: string;
};
```

### ThinkingConfig

```typescript
type ThinkingConfig =
  | { type: 'adaptive' }                              // Claude decides (Opus 4.6+ default)
  | { type: 'enabled'; budgetTokens: number }          // Fixed budget (older models)
  | { type: 'disabled' };                              // No extended thinking
```

### SDKMessage Union (all message types in a stream)

```typescript
type SDKMessage =
  | SDKAssistantMessage       // Model response
  | SDKUserMessage            // User input
  | SDKUserMessageReplay      // Replayed user message (resume)
  | SDKResultMessage          // Turn result (success or error)
  | SDKSystemMessage          // Init message
  | SDKPartialAssistantMessage // Streaming chunks
  | SDKCompactBoundaryMessage // Context compaction boundary
  | SDKStatusMessage          // Status changes
  | SDKLocalCommandOutputMessage // Slash command output
  | SDKHookStartedMessage     // Hook lifecycle
  | SDKHookProgressMessage
  | SDKHookResponseMessage
  | SDKToolProgressMessage    // Tool execution progress
  | SDKAuthStatusMessage      // Authentication status
  | SDKTaskNotificationMessage // Background task completed/failed/stopped
  | SDKTaskStartedMessage     // Background task started
  | SDKTaskProgressMessage    // Background task progress
  | SDKFilesPersistedEvent    // Files persisted
  | SDKToolUseSummaryMessage  // Tool use summary
  | SDKRateLimitEvent         // Rate limit info
  | SDKElicitationCompleteMessage // MCP elicitation completed
  | SDKPromptSuggestionMessage;  // Predicted next prompt
```

### Result Messages

```typescript
type SDKResultSuccess = {
  type: 'result';
  subtype: 'success';
  duration_ms: number;
  duration_api_ms: number;
  is_error: boolean;
  num_turns: number;
  result: string;
  stop_reason: string | null;
  total_cost_usd: number;
  usage: NonNullableUsage;
  modelUsage: Record<string, ModelUsage>;
  permission_denials: SDKPermissionDenial[];
  structured_output?: unknown;
  fast_mode_state?: FastModeState;
};

type SDKResultError = {
  type: 'result';
  subtype: 'error_during_execution' | 'error_max_turns' | 'error_max_budget_usd' | 'error_max_structured_output_retries';
  // ... same fields minus result/structured_output, plus errors: string[]
};
```

### V2 Session API (UNSTABLE @alpha)

```typescript
interface SDKSession {
  readonly sessionId: string;
  send(message: string | SDKUserMessage): Promise<void>;
  stream(): AsyncGenerator<SDKMessage, void>;
  close(): void;
  [Symbol.asyncDispose](): Promise<void>;
}
```

---

## 6. Model Routing

### ModelInfo

```typescript
type ModelInfo = {
  value: string;                    // Model ID for API calls
  displayName: string;              // Human-readable name
  description: string;              // Capabilities description
  supportsEffort?: boolean;
  supportedEffortLevels?: ('low' | 'medium' | 'high' | 'max')[];
  supportsAdaptiveThinking?: boolean;
  supportsFastMode?: boolean;
};
```

### Available Models (March 2026)

| Model ID | Family | Notes |
|---|---|---|
| `claude-opus-4-6` | Opus 4.6 | Most capable; supports adaptive thinking, fast mode, max effort |
| `claude-sonnet-4-6` | Sonnet 4.6 | Fast, balanced |
| `claude-haiku-4-5-20251001` | Haiku 4.5 | Fastest, lowest cost |

### Model Routing in AgentDefinition

```typescript
model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
```

### Per-Session Model Control

```typescript
// At query time
options.model = 'claude-sonnet-4-6';
options.fallbackModel = 'claude-haiku-4-5-20251001';

// Dynamic mid-session
await query.setModel('claude-opus-4-6');
```

### Effort Levels

```typescript
effort?: 'low' | 'medium' | 'high' | 'max';
// 'max' is Opus 4.6 only
```

### Fast Mode

```typescript
type FastModeState = 'off' | 'cooldown' | 'on';
// Toggle via /fast command. Uses same model with faster output.
```

### Settings-level Model Control

```typescript
// In settings.json:
{
  "model": "claude-opus-4-6",
  "availableModels": ["opus", "sonnet", "haiku"]  // Allowlist for users
}
```

---

## 7. Organization & Team Features

### AccountInfo

```typescript
type AccountInfo = {
  email?: string;
  organization?: string;           // Org name for Claude teams
  subscriptionType?: string;       // Subscription tier
  tokenSource?: string;            // Where the token came from
  apiKeySource?: string;           // Where the API key came from
};

type ApiKeySource = 'user' | 'project' | 'org' | 'temporary' | 'oauth';
```

### Organization-Level Settings

Settings can be scoped to organization level via managed settings:

```typescript
type SettingSource = 'local' | 'user' | 'project';
// Plus: 'managed' and 'policy' scopes for org-level enforcement
```

### MCP Server Governance

```typescript
// Enterprise allowlist
allowedMcpServers?: { serverName?: string; serverCommand?: string[]; serverUrl?: string }[];
// Enterprise denylist (takes precedence)
deniedMcpServers?: { serverName?: string; serverCommand?: string[]; serverUrl?: string }[];
```

### Rate Limiting

```typescript
type SDKRateLimitInfo = {
  status: 'allowed' | 'allowed_warning' | 'rejected';
  resetsAt?: number;
  rateLimitType?: 'five_hour' | 'seven_day' | 'seven_day_opus' | 'seven_day_sonnet' | 'overage';
  utilization?: number;
  overageStatus?: 'allowed' | 'allowed_warning' | 'rejected';
  overageResetsAt?: number;
  overageDisabledReason?: string;
  isUsingOverage?: boolean;
  surpassedThreshold?: number;
};
```

---

## 8. Telemetry & Observability

### SDK-Level Usage Tracking

Every query result includes detailed usage metrics:

```typescript
type ModelUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  webSearchRequests: number;
  costUSD: number;
  contextWindow: number;
  maxOutputTokens: number;
};

// Result message includes:
type SDKResultSuccess = {
  duration_ms: number;          // Total wall-clock time
  duration_api_ms: number;      // API call time only
  num_turns: number;            // Number of conversation turns
  total_cost_usd: number;       // Total cost
  usage: NonNullableUsage;      // Aggregate token usage
  modelUsage: Record<string, ModelUsage>;  // Per-model breakdown
};
```

### Task Progress Telemetry

```typescript
type SDKTaskNotificationMessage = {
  type: 'system';
  subtype: 'task_notification';
  task_id: string;
  status: 'completed' | 'failed' | 'stopped';
  output_file: string;
  summary: string;
  usage?: {
    total_tokens: number;
    tool_uses: number;
    duration_ms: number;
  };
};

type SDKTaskProgressMessage = {
  type: 'system';
  subtype: 'task_progress';
  task_id: string;
  description: string;
  usage: { total_tokens: number; tool_uses: number; duration_ms: number };
  last_tool_name?: string;
};
```

### Tool Progress Tracking

```typescript
type SDKToolProgressMessage = {
  type: 'tool_progress';
  tool_use_id: string;
  tool_name: string;
  parent_tool_use_id: string | null;
  elapsed_time_seconds: number;
  task_id?: string;
};
```

### Hook Observability

```typescript
// Hook lifecycle messages for observability:
type SDKHookStartedMessage = { subtype: 'hook_started'; hook_id; hook_name; hook_event };
type SDKHookProgressMessage = { subtype: 'hook_progress'; hook_id; stdout; stderr; output };
type SDKHookResponseMessage = { subtype: 'hook_response'; hook_id; exit_code?; outcome: 'success' | 'error' | 'cancelled' };
```

### Compact Boundary Tracking

```typescript
type SDKCompactBoundaryMessage = {
  subtype: 'compact_boundary';
  compact_metadata: {
    trigger: 'manual' | 'auto';
    pre_tokens: number;       // Tokens before compaction
  };
};
```

### Custom Telemetry via Hooks

Use hook callbacks to capture telemetry data:

```typescript
hooks: {
  PostToolUse: [{
    hooks: [async (input) => {
      // Send telemetry for every tool use
      await sendTelemetry({
        tool: input.tool_name,
        session: input.session_id,
        agent: input.agent_id,
        timestamp: Date.now()
      });
      return { continue: true };
    }]
  }]
}
```

### HTTP Hooks for External Telemetry

```json
{
  "hooks": {
    "PostToolUse": [{
      "hooks": [{
        "type": "http",
        "url": "https://telemetry.example.com/hook",
        "headers": { "Authorization": "Bearer $TELEMETRY_TOKEN" },
        "timeout": 5
      }]
    }]
  }
}
```

### SDK Client Identification

```typescript
env: {
  CLAUDE_AGENT_SDK_CLIENT_APP: 'my-app/1.0.0'  // Included in User-Agent header
}
```

---

## 9. Upstream / Downstream Dependency Trace

### Upstream Dependencies (consumed by this project)

```
@anthropic-ai/claude-agent-sdk@0.2.71
  ├── Types from @anthropic-ai/sdk:
  │   ├── BetaMessage (resources/beta/messages/messages)
  │   ├── BetaRawMessageStreamEvent
  │   ├── BetaUsage
  │   └── MessageParam (resources)
  ├── Types from @modelcontextprotocol/sdk:
  │   ├── CallToolResult (types)
  │   ├── ElicitResult (types)
  │   ├── JSONRPCMessage (types)
  │   ├── McpServer (server/mcp)
  │   └── ToolAnnotations (types)
  ├── Peer: zod@^4.0.0
  │   ├── zod/v4 (mini runtime, ~3.5KB)
  │   └── ZodRawShape (both v3 compat + v4)
  └── Node.js built-ins: stream (Readable, Writable), crypto (UUID)

@anthropic-ai/sdk@0.78.0
  ├── @anthropic-ai/sdk/resources (MessageParam, etc.)
  ├── @anthropic-ai/sdk/resources/beta/messages/messages
  └── MCP integration helpers (types → Anthropic API types conversion)

@modelcontextprotocol/sdk@1.27.1
  ├── types.js (CallToolResult, ElicitResult, JSONRPCMessage, ToolAnnotations)
  ├── server/mcp.js (McpServer)
  └── Peer: zod@^4.0.0

jadecli/knowledge-work-plugins @ 477c893b (upstream fork)
  └── Synced: 2026-03-06
```

### Downstream Consumers (produced by this project)

```
@jadecli/knowledge-teams-plugins@0.1.0
  ├── compose/ — Loader/resolver merging upstream KWP + jade extensions
  ├── extensions/ — Jade overlay skills and commands
  │   ├── engineering/
  │   ├── enterprise-lifecycle/
  │   ├── jade-orchestrator/
  │   └── product-management/
  ├── webmcp/ — WebMCP tool stubs
  │   ├── internal/ (claim-task, submit-artifact, get-my-tasks, get-team-status, request-checkpoint)
  │   └── external/ (discover-tools, get-tool-schema, get-usage, invoke-tool)
  ├── s-team/ — STO system prompts (CCO, CDO, CFO, CHRO, COO, CPO, CRO, CSO, CTO, GC)
  └── src/teams/ — Skeptical codegen team implementation
```

---

## 10. Anthropic API (`@anthropic-ai/sdk`)

**Package**: `@anthropic-ai/sdk@0.78.0`
**Repository**: https://github.com/anthropics/anthropic-sdk-typescript

### Key API Types Used by Agent SDK

```typescript
// From @anthropic-ai/sdk/resources/beta/messages/messages:
type BetaMessage = {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | null;
  stop_sequence: string | null;
  usage: BetaUsage;
};

type BetaUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  server_tool_use?: { web_search_requests: number } | null;
};

type BetaRawMessageStreamEvent = /* streaming events */;

// From @anthropic-ai/sdk/resources:
type MessageParam = {
  role: 'user' | 'assistant';
  content: string | ContentBlockParam[];
};
```

### API Tool Use Pattern

```typescript
// Tool definition for API calls
type Tool = {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
};

// Content blocks in messages
type ToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
};

type ToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string | ContentBlock[];
  is_error?: boolean;
};
```

### Beta Headers

```typescript
type SdkBeta = 'context-1m-2025-08-07';
// Enables 1M token context window (Sonnet 4/4.5 only)
```

### MCP → Anthropic Type Conversion

The `@anthropic-ai/sdk` provides helpers for converting MCP types to Anthropic API types,
reducing boilerplate when working with MCP tools, prompts, and resources.

---

## Appendix: Settings Schema (Key Fields)

```typescript
interface Settings {
  $schema?: 'https://json.schemastore.org/claude-code-settings.json';
  apiKeyHelper?: string;
  awsCredentialExport?: string;
  env?: Record<string, string>;
  attribution?: { commit?: string; pr?: string };
  permissions?: {
    allow?: string[];
    deny?: string[];
    ask?: string[];
    defaultMode?: PermissionMode;
    additionalDirectories?: string[];
  };
  model?: string;
  availableModels?: string[];
  enableAllProjectMcpServers?: boolean;
  allowedMcpServers?: { serverName?; serverCommand?; serverUrl? }[];
  deniedMcpServers?: { serverName?; serverCommand?; serverUrl? }[];
  hooks?: Record<string, { matcher?: string; hooks: HookConfig[] }>;
  // Agent teams
  teammateMode?: 'auto' | 'in-process' | 'tmux';
}
```

---

## Sources

- [@anthropic-ai/claude-agent-sdk on npm](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
- [@anthropic-ai/sdk on npm](https://www.npmjs.com/package/@anthropic-ai/sdk)
- [@modelcontextprotocol/sdk on npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [Claude Code GitHub Releases](https://github.com/anthropics/claude-code/releases)
- [Claude Code Agent Teams Docs](https://code.claude.com/docs/en/agent-teams)
- [Claude Agent SDK TypeScript GitHub](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Anthropic SDK TypeScript GitHub](https://github.com/anthropics/anthropic-sdk-typescript)
- [MCP TypeScript SDK GitHub](https://github.com/modelcontextprotocol/typescript-sdk)
