# Security Review Skill

## Activation

Auto-fires when:
- A file touching authentication, authorisation, or cryptography is saved
- The user runs `/security-review`
- A jade-loop completes a task involving user data or external inputs

## OWASP Top 10 checklist

| # | Vulnerability | Check |
|---|--------------|-------|
| A01 | Broken Access Control | Are all endpoints protected? |
| A02 | Cryptographic Failures | Is sensitive data encrypted at rest and in transit? |
| A03 | Injection | Are all inputs validated/parameterised? |
| A04 | Insecure Design | Does the design follow least-privilege? |
| A05 | Security Misconfiguration | Are defaults secure? |
| A06 | Vulnerable Components | Are deps up to date? |
| A07 | Auth & Session Mgmt | Are JWTs short-lived? Sessions invalidated? |
| A08 | Software Integrity | Is the supply chain verified? |
| A09 | Logging & Monitoring | Are security events logged without PII? |
| A10 | SSRF | Are outbound requests validated? |

## Secrets detection patterns

Look for:
- Regex: `(sk-|sk_|AKIA|ghp_|xoxb-)[A-Za-z0-9]+`
- Env vars accessed directly in code (should be validated at startup)
- `console.log` or `logger.info` with user input or tokens

## STRIDE threat model template

```
| Threat | Component | Mitigation |
|--------|-----------|------------|
| Spoofing | Auth service | JWT + refresh tokens |
| Tampering | API inputs | Zod validation |
| Repudiation | Audit log | Append-only event log |
| Info Disclosure | DB | Encrypted at rest |
| DoS | API | Rate limiting |
| Elevation | Admin routes | RBAC |
```

## Output format

```xml
<security_review>
  <threat_level>high</threat_level>
  <findings>
    <finding severity="critical" file="src/auth.ts" line="42">
      <description>JWT_SECRET hardcoded as literal string.</description>
      <remediation>Read from process.env.JWT_SECRET; validate at startup.</remediation>
    </finding>
  </findings>
</security_review>
```
