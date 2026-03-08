# SQL Generation Skill

## Activation

Auto-fires when the user asks a data question, mentions a metric, or
asks "how many X" / "what is the Y of Z".

## Query quality checklist

- [ ] CTEs over nested subqueries (readability)
- [ ] Explicit column lists (no `SELECT *` in production)
- [ ] Appropriate indexes assumed
- [ ] Window functions for time-series analysis
- [ ] NULLS handled explicitly
- [ ] LIMIT added for exploratory queries

## WBR metric patterns

```sql
-- MoM growth
WITH monthly AS (
  SELECT
    date_trunc('month', created_at) AS month,
    sum(amount) AS revenue
  FROM orders
  GROUP BY 1
)
SELECT
  month,
  revenue,
  lag(revenue) OVER (ORDER BY month) AS prev_month,
  round(100.0 * (revenue - lag(revenue) OVER (ORDER BY month))
        / nullif(lag(revenue) OVER (ORDER BY month), 0), 1) AS mom_pct
FROM monthly
ORDER BY month DESC
LIMIT 6;
```
