# Enterprise Onboarding & Provisioning Skill

## Activation

Auto-fires when:
- The user asks about setting up Claude Code for a team or organization
- The user runs `/admin-onboard`
- A jade-loop task involves provisioning Claude Code for new teams

## Scope

End-to-end guide for IT admins deploying Claude Code across an organization, from initial setup through ongoing management.

## Phase 1: Organization Setup

### Choose Billing Model

| Plan | Best For | Claude Code Access |
|------|----------|-------------------|
| Claude for Teams | Small-medium teams | Included per seat |
| Claude for Enterprise | Large organizations | Included per seat |
| API Console | Developer teams, CI/CD | Via API key billing |

### Create Organization

1. Go to `https://claude.ai/admin-settings`
2. Create organization with business email domain
3. Set organization display name
4. Configure domain capture for auto-routing

### Admin Roles

| Role | Capabilities |
|------|-------------|
| Primary Owner | Full access, billing, can transfer ownership |
| Owner | Manage members, settings, billing |
| Member | Use Claude Code under organization policies |

## Phase 2: Authentication

### SSO Setup (Enterprise)

1. Navigate to `Admin Settings > Authentication`
2. Choose provider: Okta, Azure AD, Google Workspace, OneLogin, custom SAML
3. Configure SAML 2.0 or OIDC endpoints
4. Enable domain capture for automatic routing
5. Enable JIT provisioning for new users

### API Key Management

1. Create team-level API keys at `console.anthropic.com`
2. Set per-key spending limits
3. Assign descriptive names per team/project
4. Rotate keys on schedule (recommend: 90 days)

## Phase 3: Policy Configuration

### Deploy Managed Settings

Choose deployment method:

**Option A: Server-Managed (Recommended for most)**
1. Open `Admin Settings > Claude Code > Managed settings`
2. Define JSON settings
3. Settings auto-apply on next startup or hourly poll

**Option B: Endpoint-Managed (MDM)**
1. Deploy `managed-settings.json` to system directory
2. Use MDM profile (Jamf/Kandji for macOS, Intune/GPO for Windows)

### Recommended Initial Policy

```json
{
  "disableBypassPermissionsMode": true,
  "allowManagedPermissionRulesOnly": false,
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(yarn *)",
      "Bash(pnpm *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ],
    "deny": [
      "Bash(sudo *)",
      "Bash(rm -rf *)",
      "Read(./.env*)",
      "Read(./secrets/**)"
    ]
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://your-collector:4317"
  }
}
```

## Phase 4: Distribution

### Desktop App Deployment

| Platform | Method | Package |
|----------|--------|---------|
| macOS | MDM (Jamf/Kandji) | `.dmg` installer |
| Windows | MDM (Intune) / GPO | MSIX or `.exe` silent install |
| Linux | Package manager | `.deb` / `.rpm` / snap |

### CLI Installation

```bash
# npm global install
npm install -g @anthropic-ai/claude-code

# Or via npx (no install)
npx @anthropic-ai/claude-code
```

### IDE Extensions

| IDE | Extension |
|-----|-----------|
| VS Code | Claude Code extension from marketplace |
| JetBrains | Claude Code plugin from marketplace |

## Phase 5: Team Project Setup

### Standard Project Configuration

Create `.claude/settings.json` in each repository:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run test *)",
      "Bash(npm run build *)"
    ]
  }
}
```

### Organization CLAUDE.md Template

Create a standard `CLAUDE.md` for all repositories:

```markdown
# Project Standards

## Code Quality
- All TypeScript must use strict mode
- Tests required for new features
- PR reviews required before merge

## Security
- No secrets in code
- Use environment variables for configuration
- Follow OWASP top 10 guidelines
```

## Phase 6: Monitoring Setup

1. Deploy OpenTelemetry collector
2. Configure Grafana dashboards (see usage-analytics skill)
3. Set up alerts for anomalous usage
4. Schedule monthly usage reviews

## Onboarding Checklist

```yaml
onboarding_status:
  organization:
    created: true|false
    domain_capture: true|false
    billing_configured: true|false
  authentication:
    sso_enabled: true|false
    jit_provisioning: true|false
    api_keys_created: true|false
  policies:
    managed_settings_deployed: true|false
    permission_rules_configured: true|false
    bypass_mode_disabled: true|false
    mcp_servers_restricted: true|false
  distribution:
    desktop_deployed: true|false
    cli_available: true|false
    ide_extensions: true|false
  monitoring:
    telemetry_enabled: true|false
    dashboards_configured: true|false
    alerts_configured: true|false
  project_standards:
    claude_md_template: true|false
    project_settings_template: true|false
  completion_percentage: "0%"
```
