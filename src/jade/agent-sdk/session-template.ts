/**
 * Generalized Session Template — Claude Agent SDK v2 (Preview)
 *
 * Reusable across repos and projects. Provides:
 * - Structured XML input/output for reliable parsing
 * - 30-turn max with budget guard
 * - Extended thinking (chain of thought) with adaptive mode
 * - Session persistence via resume
 * - Context bloat prevention via proactive compaction
 *
 * Sources:
 *   - https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview
 *   - https://platform.claude.com/docs/en/agent-sdk/typescript
 *   - https://platform.claude.com/cookbook/misc-session-memory-compaction
 *   - https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
 */

import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// ── Types ───────────────────────────────────────────────────────────────────

/** Session configuration for experimental teams. */
export interface SessionTemplateConfig {
  /** Model to use. Defaults to claude-opus-4-6. */
  model?: string;
  /** Max turns before auto-stop. Defaults to 30. */
  maxTurns?: number;
  /** Max budget in USD. Defaults to 5.00. */
  maxBudgetUsd?: number;
  /** Extended thinking mode. Defaults to adaptive (Opus 4.6+). */
  thinking?: "adaptive" | "enabled" | "disabled";
  /** Budget tokens for extended thinking (when mode is "enabled"). */
  thinkingBudgetTokens?: number;
  /** Effort level. Defaults to high. "ultrathink" enables maximum reasoning depth. */
  effort?: "low" | "medium" | "high" | "ultrathink";
  /** System prompt with structured XML instructions. */
  systemPrompt?: string;
  /** Session ID to resume from. */
  resumeSessionId?: string;
  /** Allowed tools for the agent. */
  allowedTools?: string[];
  /** Settings sources to load. Defaults to ["project"]. */
  settingSources?: Array<"project" | "user">;
  /** Enable periodic AI-generated progress summaries (v0.2.76+). */
  agentProgressSummaries?: boolean;
}

/** Structured XML input wrapper for reliable parsing. */
export interface StructuredInput {
  /** The user's task or question. */
  task: string;
  /** Additional context files or data. */
  context?: Array<{ name: string; content: string }>;
  /** Output format instructions. */
  outputFormat?: string;
  /** Constraints or rules to follow. */
  constraints?: string[];
}

/** Parsed structured output from agent responses. */
export interface StructuredOutput {
  /** Raw text response. */
  raw: string;
  /** Extracted XML sections if present. */
  sections: Record<string, string>;
  /** Whether the response indicates completion. */
  complete: boolean;
  /** Turn count for this response. */
  turn: number;
}

// ── Structured XML Helpers ──────────────────────────────────────────────────

/**
 * Format a StructuredInput as XML for Claude to parse reliably.
 *
 * XML input format is preferred over JSON for Claude because:
 * 1. XML tags are natural delimiters Claude was trained on
 * 2. Nested content doesn't need escaping
 * 3. Claude can reference sections by tag name in chain-of-thought
 */
export function formatStructuredInput(input: StructuredInput): string {
  const contextBlocks = (input.context ?? [])
    .map(
      (c) => `  <source name="${escapeXmlAttr(c.name)}">\n${c.content}\n  </source>`
    )
    .join("\n");

  const constraintLines = (input.constraints ?? [])
    .map((c) => `  <rule>${escapeXml(c)}</rule>`)
    .join("\n");

  return `<input>
  <task>${escapeXml(input.task)}</task>
${contextBlocks ? `  <context>\n${contextBlocks}\n  </context>` : ""}
${input.outputFormat ? `  <output-format>${escapeXml(input.outputFormat)}</output-format>` : ""}
${constraintLines ? `  <constraints>\n${constraintLines}\n  </constraints>` : ""}
</input>`;
}

/**
 * Parse structured XML sections from an agent response.
 * Extracts top-level XML tags as named sections.
 */
export function parseStructuredOutput(
  raw: string,
  turn: number
): StructuredOutput {
  const sections: Record<string, string> = {};
  const tagPattern = /<(\w[\w-]*)>([\s\S]*?)<\/\1>/g;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(raw)) !== null) {
    const tagName = match[1];
    const tagContent = match[2];
    if (tagName && tagContent !== undefined) {
      sections[tagName] = tagContent.trim();
    }
  }

  const complete =
    raw.includes('<status>complete</status>') ||
    raw.includes('<promise') ||
    !!sections["result"];

  return { raw, sections, complete, turn };
}

// ── Session Factory ─────────────────────────────────────────────────────────

/**
 * Create or resume a session with the V2 SDK.
 *
 * Uses the unstable_v2 preview API for cleaner multi-turn patterns.
 * Falls back to V1 query() if V2 is unavailable.
 *
 * @example
 * ```ts
 * const session = await createAgentSession({
 *   maxTurns: 30,
 *   thinking: "adaptive",
 *   systemPrompt: "You are a code review agent...",
 * });
 *
 * const result = await session.send({
 *   task: "Review this PR for security issues",
 *   context: [{ name: "diff.patch", content: diffContent }],
 *   outputFormat: "XML with <findings>, <severity>, <recommendation> tags",
 *   constraints: ["Focus on OWASP Top 10", "No false positives"],
 * });
 *
 * console.log(result.sections["findings"]);
 * await session.close();
 * ```
 */
export async function createAgentSession(config: SessionTemplateConfig = {}) {
  const {
    model = "claude-opus-4-6",
    maxTurns = 30,
    maxBudgetUsd = 5.0,
    thinking = "adaptive",
    thinkingBudgetTokens,
    effort = "high",
    systemPrompt,
    resumeSessionId,
    allowedTools,
    settingSources = ["project"],
    agentProgressSummaries,
  } = config;

  // Build thinking config based on mode
  const thinkingConfig =
    thinking === "adaptive"
      ? { type: "adaptive" as const }
      : thinking === "enabled"
        ? { type: "enabled" as const, budgetTokens: thinkingBudgetTokens ?? 10000 }
        : { type: "disabled" as const };

  // Build SDK options
  const sdkOptions = {
    model,
    maxTurns,
    maxBudgetUsd,
    thinking: thinkingConfig,
    effort,
    settingSources,
    ...(systemPrompt ? { systemPrompt } : {}),
    ...(allowedTools ? { allowedTools } : {}),
    ...(agentProgressSummaries !== undefined ? { agentProgressSummaries } : {}),
  };

  // Track turn count for context bloat prevention
  let currentTurn = 0;
  let sessionId: string | undefined = resumeSessionId;

  // Try V2 SDK first (preview), fall back to V1
  try {
    const sdk = await import("@anthropic-ai/claude-agent-sdk");

    // Check if V2 is available
    if ("unstable_v2_createSession" in sdk) {
      const sdkAny = sdk as unknown as Record<string, Function>;
      const createFn = resumeSessionId
        ? sdkAny["unstable_v2_resumeSession"]
        : sdkAny["unstable_v2_createSession"];

      const session = resumeSessionId
        ? createFn!(resumeSessionId, sdkOptions)
        : createFn!(sdkOptions);

      return {
        sessionId: sessionId ?? "pending",
        currentTurn,

        /** Send a structured input and get parsed output. */
        async send(input: StructuredInput): Promise<StructuredOutput> {
          if (currentTurn >= maxTurns) {
            return {
              raw: `<error>Max turns (${maxTurns}) reached. Session stopped to prevent context bloat.</error>`,
              sections: { error: `Max turns (${maxTurns}) reached.` },
              complete: true,
              turn: currentTurn,
            };
          }

          currentTurn++;
          const xmlInput = formatStructuredInput(input);
          await session.send(xmlInput);

          let fullText = "";
          for await (const msg of session.stream()) {
            if (!sessionId) {
              sessionId = (msg as SDKMessage).session_id;
            }
            if ((msg as SDKMessage).type === "assistant") {
              const assistantMsg = msg as SDKMessage & { message: { content: Array<{ type: string; text?: string }> } };
              const text = assistantMsg.message.content
                .filter((block) => block.type === "text")
                .map((block) => block.text ?? "")
                .join("");
              fullText += text;
            }
          }

          return parseStructuredOutput(fullText, currentTurn);
        },

        /** Get session ID for persistence/resume. */
        getSessionId(): string | undefined {
          return sessionId;
        },

        /** Close the session. */
        close(): void {
          if (typeof session.close === "function") {
            session.close();
          }
        },
      };
    }

    // Fall back to V1 query()
    return createV1FallbackSession(sdk, sdkOptions, maxTurns);
  } catch {
    // SDK not available — return a stub for type-checking
    throw new Error(
      "Claude Agent SDK not installed. Run: npm install @anthropic-ai/claude-agent-sdk"
    );
  }
}

/**
 * V1 fallback using query() async generator pattern.
 */
function createV1FallbackSession(
  sdk: Record<string, Function>,
  options: Record<string, unknown>,
  maxTurns: number
) {
  let currentTurn = 0;
  let sessionId: string | undefined;

  return {
    sessionId: "pending-v1",
    currentTurn,

    async send(input: StructuredInput): Promise<StructuredOutput> {
      if (currentTurn >= maxTurns) {
        return {
          raw: `<error>Max turns (${maxTurns}) reached.</error>`,
          sections: { error: `Max turns (${maxTurns}) reached.` },
          complete: true,
          turn: currentTurn,
        };
      }

      currentTurn++;
      const xmlInput = formatStructuredInput(input);

      const queryFn = sdk["query"] as Function;
      const q = queryFn({
        prompt: xmlInput,
        options: {
          ...options,
          ...(sessionId ? { resume: sessionId } : {}),
        },
      });

      let fullText = "";
      for await (const msg of q as AsyncIterable<SDKMessage>) {
        if (!sessionId && msg.session_id) {
          sessionId = msg.session_id;
        }
        if (msg.type === "assistant") {
          const assistantMsg = msg as SDKMessage & { message: { content: Array<{ type: string; text?: string }> } };
          const text = assistantMsg.message.content
            .filter((block) => block.type === "text")
            .map((block) => block.text ?? "")
            .join("");
          fullText += text;
        }
      }

      return parseStructuredOutput(fullText, currentTurn);
    },

    getSessionId(): string | undefined {
      return sessionId;
    },

    close(): void {
      // V1 sessions are closed when the generator completes
    },
  };
}

// ── XML Escape Utilities ────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXmlAttr(str: string): string {
  return escapeXml(str).replace(/"/g, "&quot;");
}
