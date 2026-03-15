import { describe, it, expect } from "vitest";
import {
  parseSecurityFrontmatter,
  bayesianReduction,
  compoundReduction,
} from "./security-frontmatter.js";

describe("security-frontmatter/parseSecurityFrontmatter", () => {
  it("parses valid frontmatter", () => {
    const comment = `
      /**
       * @security-test
       * ---
       * threat-model: SQL injection via tool name
       * owasp-category: A03:2021 Injection
       * attack-vector: Malicious toolName passed to logToolCall
       * bayesian-prior: 0.10
       * bayesian-posterior: 0.01
       * cve-reference: N/A (preventive)
       * ---
       */
    `;
    const fm = parseSecurityFrontmatter(comment);
    expect(fm["threat-model"]).toBe("SQL injection via tool name");
    expect(fm["owasp-category"]).toBe("A03:2021 Injection");
    expect(fm["bayesian-prior"]).toBe(0.1);
    expect(fm["bayesian-posterior"]).toBe(0.01);
  });

  it("rejects missing fences", () => {
    expect(() => parseSecurityFrontmatter("no fences here")).toThrow(
      "No frontmatter fences",
    );
  });

  it("rejects invalid owasp-category format", () => {
    const comment = `---
threat-model: test
owasp-category: invalid
attack-vector: test
bayesian-prior: 0.1
bayesian-posterior: 0.01
cve-reference: N/A
---`;
    expect(() => parseSecurityFrontmatter(comment)).toThrow();
  });

  it("rejects bayesian-posterior > 1", () => {
    const comment = `---
threat-model: test
owasp-category: A01:2021 Broken Access Control
attack-vector: test
bayesian-prior: 0.5
bayesian-posterior: 1.5
cve-reference: N/A
---`;
    expect(() => parseSecurityFrontmatter(comment)).toThrow();
  });
});

describe("security-frontmatter/bayesianReduction", () => {
  it("computes reduction ratio", () => {
    expect(bayesianReduction(0.2, 0.02)).toBeCloseTo(0.1);
  });

  it("throws on zero prior", () => {
    expect(() => bayesianReduction(0, 0.01)).toThrow("Prior must be > 0");
  });
});

describe("security-frontmatter/compoundReduction", () => {
  it("compounds multiple test reductions", () => {
    const tests = [
      { prior: 0.2, posterior: 0.04 }, // 0.2 ratio
      { prior: 0.3, posterior: 0.06 }, // 0.2 ratio
    ];
    // 0.2 × 0.2 = 0.04
    expect(compoundReduction(tests)).toBeCloseTo(0.04);
  });

  it("returns 1 for empty array", () => {
    expect(compoundReduction([])).toBe(1);
  });
});
