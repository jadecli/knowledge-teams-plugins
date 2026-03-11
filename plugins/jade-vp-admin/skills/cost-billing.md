# Cost & Billing Management Skill

## Activation

Auto-fires when:
- The user asks about Claude costs, billing, spending limits, or budgets
- The user runs `/admin-costs`
- A jade-loop task involves cost optimization or billing review

## Scope

Manages cost controls, billing configuration, and spend optimization across three Claude billing surfaces:

1. **Claude for Teams/Enterprise** — Per-seat subscription billing
2. **Anthropic API Console** — Token-based usage billing
3. **Claude Code** — Covered by Teams/Enterprise seat or API billing

## Billing Models

### Claude for Teams

| Feature | Details |
|---------|---------|
| Pricing | Per-seat/month subscription |
| Billing | Centralized to organization admin |
| Controls | Add/remove seats, spending limits |
| Dashboard | `https://claude.ai/admin-settings/billing` |

### Claude for Enterprise

| Feature | Details |
|---------|---------|
| Pricing | Custom contract, volume discounts |
| Billing | Invoice-based, custom terms |
| Controls | Department allocation, usage caps |
| Dashboard | Dedicated admin portal |

### API Console Billing

| Feature | Details |
|---------|---------|
| Pricing | Per-token (input/output), per-model |
| Billing | Prepaid credits or auto-billing |
| Controls | Spending limits, rate limits, API key budgets |
| Dashboard | `https://console.anthropic.com/settings/billing` |

## Current Model Pricing (March 2026)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude Opus 4.6 | $15.00 | $75.00 |
| Claude Sonnet 4.6 | $3.00 | $15.00 |
| Claude Haiku 4.5 | $0.80 | $4.00 |

**Prompt caching discounts**: 90% off cached input tokens, 25% off cache write tokens.

## Cost Control Strategies

### 1. Spending Limits (API Console)

Set at `https://console.anthropic.com/settings/limits`:
- **Monthly hard limit** — Stops API calls when reached
- **Monthly notification threshold** — Email alert at percentage
- **Per-key limits** — Individual API key budgets

### 2. Model Routing

Route tasks to cost-appropriate models:

| Task Type | Recommended Model | Cost Impact |
|-----------|-------------------|-------------|
| Code review, architecture | Opus 4.6 | Highest quality |
| Standard coding, edits | Sonnet 4.6 | Best value |
| Linting, formatting, simple Q&A | Haiku 4.5 | Lowest cost |

### 3. Prompt Caching

Enable prompt caching for repeated system prompts:
- S-Team role prompts — cache across sessions
- CLAUDE.md project instructions — cache per project
- Reduces input costs by up to 90%

### 4. Budget Controls in jade-loop

Leverage existing `BudgetConfig` for task-level limits:

```typescript
interface BudgetConfig {
  maxTokens: number;       // Token ceiling per task
  maxUsd: number;          // Dollar ceiling per task
  maxIterations: number;   // Iteration limit
  escalationThresholdFraction: number; // Escalate at % spent
}
```

### 5. Team-Level Cost Allocation

Use OTEL resource attributes for chargebacks:

```json
{
  "env": {
    "OTEL_RESOURCE_ATTRIBUTES": "department=engineering,team.id=platform,cost_center=eng-123"
  }
}
```

## Cost Optimization Checklist

1. **Audit model usage** — Are expensive models used for simple tasks?
2. **Enable prompt caching** — Are system prompts cached?
3. **Set spending limits** — Are hard limits configured?
4. **Review per-user usage** — Any outlier consumption?
5. **Right-size context** — Are unnecessarily large files loaded?
6. **Consolidate API keys** — Reduce sprawl, improve visibility
7. **Use batch API** — For non-real-time workloads (50% savings)

## Output Format

```yaml
cost_report:
  organization_id: "org-..."
  period:
    start: "YYYY-MM-DD"
    end: "YYYY-MM-DD"
  billing_model: teams|enterprise|api
  total_spend_usd: "0.00"
  budget_remaining_usd: "0.00"
  spending_limit_usd: "0.00"
  by_model:
    - model: claude-opus-4-6
      input_tokens: N
      output_tokens: N
      cost_usd: "0.00"
      percentage: "0%"
  by_team:
    - team_id: "..."
      cost_usd: "0.00"
      percentage: "0%"
  prompt_caching:
    enabled: true|false
    savings_usd: "0.00"
    cache_hit_rate: "0%"
  optimization_actions:
    - priority: high
      action: "..."
      estimated_savings_usd: "0.00"
      reason: "..."
```
