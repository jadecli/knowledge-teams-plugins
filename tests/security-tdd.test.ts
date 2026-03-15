/**
 * @module tests/security-tdd
 * @description Tests for the Security TDD framework itself (lib/security-tdd.ts).
 * Validates frontmatter parsing, coverage matrix computation, and Bayesian scoring.
 */

import { describe, it, expect } from "vitest";
import {
  parseSecurityFrontmatter,
  computeCoverageMatrix,
  computeBayesianConfidence,
  OwaspCategory,
  Severity,
  AttackVector,
  SecurityTddPhase,
} from "../lib/security-tdd.js";
import type { SecurityTestFrontmatter } from "../lib/security-tdd.js";

describe("lib/security-tdd — frontmatter parser", () => {
  it("parses valid @security JSDoc block", () => {
    const block = `/**
 * @security
 * @id SEC-TEST-001
 * @owasp A10:2021-Server-Side Request Forgery
 * @severity high
 * @attackVector network
 * @cwe CWE-918
 * @targetFiles lib/llms-crawler.ts
 * @threat Attacker crafts URL to bypass allowlist
 * @test Validates allowlist rejects subdomains
 * @prior high
 * @impact high
 * @phase secure
 * @createdAt 2026-03-11
 * @author jade-security-agent
 */`;

    const result = parseSecurityFrontmatter(block);
    expect(result).not.toBeNull();
    expect(result!.id).toBe("SEC-TEST-001");
    expect(result!.owasp).toBe(OwaspCategory.A10_SSRF);
    expect(result!.severity).toBe(Severity.HIGH);
    expect(result!.attackVector).toBe(AttackVector.NETWORK);
    expect(result!.cwe).toBe("CWE-918");
    expect(result!.targetFiles).toEqual(["lib/llms-crawler.ts"]);
    expect(result!.priorProbability).toBe("high");
    expect(result!.bayesianImpact).toBe("high");
    expect(result!.phase).toBe(SecurityTddPhase.SECURE);
  });

  it("returns null for non-security JSDoc", () => {
    const block = `/**
 * @module some-module
 * @description Regular JSDoc
 */`;
    expect(parseSecurityFrontmatter(block)).toBeNull();
  });

  it("returns null for incomplete frontmatter", () => {
    const block = `/**
 * @security
 * @id SEC-TEST-002
 */`;
    // Missing required fields
    expect(parseSecurityFrontmatter(block)).toBeNull();
  });
});

describe("lib/security-tdd — coverage matrix", () => {
  const sampleEntries: SecurityTestFrontmatter[] = [
    {
      id: "SEC-001",
      owasp: OwaspCategory.A10_SSRF,
      severity: Severity.HIGH,
      attackVector: AttackVector.NETWORK,
      targetFiles: ["lib/llms-crawler.ts"],
      threatDescription: "SSRF via subdomain",
      testDescription: "Validates subdomain rejection",
      priorProbability: "high",
      bayesianImpact: "high",
      phase: SecurityTddPhase.SECURE,
      createdAt: "2026-03-11",
      author: "test",
    },
    {
      id: "SEC-002",
      owasp: OwaspCategory.A10_SSRF,
      severity: Severity.MEDIUM,
      attackVector: AttackVector.NETWORK,
      targetFiles: ["lib/llms-crawler.ts"],
      threatDescription: "SSRF via encoding",
      testDescription: "Validates URL encoding rejection",
      priorProbability: "medium",
      bayesianImpact: "high",
      phase: SecurityTddPhase.SECURE,
      createdAt: "2026-03-11",
      author: "test",
    },
    {
      id: "SEC-003",
      owasp: OwaspCategory.A10_SSRF,
      severity: Severity.HIGH,
      attackVector: AttackVector.NETWORK,
      targetFiles: ["lib/llms-crawler.ts"],
      threatDescription: "SSRF via protocol confusion",
      testDescription: "Validates non-HTTPS rejection",
      priorProbability: "high",
      bayesianImpact: "high",
      phase: SecurityTddPhase.SECURE,
      createdAt: "2026-03-11",
      author: "test",
    },
    {
      id: "SEC-004",
      owasp: OwaspCategory.A03_INJECTION,
      severity: Severity.HIGH,
      attackVector: AttackVector.PROMPT_INJECTION,
      targetFiles: ["lib/llms-crawler.ts"],
      threatDescription: "Prompt injection in cached content",
      testDescription: "Validates extraction filter",
      priorProbability: "high",
      bayesianImpact: "high",
      phase: SecurityTddPhase.SECURE,
      createdAt: "2026-03-11",
      author: "test",
    },
  ];

  it("computes OWASP coverage matrix", () => {
    const matrix = computeCoverageMatrix(sampleEntries);

    // Should have entries for all 10 OWASP categories
    expect(matrix).toHaveLength(10);

    // A10 should have 3 tests with "strong" coverage
    const a10 = matrix.find((m) => m.owasp === OwaspCategory.A10_SSRF);
    expect(a10).toBeDefined();
    expect(a10!.testCount).toBe(3);
    expect(a10!.bayesianCoverage).toBe("strong");

    // A03 should have 1 test with "moderate" coverage
    const a03 = matrix.find((m) => m.owasp === OwaspCategory.A03_INJECTION);
    expect(a03).toBeDefined();
    expect(a03!.testCount).toBe(1);
    expect(a03!.bayesianCoverage).toBe("moderate");

    // A01 should have 0 tests with "none" coverage
    const a01 = matrix.find(
      (m) => m.owasp === OwaspCategory.A01_BROKEN_ACCESS_CONTROL,
    );
    expect(a01).toBeDefined();
    expect(a01!.testCount).toBe(0);
    expect(a01!.bayesianCoverage).toBe("none");
  });

  it("computes Bayesian confidence score", () => {
    const matrix = computeCoverageMatrix(sampleEntries);
    const confidence = computeBayesianConfidence(matrix);

    // 2 categories covered (A10=strong=1.0, A03=moderate=0.6) out of 10
    // (1.0 + 0.6 + 0*8) / 10 = 0.16 → 16%
    expect(confidence).toBe(16);
  });

  it("returns 0 confidence for empty entries", () => {
    const matrix = computeCoverageMatrix([]);
    const confidence = computeBayesianConfidence(matrix);
    expect(confidence).toBe(0);
  });

  it("returns 100 confidence for full strong coverage", () => {
    // Create entries covering all 10 OWASP categories with 3+ high-impact each
    const fullEntries: SecurityTestFrontmatter[] = [];
    for (const owasp of Object.values(OwaspCategory)) {
      for (let i = 0; i < 3; i++) {
        fullEntries.push({
          id: `FULL-${owasp}-${i}`,
          owasp,
          severity: Severity.HIGH,
          attackVector: AttackVector.NETWORK,
          targetFiles: ["test.ts"],
          threatDescription: "test",
          testDescription: "test",
          priorProbability: "high",
          bayesianImpact: "high",
          phase: SecurityTddPhase.SECURE,
          createdAt: "2026-03-11",
          author: "test",
        });
      }
    }

    const matrix = computeCoverageMatrix(fullEntries);
    const confidence = computeBayesianConfidence(matrix);
    expect(confidence).toBe(100);
  });
});
