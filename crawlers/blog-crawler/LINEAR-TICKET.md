# Linear Ticket: Schedule Blog Crawler for 188 Customer Posts

## Title
BLOG-CRAWLER: Schedule weekly crawl of 188 Anthropic customer blog posts

## Labels
`data-engineering`, `crawler`, `cdo`, `infrastructure`

## Priority
Medium

## Status
Backlog

## Description

### Objective
Set up a scheduled crawl pipeline that extracts raw fact JSON from all 188 Anthropic customer blog posts at `https://claude.com/customers/*`. These raw facts will serve as the foundation for future simulation testing — validating that Jade's infrastructure could hypothetically support each customer's use case.

### Background
Anthropic publishes customer success stories describing how companies use Claude. By crawling and structuring this data, we create a library of real-world use cases that serve two purposes:
1. **Near-term**: Build a searchable knowledge base of customer anecdotes for the CCO and CRO roles
2. **Future**: Generate simulation test scenarios where we validate Jade could support each customer's described workflow using our own infrastructure

### Scope
- **188 sources** registered in `crawlers/blog-crawler/manifest.json`
- **Weekly cron**: `0 3 * * 0` (Sundays at 03:00 UTC)
- **Output format**: Raw fact JSON per `crawlers/schemas/raw-fact.schema.json`
- **Output location**: `crawlers/blog-crawler/output/{slug}.json`

### Extraction fields per source
| Field | Description |
|---|---|
| `company` | Company name |
| `industry` | Primary industry vertical |
| `use_case_summary` | How they use Claude (1 paragraph) |
| `technologies_mentioned` | APIs, SDKs, platforms referenced |
| `quantitative_claims` | Measurable outcomes (e.g., "87% reduction") |
| `content_raw` | Full page text as markdown |

### Infrastructure
- **Runtime**: GitHub Actions (`blog-crawler.yml` workflow)
- **Scheduling**: Cron via GitHub Actions schedule trigger
- **Manual trigger**: `workflow_dispatch` with `limit`, `source_slug`, `dry_run` inputs
- **WebMCP tools**: `run-crawl`, `schedule-crawl`, `get-crawl-status`
- **Budget**: 200 tool calls per run (configurable via `schedule-crawl`)
- **Checkpoints**: Every 20 sources via `request-checkpoint`
- **Owner**: CDO (Chief Data Officer) — unsupervised-truth-probes safety lens

### Acceptance criteria
- [ ] `crawlers/blog-crawler/manifest.json` contains all 188 source entries
- [ ] `blog-crawler.yml` GitHub Actions workflow runs on weekly cron
- [ ] Manual dispatch works with `--limit`, `--source`, `--dry-run` flags
- [ ] Output JSON files conform to `raw-fact.schema.json`
- [ ] Each output file includes provenance: `source_url`, `crawled_at`, `crawler_name`, `crawl_run_id`
- [ ] Freshness SLA: all sources crawled within 7 days
- [ ] CDO weekly audit detects stale crawl data
- [ ] `run-crawl`, `schedule-crawl`, `get-crawl-status` WebMCP tools registered and tested

### Future work (out of scope for this ticket)
- **Simulation test generation**: Use raw facts to create test scenarios that validate Jade infrastructure against real customer use cases
- **Incremental crawling**: Detect changes since last crawl, only re-extract modified sources
- **Multi-crawler orchestration**: Coordinate blog-crawler with future crawlers (docs-crawler, changelog-crawler)
- **Downstream transforms**: Industry classification, use-case tagging, similarity scoring

### Sample sources (first 10 of 188)
1. [Attention](https://claude.com/customers/attention) — Sales operations automation
2. [Stripe](https://claude.com/customers/stripe) — Claude Code enterprise rollout
3. [Shortcut](https://claude.com/customers/shortcut) — Spreadsheet work with Opus 4.6
4. [Athena Intelligence](https://claude.com/customers/athena) — Enterprise knowledge work
5. [n8n](https://claude.com/customers/n8n) — Workflow automation
6. [Wiz](https://claude.com/customers/wiz) — Codebase migration
7. [Lyft](https://claude.com/customers/lyft) — Customer support
8. [Pratham](https://claude.com/customers/pratham-international) — Education assessment
9. [Adalat AI](https://claude.com/customers/adalat-ai) — Legal accessibility
10. [Rocket](https://claude.com/customers/rocket) — Website generation

*Full manifest: `crawlers/blog-crawler/manifest.json` (188 entries)*
