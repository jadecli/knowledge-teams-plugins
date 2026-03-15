# Cron Scheduling

Extends upstream engineering patterns with data-engineering-specific cron job management. Reuses the scheduling patterns from Claude Code's Cowork desktop application — GitHub Actions cron triggers, checkpoint-based progress tracking, and budget-aware execution windows.

## When to apply

Use this skill when setting up, managing, auditing, or debugging scheduled data pipeline jobs (crawls, transforms, aggregations).

## Patterns

1. **GitHub Actions as cron runtime** — All scheduled jobs run as GitHub Actions workflows with `schedule:` triggers. This reuses the same infrastructure Claude Code's Cowork uses for weekly audits and CI pipelines. No external scheduler needed.

2. **Cron expression validation** — Every cron schedule must be expressed in standard 5-field POSIX format and documented with a human-readable description. Example: `'30 2 * * *'` → "Daily at 02:30 UTC".

3. **Idempotent crawl runs** — Each crawl job must be idempotent. If a run is interrupted or retried, it produces the same output without duplicating records. Use `crawl_run_id` (ISO timestamp + source slug) as the dedup key.

4. **Checkpoint-integrated scheduling** — Long-running crawls must call `request-checkpoint` at page boundaries (every 20 URLs or 5 minutes, whichever comes first). This reuses the jade-orchestrator checkpoint protocol.

5. **Budget-aware windows** — Each crawl job specifies a `budget_tool_calls` ceiling. The scheduler refuses to start a new crawl if the projected cost exceeds the remaining daily budget. This mirrors Cowork's budget enforcement for agent sessions.

6. **Stale detection** — If a crawl job has not produced fresh data within its expected SLA (default: 2× the cron interval), the CDO fitness function flags it as stale. The `weekly-audit` workflow picks this up automatically.

7. **Output to raw-fact store** — All crawl output is written as JSON conforming to the raw-fact schema (`crawlers/schemas/raw-fact.schema.json`). No crawl may write unstructured data.
