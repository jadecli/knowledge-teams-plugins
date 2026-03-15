# /jade-crawl

Run or schedule a crawl job for a registered crawler.

## Syntax

```
/jade-crawl <crawler-name> [--dry-run] [--limit <n>] [--source <slug>]
```

## Arguments

- `<crawler-name>` — Required. The crawler to run (e.g., `blog-crawler`).
- `--dry-run` — Validate manifest and list sources without fetching.
- `--limit <n>` — Crawl only the first `n` sources (for testing).
- `--source <slug>` — Crawl a single source by slug.

## Behavior

1. Load the crawler manifest from `crawlers/<crawler-name>/manifest.json`.
2. Validate all source URLs are reachable (HEAD request).
3. Generate a `crawl_run_id`.
4. For each source: fetch content, extract facts per output schema, write to output directory.
5. Call `request-checkpoint` every 20 sources.
6. On completion, call `submit-artifact` with crawl summary.

## Examples

```
/jade-crawl blog-crawler                    # Crawl all registered blog posts
/jade-crawl blog-crawler --limit 5          # Test with first 5 sources
/jade-crawl blog-crawler --source stripe    # Crawl only the Stripe blog post
/jade-crawl blog-crawler --dry-run          # Validate manifest without fetching
```
