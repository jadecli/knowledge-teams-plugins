# Raw Fact Schema Governance

Governs the structure and evolution of raw fact JSON data captured by crawl pipelines.

## When to apply

Use this skill when defining, validating, or evolving the schema for raw fact data produced by crawlers.

## Principles

1. **Single canonical schema** — All crawlers write to the same raw-fact base schema. Crawler-specific fields go in an `extensions` object, never at the top level.

2. **Schema versioning** — The schema includes a `schemaVersion` field. Breaking changes increment the major version. Additive fields increment the minor version. Crawlers must declare which schema version they target.

3. **Provenance required** — Every fact must include `source_url`, `crawled_at` (ISO timestamp), `crawler_name`, and `crawl_run_id`. Facts without provenance are rejected at validation time.

4. **Simulation readiness** — Raw facts are stored in a format that supports future test simulation. Each fact includes a `customer_context` object with `company`, `industry`, `use_case_summary`, and `technologies_mentioned` so that simulation agents can reconstruct scenarios.

5. **No derived data** — Raw facts contain only data directly extracted from the source. Summaries, scores, and classifications belong in downstream transforms, not in the raw-fact store.
