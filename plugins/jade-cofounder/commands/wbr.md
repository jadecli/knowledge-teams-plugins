---
description: "Run Weekly Business Review with S-Team metrics"
argument-hint: "[--week YYYY-WNN] [--data FILE]"
---

# /wbr

Conducts a **Weekly Business Review** (WBR) — a structured review of the
previous week's metrics against targets, with red/yellow/green status for each
S-Team domain.

## Review areas

| Domain | Owner | Key metrics |
|--------|-------|-------------|
| Engineering | jade-vp-engineering | Deployment freq, DORA, open PRs |
| Security | jade-vp-security | CVE count, open findings |
| Product | jade-vp-product | Feature velocity, NPS |
| Sales | jade-vp-sales | Pipeline, ARR delta |
| Marketing | jade-vp-marketing | CAC, MQL volume |
| Finance | jade-vp-finance | Burn, runway |
| Data | jade-vp-data | Data freshness, query SLAs |
| Support | jade-vp-support | CSAT, P1 tickets open |

## Output

Produces a WBR summary in `docs/reviews/wbr-{WEEK}.md` with traffic-light
status per domain and action items for the coming week.
