# Crawl Pipeline Management

Defines the end-to-end lifecycle for data crawl pipelines, from source registration through fact extraction to quality audit.

## When to apply

Use this skill when building, reviewing, or debugging crawl pipelines that capture raw fact JSON from external sources.

## Pipeline stages

### 1. Source registration

Every external source must be registered in a crawler manifest (`crawlers/<crawler-name>/manifest.json`) with:
- `name` — crawler identifier (kebab-case, e.g., `blog-crawler`)
- `description` — what the crawler collects
- `sources` — array of `{ slug, url, label }` entries
- `schedule` — cron expression for automated runs
- `outputSchema` — reference to the raw-fact JSON schema
- `owner` — S-team role responsible (typically CDO)

### 2. Crawl execution

Crawl jobs are triggered by GitHub Actions cron or manually via `/jade-crawl` command. Each run:
- Generates a `crawl_run_id` from `{crawler-name}-{ISO-timestamp}`
- Iterates sources from the manifest
- Captures raw HTML/JSON from each URL
- Extracts structured facts per the output schema
- Writes results to `crawlers/<crawler-name>/output/`

### 3. Quality audit

After each crawl run, the CDO's unsupervised-truth-probes lens validates:
- Schema conformance (Zod validation against raw-fact schema)
- Completeness (all registered sources attempted)
- Freshness (timestamps within expected SLA)
- Anomaly detection (field distributions match historical baseline)

### 4. Artifact submission

Completed crawl runs are submitted via `submit-artifact` with:
- `artifactType`: `"crawl-output"`
- `metadata.sourceCount`: number of URLs crawled
- `metadata.factCount`: number of facts extracted
- `metadata.crawlRunId`: the dedup identifier
