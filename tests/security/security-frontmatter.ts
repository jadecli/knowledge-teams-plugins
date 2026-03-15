/**
 * @module tests/security/security-frontmatter
 * @description Parse and validate @security-test YAML frontmatter from JSDoc comments.
 *
 * Security TDD convention: every *.security.test.ts describe block opens with
 * a JSDoc block containing structured frontmatter that documents the threat model,
 * OWASP category, and Bayesian probability reduction for each test.
 *
 * Bayesian model: P(vuln|no_test) is the prior. P(vuln|test_passes) is the posterior.
 * Writing the test and seeing it pass reduces the probability that the vulnerability
 * exists in production. Compound reduction across N tests:
 *   P_final = P_0 × Π(posterior_i / prior_i)
 */

import { z } from "zod";

// ─── OWASP 2021 Top 10 ───────────────────────────────────────────────────────

export const OWASP_2021 = [
  "A01:2021 Broken Access Control",
  "A02:2021 Cryptographic Failures",
  "A03:2021 Injection",
  "A04:2021 Insecure Design",
  "A05:2021 Security Misconfiguration",
  "A06:2021 Vulnerable and Outdated Components",
  "A07:2021 Identification and Authentication Failures",
  "A08:2021 Software and Data Integrity Failures",
  "A09:2021 Security Logging and Monitoring Failures",
  "A10:2021 Server-Side Request Forgery",
] as const;

export type OwaspCategory = (typeof OWASP_2021)[number];

// ─── Schema ──────────────────────────────────────────────────────────────────

const SecurityFrontmatterSchema = z.object({
  "threat-model": z.string().min(1),
  "owasp-category": z.enum(OWASP_2021),
  "attack-vector": z.string().min(1),
  "bayesian-prior": z.number().min(0).max(1),
  "bayesian-posterior": z.number().min(0).max(1),
  "cve-reference": z.string().min(1),
});

export type SecurityFrontmatter = z.infer<typeof SecurityFrontmatterSchema>;

// ─── Parser ──────────────────────────────────────────────────────────────────

/** Extract YAML frontmatter from a @security-test JSDoc comment. */
export function parseSecurityFrontmatter(comment: string): SecurityFrontmatter {
  const fenceMatch = comment.match(/\*?\s*---\s*\n([\s\S]*?)\n\s*\*?\s*---/);
  if (!fenceMatch) {
    throw new Error("No frontmatter fences (---) found in comment");
  }

  const yamlBlock = fenceMatch[1];
  const fields: Record<string, unknown> = {};

  for (const line of yamlBlock.split("\n")) {
    const trimmed = line.replace(/^\s*\*?\s*/, "").trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();

    if (key === "bayesian-prior" || key === "bayesian-posterior") {
      fields[key] = parseFloat(value);
    } else {
      fields[key] = value;
    }
  }

  return SecurityFrontmatterSchema.parse(fields);
}

// ─── Bayesian Helpers ────────────────────────────────────────────────────────

/** Compute the probability reduction ratio: posterior / prior. Lower is better. */
export function bayesianReduction(prior: number, posterior: number): number {
  if (prior <= 0) throw new Error("Prior must be > 0");
  return posterior / prior;
}

/** Compound Bayesian reduction across multiple tests. */
export function compoundReduction(
  tests: ReadonlyArray<{ prior: number; posterior: number }>,
): number {
  return tests.reduce(
    (product, t) => product * bayesianReduction(t.prior, t.posterior),
    1,
  );
}
