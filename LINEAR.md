# LINEAR: BLOG-CRAWLER — Schedule 188 Customer Blog Post Crawls

## Ticket

| Field | Value |
|---|---|
| **Title** | BLOG-CRAWLER: Schedule crawls for 188 Anthropic customer blog posts |
| **Team** | Data Engineering |
| **Priority** | Medium |
| **Labels** | `data-engineering`, `crawler`, `blog`, `cron`, `simulation-data` |
| **Estimate** | 3 points |
| **Milestone** | v0.9.0 — Blog Crawler Infrastructure |

## Description

Set up automated crawling of all 188 Anthropic customer case studies at `claude.com/customers/*` to populate the `meta_blog_cache` Kimball metadata table. These posts become raw fact JSON for future simulation testing — each customer anecdote maps to a hypothetical Jade integration scenario.

### Why

Customer blog posts describe real-world Claude integrations (Stripe's 1,370-engineer rollout, Spotify's 90% migration time reduction, Lyft's 87% support time reduction). By crawling and caching these, we can:

1. **Simulate** customer use cases against Jade infrastructure
2. **Test** whether our orchestrator/WebMCP/STO patterns could support each scenario
3. **Benchmark** our agent capabilities against real enterprise deployments
4. **Gap-analyze** missing Jade features per customer vertical

### Architecture

Reuses and extends the existing `llms-crawler.ts` patterns:

| Component | File | Pattern reused from |
|---|---|---|
| Blog manifest (188 URLs) | `lib/blog-manifest.ts` | Static allowlist (`CRAWLER_ALLOWLIST`) |
| Blog crawler | `lib/blog-crawler.ts` | `llms-crawler.ts` fetch + hash + allowlist |
| Blog cache (LRU + Neon) | `lib/blog-cache.ts` | `llms-cache.ts` two-tier cache |
| Blog sync orchestrator | `lib/blog-sync.ts` | `llms-sync.ts` CLI entry point |
| Schema: `meta_blog_cache` | `db/schema.ts` | `meta_doc_cache` Kimball metadata table |
| Cron workflow | `.github/workflows/blog-crawl.yml` | `weekly-audit.yml` cron pattern |
| WebMCP search tool | `webmcp/external/tools/search-blogs.ts` | `discover-tools.ts` tool registration |
| Extension plugin | `extensions/blog-crawler/` | `jade-orchestrator/` plugin pattern |

### Cron Schedule

| Job | Schedule | Purpose |
|---|---|---|
| `blog-crawl.yml` | Sunday 6am UTC | Crawl all 188 posts, cache changed content |
| `weekly-audit.yml` | Monday 9am UTC | Existing audit (now includes blog staleness check) |

### Security

- **Allowlist**: Only `claude.com` domain with `/customers/` path prefix
- **Multi-sig**: Allowlist changes require human-approved PR + CI + architecture review
- **Concurrency**: 5 workers default (configurable via `workflow_dispatch`)
- **Hash-based**: SHA-256 content hashing — only re-caches on actual change

## Acceptance Criteria

- [ ] `npm run blog:sync` crawls all 188 posts and persists to `meta_blog_cache`
- [ ] `blog-crawl.yml` runs on Sunday 6am UTC cron schedule
- [ ] `search-blogs` WebMCP tool returns results from manifest
- [ ] `meta_blog_cache` table has unique index on URL
- [ ] Blog crawler respects allowlist (only `claude.com/customers/*`)
- [ ] Changed posts detected via SHA-256 hash comparison
- [ ] SyncReport includes updated/unchanged/errors counts
- [ ] Extension plugin registered in `extensions/blog-crawler/plugin.json`

## Subtasks (semver)

```
feat(v0.9.1): Blog manifest — 188 customer URLs with tags
feat(v0.9.2): Blog crawler — fetch + hash + allowlist
feat(v0.9.3): Blog cache — two-tier LRU + Neon
feat(v0.9.4): Blog sync orchestrator + CLI entry point
feat(v0.9.5): meta_blog_cache schema addition
feat(v0.9.6): blog-crawl.yml cron workflow
feat(v0.9.7): search-blogs WebMCP tool
feat(v0.9.8): blog-crawler extension plugin
test(v0.9.9): Security + integration tests
docs(v0.9.10): LINEAR ticket + CLAUDE.md update
```

## Future Work (simulation layer)

Once blog data is cached, the next phase builds the simulation test framework:

1. **Extract structured facts** from each blog post (company, industry, problem, solution, metrics, Claude features)
2. **Generate test scenarios** that exercise Jade capabilities matching customer patterns
3. **Coverage matrix** mapping customer use cases → Jade features exercised
4. **Gap analysis** identifying customer patterns Jade cannot yet support
5. **Regression suite** ensuring future Jade changes don't break customer-pattern compatibility
