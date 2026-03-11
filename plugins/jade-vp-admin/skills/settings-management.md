# Claude Code Settings Management Skill

## Activation

Auto-fires when:
- The user asks about Claude Code configuration, settings, or policies
- The user runs `/admin-settings`
- A jade-loop task involves organization-wide Claude Code setup

## Scope

Manages the 4-tier Claude Code settings hierarchy for teams and enterprises:

| Tier | Location | Scope | Shared |
|------|----------|-------|--------|
| **Managed** | System-level (MDM/registry) | All users on machine | IT-deployed |
| **User** | `~/.claude/settings.json` | Individual, all projects | No |
| **Project** | `.claude/settings.json` | All collaborators | Yes (git) |
| **Local** | `.claude/settings.local.json` | Individual, one repo | No (gitignored) |

**Precedence**: Managed > CLI args > Local > Project > User

## Managed Settings Deployment

### Server-Managed (no MDM required)

Configure at: `https://claude.ai/admin-settings/claude-code`

Settings apply on next startup or hourly polling. JSON payload:

```json
{
  "permissions": {
    "allow": ["Bash(npm run test *)", "Read(src/**)"],
    "deny": ["Bash(curl *)", "Read(./.env)", "Read(./secrets/**)"]
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://collector.example.com:4317"
  }
}
```

### Endpoint-Managed (MDM/OS-level)

| Platform | Path |
|----------|------|
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux/WSL | `/etc/claude-code/managed-settings.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-settings.json` |

MDM tools: Jamf, Kandji (macOS plist `com.anthropic.Claude`), Intune/GPO (Windows registry `SOFTWARE\Policies\Claude`).

## Enterprise Lockdown Options

Admin-only flags in managed settings:

| Setting | Effect |
|---------|--------|
| `disableBypassPermissionsMode` | Prevents bypass mode globally |
| `allowManagedPermissionRulesOnly` | Only managed permission rules apply |
| `allowManagedHooksOnly` | Only managed hooks execute |
| `allowManagedMcpServersOnly` | Only managed MCP servers connect |

## Permission Modes

| Mode | Behavior |
|------|----------|
| `default` | Prompts on first use |
| `acceptEdits` | Auto-accepts file edits, asks for commands |
| `plan` | Analyze only, no modifications |
| `dontAsk` | Auto-denies unless pre-approved |
| `bypassPermissions` | Skips all prompts (sandboxed environments only) |

## MCP Server Controls

**Exclusive control** via `managed-mcp.json` deployed to system directories.

**Policy-based control** via allowlist/denylist:

```json
{
  "allowedMcpServers": [
    { "serverName": "github" },
    { "serverUrl": "https://mcp.company.com/*" },
    { "serverCommand": ["npx", "-y", "approved-package"] }
  ],
  "deniedMcpServers": [
    { "serverUrl": "https://*.untrusted.com/*" }
  ]
}
```

## Plugin Marketplace Restrictions

```json
{
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "acme-corp/approved-plugins" },
    { "source": "hostPattern", "hostPattern": "^github\\.example\\.com$" }
  ]
}
```

- `undefined` — No restrictions (default)
- `[]` — Complete lockdown
- List — Only specified marketplaces

## Network & Proxy Configuration

- Custom HTTP/HTTPS proxies
- Custom CA certificates and mTLS
- LLM gateway routing (LiteLLM, Bedrock, Vertex, Foundry)
- `ANTHROPIC_BASE_URL` for custom endpoints

## Output Format

Produce structured YAML:

```yaml
settings_audit:
  organization_id: "org-..."
  timestamp: "YYYY-MM-DDThh:mm:ssZ"
  managed_settings:
    source: server | endpoint | none
    lockdown_flags:
      disableBypassPermissionsMode: true|false
      allowManagedPermissionRulesOnly: true|false
      allowManagedHooksOnly: true|false
      allowManagedMcpServersOnly: true|false
  permission_mode: default|acceptEdits|plan|dontAsk|bypassPermissions
  permission_rules:
    allow: [...]
    deny: [...]
  mcp_servers:
    managed: [...]
    user_added: [...]
    policy: allowlist|denylist|unrestricted
  plugin_marketplace:
    policy: unrestricted|locked|allowlist
    sources: [...]
  recommendations:
    - priority: high
      action: "..."
      reason: "..."
```
