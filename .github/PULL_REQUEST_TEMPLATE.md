## Summary

<!-- What does this PR do? 1-3 sentences. -->

## Semver Subtask

<!-- Which subtask does this close? e.g. feat(v0.3.0): tool call logger -->
- **Task ID**: <!-- e.g. add-neon-logging -->
- **Subtask**: <!-- e.g. v0.3.0 -->

## Changes

- [ ] New files added
- [ ] Existing files modified
- [ ] Tests added/updated
- [ ] CLAUDE.md updated (if architecture changed)

## Pre-merge Checklist

> Only hardcoded secrets hard-block. Everything else is a follow-up.

- [ ] `npx tsc --noEmit` passes
- [ ] `npx vitest run` passes (all tests green)
- [ ] No hardcoded secrets (sk-, xoxb-, ghp_, AKIA, Bearer tokens)
- [ ] Exported functions have explicit return types
- [ ] New WebMCP tools export `{ name, description, inputSchema, handler }`
- [ ] Neon schema changes tested on ephemeral branch (if applicable)

## Architecture Guardrails Verdict

<!-- Filled by Claude after review. Do not edit manually. -->
- [ ] PASS
- [ ] PASS with follow-ups
- [ ] REVISIT
- [ ] BLOCK

---

## Follow-ups & Linear Ticket Drafts

<!--
This section uses XML so Claude can parse it programmatically and draft
Linear tickets for Jade or Alex to approve. Each <ticket> becomes a task
in the Linear queue. Approver reviews and promotes to the backlog.

INSTRUCTIONS:
1. List follow-ups discovered during this PR (from code review, guardrails, or scope decisions)
2. Each follow-up becomes a <ticket> with structured fields
3. Claude's architecture-guardrails workflow auto-populates this section
4. Jade or Alex approves tickets before they enter the Linear sprint queue
-->

<linear-ticket-drafts>
<!--
  <ticket>
    <title>Short imperative title (max 80 chars)</title>
    <description>What needs to happen and why it compounds value</description>
    <type>feature | bug | refactor | test | docs</type>
    <priority>urgent | high | medium | low</priority>
    <assignee>jade | alex | unassigned</assignee>
    <labels>sdk-correctness, type-safety, test-coverage, naming-drift, package-drift, webmcp, neon, llms-cache</labels>
    <estimated-subtasks>
      <subtask version="0.1.0">Description of first step</subtask>
      <subtask version="0.2.0">Description of second step</subtask>
    </estimated-subtasks>
    <affected-files>
      <file>path/to/file.ts</file>
    </affected-files>
    <blocked-by>PR number or ticket ID if dependent</blocked-by>
    <scope-note>Why this was deferred from the current PR</scope-note>
  </ticket>
-->
</linear-ticket-drafts>

<!--
MACHINE-READABLE CONTEXT FOR CLAUDE WORKFLOWS
The XML below is consumed by architecture-guardrails.yml and staff-review.yml
to auto-generate follow-up tickets. Do not remove.
-->

<pr-context>
  <repo>jadecli/knowledge-teams-plugins</repo>
  <base-branch>main</base-branch>
  <conventions>
    <convention id="sdk">Use @anthropic-ai/claude-agent-sdk for agents, @anthropic-ai/sdk for REST</convention>
    <convention id="return-types">Exported functions must have explicit return types</convention>
    <convention id="naming">Reuse McpServerEntry, CanonicalPackage, WorkDomain, SupportedLanguage</convention>
    <convention id="webmcp">Tools export { name, description, inputSchema, handler }</convention>
    <convention id="zod">Zod v4: err.issues not err.errors, z.record(key, val)</convention>
    <convention id="testing">vitest, suggest concrete test cases not just "add tests"</convention>
    <convention id="security">Hardcoded secrets are the only hard block</convention>
    <convention id="style">Go-style: small interfaces, explicit returns, functions do one thing</convention>
  </conventions>
  <verdict-rules>
    <rule verdict="PASS">Ship it, follow-ups are nice-to-haves</rule>
    <rule verdict="PASS-WITH-FOLLOWUPS">Ship, but draft Linear tickets for recommendations</rule>
    <rule verdict="REVISIT">Significant drift, worth revision before compounding debt</rule>
    <rule verdict="BLOCK">Hardcoded secrets only</rule>
  </verdict-rules>
  <ticket-approval>
    <approvers>jade, alex</approvers>
    <queue>linear</queue>
    <workflow>Claude drafts tickets in XML → approver reviews → approved tickets enter sprint backlog</workflow>
  </ticket-approval>
</pr-context>
