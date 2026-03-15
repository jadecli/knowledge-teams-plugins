# BLOG-CRAWLER: Schedule crawls for 188 Anthropic customer blog posts

**Type:** Feature
**Priority:** Medium
**Labels:** data-engineering, crawler, cron

## Summary

Set up a recurring BLOG-CRAWLER that fetches, hashes, and caches all 188
Anthropic customer case study blog posts as raw fact JSON data. This data
feeds future simulation tests where we validate Jade infrastructure by
hypothetically building what customers already built using Claude — but
on our stack.

## Motivation

Anthropic's customer blog posts describe real-world production use cases:
code migrations, customer support automation, cron-scheduled workflows,
agent orchestration, data pipelines, and more. These are concrete anecdotes
we can use to:

1. **Simulate test scenarios** — "If Spotify used Jade for their migration,
   would our agent SDK handle their patterns?"
2. **Benchmark coverage** — Track which customer patterns our infrastructure
   already supports vs. gaps
3. **Regression tests** — Real customer patterns catch edge cases synthetic
   tests miss

## Architecture

Extends the existing `lib/llms-crawler.ts` + `lib/llms-cache.ts` pattern:

```
lib/blog-manifest.ts   — 188 blog entries (slug, title, URL)
lib/blog-crawler.ts    — Fetch + hash blog posts (allowlisted to anthropic.com/customers/*)
lib/blog-sync.ts       — Orchestrator: crawl all, compare hashes, upsert cache
db/schema.ts           — meta_blog_cache table (Kimball metadata dimension)
.github/workflows/blog-crawl.yml — Weekly cron (Sundays 6am UTC)
```

### Reuse from Cowork / Claude Code patterns

The cron scheduling follows two proven patterns from the Claude ecosystem:

- **GitHub Actions cron** (like `weekly-audit.yml`) — durable, survives restarts,
  runs headless via `anthropics/claude-code-action@v1`
- **Claude Code `/loop` native cron** (`CronCreate`/`CronDelete`/`CronList`) —
  for ephemeral dev-time monitoring during crawl runs

The crawler itself reuses:
- `hashContent()` from `lib/llms-crawler.ts` (SHA-256 change detection)
- Two-tier cache pattern from `lib/llms-cache.ts` (LRU + Neon persistence)
- `getDb()` / `hasDatabase()` from `db/client.ts`
- Allowlist security boundary pattern (domain-locked to `www.anthropic.com`)

### Schema: `meta_blog_cache`

| Column | Type | Purpose |
|--------|------|---------|
| slug | text (unique) | URL-friendly identifier |
| url | text (unique) | Full anthropic.com/customers/* URL |
| title | text | Blog post title |
| content_hash | text | SHA-256 for change detection |
| content | text | Raw HTML content |
| fact_json | jsonb | Structured extracted facts (future) |
| last_crawled | timestamp | Last successful crawl |
| http_status | integer | HTTP response code |
| crawl_duration_ms | integer | Fetch latency measure |

## Subtasks (semver convention)

```
feat(v0.1.0): blog-manifest.ts — 188 entry manifest ✅
feat(v0.2.0): meta_blog_cache schema table ✅
feat(v0.3.0): blog-crawler.ts — fetch + hash with concurrency ✅
feat(v0.4.0): blog-sync.ts — orchestrator with CLI entry point ✅
feat(v0.5.0): blog-crawl.yml — weekly cron workflow ✅
feat(v0.6.0): fact extraction — parse blog HTML into structured JSON (future)
feat(v0.7.0): simulation harness — generate test cases from fact_json (future)
test(v0.8.0): unit tests for crawler, sync, manifest
docs(v0.9.0): update CLAUDE.md with blog crawler docs
```

## Customer blog posts (188 total)

All posts follow the URL pattern `https://www.anthropic.com/customers/{slug}`.
See `lib/blog-manifest.ts` for the full canonical list.

### By category (approximate):

**Developer Tools & Code** (35+): Stripe, Wiz, Spotify, Greptile, Money Forward,
Doctolib, Classmethod, Ramp, Rakuten, Sentry, Bito, Augment, Replit, GitLab,
Sourcegraph, CodeRabbit, Graphite, Tabnine, Windsurf, cubic, Factory, etc.

**Customer Support & Operations** (25+): Lyft, N26, Tidio, Chatbase, Intercom,
Sendbird, Decagon, Assembled, Coinbase, ASAPP, Humach, Gradient Labs, etc.

**Healthcare & Life Sciences** (10+): Carta Healthcare, Elation Health,
Qualified Health, Banner Health, Medgate, Novo Nordisk, Benchling, Bluenote, etc.

**Education** (10+): Pratham, ClassDojo, MagicSchool, StudyFetch, Rising Academies,
Amira, Pensive, Super Teacher, Praxis AI, RileyBot, Dolly, etc.

**Sales & Marketing** (10+): Attention, Apollo, Clay, Tome, Triple Whale,
Advolve, Copy.ai, Local Falcon, etc.

**Legal & Finance** (10+): Harvey, Wordsmith, Legora, Law&Company, Steno,
Chronograph, Nevis, Crunched, BlueFlame AI, Armanino, Campfire, etc.

**Infrastructure & Security** (10+): eSentire, Trellix, Panther, Stairwell,
Palo Alto Networks, Semgrep, Vanta, etc.

**AI Platforms & Agents** (15+): n8n, Workato, Lindy, Dust, Genspark,
FutureHouse, Emergent, Parcha, Kodif, Tines, etc.

## Future work

1. **Fact extraction (v0.6.0)**: Parse raw HTML into structured `fact_json`:
   - Company name, industry, use case category
   - Quantitative claims (e.g., "87% reduction", "2x performance")
   - SDK/product mentions (Claude Code, Agent SDK, Bedrock, Vertex)
   - Architecture patterns described

2. **Simulation harness (v0.7.0)**: Generate Vitest test cases from `fact_json`:
   - "Given Spotify's migration pattern, can our agent SDK handle it?"
   - "Given Lyft's support automation, does our WebMCP support the flow?"

3. **Drift detection**: Compare `fact_json` across crawls to detect when
   Anthropic updates case studies (new metrics, new features mentioned)

## Acceptance criteria

- [ ] `npm run blog:sync` crawls all 188 posts and caches to Neon
- [ ] Weekly cron runs on Sundays without manual intervention
- [ ] Change detection skips unchanged posts (hash comparison)
- [ ] Errors don't halt the crawl (continue-on-error per post)
- [ ] Blog manifest count matches expected 188
