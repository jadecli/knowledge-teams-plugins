#!/usr/bin/env node
/**
 * Blog Crawler → Neon Loader
 * Fetches all 188 Anthropic customer blog posts via curl (proxy-aware),
 * extracts content, and loads raw facts into Neon Postgres via SQL-over-HTTP.
 */
import { readFileSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const NEON_HOST = "ep-jolly-grass-ajs4h5w8-pooler.c-3.us-east-2.aws.neon.tech";
const NEON_CONN_STR = "postgresql://neondb_owner:npg_cQM1UgBsPtp8@ep-jolly-grass-ajs4h5w8-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";
const NEON_SQL_URL = `https://${NEON_HOST}/sql`;

const MANIFEST = JSON.parse(
  readFileSync(new URL("./manifest.json", import.meta.url), "utf8")
);

const BASE_URL = MANIFEST.baseUrl;
const CRAWLER_NAME = MANIFEST.name;
const CRAWL_RUN_ID = `${CRAWLER_NAME}-${new Date().toISOString()}`;
const CONCURRENCY = 15;

// ── Neon SQL via curl ───────────────────────────────────────────────
async function neonQuery(query, params = []) {
  const body = JSON.stringify({ query, params });
  // Escape single quotes in body for shell
  const escapedBody = body.replace(/'/g, "'\\''");
  const cmd = `curl -s --max-time 30 '${NEON_SQL_URL}' ` +
    `-H 'Content-Type: application/json' ` +
    `-H 'Neon-Connection-String: ${NEON_CONN_STR}' ` +
    `-d '${escapedBody}'`;
  const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
  const parsed = JSON.parse(stdout);
  if (parsed.error) throw new Error(`Neon: ${JSON.stringify(parsed.error)}`);
  return parsed;
}

async function initDb() {
  await neonQuery(`
    CREATE TABLE IF NOT EXISTS raw_facts (
      fact_id          TEXT PRIMARY KEY,
      schema_version   TEXT NOT NULL DEFAULT '1.0.0',
      source_url       TEXT NOT NULL,
      crawled_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      crawler_name     TEXT NOT NULL,
      crawl_run_id     TEXT NOT NULL,
      title            TEXT,
      content_raw      TEXT,
      company          TEXT,
      industry         TEXT,
      use_case_summary TEXT,
      slug             TEXT,
      http_status      INT,
      error            TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  await neonQuery(`CREATE INDEX IF NOT EXISTS idx_raw_facts_company ON raw_facts(company)`);
  await neonQuery(`CREATE INDEX IF NOT EXISTS idx_raw_facts_crawl_run ON raw_facts(crawl_run_id)`);
  console.log("✓ Table raw_facts ready in Neon");
}

// ── HTML extraction ─────────────────────────────────────────────────
function htmlToText(html) {
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");
  text = text.replace(/<\/li>/gi, "\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  text = text.replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/");
  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

function extractTitle(html) {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (og) return og[1];
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (t) return t[1].trim();
  return null;
}

function extractDescription(html) {
  const og = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  if (og) return og[1];
  const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  if (m) return m[1];
  return null;
}

// ── Fetch page via curl ─────────────────────────────────────────────
async function fetchPage(url) {
  const { stdout } = await execAsync(
    `curl -sL --max-time 20 -w '\\n__HTTP_STATUS__%{http_code}' -H 'User-Agent: JadeCLI-BlogCrawler/0.1' '${url}'`,
    { maxBuffer: 10 * 1024 * 1024 }
  );
  const statusMatch = stdout.match(/__HTTP_STATUS__(\d+)$/);
  const httpStatus = statusMatch ? parseInt(statusMatch[1]) : null;
  const html = stdout.replace(/__HTTP_STATUS__\d+$/, "");
  return { html, httpStatus };
}

// ── Process a single source ─────────────────────────────────────────
async function processSource(source) {
  const url = `${BASE_URL}/${source.slug}`;
  const now = new Date().toISOString();
  const factId = `${CRAWLER_NAME}-${source.slug}-${now}`;

  try {
    const { html, httpStatus } = await fetchPage(url);

    if (httpStatus && httpStatus >= 400) {
      return { factId, sourceUrl: url, crawledAt: now, title: null, contentRaw: null,
        company: source.company, useCaseSummary: null, slug: source.slug,
        httpStatus, error: `HTTP ${httpStatus}` };
    }

    const title = extractTitle(html) || source.company;
    const contentRaw = htmlToText(html).substring(0, 50000);
    const description = extractDescription(html);

    return { factId, sourceUrl: url, crawledAt: now, title, contentRaw,
      company: source.company, useCaseSummary: description, slug: source.slug,
      httpStatus: httpStatus || 200, error: null };
  } catch (err) {
    return { factId, sourceUrl: url, crawledAt: now, title: null, contentRaw: null,
      company: source.company, useCaseSummary: null, slug: source.slug,
      httpStatus: null, error: err.message.substring(0, 200) };
  }
}

// ── Insert into Neon ────────────────────────────────────────────────
async function insertFact(fact) {
  const q = `INSERT INTO raw_facts
    (fact_id, schema_version, source_url, crawled_at, crawler_name, crawl_run_id,
     title, content_raw, company, use_case_summary, slug, http_status, error)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (fact_id) DO NOTHING`;
  await neonQuery(q, [
    fact.factId, "1.0.0", fact.sourceUrl, fact.crawledAt,
    CRAWLER_NAME, CRAWL_RUN_ID, fact.title, fact.contentRaw,
    fact.company, fact.useCaseSummary, fact.slug,
    fact.httpStatus, fact.error,
  ]);
}

// ── Concurrency-limited execution ───────────────────────────────────
async function runWithConcurrency(items, fn, concurrency) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );
  return results;
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log(`Blog Crawler → Neon Loader`);
  console.log(`Sources: ${MANIFEST.sources.length}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Run ID: ${CRAWL_RUN_ID}\n`);

  await initDb();

  let completed = 0;
  let successes = 0;
  let failures = 0;

  await runWithConcurrency(
    MANIFEST.sources,
    async (source) => {
      const fact = await processSource(source);
      try {
        await insertFact(fact);
      } catch (insertErr) {
        fact.error = (fact.error || "") + ` | DB: ${insertErr.message.substring(0, 100)}`;
      }
      completed++;
      if (fact.error) {
        failures++;
        process.stdout.write(`✗ [${completed}/${MANIFEST.sources.length}] ${source.company}: ${fact.error.substring(0, 80)}\n`);
      } else {
        successes++;
        process.stdout.write(`✓ [${completed}/${MANIFEST.sources.length}] ${source.company} (${fact.httpStatus}) ${(fact.contentRaw||"").length} chars\n`);
      }
      return fact;
    },
    CONCURRENCY
  );

  console.log(`\n${"═".repeat(60)}`);
  console.log(`CRAWL COMPLETE`);
  console.log(`${"═".repeat(60)}`);
  console.log(`Total:    ${MANIFEST.sources.length}`);
  console.log(`Success:  ${successes}`);
  console.log(`Failed:   ${failures}`);
  console.log(`Run ID:   ${CRAWL_RUN_ID}`);

  // Query Neon for summary stats
  const countRes = await neonQuery(
    `SELECT count(*) as total, count(content_raw) as with_content FROM raw_facts WHERE crawl_run_id = $1`,
    [CRAWL_RUN_ID]
  );
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║         DATA IN NEON                 ║`);
  console.log(`╠══════════════════════════════════════╣`);
  console.log(`║  Rows inserted: ${String(countRes.rows[0].total).padEnd(20)}║`);
  console.log(`║  With content:  ${String(countRes.rows[0].with_content).padEnd(20)}║`);
  console.log(`╚══════════════════════════════════════╝`);

  // Top companies by content length
  const topRes = await neonQuery(`
    SELECT company, http_status, length(content_raw) as content_len,
           substring(use_case_summary, 1, 100) as summary_preview
    FROM raw_facts
    WHERE crawl_run_id = $1 AND content_raw IS NOT NULL
    ORDER BY length(content_raw) DESC
    LIMIT 20`, [CRAWL_RUN_ID]);

  console.log(`\nTop 20 by content size:`);
  console.log(`${"─".repeat(110)}`);
  console.log(`${"Company".padEnd(28)} ${"Status".padEnd(8)} ${"Size".padEnd(10)} Summary`);
  console.log(`${"─".repeat(110)}`);
  for (const r of topRes.rows) {
    console.log(`${(r.company || "").padEnd(28)} ${String(r.http_status).padEnd(8)} ${String(r.content_len).padEnd(10)} ${r.summary_preview || ""}`);
  }

  // HTTP status breakdown
  const statusRes = await neonQuery(`
    SELECT
      count(*) FILTER (WHERE http_status = 200) as ok_200,
      count(*) FILTER (WHERE http_status BETWEEN 300 AND 399) as redirects,
      count(*) FILTER (WHERE http_status = 404) as not_found,
      count(*) FILTER (WHERE http_status >= 500) as server_error,
      count(*) FILTER (WHERE error IS NOT NULL) as errors
    FROM raw_facts WHERE crawl_run_id = $1`, [CRAWL_RUN_ID]);
  const s = statusRes.rows[0];
  console.log(`\nHTTP Status Breakdown:`);
  console.log(`  200 OK:       ${s.ok_200}`);
  console.log(`  3xx:          ${s.redirects}`);
  console.log(`  404:          ${s.not_found}`);
  console.log(`  5xx:          ${s.server_error}`);
  console.log(`  Errors:       ${s.errors}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
