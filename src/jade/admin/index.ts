/**
 * jade-vp-admin SDK entry point.
 * Re-exports admin types, utilities, and API client.
 */

// Types
export type {
  BillingPlan,
  PermissionMode,
  Severity,
  AuditDomain,
  AuditStatus,
  LockdownFlags,
  PermissionRules,
  McpServerPolicy,
  ManagedSettings,
  TelemetryConfig,
  TokenUsage,
  ModelCost,
  TeamCost,
  UsageReport,
  OptimizationAction,
  AuditFinding,
  DomainAudit,
  AuditSynthesis,
  OnboardingStatus,
} from './types.js';

// Helpers
export {
  getManagedSettingsPath,
  buildManagedSettings,
  buildTelemetryEnv,
  scoreLockdown,
} from './helpers.js';

// Admin API client
export {
  AdminApiClient,
  AdminApiError,
} from './client.js';

export type {
  AdminClientConfig,
  OrgInfo,
  OrgMember,
  Workspace,
  ApiKeyInfo,
  UsageReportParams,
  CostReportParams,
  PaginatedResponse,
} from './client.js';
