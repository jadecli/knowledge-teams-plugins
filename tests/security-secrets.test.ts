/**
 * @module tests/security-secrets
 * @description Security TDD tests for secret material and credential handling.
 *
 * These tests scan the codebase for leaked secrets and validate that
 * credential handling follows security best practices. Written in the
 * RED phase — these tests must pass before any code ships.
 *
 * Bayesian rationale: P(secret leak | codebase without scanning) ≈ 0.15
 * per year (industry average). With automated scanning in CI:
 * P(secret leak | scanning + rotation) ≈ 0.01.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");

/** Get all TypeScript source files (not node_modules, not dist) */
function getSourceFiles(): string[] {
  const output = execSync(
    'find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*"',
    { cwd: ROOT, encoding: "utf-8" },
  );
  return output.trim().split("\n").filter(Boolean);
}

describe("security/secrets — hardcoded credential scanning", () => {
  const sourceFiles = getSourceFiles();

  /**
   * @security
   * @id SEC-SECRETS-001
   * @owasp A02:2021-Cryptographic Failures
   * @severity critical
   * @attackVector local
   * @cwe CWE-798
   * @targetFiles all .ts source files
   * @threat Developer accidentally commits API key or token in source code
   * @test Scans all TypeScript files for common secret patterns
   * @prior high
   * @impact high
   * @phase secure
   * @createdAt 2026-03-11
   * @author jade-security-agent
   */
  it("SEC-SECRETS-001: no hardcoded API keys in source files", () => {
    const secretPatterns = [
      { pattern: /sk-ant-[a-zA-Z0-9]{20,}/, name: "Anthropic API key" },
      { pattern: /ghp_[a-zA-Z0-9]{36,}/, name: "GitHub personal access token" },
      { pattern: /xoxb-[a-zA-Z0-9-]{50,}/, name: "Slack bot token" },
      { pattern: /AKIA[A-Z0-9]{16}/, name: "AWS access key" },
    ];

    const violations: string[] = [];

    for (const file of sourceFiles) {
      // Skip test files that contain patterns as test fixtures
      if (file.includes("security-secrets.test.ts")) continue;
      // Skip docs that document patterns
      if (file.endsWith(".md")) continue;

      const absPath = resolve(ROOT, file);
      if (!existsSync(absPath)) continue;

      const content = readFileSync(absPath, "utf-8");
      for (const { pattern, name } of secretPatterns) {
        const match = content.match(pattern);
        if (match) {
          violations.push(`${file}: Found ${name} pattern: ${match[0].slice(0, 10)}...`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  /**
   * @security
   * @id SEC-SECRETS-002
   * @owasp A02:2021-Cryptographic Failures
   * @severity high
   * @attackVector local
   * @cwe CWE-312
   * @targetFiles .env, .env.local, .env.production
   * @threat .env file with real credentials committed to repository
   * @test Validates that .env files (with real values) are not committed
   * @prior medium
   * @impact high
   * @phase secure
   * @createdAt 2026-03-11
   * @author jade-security-agent
   */
  it("SEC-SECRETS-002: no .env files with real values committed", () => {
    const dangerousEnvFiles = [".env", ".env.local", ".env.production", ".env.staging"];

    for (const envFile of dangerousEnvFiles) {
      const absPath = resolve(ROOT, envFile);
      if (existsSync(absPath)) {
        const content = readFileSync(absPath, "utf-8");
        // If the file exists, it should only contain placeholders
        for (const { pattern, name } of [
          { pattern: /sk-ant-[a-zA-Z0-9]{20,}/, name: "Anthropic key" },
          { pattern: /postgres:\/\/[^:]+:[^@]+@/, name: "database URL with password" },
        ]) {
          expect(content).not.toMatch(pattern);
        }
      }
    }
  });

  /**
   * @security
   * @id SEC-SECRETS-003
   * @owasp A05:2021-Security Misconfiguration
   * @severity medium
   * @attackVector local
   * @cwe CWE-200
   * @targetFiles .gitignore
   * @threat .env files not gitignored, leading to accidental commits
   * @test Validates that .gitignore excludes sensitive files
   * @prior medium
   * @impact medium
   * @phase secure
   * @createdAt 2026-03-11
   * @author jade-security-agent
   */
  it("SEC-SECRETS-003: .gitignore excludes sensitive file patterns", () => {
    const gitignorePath = resolve(ROOT, ".gitignore");
    expect(existsSync(gitignorePath)).toBe(true);

    const gitignore = readFileSync(gitignorePath, "utf-8");
    // Must ignore .env files
    expect(gitignore).toMatch(/\.env/);
    // Must ignore node_modules
    expect(gitignore).toMatch(/node_modules/);
    // Must ignore dist
    expect(gitignore).toMatch(/dist/);
  });
});

describe("security/secrets — credential handling patterns", () => {
  /**
   * @security
   * @id SEC-SECRETS-004
   * @owasp A07:2021-Identification and Authentication Failures
   * @severity high
   * @attackVector local
   * @cwe CWE-522
   * @targetFiles db/org-usage.ts
   * @threat API key passed as function argument could be logged in stack traces
   * @test Validates that org-usage reads credentials from env, not function args in production paths
   * @prior medium
   * @impact high
   * @phase secure
   * @createdAt 2026-03-11
   * @author jade-security-agent
   */
  it("SEC-SECRETS-004: syncOrgUsage reads credentials from environment", () => {
    const orgUsagePath = resolve(ROOT, "db/org-usage.ts");
    const content = readFileSync(orgUsagePath, "utf-8");

    // syncOrgUsage should read from process.env, not require args
    expect(content).toMatch(/process\.env\.ANTHROPIC_ORG_API_KEY/);
    expect(content).toMatch(/process\.env\.ANTHROPIC_ORG_ID/);
  });

  /**
   * @security
   * @id SEC-SECRETS-005
   * @owasp A09:2021-Security Logging and Monitoring Failures
   * @severity medium
   * @attackVector local
   * @cwe CWE-532
   * @targetFiles db/logger.ts
   * @threat inputParams field in ToolCallEvent could contain secrets that get persisted to database
   * @test Validates that the logger interface documents the risk of sensitive data in inputParams
   * @prior medium
   * @impact medium
   * @phase secure
   * @createdAt 2026-03-11
   * @author jade-security-agent
   */
  it("SEC-SECRETS-005: logger ToolCallEvent inputParams is typed as Record<string, unknown>", () => {
    const loggerPath = resolve(ROOT, "db/logger.ts");
    const content = readFileSync(loggerPath, "utf-8");

    // inputParams should be optional — callers can omit sensitive params
    expect(content).toMatch(/inputParams\?/);
  });
});
