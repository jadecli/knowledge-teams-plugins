---
description: "Run a security review on code, a PR, or a system design"
argument-hint: "TARGET [--threat-model] [--compliance soc2|gdpr|hipaa]"
---

# /security-review

Performs a comprehensive security review integrating the patterns from
`claude-code-security-review`.

## Arguments

| Arg | Description |
|-----|-------------|
| `TARGET` | File path, directory, PR number, or system design doc |
| `--threat-model` | Include a full STRIDE threat model |
| `--compliance` | Check against compliance framework |

## What it covers

1. **OWASP Top 10** — injection, broken auth, XSS, IDOR, etc.
2. **Secrets** — hardcoded credentials, leaked API keys
3. **Dependencies** — known CVEs in transitive deps
4. **Prompt injection** (for AI-adjacent code) — see `agent-prompt-injection` skill
5. **Data handling** — PII exposure, logging of sensitive data
6. **Access control** — missing authz checks, privilege escalation

## Output

```xml
<security_review>
  <threat_level>critical|high|medium|low</threat_level>
  <findings>
    <finding cve="CVE-XXXX-XXXX" severity="critical" file="..." line="...">
      <description>...</description>
      <remediation>...</remediation>
    </finding>
  </findings>
  <compliance_gaps framework="soc2">
    <gap control="CC6.1">...</gap>
  </compliance_gaps>
</security_review>
```

## Example

```
/security-review src/auth/
/security-review --pr 42 --threat-model --compliance soc2
```
