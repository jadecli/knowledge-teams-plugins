# Security Policies & Compliance Skill

## Activation

Auto-fires when:
- The user asks about Claude Code security, compliance, or access controls
- The user runs `/admin-policies`
- A jade-loop task involves enterprise security configuration

## Scope

Covers security hardening, access controls, compliance configuration, and audit capabilities for Claude Code in enterprise environments.

## Authentication & Identity

### SSO/SAML Configuration (Enterprise)

- SAML 2.0 and OIDC support (via WorkOS backend)
- Supported IdPs: Okta, Azure AD (Entra), Google Workspace, Ping Identity, custom SAML 2.0
- Domain capture — auto-route users with matching email domains to org SSO
- JIT provisioning — create accounts on first SSO login
- SCIM 2.0 — automated provisioning/deprovisioning from IdP (requires 70+ users)
- Advanced Group Mappings — IdP groups prefixed `anthropic-` auto-assign roles
- Managed via: `https://claude.ai/admin-settings/authentication`

### Auth Modes for Claude Code

| Mode | Source | Use Case |
|------|--------|----------|
| `pro-max` | Claude Code session token | Default, zero config |
| `api-key` | `ANTHROPIC_API_KEY` env var | API billing |
| `enterprise` | `JADE_ENTERPRISE_API_KEY` env var | Enterprise routing |

### Cloud Provider Authentication

- **AWS Bedrock** — IAM roles, STS assume-role
- **Google Vertex AI** — Service account, ADC
- **Microsoft Foundry** — Entra ID, managed identity

## Permission Hardening

### Recommended Enterprise Permission Rules

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run test *)",
      "Bash(npm run build *)",
      "Bash(npm run lint *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Read(src/**)",
      "Read(tests/**)",
      "Read(docs/**)"
    ],
    "deny": [
      "Bash(curl *)",
      "Bash(wget *)",
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Bash(chmod *)",
      "Bash(ssh *)",
      "Read(./.env*)",
      "Read(./secrets/**)",
      "Read(./**/credentials*)",
      "Read(./**/*.pem)",
      "Read(./**/*.key)",
      "WebFetch(*)"
    ]
  }
}
```

### Sandboxing

Available on macOS, Linux, WSL2:
- Filesystem isolation — restrict to project directory
- Network isolation — block outbound from Bash
- Process isolation — limit spawnable processes

## Hooks for Security Audit

### Pre-Tool Audit Hook

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "/usr/local/bin/claude-audit-pre.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash|Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "/usr/local/bin/claude-audit-post.sh"
          }
        ]
      }
    ]
  }
}
```

### Prompt Validation Hook

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/usr/local/bin/claude-prompt-filter.sh"
          }
        ]
      }
    ]
  }
}
```

## Data Handling & Compliance

### Data Residency Options

| Option | Data Flow | Features |
|--------|-----------|----------|
| Default | Anthropic API (US) | Full feature set |
| Zero Data Retention (ZDR) | Anthropic API, no storage | Reduced features |
| AWS Bedrock | Within AWS region | AWS compliance |
| Google Vertex AI | Within GCP region | GCP compliance |
| Microsoft Foundry | Within Azure region | Azure compliance |

### ZDR Limitations

When Zero Data Retention is active:
- Auto-memory disabled
- Code review features limited
- Conversation history not persisted server-side
- Audit logging available for policy violations

### Compliance Frameworks

Claude Code enterprise supports:
- SOC 2 Type II
- HIPAA (via BAA with Anthropic)
- GDPR (data processing agreement)
- FedRAMP (via AWS GovCloud/Bedrock)

## Desktop Admin Console Security Controls

Configured at: `https://claude.ai/admin-settings/claude-code`

| Control | Effect |
|---------|--------|
| Enable/disable Code tab | Toggle Claude Code access |
| Disable Bypass permissions mode | Prevent unrestricted execution |
| Disable remote sessions | Block web-based access |

## Security Audit Checklist

1. **Managed settings deployed** — Are lockdown flags active?
2. **SSO enforced** — Is domain capture enabled?
3. **Permission rules reviewed** — Are deny rules comprehensive?
4. **Sensitive files blocked** — .env, secrets, keys in deny list?
5. **Sandboxing enabled** — Filesystem and network isolation?
6. **Audit hooks configured** — Pre/post tool use logging?
7. **MCP servers restricted** — Allowlist-only mode?
8. **Plugin marketplace locked** — Only approved sources?
9. **Bypass mode disabled** — `disableBypassPermissionsMode: true`?
10. **Data residency chosen** — Appropriate for compliance needs?

## Output Format

```yaml
security_audit:
  organization_id: "org-..."
  timestamp: "YYYY-MM-DDThh:mm:ssZ"
  authentication:
    sso_enabled: true|false
    sso_provider: "..."
    domain_capture: true|false
    auth_mode: pro-max|api-key|enterprise
  permissions:
    mode: default|acceptEdits|plan|dontAsk|bypassPermissions
    bypass_disabled: true|false
    managed_only: true|false
    allow_rules: N
    deny_rules: N
  sandboxing:
    enabled: true|false
    filesystem_isolation: true|false
    network_isolation: true|false
  data_handling:
    residency: anthropic|bedrock|vertex|foundry
    zdr_enabled: true|false
    compliance: [SOC2, HIPAA, GDPR, ...]
  audit_hooks:
    pre_tool: true|false
    post_tool: true|false
    prompt_validation: true|false
  risk_score: 0-100
  findings:
    - severity: critical|high|medium|low
      finding: "..."
      remediation: "..."
```
