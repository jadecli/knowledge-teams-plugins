# Usage Analytics & Monitoring Skill

## Activation

Auto-fires when:
- The user asks about Claude Code usage, metrics, or analytics
- The user runs `/admin-usage`
- A jade-loop task involves usage reporting or monitoring setup

## Scope

Covers three pillars of Claude Code usage visibility:

1. **Anthropic Admin Dashboard** — Web-based analytics
2. **OpenTelemetry Integration** — Custom metrics pipeline
3. **API Usage Endpoints** — Programmatic access

## Admin Dashboard Analytics

Available at: `https://claude.ai/admin-settings/analytics`

For Teams/Enterprise plans:
- Adoption tracking (active users, session counts)
- PRs created per user
- Code contribution metrics (lines modified, commits)
- Top contributor identification
- ROI measurement (estimated hours saved)

## OpenTelemetry Setup

### Enable via Managed Settings

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://collector.example.com:4317",
    "OTEL_RESOURCE_ATTRIBUTES": "department=engineering,team.id=platform,cost_center=eng-123"
  }
}
```

### Available Metrics

| Metric | Description | Labels |
|--------|-------------|--------|
| `claude_code.session.count` | Sessions started | user, team |
| `claude_code.token.usage` | Token consumption | model, type (input/output) |
| `claude_code.cost.usage` | Cost in USD | model, user |
| `claude_code.lines_of_code.count` | Code modifications | language, action |
| `claude_code.commit.count` | Git commits | repo, user |
| `claude_code.pull_request.count` | PRs created | repo, user |
| `claude_code.active_time.total` | Active time (seconds) | user |

### Available Events

| Event | Description |
|-------|-------------|
| `claude_code.user_prompt` | User submissions |
| `claude_code.tool_result` | Tool executions |
| `claude_code.api_request` | API calls made |
| `claude_code.api_error` | API failures |
| `claude_code.tool_decision` | Permission decisions |

### Multi-Team Attribution

Use `OTEL_RESOURCE_ATTRIBUTES` for cost allocation:

```bash
OTEL_RESOURCE_ATTRIBUTES="department=engineering,team.id=platform,cost_center=eng-123"
```

## Anthropic Admin API Endpoints

### Organization Usage

```bash
# Get organization usage summary
curl -H "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  "https://api.anthropic.com/v1/organizations/{org_id}/usage?start_date=2026-03-01&end_date=2026-03-11"

# List workspace members
curl -H "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  "https://api.anthropic.com/v1/organizations/{org_id}/members"

# Get API key usage breakdown
curl -H "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  "https://api.anthropic.com/v1/organizations/{org_id}/api_keys"
```

### Rate Limits

```bash
# View current rate limits
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
  "https://api.anthropic.com/v1/rate_limits"
```

## Recommended Observability Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| Collector | OpenTelemetry Collector | Receives OTLP metrics |
| Storage | Prometheus / InfluxDB | Time-series metrics |
| Dashboards | Grafana / Datadog | Visualization |
| Alerting | PagerDuty / OpsGenie | Threshold alerts |

### Sample Grafana Dashboard Panels

1. **Token Usage Over Time** — `claude_code.token.usage` by model
2. **Cost Per Team** — `claude_code.cost.usage` grouped by `team.id`
3. **Active Users** — `claude_code.session.count` unique users/day
4. **Error Rate** — `claude_code.api_error` / `claude_code.api_request`
5. **PR Velocity** — `claude_code.pull_request.count` per week

## Output Format

```yaml
usage_report:
  organization_id: "org-..."
  period:
    start: "YYYY-MM-DD"
    end: "YYYY-MM-DD"
  summary:
    total_sessions: N
    active_users: N
    total_tokens:
      input: N
      output: N
    total_cost_usd: "0.00"
    total_prs: N
    total_commits: N
  by_team:
    - team_id: "..."
      users: N
      tokens: N
      cost_usd: "0.00"
  by_user:
    - user_id: "..."
      sessions: N
      tokens: N
      cost_usd: "0.00"
      prs: N
  telemetry_status:
    enabled: true|false
    exporter: otlp|none
    endpoint: "..."
  recommendations:
    - priority: high
      action: "..."
      reason: "..."
```
