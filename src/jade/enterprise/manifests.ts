/**
 * Enterprise Manifest Factories
 *
 * Creates canonical manifest objects with sensible defaults.
 * These are the "documents" that Alex and Jade produce at each
 * phase of the consulting engagement.
 */

import {
  EngagementPhase,
  PhaseStatus,
  PhaseOwner,
  AgentPermissionScope,
  TeamOwnershipMode,
  SecretProvider,
  SecurityCheckpoint,
  AuditCadence,
  TeamMemberEvent,
  AdminDashboardHost,
  AdminApiDomain,
  GitHubTeamRole,
} from './enums';

import type {
  EngagementManifest,
  PhaseCheckpoint,
  GovernedTeam,
  GovernedTool,
  ToolGrant,
  TeamMember,
  AdminDashboardConfig,
  SecurityPosture,
  SecurityCheckpointStatus,
  TestManifest,
  WeeklyAuditReport,
  BusinessContext,
  ITEnvironment,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// § 1. ENGAGEMENT MANIFEST
// ─────────────────────────────────────────────────────────────────────────────

/** Phase ownership map — who leads each phase */
const PHASE_OWNERS: Record<EngagementPhase, PhaseOwner> = {
  [EngagementPhase.DISCOVERY]: PhaseOwner.ALEX,
  [EngagementPhase.STRATEGY_DOCUMENTATION]: PhaseOwner.ALEX_AND_JADE,
  [EngagementPhase.INFRASTRUCTURE_SETUP]: PhaseOwner.JADE,
  [EngagementPhase.PERMISSION_GOVERNANCE]: PhaseOwner.JADE,
  [EngagementPhase.SECURITY_PLANNING]: PhaseOwner.ALEX_AND_JADE,
  [EngagementPhase.TEST_DRIVEN_PLANNING]: PhaseOwner.JADE,
  [EngagementPhase.IMPLEMENTATION]: PhaseOwner.JADE,
  [EngagementPhase.HANDOFF]: PhaseOwner.ALEX,
  [EngagementPhase.OPERATIONAL]: PhaseOwner.ALEX_AND_JADE,
};

/** Create a new engagement manifest for a customer */
export function createEngagementManifest(
  customerId: string,
  customerName: string,
  customerDomain: string,
): EngagementManifest {
  const phases: PhaseCheckpoint[] = Object.values(EngagementPhase).map(
    (phase) => ({
      phase,
      status: phase === EngagementPhase.DISCOVERY
        ? PhaseStatus.IN_PROGRESS
        : PhaseStatus.NOT_STARTED,
      owner: PHASE_OWNERS[phase],
      artifacts: [],
    }),
  );

  return {
    $schema: 'jade-engagement-v1',
    engagementId: customerId,
    customerName,
    customerDomain,
    startDate: new Date().toISOString().split('T')[0] as string,
    phases,
    businessContext: {
      industry: '',
      employeeCount: 0,
      engineeringHeadcount: 0,
      complianceFrameworks: [],
      existingTools: [],
      strategicPriorities: [],
      uniqueBusinessRules: [],
      dataResidencyRequirements: [],
    },
    itEnvironment: {
      cloudProvider: 'aws',
      gitProvider: 'github',
      gitOrgName: '',
      ssoProvider: '',
      secretProvider: SecretProvider.GITHUB_ORG_SECRETS,
      ciPlatform: '',
    },
    securityPosture: createSecurityPosture(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. PERMISSION GOVERNANCE
// ─────────────────────────────────────────────────────────────────────────────

/** Default read-only tool grants for a new team */
export function createDefaultToolGrants(
  tools: readonly GovernedTool[],
  grantedBy: string,
): ToolGrant[] {
  return tools.map((tool) => ({
    toolId: tool.toolId,
    scope: AgentPermissionScope.READ,  // read by default, write requires approval
    grantedBy,
    grantedAt: new Date().toISOString(),
    justification: 'Default read-only grant during team provisioning',
  }));
}

/** Create a new governed team with v1 manual audit */
export function createGovernedTeam(
  teamSlug: string,
  teamName: string,
  orgName: string,
  manager: TeamMember,
): GovernedTeam {
  return {
    teamSlug,
    teamName,
    gitHubOrgName: orgName,
    ownershipMode: TeamOwnershipMode.V1_MANUAL_AUDIT,
    manager,
    members: [manager],
    toolGrants: [],
    auditCadence: AuditCadence.WEEKLY,
  };
}

/** Create a team member record */
export function createTeamMember(
  gitHubUsername: string,
  email: string,
  role: GitHubTeamRole,
): TeamMember {
  const now = new Date().toISOString();
  return {
    gitHubUsername,
    email,
    role,
    joinedAt: now,
    lastEvent: TeamMemberEvent.JOINED,
    lastEventAt: now,
    suspended: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

/** Create default admin dashboard config — Vercel + Cloudflare, intranet-only */
export function createAdminDashboardConfig(
  domain: string,
  emailDomain: string,
): AdminDashboardConfig {
  return {
    host: AdminDashboardHost.VERCEL_CLOUDFLARE,
    domain,
    cloudflareAccessPolicies: [
      {
        type: 'email-domain' as const,
        value: emailDomain,
        action: 'allow' as const,
      },
      {
        // Block everything else — defense in depth
        type: 'email-domain' as const,
        value: '*',
        action: 'deny' as const,
      },
    ],
    enabledDomains: [
      AdminApiDomain.ORGANIZATION,
      AdminApiDomain.MEMBERS,
      AdminApiDomain.WORKSPACES,
      AdminApiDomain.USAGE,
      AdminApiDomain.COSTS,
      AdminApiDomain.AUDIT_LOG,
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. SECURITY POSTURE
// ─────────────────────────────────────────────────────────────────────────────

/** Create initial security posture with all checkpoints pending */
export function createSecurityPosture(): SecurityPosture {
  const checkpoints: SecurityCheckpointStatus[] = Object.values(
    SecurityCheckpoint,
  ).map((checkpoint) => ({
    checkpoint,
    passed: false,
    checkedBy: PhaseOwner.JADE,
    blockingIssues: [],
  }));

  return {
    checkpoints,
    dependencyAudit: [],
    allCheckpointsPassed: false,
    codeWritingApproved: false,
  };
}

/**
 * Evaluate whether code writing is approved.
 * Returns true ONLY when ALL security checkpoints have passed.
 * This is the gate — no exceptions, no overrides in v1.
 */
export function evaluateCodeWritingApproval(
  posture: SecurityPosture,
): boolean {
  return posture.checkpoints.every((cp) => cp.passed);
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5. TEST MANIFEST
// ─────────────────────────────────────────────────────────────────────────────

/** Create an empty test manifest for a project */
export function createTestManifest(projectName: string): TestManifest {
  const checkpointCoverage: Record<SecurityCheckpoint, readonly string[]> =
    Object.values(SecurityCheckpoint).reduce(
      (acc, cp) => {
        acc[cp] = [];
        return acc;
      },
      {} as Record<SecurityCheckpoint, string[]>,
    );

  return {
    $schema: 'jade-test-manifest-v1',
    projectName,
    generatedAt: new Date().toISOString(),
    tests: [],
    dependencyGraph: {},
    checkpointCoverage,
    silentFailureGuards: [],
  };
}
