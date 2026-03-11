/**
 * Admin SDK helpers for Claude Code enterprise management.
 */

import type {
  LockdownFlags,
  ManagedSettings,
  PermissionRules,
  TelemetryConfig,
} from './types.js';

/**
 * Returns the platform-appropriate path for managed settings deployment.
 */
export function getManagedSettingsPath(): string {
  const platform = process.platform;
  switch (platform) {
    case 'darwin':
      return '/Library/Application Support/ClaudeCode/managed-settings.json';
    case 'win32':
      return 'C:\\Program Files\\ClaudeCode\\managed-settings.json';
    default:
      return '/etc/claude-code/managed-settings.json';
  }
}

/**
 * Builds a managed settings object with sensible enterprise defaults.
 */
export function buildManagedSettings(overrides?: {
  lockdownFlags?: Partial<LockdownFlags>;
  permissions?: Partial<PermissionRules>;
  telemetry?: TelemetryConfig;
}): ManagedSettings {
  const defaultLockdown: LockdownFlags = {
    disableBypassPermissionsMode: true,
    allowManagedPermissionRulesOnly: false,
    allowManagedHooksOnly: false,
    allowManagedMcpServersOnly: false,
  };

  const defaultPermissions: PermissionRules = {
    allow: [
      'Bash(npm run *)',
      'Bash(yarn *)',
      'Bash(pnpm *)',
      'Bash(git status)',
      'Bash(git diff *)',
      'Bash(git log *)',
    ],
    deny: [
      'Bash(sudo *)',
      'Bash(rm -rf *)',
      'Bash(curl *)',
      'Bash(wget *)',
      'Read(./.env*)',
      'Read(./secrets/**)',
      'Read(./**/*.pem)',
      'Read(./**/*.key)',
    ],
  };

  const env: Record<string, string> = {};
  if (overrides?.telemetry?.enabled) {
    env['CLAUDE_CODE_ENABLE_TELEMETRY'] = '1';
    env['OTEL_METRICS_EXPORTER'] = overrides.telemetry.exporter;
    env['OTEL_EXPORTER_OTLP_ENDPOINT'] = overrides.telemetry.endpoint;
    for (const [k, v] of Object.entries(overrides.telemetry.resourceAttributes)) {
      env['OTEL_RESOURCE_ATTRIBUTES'] =
        (env['OTEL_RESOURCE_ATTRIBUTES'] ? env['OTEL_RESOURCE_ATTRIBUTES'] + ',' : '') +
        `${k}=${v}`;
    }
  }

  return {
    lockdownFlags: { ...defaultLockdown, ...overrides?.lockdownFlags },
    permissions: {
      allow: overrides?.permissions?.allow ?? defaultPermissions.allow,
      deny: overrides?.permissions?.deny ?? defaultPermissions.deny,
    },
    env,
  };
}

/**
 * Builds environment variable map for OpenTelemetry configuration.
 */
export function buildTelemetryEnv(config: TelemetryConfig): Record<string, string> {
  if (!config.enabled) {
    return {};
  }

  const env: Record<string, string> = {
    CLAUDE_CODE_ENABLE_TELEMETRY: '1',
    OTEL_METRICS_EXPORTER: config.exporter,
    OTEL_EXPORTER_OTLP_ENDPOINT: config.endpoint,
  };

  const attrs = Object.entries(config.resourceAttributes)
    .map(([k, v]) => `${k}=${v}`)
    .join(',');

  if (attrs) {
    env['OTEL_RESOURCE_ATTRIBUTES'] = attrs;
  }

  return env;
}

/**
 * Scores lockdown configuration completeness (0-100).
 * Higher score = more secure.
 */
export function scoreLockdown(flags: LockdownFlags): number {
  let score = 0;
  if (flags.disableBypassPermissionsMode) score += 40;
  if (flags.allowManagedPermissionRulesOnly) score += 25;
  if (flags.allowManagedHooksOnly) score += 15;
  if (flags.allowManagedMcpServersOnly) score += 20;
  return score;
}
