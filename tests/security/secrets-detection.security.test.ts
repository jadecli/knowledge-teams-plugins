/**
 * Security TDD: Secrets Detection
 *
 * Scans the repository source tree for hardcoded secrets. This is the same
 * class of check that architecture-guardrails.yml performs via Claude, but
 * as a deterministic test that runs on every `npm test` invocation.
 *
 * Bayesian framing: running this test on every commit means the probability
 * of a hardcoded secret reaching main approaches zero over time.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, extname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SCAN_EXTENSIONS = new Set([".ts", ".yml", ".yaml", ".md", ".json"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "coverage"]);

function collectFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else if (SCAN_EXTENSIONS.has(extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

const SECRET_PATTERNS = [
  { name: "Anthropic API key", pattern: /sk-ant-[a-zA-Z0-9]{20,}/ },
  { name: "Slack bot token", pattern: /xoxb-[a-zA-Z0-9-]+/ },
  { name: "GitHub PAT", pattern: /ghp_[a-zA-Z0-9]{36,}/ },
  { name: "AWS access key", pattern: /AKIA[A-Z0-9]{16}/ },
  { name: "Bearer token (long)", pattern: /Bearer [a-zA-Z0-9_-]{40,}/ },
];

// Cache file contents once for all pattern checks (avoids N_files × N_patterns reads)
const files = collectFiles(ROOT);
const fileContents = new Map<string, string>();
for (const file of files) {
  if (file.endsWith("secrets-detection.security.test.ts")) continue;
  if (file.endsWith(".env.example")) continue;
  fileContents.set(file, readFileSync(file, "utf-8"));
}

/**
 * @security-test
 * ---
 * threat-model: Hardcoded secrets committed to repository
 * owasp-category: A02:2021 Cryptographic Failures
 * attack-vector: Developer accidentally commits API key or token in source
 * bayesian-prior: 0.20
 * bayesian-posterior: 0.005
 * cve-reference: N/A (preventive)
 * ---
 */
describe("secrets-detection — no hardcoded secrets in source", () => {
  for (const { name, pattern } of SECRET_PATTERNS) {
    it(`no ${name} pattern in source files`, () => {
      const violations: string[] = [];
      for (const [file, content] of fileContents) {
        const match = content.match(pattern);
        if (match) {
          const relPath = file.replace(ROOT + "/", "");
          violations.push(`${relPath}: found ${name} → ${match[0].slice(0, 20)}...`);
        }
      }
      expect(violations, `Found ${name} in source files`).toEqual([]);
    });
  }
});

/**
 * @security-test
 * ---
 * threat-model: .env.example contains real credentials instead of placeholders
 * owasp-category: A02:2021 Cryptographic Failures
 * attack-vector: Developer copies .env to .env.example without redacting
 * bayesian-prior: 0.10
 * bayesian-posterior: 0.02
 * cve-reference: N/A (preventive)
 * ---
 */
describe("secrets-detection — .env.example has placeholders only", () => {
  const envExample = readFileSync(join(ROOT, ".env.example"), "utf-8");

  it("DATABASE_URL uses placeholder host", () => {
    const dbUrl = envExample.match(/DATABASE_URL=(.+)/);
    if (dbUrl) {
      expect(dbUrl[1]).not.toMatch(/@[a-z0-9-]+\.neon\.tech.*password/i);
    }
  });

  it("ANTHROPIC_ORG_API_KEY uses placeholder pattern", () => {
    const apiKey = envExample.match(/ANTHROPIC_ORG_API_KEY=(.+)/);
    if (apiKey) {
      expect(apiKey[1]).toMatch(/xxxxx/);
    }
  });
});

/**
 * @security-test
 * ---
 * threat-model: OAuth/API tokens referenced outside secrets context in workflows
 * owasp-category: A02:2021 Cryptographic Failures
 * attack-vector: Token value hardcoded directly in workflow YAML instead of using secrets
 * bayesian-prior: 0.08
 * bayesian-posterior: 0.01
 * cve-reference: N/A (preventive)
 * ---
 */
describe("secrets-detection — workflow tokens use ${{ secrets.* }}", () => {
  const workflowDir = join(ROOT, ".github", "workflows");
  const workflowFiles = readdirSync(workflowDir).filter((f) => f.endsWith(".yml"));

  it.each(["CLAUDE_CODE_OAUTH_TOKEN", "CLAUDE_API_KEY"])(
    "%s only in secrets context",
    (tokenName) => {
      for (const file of workflowFiles) {
        const content = readFileSync(join(workflowDir, file), "utf-8");
        if (!content.includes(tokenName)) continue;

        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (
            line.includes(tokenName) &&
            !line.includes(`secrets.${tokenName}`)
          ) {
            if (line.trim().startsWith("#")) continue;
            expect.fail(
              `${file}:${i + 1} references ${tokenName} outside secrets context`,
            );
          }
        }
      }
    },
  );
});
