/**
 * Enterprise Implementation Canonical Types
 *
 * Stateful objects that flow through the Alex + Jade consulting lifecycle.
 * These types are the "nouns" that the enums (state machines) act upon.
 */

import type {
  EngagementPhase,
  PhaseStatus,
  PhaseOwner,
  AgentPermissionScope,
  GitHubTeamRole,
  ToolGovernanceCategory,
  TeamOwnershipMode,
  SecretProvider,
  SecretAccessLevel,
  SecurityCheckpoint,
  TestRationale,
  DependencyHealth,
  AuditCadence,
  TeamMemberEvent,
  AdminAlertType,
  CloudflareAccessPolicy,
  AdminDashboardHost,
  AdminApiDomain,
} from './enums';

// ─────────────────────────────────────────────────────────────────────────────
// § 1. ENGAGEMENT & CONSULTING
// ─────────────────────────────────────────────────────────────────────────────

/** A single phase checkpoint in the engagement */
export interface PhaseCheckpoint {
  readonly phase: EngagementPhase;
  readonly status: PhaseStatus;
  readonly owner: PhaseOwner;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly blockedReason?: string;
  readonly approvedBy?: string;
  readonly artifacts: readonly string[]; // paths to deliverables
}

/** Full engagement tracking object for a customer */
export interface EngagementManifest {
  readonly $schema: 'jade-engagement-v1';
  readonly engagementId: string;
  readonly customerName: string;
  readonly customerDomain: string;
  readonly startDate: string;
  readonly phases: readonly PhaseCheckpoint[];
  /** Business context captured during discovery */
  readonly businessContext: BusinessContext;
  /** IT environment captured during infrastructure setup */
  readonly itEnvironment: ITEnvironment;
  /** Security posture captured during security planning */
  readonly securityPosture: SecurityPosture;
}

/** Business strategy and requirements captured during discovery */
export interface BusinessContext {
  readonly industry: string;
  readonly employeeCount: number;
  readonly engineeringHeadcount: number;
  readonly complianceFrameworks: readonly string[]; // e.g. SOC2, HIPAA, PCI-DSS
  readonly existingTools: readonly string[];         // e.g. Jira, Slack, GitHub
  readonly strategicPriorities: readonly string[];
  readonly uniqueBusinessRules: readonly string[];
  readonly dataResidencyRequirements: readonly string[];
}

/** Customer IT environment snapshot */
export interface ITEnvironment {
  readonly cloudProvider: 'aws' | 'gcp' | 'azure' | 'oracle' | 'multi-cloud';
  readonly gitProvider: 'github' | 'gitlab' | 'bitbucket';
  readonly gitOrgName: string;
  readonly ssoProvider: string;
  readonly secretProvider: SecretProvider;
  readonly ciPlatform: string;
  readonly intranetDomain?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. GITHUB TEAM GOVERNANCE
// ─────────────────────────────────────────────────────────────────────────────

/** A governed tool — any MCP tool, CLI command, or agent capability */
export interface GovernedTool {
  readonly toolId: string;
  readonly toolName: string;
  readonly description: string;
  readonly category: ToolGovernanceCategory;
  /** Which permission scope this tool requires */
  readonly requiredScope: AgentPermissionScope;
  /** Human-readable explanation of blast radius if misused */
  readonly blastRadius: string;
}

/** A GitHub team with Jade governance overlay */
export interface GovernedTeam {
  readonly teamSlug: string;
  readonly teamName: string;
  readonly gitHubOrgName: string;
  readonly ownershipMode: TeamOwnershipMode;
  readonly manager: TeamMember;
  readonly fallbackManager?: TeamMember;
  readonly members: readonly TeamMember[];
  /** Tools this team has access to, with read/write separation */
  readonly toolGrants: readonly ToolGrant[];
  /** When the team was last audited */
  readonly lastAuditedAt?: string;
  readonly nextAuditDue?: string;
  readonly auditCadence: AuditCadence;
}

/** A team member with lifecycle state */
export interface TeamMember {
  readonly gitHubUsername: string;
  readonly email: string;
  readonly role: GitHubTeamRole;
  readonly joinedAt: string;
  readonly lastEvent: TeamMemberEvent;
  readonly lastEventAt: string;
  readonly suspended: boolean;
}

/** A specific tool grant to a team */
export interface ToolGrant {
  readonly toolId: string;
  readonly scope: AgentPermissionScope;
  readonly grantedBy: string;         // GitHub username of team manager
  readonly grantedAt: string;
  readonly expiresAt?: string;        // Time-boxed grants for external collabs
  readonly justification: string;     // Why this scope was granted
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. SECRET GOVERNANCE
// ─────────────────────────────────────────────────────────────────────────────

/** A managed secret with access control */
export interface GovernedSecret {
  readonly secretId: string;
  readonly provider: SecretProvider;
  /** Which teams can READ this secret at runtime */
  readonly readTeams: readonly string[];
  /** Which teams can WRITE (rotate/update) this secret */
  readonly writeTeams: readonly string[];
  /** Last rotation timestamp */
  readonly lastRotatedAt: string;
  /** Next rotation due */
  readonly nextRotationDue: string;
  readonly rotationPolicyDays: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

/** Admin dashboard deployment configuration */
export interface AdminDashboardConfig {
  readonly host: AdminDashboardHost;
  readonly vercelProjectId?: string;
  readonly vercelTeamId?: string;
  readonly domain: string;
  readonly cloudflareAccessPolicies: readonly CloudflareAccessPolicyRule[];
  /** Which Admin API domains to display */
  readonly enabledDomains: readonly AdminApiDomain[];
}

/** A Cloudflare Access policy rule */
export interface CloudflareAccessPolicyRule {
  readonly type: CloudflareAccessPolicy;
  readonly value: string;              // e.g. "@company.com", "10.0.0.0/8"
  readonly action: 'allow' | 'deny';
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5. SECURITY TEST-DRIVEN PLANNING
// ─────────────────────────────────────────────────────────────────────────────

/** Security checkpoint status */
export interface SecurityCheckpointStatus {
  readonly checkpoint: SecurityCheckpoint;
  readonly passed: boolean;
  readonly checkedAt?: string;
  readonly checkedBy: PhaseOwner;
  readonly notes?: string;
  readonly blockingIssues: readonly string[];
}

/** Full security posture for an engagement */
export interface SecurityPosture {
  readonly checkpoints: readonly SecurityCheckpointStatus[];
  readonly dependencyAudit: readonly TrackedDependency[];
  readonly threatModel?: ThreatModel;
  readonly allCheckpointsPassed: boolean;
  readonly codeWritingApproved: boolean;
}

/** A tracked dependency in the codebase */
export interface TrackedDependency {
  readonly packageName: string;
  readonly currentVersion: string;
  readonly latestVersion: string;
  readonly health: DependencyHealth;
  readonly isClaudeSecurity: boolean;  // is this a Claude/Anthropic security package?
  readonly cveIds: readonly string[];
  readonly lastCheckedAt: string;
}

/** Threat model for a feature or change */
export interface ThreatModel {
  readonly featureName: string;
  readonly entryPoints: readonly string[];
  readonly trustBoundaries: readonly string[];
  readonly threats: readonly {
    readonly id: string;
    readonly description: string;
    readonly severity: 'critical' | 'high' | 'medium' | 'low';
    readonly mitigation: string;
    readonly testId?: string; // links to TestSpec
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6. TEST MANIFEST (Machine-Readable, Version-Controlled)
// ─────────────────────────────────────────────────────────────────────────────

/** A single test specification with inline rationale */
export interface TestSpec {
  readonly testId: string;
  readonly testFile: string;
  readonly testName: string;
  /** WHY this test exists — machine-readable for agents */
  readonly rationale: TestRationale;
  /** Human-readable explanation of why */
  readonly rationaleDescription: string;
  /** What breaks if this test is removed */
  readonly impactIfRemoved: string;
  /** Upstream dependencies this test validates */
  readonly upstreamDeps: readonly string[];
  /** Downstream consumers that depend on the behavior this test guards */
  readonly downstreamDeps: readonly string[];
  /** Link to the security checkpoint that requires this test, if any */
  readonly securityCheckpoint?: SecurityCheckpoint;
  /** Git commit SHA where this test was introduced */
  readonly introducedInCommit: string;
  /** Last commit SHA that modified this test */
  readonly lastModifiedInCommit: string;
}

/** The complete test manifest for a project */
export interface TestManifest {
  readonly $schema: 'jade-test-manifest-v1';
  readonly projectName: string;
  readonly generatedAt: string;
  readonly tests: readonly TestSpec[];
  /** Dependency graph: testId → testIds it depends on */
  readonly dependencyGraph: Record<string, readonly string[]>;
  /** Coverage of security checkpoints */
  readonly checkpointCoverage: Record<SecurityCheckpoint, readonly string[]>;
  /** Tests that guard against silent failures */
  readonly silentFailureGuards: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// § 7. ADMIN ALERTS & AUDIT
// ─────────────────────────────────────────────────────────────────────────────

/** An alert sent to IT admin */
export interface AdminAlert {
  readonly alertId: string;
  readonly type: AdminAlertType;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  readonly title: string;
  readonly description: string;
  readonly teamSlug?: string;
  readonly affectedUser?: string;
  readonly createdAt: string;
  readonly acknowledgedAt?: string;
  readonly resolvedAt?: string;
  readonly autoResolvable: boolean;
}

/** Weekly audit report generated for IT admin */
export interface WeeklyAuditReport {
  readonly reportId: string;
  readonly generatedAt: string;
  readonly period: { readonly start: string; readonly end: string };
  readonly teams: readonly {
    readonly teamSlug: string;
    readonly managerUsername: string;
    readonly memberCount: number;
    readonly hasManager: boolean;
    readonly toolGrantCount: number;
    readonly writeGrantCount: number;
    readonly expiredGrants: number;
    readonly memberEvents: readonly {
      readonly event: TeamMemberEvent;
      readonly username: string;
      readonly at: string;
    }[];
  }[];
  readonly alerts: readonly AdminAlert[];
  readonly orphanedTeams: readonly string[];
  readonly secretsNeedingRotation: readonly string[];
  readonly dependenciesNeedingUpdate: readonly string[];
}
