---
description: "Run annual OP1 planning process with the S-Team council"
argument-hint: "[--year YEAR] [--context FILE]"
---

# /op1

Drives the annual **OP1 → OP2 planning** cycle using the Working Backwards
methodology and S-Team council review.

## Process

1. **Narratives** — Collect 6-page narrative documents from each VP.
2. **S-Team review** — Convene `/s-team` council to challenge assumptions.
3. **Big bets** — Identify 3–5 transformational initiatives.
4. **Goal tree** — Decompose into measurable goals (G1, G2, …).
5. **Resource allocation** — Map token budgets to goals.
6. **OP2 commit** — Lock commitments after mid-year review.

## Output

Produces `docs/planning/op1-{YEAR}.md` with:
- Vision statement
- Goal tree with success metrics
- Big bets table
- S-Team feedback YAML
- Resource allocation table

## Example

```
/op1 --year 2026
/op1 --year 2026 --context docs/context/market-analysis.md
```
