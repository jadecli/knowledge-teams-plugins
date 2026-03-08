# Contract Review Skill

## Activation

Auto-fires when the user uploads or pastes contract text, or runs
`/contract-review`.

**DISCLAIMER**: This skill provides AI-assisted analysis for informational
purposes only. It does not constitute legal advice. Always consult a
qualified lawyer for binding legal decisions.

## Risky clause patterns

### Indemnification
- Unlimited liability → flag as critical
- One-sided indemnification → flag as high
- Mutual indemnification capped at contract value → acceptable

### IP assignment
- "Work made for hire" covering pre-existing IP → flag as critical
- Broad assignment of IP created outside work scope → flag as high

### Non-compete / non-solicitation
- Temporal scope > 1 year → flag as high
- Geographic scope > jurisdiction of work → flag as high

### Termination
- Termination for convenience without cure period → flag as medium
- Automatic renewal without notice → flag as medium

### Data handling
- Transfer of customer data to third parties → flag as critical (GDPR)
- No DPA (Data Processing Agreement) for EU data → flag as critical

## Output format

```xml
<contract_review>
  <risk_summary level="critical|high|medium|low"/>
  <clauses>
    <clause section="3.2" risk="critical">
      <text>...</text>
      <concern>...</concern>
      <recommendation>...</recommendation>
    </clause>
  </clauses>
  <disclaimer>AI analysis only. Not legal advice.</disclaimer>
</contract_review>
```
