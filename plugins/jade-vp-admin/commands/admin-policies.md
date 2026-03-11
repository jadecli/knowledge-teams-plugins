---
description: "Audit security policies, permissions, and compliance posture"
argument-hint: "[--org ORG_ID] [--checklist] [--remediate]"
---

# /admin-policies

Audits the security and compliance posture of Claude Code across the
organization, scoring against best practices and generating remediation plans.

## Options

- `--org ORG_ID` — Organization identifier
- `--checklist` — Run the full security audit checklist
- `--remediate` — Generate remediation configuration files

## Output

Produces a security audit with: authentication status, permission hardening
score, sandboxing coverage, data handling compliance, audit hook coverage,
risk score (0-100), and prioritized findings with remediation steps.
