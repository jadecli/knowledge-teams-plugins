/**
 * Deterministic Parallel Task Executor
 *
 * Binary (0|1) subtask model with predetermined budgets and time fail-safes.
 * Each subtask is pass/fail — no partial completions, no retries-until-good.
 *
 * Tradeoff analysis:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Sequential subagents (chain):                               │
 * │   + Deterministic ordering, output of N feeds into N+1     │
 * │   + Lower total token cost (shared context)                 │
 * │   + Better for dependent subtasks                           │
 * │   - Wall-clock time = sum(all subtasks)                     │
 * │   - Single point of failure (one bad result cascades)       │
 * │                                                              │
 * │ Parallel subagents (Promise.allSettled):                    │
 * │   + Wall-clock time = max(slowest subtask)                  │
 * │   + Independent failures don't cascade                      │
 * │   + Better for independent subtasks                         │
 * │   - Higher total token cost (N contexts)                    │
 * │   - No inter-task communication (use agent teams for that)  │
 * │                                                              │
 * │ Agent teams (experimental):                                 │
 * │   + Peer-to-peer messaging between teammates                │
 * │   + Shared task list with dependency resolution             │
 * │   + Better for tasks needing cross-agent coordination       │
 * │   - ~5x token cost per teammate                             │
 * │   - Requires Opus 4.6+ and experimental flag                │
 * │   - Non-deterministic coordination timing                   │
 * │                                                              │
 * │ Bayesian ROTS heuristic:                                    │
 * │   P(complete | budget) = 1 - e^(-budget/expected_cost)      │
 * │   ROTS = value_delivered / token_cost                       │
 * │   Choose parallel when: subtasks independent AND            │
 * │     sum(budgets) < team_coordination_overhead               │
 * │   Choose sequential when: subtask_N depends on N-1          │
 * │   Choose teams when: tasks need mid-flight coordination     │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Sources:
 *   - https://platform.claude.com/docs/en/agent-sdk/typescript
 *   - https://platform.claude.com/docs/en/agent-sdk/agent-loop
 *   - https://code.claude.com/docs/en/sub-agents
 *   - https://code.claude.com/docs/en/agent-teams
 */

import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

// ── Types ───────────────────────────────────────────────────────────────────

/** Binary result: 0 = fail, 1 = pass. No partial states. */
export type BinaryResult = 0 | 1;

/** Budget configuration for a single subtask. */
export interface SubtaskBudget {
  /** Max agentic turns (tool-use round trips). */
  maxTurns: number;
  /** Max cost in USD. Acts as hard fail-safe. */
  maxBudgetUsd: number;
  /** Wall-clock timeout in milliseconds. Abort after this. */
  timeoutMs: number;
}

/** A single subtask in a parallel execution plan. */
export interface Subtask {
  /** Unique ID for tracking. */
  id: string;
  /** Human-readable description. */
  description: string;
  /** XML-formatted prompt for the subtask. */
  prompt: string;
  /** Agent definition (model, tools, system prompt). */
  agent: AgentDefinition;
  /** Predetermined budget for this subtask. */
  budget: SubtaskBudget;
  /** IDs of subtasks that must complete (result=1) before this one runs. */
  dependsOn?: string[];
}

/** Result of a single subtask execution. */
export interface SubtaskResult {
  id: string;
  /** Binary pass/fail. */
  result: BinaryResult;
  /** Raw output from the agent. */
  output: string;
  /** How the subtask terminated. */
  exitReason:
    | "success"                          // Agent completed normally
    | "error_max_turns"                  // Hit turn limit
    | "error_max_budget"                 // Hit USD budget limit
    | "error_timeout"                    // Hit wall-clock timeout
    | "error_dependency"                 // A dependency failed
    | "error_runtime"                    // Unexpected error
    | "error_structured_output_retries"; // Structured output validation failed (v0.2.76+)
  /** Actual cost incurred. */
  costUsd: number;
  /** Actual turns used. */
  turnsUsed: number;
  /** Wall-clock duration in ms. */
  durationMs: number;
}

/** Result of the full parallel execution. */
export interface ParallelExecutionResult {
  /** All subtask results, indexed by ID. */
  results: Record<string, SubtaskResult>;
  /** Overall pass/fail: 1 only if ALL subtasks passed. */
  overallResult: BinaryResult;
  /** Total cost across all subtasks. */
  totalCostUsd: number;
  /** Wall-clock time for the entire execution. */
  totalDurationMs: number;
  /** ROTS: tasks completed / total cost. */
  rots: number;
}

/** Execution strategy selection. */
export type ExecutionStrategy = "sequential" | "parallel" | "team";

// ── Strategy Selection ──────────────────────────────────────────────────────

/**
 * Select optimal execution strategy based on subtask properties.
 *
 * Decision tree:
 *   1. Any dependencies? → sequential (chain)
 *   2. Need inter-task communication? → team
 *   3. Independent tasks? → parallel (Promise.allSettled)
 *
 * Bayesian ROTS heuristic:
 *   P(complete | parallel) ≈ ∏ P(subtask_i completes)
 *   P(complete | sequential) ≈ ∏ P(subtask_i | subtask_{i-1} succeeded)
 *   P(complete | team) ≈ P(parallel) * P(coordination overhead doesn't exceed budget)
 *
 *   Expected ROTS(parallel) = value * P(complete|parallel) / sum(budgets)
 *   Expected ROTS(sequential) = value * P(complete|sequential) / sum(budgets)
 *   Expected ROTS(team) = value * P(complete|team) / (sum(budgets) * 5)  // ~5x overhead
 */
export function selectStrategy(subtasks: Subtask[]): ExecutionStrategy {
  const hasDependencies = subtasks.some(
    (s) => s.dependsOn && s.dependsOn.length > 0
  );

  if (hasDependencies) {
    // Topological sort required — must execute in dependency order
    // Some may still parallelize (independent branches), but default conservative
    return "sequential";
  }

  // For independent subtasks, parallel is almost always better on ROTS
  // because wall-clock time = max(subtasks) instead of sum(subtasks).
  // Team overhead (~5x tokens) only justified when tasks need mid-flight
  // coordination, which our binary model does not support.
  return "parallel";
}

// ── Parallel Executor ───────────────────────────────────────────────────────

/**
 * Execute subtasks in parallel using Promise.allSettled.
 *
 * Each subtask runs in its own context via the Agent SDK query().
 * Results are binary: success (1) or fail (0).
 * No partial results, no retries, no cascading failures.
 *
 * Uses pro-max auth mode (Claude Code session) by default —
 * no ANTHROPIC_API_KEY needed for Claude.ai/code subscribers.
 */
export async function executeParallel(
  subtasks: Subtask[]
): Promise<ParallelExecutionResult> {
  const startTime = Date.now();
  const results: Record<string, SubtaskResult> = {};

  // Separate into dependency-free and dependent subtasks
  const ready = subtasks.filter(
    (s) => !s.dependsOn || s.dependsOn.length === 0
  );
  const blocked = subtasks.filter(
    (s) => s.dependsOn && s.dependsOn.length > 0
  );

  // Phase 1: Execute all independent subtasks in parallel
  const independentResults = await Promise.allSettled(
    ready.map((subtask) => executeSubtask(subtask))
  );

  for (let i = 0; i < ready.length; i++) {
    const subtask = ready[i]!;
    const settled = independentResults[i]!;
    if (settled.status === "fulfilled") {
      results[subtask.id] = settled.value;
    } else {
      results[subtask.id] = {
        id: subtask.id,
        result: 0,
        output: String(settled.reason),
        exitReason: "error_runtime",
        costUsd: 0,
        turnsUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }
  }

  // Phase 2: Execute dependent subtasks (sequential within dependency chain)
  for (const subtask of topologicalSort(blocked, results)) {
    const depsOk = (subtask.dependsOn ?? []).every(
      (depId) => results[depId]?.result === 1
    );

    if (!depsOk) {
      results[subtask.id] = {
        id: subtask.id,
        result: 0,
        output: `Skipped: dependency failed (${(subtask.dependsOn ?? []).filter((d) => results[d]?.result !== 1).join(", ")})`,
        exitReason: "error_dependency",
        costUsd: 0,
        turnsUsed: 0,
        durationMs: 0,
      };
      continue;
    }

    try {
      results[subtask.id] = await executeSubtask(subtask);
    } catch (err) {
      results[subtask.id] = {
        id: subtask.id,
        result: 0,
        output: String(err),
        exitReason: "error_runtime",
        costUsd: 0,
        turnsUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }
  }

  const totalDurationMs = Date.now() - startTime;
  const totalCostUsd = Object.values(results).reduce(
    (sum, r) => sum + r.costUsd,
    0
  );
  const tasksCompleted = Object.values(results).filter(
    (r) => r.result === 1
  ).length;
  const overallResult: BinaryResult =
    tasksCompleted === subtasks.length ? 1 : 0;

  return {
    results,
    overallResult,
    totalCostUsd,
    totalDurationMs,
    rots: totalCostUsd > 0 ? tasksCompleted / totalCostUsd : Infinity,
  };
}

// ── Single Subtask Executor ─────────────────────────────────────────────────

/**
 * Execute a single subtask with budget and timeout fail-safes.
 *
 * Uses the Claude Agent SDK query() for programmatic tool calling.
 * The agent runs in its own context window with restricted tools.
 *
 * Binary outcome:
 *   1 = agent returned result.subtype === "success"
 *   0 = anything else (budget exceeded, timeout, error)
 */
async function executeSubtask(subtask: Subtask): Promise<SubtaskResult> {
  const startTime = Date.now();

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, subtask.budget.timeoutMs);

  try {
    const { query } = await import("@anthropic-ai/claude-agent-sdk");

    const q = query({
      prompt: subtask.prompt,
      options: {
        model: subtask.agent.model ?? "sonnet",
        tools: subtask.agent.tools,
        maxTurns: subtask.budget.maxTurns,
        maxBudgetUsd: subtask.budget.maxBudgetUsd,
        permissionMode: "dontAsk",
        settingSources: ["project"],
        systemPrompt: subtask.agent.prompt
          ? subtask.agent.prompt
          : { type: "preset", preset: "claude_code" },
        abortController: controller,
      },
    });

    let output = "";
    let result: SubtaskResult | undefined;

    for await (const msg of q) {
      if (controller.signal.aborted) {
        break;
      }

      switch (msg.type) {
        case "assistant": {
          for (const block of msg.message.content) {
            if (block.type === "text") {
              output += block.text;
            }
          }
          break;
        }
        case "result": {
          const durationMs = Date.now() - startTime;
          const costUsd =
            "total_cost_usd" in msg
              ? (msg.total_cost_usd as number)
              : 0;
          const turnsUsed =
            "num_turns" in msg ? (msg.num_turns as number) : 0;

          if (msg.subtype === "success") {
            result = {
              id: subtask.id,
              result: 1,
              output,
              exitReason: "success",
              costUsd,
              turnsUsed,
              durationMs,
            };
          } else if (msg.subtype === "error_max_turns") {
            result = {
              id: subtask.id,
              result: 0,
              output,
              exitReason: "error_max_turns",
              costUsd,
              turnsUsed,
              durationMs,
            };
          } else if (msg.subtype === "error_max_budget_usd") {
            result = {
              id: subtask.id,
              result: 0,
              output,
              exitReason: "error_max_budget",
              costUsd,
              turnsUsed,
              durationMs,
            };
          } else if (msg.subtype === "error_max_structured_output_retries") {
            result = {
              id: subtask.id,
              result: 0,
              output: `Structured output validation failed after max retries`,
              exitReason: "error_structured_output_retries",
              costUsd,
              turnsUsed,
              durationMs,
            };
          } else {
            result = {
              id: subtask.id,
              result: 0,
              output: `Agent error: ${msg.subtype}`,
              exitReason: "error_runtime",
              costUsd,
              turnsUsed,
              durationMs,
            };
          }
          break;
        }
      }
    }

    return (
      result ?? {
        id: subtask.id,
        result: controller.signal.aborted ? 0 : 0,
        output: controller.signal.aborted
          ? `Timeout after ${subtask.budget.timeoutMs}ms`
          : output,
        exitReason: controller.signal.aborted
          ? "error_timeout"
          : "error_runtime",
        costUsd: 0,
        turnsUsed: 0,
        durationMs: Date.now() - startTime,
      }
    );
  } finally {
    clearTimeout(timeout);
  }
}

// ── Topological Sort ────────────────────────────────────────────────────────

function topologicalSort(
  subtasks: Subtask[],
  completedResults: Record<string, SubtaskResult>
): Subtask[] {
  const remaining = subtasks.filter((s) => !(s.id in completedResults));
  const sorted: Subtask[] = [];
  const visited = new Set<string>();

  function visit(task: Subtask): void {
    if (visited.has(task.id)) return;
    visited.add(task.id);
    for (const depId of task.dependsOn ?? []) {
      const dep = remaining.find((s) => s.id === depId);
      if (dep) visit(dep);
    }
    sorted.push(task);
  }

  for (const task of remaining) {
    visit(task);
  }

  return sorted;
}

// ── XML Report Generator ────────────────────────────────────────────────────

/**
 * Generate a structured XML execution report.
 * Used by lead agents and ROTS tracking.
 */
export function generateExecutionReport(
  result: ParallelExecutionResult
): string {
  const subtaskReports = Object.values(result.results)
    .map(
      (r) => `  <subtask id="${r.id}" result="${r.result}" exit="${r.exitReason}" ` +
        `cost="${r.costUsd.toFixed(4)}" turns="${r.turnsUsed}" duration="${r.durationMs}ms">
    <output>${r.output.slice(0, 2000)}</output>
  </subtask>`
    )
    .join("\n");

  return `<execution-report>
  <summary overall="${result.overallResult}" tasks="${Object.keys(result.results).length}" ` +
    `passed="${Object.values(result.results).filter((r) => r.result === 1).length}" ` +
    `failed="${Object.values(result.results).filter((r) => r.result === 0).length}" ` +
    `cost="${result.totalCostUsd.toFixed(4)}" duration="${result.totalDurationMs}ms" ` +
    `rots="${result.rots === Infinity ? "∞" : result.rots.toFixed(4)}" />
${subtaskReports}
</execution-report>`;
}
