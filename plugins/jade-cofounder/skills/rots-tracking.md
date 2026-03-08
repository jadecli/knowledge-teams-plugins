# ROTS — Return on Token Spend

## Activation

Auto-fires on jade-loop completion, during WBR/MBR/QBR reviews, and when
budget allocation decisions are being made.

## Formula

```
ROTS = Value Delivered / Token Cost (USD)
```

## Value proxies by domain

| Domain | Value proxy | Unit |
|--------|------------|------|
| Engineering | Story points shipped | SP/$ |
| Security | CVEs closed | CVEs/$ |
| Product | Features launched | features/$ |
| Sales | ARR pipeline created | $ARR/$ |
| Marketing | MQLs generated | MQLs/$ |
| Finance | Hours saved | hrs/$ |
| Data | Dashboards delivered | dashboards/$ |
| Support | Tickets resolved | tickets/$ |
| Legal | Contracts reviewed | contracts/$ |
| Research | Insights produced | insights/$ |

## Benchmarks (initial targets)

| ROTS range | Interpretation |
|------------|---------------|
| < 1 | Below baseline — review agent effectiveness |
| 1–10 | Acceptable — routine work |
| 10–100 | Good — high-leverage automation |
| > 100 | Exceptional — compounding returns |

## Tracking

ROTS is persisted in `.claude/jade-loop.local.md` after each loop:

```yaml
rots: 42.5
```

And aggregated in `docs/reviews/rots-{PERIOD}.md` during WBR/MBR/QBR cycles.

## Improving ROTS

1. **Narrow the task** — smaller, well-defined tasks have higher ROTS
2. **Better prompts** — clearer instructions reduce wasted tokens
3. **Right model** — use Haiku for simple tasks, Opus only for complex reasoning
4. **Cache context** — use prompt caching for repeated context
5. **Parallelise** — more agents × higher parallelism = better throughput per dollar
