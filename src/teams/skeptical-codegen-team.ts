/**
 * Skeptical Codegen Team
 *
 * A multi-agent code review team using @anthropic-ai/claude-agent-sdk (NOT @anthropic-ai/sdk).
 * The Agent SDK runs Claude Code sessions with full tool access and session management.
 * The REST API SDK (@anthropic-ai/sdk) is wrong for this use case — it bypasses all
 * agent orchestration, tool permissions, hooks, and session infrastructure.
 *
 * Correct SDK: @anthropic-ai/claude-agent-sdk → query(), agents: Record<string, AgentDefinition>
 * Wrong SDK:   @anthropic-ai/sdk              → new Anthropic(), client.messages.create()
 */
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

// ─── Sub-agent definitions ────────────────────────────────────────────────────
// Each entry becomes a subagent_type the lead can spawn via the Agent tool.
// model aliases: "opus" | "sonnet" | "haiku" | "inherit" (NOT full model IDs)
// v0.2.76+: aliases now resolve correctly on Bedrock/Vertex/Foundry backends

const agents = {
  "type-auditor": {
    description:
      "Audits TypeScript: finds `any`, wrong SDK imports, missing return types, type assertions",
    model: "sonnet",
    tools: ["Read", "Glob", "Grep"],
    maxTurns: 25,
    prompt: `You are a ruthless TypeScript type auditor. Be exhaustive. Find every type safety violation.

Flag every instance of:
1. \`any\` type — explicit (: any) or implicit (function parameters without types)
2. \`as\` type assertions that suppress errors instead of fixing them
3. \`// @ts-ignore\` or \`// @ts-nocheck\` comments
4. Exported functions missing explicit return types
5. JSON.parse() results used without type guards

CRITICAL — SDK MISUSE: The most important thing to find is any import of \`@anthropic-ai/sdk\`.
This is the direct REST API SDK. This codebase should use \`@anthropic-ai/claude-agent-sdk\` instead.
They are fundamentally different packages:
- WRONG: import Anthropic from "@anthropic-ai/sdk"; ... client.messages.create({...})
- RIGHT: import { query } from "@anthropic-ai/claude-agent-sdk"; ... for await (const msg of query(...))

Search for these patterns across all TypeScript files:
- "from \"@anthropic-ai/sdk\""
- "from '@anthropic-ai/sdk'"
- "client.messages.create"
- "new Anthropic("

For each finding output: file path, line number, violation type, one-line fix.
Check every .ts file in the repo.`,
  },

  "dead-code-hunter": {
    description:
      "Finds unimplemented stubs, handlers that return empty data, and files that exist but do nothing",
    model: "haiku",
    tools: ["Read", "Glob", "Grep"],
    maxTurns: 25,
    prompt: `You are a dead code hunter. Your job is to find code that exists but delivers no value.

Hunt for:
1. Handler functions that return hardcoded empty data (tasks: [], tools: [], etc.)
   These are stubs masquerading as implementations.
2. TypeScript files that only re-export from somewhere else with no added value
3. Plugin JSON files referencing skills/ or commands/ files that don't exist on disk
4. Markdown command files that describe behavior without any implementation (pure docs masquerading as commands)
5. "// Stub: would query ..." comments — these are the clearest signal
6. s-team/ STO files — list them. Do they have corresponding TypeScript implementations that actually use them? Or are they just YAML frontmatter that nothing reads?
7. The compose/loader.ts loads upstream from "../knowledge-work-plugins/plugins" — does that sibling directory exist? If not, the upstream loading is dead code.

For each finding:
- File path
- What it claims to do
- What it actually does (nothing / returns empty / pretends)
- Verdict: DELETE, IMPLEMENT, or DOCUMENT-ONLY`,
  },

  "simplicity-enforcer": {
    description:
      "Challenges over-engineering, premature abstractions, and architecture theater",
    model: "sonnet",
    tools: ["Read", "Glob", "Grep"],
    maxTurns: 25,
    prompt: `You are a simplicity enforcer. For every abstraction, ask: does this solve a real problem that exists today?

Check each of these specific areas:

1. compose/ layer (loader.ts, resolver.ts, manifest.ts):
   - How many upstream plugins does it actually load in practice? (Hint: look at loadAll() — it looks for a sibling directory that likely doesn't exist)
   - Is this a working compose system or aspirational architecture?
   - If upstream loading never works, what's left? Just scanning extensions/ — which is one readdirSync call.

2. webmcp/ registry pattern:
   - registerTool() adds to a module-level Map. Who calls getTool()? Who calls listTools()?
   - Is there a consumer of this registry anywhere, or is it a registry with no readers?
   - The WebMCPToolDefinition interface requires { name, description, inputSchema, handler }. How many handlers actually do anything vs return stubbed data?

3. extensions/jade-orchestrator/:
   - plugin.json exists. Does anything actually load and execute these commands at runtime?
   - /jade-assign and /jade-checkpoint are Markdown files describing behavior. Is there a TypeScript runtime that parses and executes them?

4. s-team/ STO files:
   - 10 YAML-frontmatter + Markdown files. What reads the fitness_function field at runtime? What enforces budget_tool_calls? Is there a scheduler?
   - If nothing reads them programmatically, they are documentation, not configuration.

For each area:
- Current complexity level (High/Med/Low)
- Actual delivered value (what it does RIGHT NOW)
- Recommended form (what it should be simplified to)
- Lines that can be deleted immediately`,
  },
} as const satisfies Record<string, AgentDefinition>;

// ─── Lead skeptic prompt ──────────────────────────────────────────────────────

const LEAD_PROMPT = `You are the lead skeptic reviewing the knowledge-teams-plugins codebase.
Your job: run all three specialist agents in parallel and produce a prioritised audit report.

Spawn all three agents simultaneously using the Agent tool:
- type-auditor: finds TypeScript and SDK misuse
- dead-code-hunter: finds stubs and unimplemented code
- simplicity-enforcer: challenges architectural theater

Wait for all three to complete. Then produce a final structured report in this format:

<audit>
  <critical title="Wrong SDK package">
    <!-- Any use of @anthropic-ai/sdk instead of @anthropic-ai/claude-agent-sdk -->
    <!-- This is the #1 mistake. The REST API SDK is not the Agent SDK. -->
  </critical>
  <high title="TypeScript violations">
    <!-- any, missing types, type assertions -->
  </high>
  <medium title="Dead and stub code">
    <!-- Handlers returning empty data, files that do nothing -->
    <!-- Include: which webmcp stubs to delete vs implement -->
    <!-- Include: whether the upstream compose loading is reachable -->
  </medium>
  <low title="Over-engineering">
    <!-- Abstractions with no consumers, registries with no readers -->
    <!-- Architecture that describes intent but has no runtime effect -->
  </low>
  <verdict>
    <!-- 3-5 sentences: what is the codebase actually doing right now vs what it claims?
         What is the minimum viable core worth keeping?
         What can be deleted immediately? -->
  </verdict>
</audit>`;

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runSkepticalCodegenTeam(cwd = process.cwd()): Promise<void> {
  const q = query({
    prompt: LEAD_PROMPT,
    options: {
      model: "claude-opus-4-6",
      cwd,
      agents,
      tools: ["Read", "Glob", "Grep", "Agent"],
      allowedTools: ["Read", "Glob", "Grep", "Agent"],
      permissionMode: "dontAsk",
      settingSources: ["project"],
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append:
          "You are coordinating a skeptical code review team. Be ruthless. Prefer deletion over abstraction.",
      },
      maxTurns: 60,
      maxBudgetUsd: 10.0,
    },
  });

  for await (const msg of q) {
    switch (msg.type) {
      case "assistant": {
        for (const block of msg.message.content) {
          if (block.type === "text") {
            process.stdout.write(block.text);
          }
        }
        break;
      }
      case "result":
        if (msg.subtype === "success") {
          console.error(
            `\n[done] turns=${msg.num_turns} cost=$${msg.total_cost_usd.toFixed(4)}`
          );
        } else {
          console.error(`\n[failed] ${msg.subtype}`);
          if ("errors" in msg) console.error(msg.errors);
          process.exitCode = 1;
        }
        break;
    }
  }
}
