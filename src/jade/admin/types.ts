/**
 * TypeScript types for the jade-vp-admin plugin.
 * Covers settings management, usage analytics, cost controls, and security policies.
 */

/** Organization billing model */
export type BillingPlan = 'teams' | 'enterprise' | 'api';

/** Claude Code permission mode */
export type PermissionMode = 'default' | 'acceptEdits' | 'plan' | 'dontAsk' | 'bypassPermissions';

/** Audit finding severity */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** Audit domain category */
export type AuditDomain = 'settings' | 'usage' | 'costs' | 'security';

/** Audit overall status */
export type AuditStatus = 'healthy' | 'needs-attention' | 'critical';

/** Managed settings lockdown flags */
export interface LockdownFlags {
  readonly disableBypassPermissionsMode: boolean;
  readonly allowManagedPermissionRulesOnly: boolean;
  readonly allowManagedHooksOnly: boolean;
  readonly allowManagedMcpServersOnly: boolean;
}

/** Permission rules for allow/deny lists */
export interface PermissionRules {
  readonly allow: readonly string[];
  readonly deny: readonly string[];
}

/** MCP server policy entry */
export interface McpServerPolicy {
  readonly serverName?: string;
  readonly serverUrl?: string;
  readonly serverCommand?: readonly string[];
}

/** Managed settings configuration */
export interface ManagedSettings {
  readonly lockdownFlags: LockdownFlags;
  readonly permissions: PermissionRules;
  readonly env: Record<string, string>;
  readonly allowedMcpServers?: readonly McpServerPolicy[];
  readonly deniedMcpServers?: readonly McpServerPolicy[];
}

/** OpenTelemetry configuration for usage monitoring */
export interface TelemetryConfig {
  readonly enabled: boolean;
  readonly exporter: 'otlp' | 'none';
  readonly endpoint: string;
  readonly resourceAttributes: Record<string, string>;
}

/** Token usage breakdown */
export interface TokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheWriteTokens: number;
}

/** Cost breakdown by model */
export interface ModelCost {
  readonly model: string;
  readonly tokenUsage: TokenUsage;
  readonly costUsd: number;
  readonly percentage: number;
}

/** Per-team cost allocation */
export interface TeamCost {
  readonly teamId: string;
  readonly costUsd: number;
  readonly percentage: number;
  readonly userCount: number;
}

/** Usage report for a period */
export interface UsageReport {
  readonly organizationId: string;
  readonly period: { readonly start: string; readonly end: string };
  readonly totalSessions: number;
  readonly activeUsers: number;
  readonly totalTokens: TokenUsage;
  readonly totalCostUsd: number;
  readonly totalPrs: number;
  readonly totalCommits: number;
  readonly byModel: readonly ModelCost[];
  readonly byTeam: readonly TeamCost[];
}

/** Cost optimization action */
export interface OptimizationAction {
  readonly priority: Severity;
  readonly action: string;
  readonly estimatedSavingsUsd: number;
  readonly reason: string;
}

/** Audit finding */
export interface AuditFinding {
  readonly severity: Severity;
  readonly domain: AuditDomain;
  readonly finding: string;
  readonly remediation: string;
  readonly configExample?: string;
}

/** Domain audit result */
export interface DomainAudit {
  readonly domain: AuditDomain;
  readonly score: number;
  readonly status: AuditStatus;
  readonly findings: readonly AuditFinding[];
  readonly topRisks: readonly string[];
}

/** Executive audit synthesis */
export interface AuditSynthesis {
  readonly organizationId: string;
  readonly auditedAt: string;
  readonly overallScore: number;
  readonly overallStatus: AuditStatus;
  readonly domainScores: Record<AuditDomain, number>;
  readonly criticalFindings: number;
  readonly highFindings: number;
  readonly topActions: readonly {
    readonly priority: number;
    readonly domain: AuditDomain;
    readonly action: string;
    readonly impact: string;
    readonly effort: 'low' | 'medium' | 'high';
  }[];
  readonly estimatedMonthlySavingsUsd: number;
  readonly complianceGaps: readonly string[];
}

/** Onboarding phase status */
export interface OnboardingStatus {
  readonly organization: {
    readonly created: boolean;
    readonly domainCapture: boolean;
    readonly billingConfigured: boolean;
  };
  readonly authentication: {
    readonly ssoEnabled: boolean;
    readonly jitProvisioning: boolean;
    readonly apiKeysCreated: boolean;
  };
  readonly policies: {
    readonly managedSettingsDeployed: boolean;
    readonly permissionRulesConfigured: boolean;
    readonly bypassModeDisabled: boolean;
    readonly mcpServersRestricted: boolean;
  };
  readonly monitoring: {
    readonly telemetryEnabled: boolean;
    readonly dashboardsConfigured: boolean;
    readonly alertsConfigured: boolean;
  };
  readonly completionPercentage: number;
}
