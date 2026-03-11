/**
 * Enterprise Implementation Lifecycle Enums
 *
 * Canonical enums governing the Alex + Jade consulting engagement model.
 * Alex = human cofounder (strategy, relationships, business context)
 * Jade = AI agent cofounder (automation, security, code, orchestration)
 *
 * These enums are the source of truth for state machines across:
 *  - Consulting engagement phases
 *  - GitHub team permission governance
 *  - Security test-driven planning
 *  - Admin dashboard lifecycle
 */

// ─────────────────────────────────────────────────────────────────────────────
// § 1. ENGAGEMENT LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────

/** Top-level phases of an enterprise consulting engagement */
export enum EngagementPhase {
  /** Alex-led: Meet leadership, scope business requirements */
  DISCOVERY = 'discovery',
  /** Alex + Jade: Document strategy, unique business rules, compliance needs */
  STRATEGY_DOCUMENTATION = 'strategy-documentation',
  /** Jade-led: IT admin pre-config, intranet setup, env key management */
  INFRASTRUCTURE_SETUP = 'infrastructure-setup',
  /** Jade-led: GitHub org teams, read/write separation, permission governance */
  PERMISSION_GOVERNANCE = 'permission-governance',
  /** Alex + Jade: Security review, threat modeling, dependency audit */
  SECURITY_PLANNING = 'security-planning',
  /** Jade-led: Write test manifests with machine-readable rationale */
  TEST_DRIVEN_PLANNING = 'test-driven-planning',
  /** Jade-led: Only after all test checklists pass — write implementation code */
  IMPLEMENTATION = 'implementation',
  /** Alex-led: Leadership review, sign-off, training */
  HANDOFF = 'handoff',
  /** Ongoing: Weekly audits (v1), HR-integrated auto-assign (v2) */
  OPERATIONAL = 'operational',
}

/** Sub-states within any engagement phase */
export enum PhaseStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress',
  BLOCKED = 'blocked',
  AWAITING_APPROVAL = 'awaiting-approval',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

/** Who owns the action in each phase */
export enum PhaseOwner {
  ALEX = 'alex',           // Human cofounder — strategy, relationships
  JADE = 'jade',           // AI agent cofounder — automation, code, security
  ALEX_AND_JADE = 'both',  // Collaborative
  CUSTOMER_IT = 'customer-it',
  CUSTOMER_LEADERSHIP = 'customer-leadership',
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. GITHUB TEAM PERMISSION GOVERNANCE
// ─────────────────────────────────────────────────────────────────────────────

/** Permission scope for agent tool access — read/write ALWAYS separated */
export enum AgentPermissionScope {
  /** Can query, search, read data. Cannot mutate. */
  READ = 'read',
  /** Can create, update, delete. Requires explicit team-leader approval. */
  WRITE = 'write',
  /** Read + Write. Rarely granted. Requires IT admin + team leader. */
  READ_WRITE = 'read-write',
  /** No access. Default for unassigned tools. */
  NONE = 'none',
}

/** GitHub team roles mapped to Jade governance */
export enum GitHubTeamRole {
  /** Org admin — full control, manages IT admin alerts */
  ORG_ADMIN = 'org-admin',
  /** Team manager — approves write access for their team's tools */
  TEAM_MANAGER = 'team-manager',
  /** Team member — gets scoped read/write per manager config */
  TEAM_MEMBER = 'team-member',
  /** External collaborator — read-only, time-boxed */
  EXTERNAL = 'external',
}

/** Tool governance categories — what kind of operation does a tool perform */
export enum ToolGovernanceCategory {
  /** Database read (SELECT, DESCRIBE) */
  DB_READ = 'db-read',
  /** Database write (INSERT, UPDATE, DELETE, DROP) */
  DB_WRITE = 'db-write',
  /** File system read */
  FS_READ = 'fs-read',
  /** File system write */
  FS_WRITE = 'fs-write',
  /** API read (GET) */
  API_READ = 'api-read',
  /** API write (POST, PUT, DELETE) */
  API_WRITE = 'api-write',
  /** Git read (status, log, diff) */
  GIT_READ = 'git-read',
  /** Git write (commit, push, branch, merge) */
  GIT_WRITE = 'git-write',
  /** Infrastructure provisioning */
  INFRA = 'infra',
  /** Secrets management */
  SECRETS = 'secrets',
}

/** Team ownership persistence model */
export enum TeamOwnershipMode {
  /** v1: IT admin gets weekly audit alert to verify team owners */
  V1_MANUAL_AUDIT = 'v1-manual-audit',
  /** v2: HR system integration auto-assigns to new manager on employee departure */
  V2_HR_INTEGRATED = 'v2-hr-integrated',
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. SECRET MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/** Secret storage backend */
export enum SecretProvider {
  /** v1: GitHub org secrets scoped to teams */
  GITHUB_ORG_SECRETS = 'github-org-secrets',
  /** v2: 1Password Connect */
  ONE_PASSWORD = '1password',
  /** v2: AWS Secrets Manager */
  AWS_SECRETS_MANAGER = 'aws-secrets-manager',
  /** v2: Azure Key Vault */
  AZURE_KEY_VAULT = 'azure-key-vault',
  /** v2: GCP Secret Manager */
  GCP_SECRET_MANAGER = 'gcp-secret-manager',
  /** v2: Oracle Cloud Vault */
  ORACLE_VAULT = 'oracle-vault',
}

/** Secret access level — read and write are ALWAYS separated */
export enum SecretAccessLevel {
  /** Can read secret values (runtime injection) */
  READ = 'read',
  /** Can rotate/update secret values (admin only) */
  WRITE = 'write',
  /** Can create/delete secrets */
  ADMIN = 'admin',
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. ADMIN DASHBOARD & INTRANET
// ─────────────────────────────────────────────────────────────────────────────

/** Admin dashboard deployment target */
export enum AdminDashboardHost {
  /** Vercel deployment behind Cloudflare Access (intranet-only) */
  VERCEL_CLOUDFLARE = 'vercel-cloudflare',
  /** Self-hosted on customer infrastructure */
  SELF_HOSTED = 'self-hosted',
}

/** Cloudflare Access policy types for intranet restriction */
export enum CloudflareAccessPolicy {
  /** Email domain match (e.g. @company.com) */
  EMAIL_DOMAIN = 'email-domain',
  /** IP range allowlist (office/VPN) */
  IP_RANGE = 'ip-range',
  /** Identity provider group */
  IDP_GROUP = 'idp-group',
  /** Service token (for CI/CD) */
  SERVICE_TOKEN = 'service-token',
}

/** Claude Admin API data domains we collect and display */
export enum AdminApiDomain {
  ORGANIZATION = 'organization',
  MEMBERS = 'members',
  WORKSPACES = 'workspaces',
  API_KEYS = 'api-keys',
  USAGE = 'usage',
  COSTS = 'costs',
  AUDIT_LOG = 'audit-log',
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5. SECURITY TEST-DRIVEN PLANNING
// ─────────────────────────────────────────────────────────────────────────────

/** Security review checkpoints — must ALL pass before code is written */
export enum SecurityCheckpoint {
  /** Codebase manifest reviewed — all files, deps, entry points catalogued */
  CODEBASE_MANIFEST = 'codebase-manifest',
  /** Latest commit history analyzed for security-relevant changes */
  COMMIT_HISTORY_REVIEW = 'commit-history-review',
  /** All Claude security packages tracked with current versions */
  DEPENDENCY_TRACKING = 'dependency-tracking',
  /** Threat model documented for new feature/change */
  THREAT_MODEL = 'threat-model',
  /** Silent failure analysis — all error paths have explicit handling */
  SILENT_FAILURE_PREVENTION = 'silent-failure-prevention',
  /** Test manifest written with machine-readable rationale */
  TEST_MANIFEST_WRITTEN = 'test-manifest-written',
  /** Tests refactored and optimized for agent readability */
  TESTS_OPTIMIZED = 'tests-optimized',
  /** Upstream/downstream dependency map documented */
  DEPENDENCY_MAP = 'dependency-map',
  /** All checklist items green — gate to write code */
  ALL_CLEAR = 'all-clear',
}

/** Test rationale categories — why does this test exist? */
export enum TestRationale {
  /** Prevents regression of a specific bug */
  REGRESSION = 'regression',
  /** Validates a business requirement */
  REQUIREMENT = 'requirement',
  /** Guards a security boundary */
  SECURITY_BOUNDARY = 'security-boundary',
  /** Validates integration between components */
  INTEGRATION = 'integration',
  /** Prevents silent failure in error paths */
  SILENT_FAILURE_GUARD = 'silent-failure-guard',
  /** Validates upstream dependency contract */
  UPSTREAM_CONTRACT = 'upstream-contract',
  /** Validates downstream consumer expectations */
  DOWNSTREAM_CONTRACT = 'downstream-contract',
  /** Performance/resource constraint */
  PERFORMANCE = 'performance',
}

/** Dependency health status */
export enum DependencyHealth {
  /** Current version, no known vulnerabilities */
  HEALTHY = 'healthy',
  /** Patch update available */
  PATCH_AVAILABLE = 'patch-available',
  /** Minor update available */
  MINOR_AVAILABLE = 'minor-available',
  /** Major update available — breaking changes possible */
  MAJOR_AVAILABLE = 'major-available',
  /** Known vulnerability — must update */
  VULNERABLE = 'vulnerable',
  /** Deprecated — must migrate */
  DEPRECATED = 'deprecated',
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6. TEAM AUDIT & HR LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────

/** v1 IT admin audit cadence */
export enum AuditCadence {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

/** Team member lifecycle events */
export enum TeamMemberEvent {
  /** New hire provisioned to team */
  JOINED = 'joined',
  /** Employee left company — permissions revoked */
  DEPARTED = 'departed',
  /** Transferred to different team */
  TRANSFERRED = 'transferred',
  /** Role changed (e.g. member → manager) */
  ROLE_CHANGED = 'role-changed',
  /** Access suspended (security incident, leave, etc.) */
  SUSPENDED = 'suspended',
  /** Access reinstated */
  REINSTATED = 'reinstated',
}

/** Alert types for IT admin notifications */
export enum AdminAlertType {
  /** Team has no manager assigned — needs immediate action */
  ORPHANED_TEAM = 'orphaned-team',
  /** Weekly audit reminder */
  AUDIT_REMINDER = 'audit-reminder',
  /** Permission escalation request pending */
  PERMISSION_REQUEST = 'permission-request',
  /** Secret rotation due */
  SECRET_ROTATION_DUE = 'secret-rotation-due',
  /** Security vulnerability detected in dependency */
  VULNERABILITY_DETECTED = 'vulnerability-detected',
  /** Silent failure detected in production */
  SILENT_FAILURE = 'silent-failure',
  /** Employee departure — review team assignments */
  EMPLOYEE_DEPARTURE = 'employee-departure',
}
