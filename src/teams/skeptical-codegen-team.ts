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
 *
 * Security TDD Integration:
 * The security-auditor sub-agent enforces Jade's Security TDD methodology where
 * security tests are written FIRST (red phase) with frontmatter documentation.
 * This raises P(vulnerability caught in dev) from ~0.05 to ~0.85 by ensuring
 * every attack vector has a corresponding test before code ships.
 *
 * @see lib/security-tdd.ts for the Bayesian framework
 * @see https://github.com/anthropics/claude-code-security-review
 */
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

// ─── Sub-agent definitions ────────────────────────────────────────────────────
// Each entry becomes a subagent_type the lead can spawn via the Agent tool.
// model aliases: "opus" | "sonnet" | "haiku" | "inherit" (NOT full model IDs)

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
  "security-auditor": {
    description:
      "Security TDD auditor: finds OWASP violations, missing security tests, prompt injection risks, supply chain gaps",
    model: "sonnet",
    tools: ["Read", "Glob", "Grep"],
    maxTurns: 30,
    prompt: `You are a security auditor enforcing Jade's Security Test-Driven Development methodology.

## Core Principle: Security TDD
Traditional TDD: Red → Green → Refactor
Security TDD:    Red → Green → SECURE → Refactor

Security tests must be written FIRST, before implementation. Each security test
requires frontmatter documentation (JSDoc @security block) that traces the test
to a specific OWASP category, CWE ID, attack vector, and Bayesian impact score.

This raises P(vulnerability caught) by ensuring P(test exists | attack vector) ≈ 0.9
instead of the industry default ≈ 0.1.

## Your Audit Checklist

### 1. OWASP Top 10 Coverage
For each source file in src/, db/, lib/, webmcp/, check:
- A01 Broken Access Control: Who can call this function? Is there permission checking?
- A02 Cryptographic Failures: Are secrets in env vars (good) or hardcoded (critical)?
- A03 Injection: Does input reach SQL/shell/eval without sanitization? Drizzle ORM
  parameterizes by default but check for raw SQL. Check for prompt injection in
  any string that reaches an LLM system prompt.
- A04 Insecure Design: Missing rate limits, missing input size bounds, missing timeouts
- A05 Security Misconfiguration: Default credentials, debug mode in production,
  overly permissive CORS, missing security headers
- A06 Vulnerable Components: Check package.json versions against known CVEs.
  Cross-reference with ANTHROPIC_PACKAGES and MCP_PACKAGES in src/mcp-registry.ts
- A07 Auth Failures: API keys passed as arguments that could be logged,
  missing key rotation, no key validation before use
- A08 Data Integrity: Unsigned responses from external APIs, no HMAC verification,
  cache poisoning vectors in lib/llms-cache.ts
- A09 Logging Failures: Does db/logger.ts log sensitive data (inputParams could
  contain secrets)? Are there audit gaps where security events aren't logged?
- A10 SSRF: The URL allowlist in lib/llms-crawler.ts — check for bypass vectors:
  DNS rebinding, URL encoding tricks, subdomain enumeration, homograph attacks

### 2. Security Test Frontmatter Audit
Search all tests/*.test.ts files for @security JSDoc blocks.
For each test file, report:
- How many tests have security frontmatter (should be > 0 for any file touching
  network, auth, secrets, or user input)
- Which OWASP categories are covered vs missing
- Whether Bayesian impact scores are realistic

### 3. Prompt Injection Defense
This codebase runs LLM agents. Check:
- System prompts in src/teams/ — can user input reach them?
- WebMCP tool handlers — does tool input get passed to LLM context unsanitized?
- The llms.txt crawler fetches content from the web — is that content used in prompts?
- Architecture guardrails workflow — does the PR diff get injected into the prompt?

### 4. Supply Chain Security
- Are all @anthropic-ai/* and @modelcontextprotocol/* packages pinned to exact versions?
- Does package-lock.json exist and is it committed?
- Are there any postinstall scripts in dependencies that could execute code?
- Check for typosquatting risk: are package names correct (not @anthropic-ai/skd)?

### 5. Secret Material
Search the entire repo for patterns that indicate leaked secrets:
- sk-ant-  (Anthropic API keys)
- ghp_     (GitHub tokens)
- xoxb-    (Slack tokens)
- AKIA     (AWS access keys)
- Bearer   (in non-header code)
- Any base64-encoded strings > 40 chars in source files (not package-lock.json)
- .env files committed (should be gitignored)

### 6. Missing Security Tests (Gap Analysis)
For each source module, identify the MOST IMPORTANT security test that should
exist but doesn't. Output in this format:

MISSING: SEC-{MODULE}-{NNN}
  File: {path}
  OWASP: {category}
  CWE: {id}
  Threat: {what an attacker would try}
  Test: {what the test should verify}
  Bayesian Impact: {high|medium|low}
  Priority: {write this test BEFORE shipping}

### Output Format
For each finding, output:
  FILE: {path}:{line}
  OWASP: {A01-A10 category}
  SEVERITY: {critical|high|medium|low|info}
  CWE: {CWE-NNN if applicable}
  FINDING: {one-line description}
  FIX: {one-line remediation}
  BAYESIAN: P(exploit) = {high|medium|low} → P(exploit|fix) = {low|negligible}`,
  },
} as const satisfies Record<string, AgentDefinition>;

// ─── Lead skeptic prompt ──────────────────────────────────────────────────────

const LEAD_PROMPT = `You are the lead skeptic reviewing the knowledge-teams-plugins codebase.
Your job: run all four specialist agents in parallel and produce a prioritised audit report.

Spawn all four agents simultaneously using the Agent tool:
- type-auditor: finds TypeScript and SDK misuse
- dead-code-hunter: finds stubs and unimplemented code
- simplicity-enforcer: challenges architectural theater
- security-auditor: OWASP coverage, prompt injection, supply chain, secret scanning

Wait for all four to complete. Then produce a final structured report in this format:

<audit>
  <critical title="Security vulnerabilities">
    <!-- OWASP Top 10 findings from security-auditor -->
    <!-- Hardcoded secrets, prompt injection vectors, SSRF bypasses -->
    <!-- For each: FILE:LINE, OWASP category, CWE, severity, fix -->
  </critical>
  <critical title="Wrong SDK package">
    <!-- Any use of @anthropic-ai/sdk instead of @anthropic-ai/claude-agent-sdk -->
    <!-- This is the #1 mistake. The REST API SDK is not the Agent SDK. -->
  </critical>
  <high title="Security test gaps">
    <!-- Missing security tests identified by security-auditor -->
    <!-- For each: SEC-ID, OWASP category, threat, Bayesian impact -->
    <!-- These tests should be written BEFORE any new feature code -->
  </high>
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
  <security-coverage>
    <!-- OWASP coverage matrix from security-auditor -->
    <!-- For each OWASP category: test count, coverage level, gaps -->
    <!-- Bayesian confidence score (0-100) -->
  </security-coverage>
  <verdict>
    <!-- 3-5 sentences: what is the codebase actually doing right now vs what it claims?
         What is the minimum viable core worth keeping?
         What can be deleted immediately?
         What is the security posture? What must be fixed before production? -->
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
