---
description: "Convene the S-Team council to review a document or decision"
argument-hint: "TOPIC [--doc FILE] [--decision TYPE]"
---

# /s-team

Convenes the **13-seat S-Team council** to review a document or decision.

Each VP agent adopts their domain perspective and challenges assumptions,
proposes big bets, and identifies risks. Outputs a YAML addendum per VP,
then synthesises into unified feedback.

## VP seats

| Seat | Plugin | Domain |
|------|--------|--------|
| CEO | jade-cofounder | Strategy & orchestration |
| CTO | jade-vp-engineering | Engineering & architecture |
| CSO | jade-vp-security | Security & compliance |
| CPO | jade-vp-product | Product & roadmap |
| CRO | jade-vp-sales | Revenue & pipeline |
| CMO | jade-vp-marketing | Marketing & brand |
| CFO | jade-vp-finance | Finance & operations |
| CDO | jade-vp-data | Data & analytics |
| CCO | jade-vp-support | Customer success |
| CLO | jade-vp-legal | Legal & compliance |
| CSO₂ | jade-vp-search | Search & knowledge |
| CRO₂ | jade-vp-research | Research & innovation |
| CPO₂ | jade-vp-productivity | Productivity & tooling |

## Example

```
/s-team "Review Q1 OP1 draft" --doc docs/planning/op1-2026.md
/s-team "Decide on Neon vs PlanetScale" --decision two-way-door
```
