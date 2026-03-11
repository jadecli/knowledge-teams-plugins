/**
 * @module lib/security-tdd
 * @description Security Test-Driven Development framework for knowledge-teams-plugins.
 *
 * Extends the traditional Red/Green/Refactor TDD cycle with a mandatory
 * security phase: Red → Green → Secure → Refactor.
 *
 * Key principle: Security tests are written FIRST, before implementation,
 * with frontmatter documentation per test. This raises the Bayesian prior
 * probability that vulnerabilities are caught during development rather than
 * post-deployment — reducing P(vulnerability | code shipped) by ensuring
 * P(test covers attack vector) is high from the start.
 *
 * Bayesian reasoning:
 *   P(vuln found in dev) = P(test exists | attack vector) × P(test catches | test exists)
 *   Without Security TDD: P(test exists) ≈ 0.1 → P(vuln found) ≈ 0.05
 *   With Security TDD:    P(test exists) ≈ 0.9 → P(vuln found) ≈ 0.85
 *
 * The frontmatter per test creates a traceable audit trail from threat model
 * to test case to implementation, making the security posture machine-verifiable.
 */

// ─── Security Test Frontmatter Schema ───────────────────────────────────────

/** OWASP Top 10 2021 categories */
export enum OwaspCategory {
  A01_BROKEN_ACCESS_CONTROL = "A01:2021-Broken Access Control",
  A02_CRYPTOGRAPHIC_FAILURES = "A02:2021-Cryptographic Failures",
  A03_INJECTION = "A03:2021-Injection",
  A04_INSECURE_DESIGN = "A04:2021-Insecure Design",
  A05_SECURITY_MISCONFIGURATION = "A05:2021-Security Misconfiguration",
  A06_VULNERABLE_COMPONENTS = "A06:2021-Vulnerable and Outdated Components",
  A07_AUTH_FAILURES = "A07:2021-Identification and Authentication Failures",
  A08_DATA_INTEGRITY = "A08:2021-Software and Data Integrity Failures",
  A09_LOGGING_FAILURES = "A09:2021-Security Logging and Monitoring Failures",
  A10_SSRF = "A10:2021-Server-Side Request Forgery",
}

/** Severity levels aligned with CVSS */
export enum Severity {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  INFO = "info",
}

/** Attack vector classification */
export enum AttackVector {
  /** Attacker controls network input (API, HTTP) */
  NETWORK = "network",
  /** Attacker controls adjacent system (MCP server, plugin) */
  ADJACENT = "adjacent",
  /** Attacker has local access (env vars, filesystem) */
  LOCAL = "local",
  /** Attacker has physical access */
  PHYSICAL = "physical",
  /** Attacker manipulates LLM prompts */
  PROMPT_INJECTION = "prompt-injection",
  /** Attacker compromises upstream dependency */
  SUPPLY_CHAIN = "supply-chain",
}

/** Security TDD phase */
export enum SecurityTddPhase {
  /** Write failing security test first */
  RED = "red",
  /** Implement minimum code to pass */
  GREEN = "green",
  /** Add security hardening */
  SECURE = "secure",
  /** Refactor while maintaining security */
  REFACTOR = "refactor",
}

/**
 * Frontmatter for each security test.
 * Embedded as JSDoc above the test function.
 * Machine-parseable for audit trail generation.
 */
export interface SecurityTestFrontmatter {
  /** Unique test identifier (e.g., "SEC-CRAWLER-001") */
  id: string;
  /** OWASP category this test covers */
  owasp: OwaspCategory;
  /** Severity if this vulnerability were exploited */
  severity: Severity;
  /** Attack vector classification */
  attackVector: AttackVector;
  /** CWE identifier (e.g., "CWE-918" for SSRF) */
  cwe?: string;
  /** Source file(s) being tested */
  targetFiles: string[];
  /** What the attacker would try */
  threatDescription: string;
  /** What the test validates */
  testDescription: string;
  /** Bayesian prior: P(attack attempt | system deployed) */
  priorProbability: "high" | "medium" | "low";
  /** Expected reduction in P(success | attack attempt) after this test passes */
  bayesianImpact: "high" | "medium" | "low";
  /** Current TDD phase */
  phase: SecurityTddPhase;
  /** Date test was written */
  createdAt: string;
  /** Who wrote the test (agent or human) */
  author: string;
}

// ─── Frontmatter Parser ─────────────────────────────────────────────────────

/**
 * Parse security frontmatter from a JSDoc comment block.
 *
 * Expected format in test files:
 * ```
 * /**
 *  * @security
 *  * @id SEC-CRAWLER-001
 *  * @owasp A10:2021-Server-Side Request Forgery
 *  * @severity high
 *  * @attackVector network
 *  * @cwe CWE-918
 *  * @targetFiles lib/llms-crawler.ts
 *  * @threat Attacker crafts URL that passes allowlist but resolves to internal IP
 *  * @test Validates that subdomain variations are rejected
 *  * @prior high
 *  * @impact high
 *  * @phase secure
 *  * /
 * ```
 */
export function parseSecurityFrontmatter(
  jsdocBlock: string,
): SecurityTestFrontmatter | null {
  if (!jsdocBlock.includes("@security")) return null;

  const get = (tag: string): string | undefined => {
    const match = jsdocBlock.match(new RegExp(`@${tag}\\s+(.+?)(?:\\n|\\*\\/)`));
    return match?.[1]?.trim();
  };

  const id = get("id");
  const owasp = get("owasp") as OwaspCategory | undefined;
  const severity = get("severity") as Severity | undefined;
  const attackVector = get("attackVector") as AttackVector | undefined;
  const threatDescription = get("threat");
  const testDescription = get("test");

  if (!id || !owasp || !severity || !attackVector || !threatDescription || !testDescription) {
    return null;
  }

  return {
    id,
    owasp,
    severity,
    attackVector,
    cwe: get("cwe"),
    targetFiles: get("targetFiles")?.split(",").map((f) => f.trim()) ?? [],
    threatDescription,
    testDescription,
    priorProbability: (get("prior") as "high" | "medium" | "low") ?? "medium",
    bayesianImpact: (get("impact") as "high" | "medium" | "low") ?? "medium",
    phase: (get("phase") as SecurityTddPhase) ?? SecurityTddPhase.RED,
    createdAt: get("createdAt") ?? new Date().toISOString().split("T")[0],
    author: get("author") ?? "jade-security-agent",
  };
}

// ─── Coverage Matrix ────────────────────────────────────────────────────────

export interface SecurityCoverageEntry {
  owasp: OwaspCategory;
  testCount: number;
  testIds: string[];
  targetFiles: string[];
  highestSeverity: Severity;
  bayesianCoverage: "strong" | "moderate" | "weak" | "none";
}

/** Compute coverage matrix from parsed frontmatter entries */
export function computeCoverageMatrix(
  entries: SecurityTestFrontmatter[],
): SecurityCoverageEntry[] {
  const byOwasp = new Map<OwaspCategory, SecurityTestFrontmatter[]>();

  for (const entry of entries) {
    const existing = byOwasp.get(entry.owasp) ?? [];
    existing.push(entry);
    byOwasp.set(entry.owasp, existing);
  }

  const severityOrder: Severity[] = [
    Severity.CRITICAL,
    Severity.HIGH,
    Severity.MEDIUM,
    Severity.LOW,
    Severity.INFO,
  ];

  const result: SecurityCoverageEntry[] = [];

  for (const owasp of Object.values(OwaspCategory)) {
    const tests = byOwasp.get(owasp) ?? [];
    const allFiles = [...new Set(tests.flatMap((t) => t.targetFiles))];
    const highestSeverity =
      tests.length > 0
        ? severityOrder.find((s) => tests.some((t) => t.severity === s)) ?? Severity.INFO
        : Severity.INFO;

    const highImpactCount = tests.filter((t) => t.bayesianImpact === "high").length;

    let bayesianCoverage: "strong" | "moderate" | "weak" | "none";
    if (tests.length === 0) bayesianCoverage = "none";
    else if (highImpactCount >= 3) bayesianCoverage = "strong";
    else if (highImpactCount >= 1) bayesianCoverage = "moderate";
    else bayesianCoverage = "weak";

    result.push({
      owasp,
      testCount: tests.length,
      testIds: tests.map((t) => t.id),
      targetFiles: allFiles,
      highestSeverity,
      bayesianCoverage,
    });
  }

  return result;
}

/** Compute overall Bayesian security confidence score (0-100) */
export function computeBayesianConfidence(
  matrix: SecurityCoverageEntry[],
): number {
  const weights: Record<string, number> = {
    strong: 1.0,
    moderate: 0.6,
    weak: 0.3,
    none: 0.0,
  };

  const totalWeight = matrix.reduce(
    (sum, entry) => sum + weights[entry.bayesianCoverage],
    0,
  );

  return Math.round((totalWeight / matrix.length) * 100);
}
