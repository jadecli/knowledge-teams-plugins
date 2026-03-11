/**
 * jade-vp-admin SDK entry point.
 * Re-exports all admin types and utilities.
 */

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
} from './types';

export {
  getManagedSettingsPath,
  buildManagedSettings,
  buildTelemetryEnv,
  scoreLockdown,
} from './helpers';
