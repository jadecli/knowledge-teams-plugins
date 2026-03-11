# Parallel Agent Orchestration — Design Document

Deterministic binary (0|1) subtask model for the jade-cofounder codebase.
Covers programmatic subagents (Agent SDK), declarative agents (.claude/agents/),
and experimental agent teams. All version-controlled, all using XML prompting,
all defaulting to pro-max auth (Claude Code session, no API key).

## Core Principle: Binary Determinism

Every subtask completes as **1 (pass)** or **0 (fail)**. No partial states.
Budget and time fail-safes guarantee termination:

| Fail-safe | Mechanism | SDK Field |
|-----------|-----------|-----------|
| Turn limit | Counts tool-use round trips | `maxTurns` |
| Cost limit | USD cap on token spend | `maxBudgetUsd` |
| Time limit | AbortController timeout | Custom (wall-clock) |
| Dependency gate | Skip if upstream failed | `dependsOn` |

When any fail-safe triggers, the subtask returns `result: 0` with
the corresponding `exitReason`. No retries, no partial credit.

## Execution Strategies

### 1. Sequential Subagents (Chain)

```
Task A → result → Task B → result → Task C → result
```

**When**: Subtasks have data dependencies (output of A feeds B).
**How**: SDK `query()` calls in sequence, passing structured XML output forward.
**Cost**: N contexts, but can share findings via prompts.
**Determinism**: High — each step validates before proceeding.

```typescript
// Chain pattern: each subtask receives prior output
const resultA = await executeSubtask(taskA);
if (resultA.result === 0) return fail("Task A failed");

const taskB = { ...taskBTemplate, prompt: injectContext(taskBTemplate.prompt, resultA.output) };
const resultB = await executeSubtask(taskB);
```

### 2. Parallel Subagents (Promise.allSettled)

```
        ┌→ Task A → result ─┐
Start ──┼→ Task B → result ──┼→ Collect
        └→ Task C → result ─┘
```

**When**: Subtasks are independent (no data dependencies).
**How**: `Promise.allSettled()` over SDK `query()` calls.
**Cost**: N concurrent contexts. Wall-clock = max(subtask durations).
**Determinism**: High — independent failures don't cascade.

```typescript
// Parallel pattern: independent subtasks run concurrently
const results = await Promise.allSettled(
  subtasks.map(s => executeSubtask(s))
);
const passed = results.filter(r => r.status === "fulfilled" && r.value.result === 1);
```

### 3. Agent Teams (Experimental)

```
        ┌→ Teammate A ←──→ Teammate B ──→┐
Lead ───┤       ↕ (mailbox)      ↕        ├→ Synthesize
        └→ Teammate C ←──→ Teammate D ──→┘
```

**When**: Tasks need mid-flight coordination, competing hypotheses, debate.
**How**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, natural language delegation.
**Cost**: ~5x per teammate. Shared task list with dependency resolution.
**Determinism**: Lower — coordination timing is non-deterministic.

### Decision Matrix

| Property | Sequential | Parallel | Team |
|----------|-----------|----------|------|
| Data dependencies | Yes | No | Optional |
| Inter-task communication | Via prompt chaining | None | Peer-to-peer mailbox |
| Wall-clock time | Σ(durations) | max(durations) | max + coordination |
| Token cost | N contexts | N contexts | ~5N contexts |
| Determinism | High | High | Medium |
| P(complete) | Π P(task_i \| prev) | Π P(task_i) | Π P(task_i) × P(coord) |
| ROTS ceiling | value/Σ(costs) | value/Σ(costs) | value/(5×Σ(costs)) |
| Best for | Dependent chains | Independent work | Collaborative exploration |

### Bayesian ROTS Heuristic

```
Expected ROTS = value × P(complete | strategy) / expected_cost(strategy)

P(complete | parallel)   ≈ ∏ P(subtask_i completes within budget)
P(complete | sequential) ≈ ∏ P(subtask_i | subtask_{i-1} succeeded)
P(complete | team)       ≈ P(parallel) × P(coordination ≤ budget)

Where P(subtask completes | budget) ≈ 1 - e^(-budget / expected_cost)
```

Choose parallel when tasks are independent — it always has equal or better
ROTS than teams (no coordination overhead) and better wall-clock than sequential.

Choose sequential when output of N feeds into N+1 — parallel would require
speculative execution that wastes tokens on wrong assumptions.

Choose teams only when tasks genuinely need mid-flight debate or coordination
that cannot be expressed as data dependencies.

## Auth Modes

All agents default to **pro-max** auth (Claude Code session):

| Mode | Trigger | API Key Required | Best For |
|------|---------|-----------------|----------|
| `pro-max` | Default (no env vars) | No | Alex & Jade on Claude.ai/code |
| `api-key` | `ANTHROPIC_API_KEY` set | Yes | CI/CD, programmatic SDK use |
| `enterprise` | `JADE_ENTERPRISE_API_KEY` set | Yes | Enterprise customers |

Pro-max mode uses the Claude Code session directly — the Agent SDK `query()`
handles tool calling, permissions, and session management. No API key means
no credential to leak, which is the security default.

For `.claude/agents/` definitions, auth is automatic — Claude Code resolves
the model and auth from the user's subscription.

## Version-Controlled Agent Inventory

### Declarative Agents (`.claude/agents/`)

These use the canonical Claude Code YAML frontmatter format.
Loaded at session start, available to all contributors.

| Agent | Model | Tools | maxTurns | Purpose |
|-------|-------|-------|----------|---------|
| `jade-reviewer` | sonnet | Read, Glob, Grep, Bash | 25 | Code review with SDK/TypeScript/security checks |
| `jade-researcher` | haiku | Read, Glob, Grep, Bash | 30 | Codebase exploration and dependency analysis |
| `jade-implementer` | inherit | All + Edit/Write | 40 | Code writing with worktree isolation |
| `jade-security` | sonnet | Read, Glob, Grep | 20 | Security review (OWASP, prompt injection, secrets) |

### Programmatic Agents (`src/teams/`)

These use the Agent SDK `query()` + `AgentDefinition` for programmatic control.

| Team | Lead Model | Subagents | Strategy |
|------|-----------|-----------|----------|
| `skeptical-codegen-team` | opus | type-auditor, dead-code-hunter, simplicity-enforcer | Parallel (Agent tool) |

### Programmatic Task Executor (`src/jade/agent-sdk/parallel-tasks.ts`)

Generic binary subtask executor. Supports:
- Independent parallel execution via `Promise.allSettled`
- Dependency chains via topological sort
- Per-subtask budgets (turns, USD, wall-clock timeout)
- XML execution reports for ROTS tracking

## XML Prompting Convention

All agents use XML for structured I/O. XML is preferred over JSON because:
1. Claude was trained on XML tags as natural delimiters
2. Nested content doesn't need escaping
3. Claude references sections by tag name in chain-of-thought

### Input Format

```xml
<input>
  <task>The specific task to complete</task>
  <context>
    <source name="file.ts">File contents or relevant data</source>
  </context>
  <output-format>Description of expected output structure</output-format>
  <constraints>
    <rule>Constraint 1</rule>
    <rule>Constraint 2</rule>
  </constraints>
</input>
```

### Output Format

```xml
<result status="complete|incomplete">
  <findings>...</findings>
  <summary>...</summary>
</result>
```

## Context Bloat Prevention in Multi-Agent Workflows

1. **Subagents run in separate contexts** — only the summary returns to the parent
2. **maxTurns as hard stop** — prevents runaway agents from filling context
3. **maxBudgetUsd as cost cap** — prevents runaway token spend
4. **Wall-clock timeout** — AbortController kills hung agents
5. **XML reports are compact** — structured data instead of verbose prose
6. **Agent teams: each teammate gets 1M tokens** — doesn't share parent context
7. **PreCompact hook** — snapshots state before compaction in multi-turn sessions

## Sources

### Anthropic Official
- [Agent SDK TypeScript](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Agent SDK V2 Preview](https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview)
- [Agent Loop](https://platform.claude.com/docs/en/agent-sdk/agent-loop)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [Agent Teams](https://code.claude.com/docs/en/agent-teams)
- [Best Practices](https://code.claude.com/docs/en/best-practices)
- [Building a C Compiler with Agent Teams](https://www.anthropic.com/engineering/building-c-compiler)

### Context Management
- [Session Memory Compaction](https://platform.claude.com/cookbook/misc-session-memory-compaction)
- [Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
