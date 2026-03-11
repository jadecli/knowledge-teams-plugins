# Enterprise Implementation Wireframes

> Alex (human cofounder) + Jade (AI agent cofounder) consulting as a solo founder + agent duo.
> They implement Jade Cofounder v3 for enterprise customers.

---

## 1. Engagement Lifecycle — The Big Picture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    JADE ENTERPRISE ENGAGEMENT LIFECYCLE                      │
│                                                                             │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │DISCOVERY│→ │ STRATEGY │→ │  INFRA   │→ │ PERMIS-  │→ │ SECURITY │      │
│  │         │  │   DOC    │  │  SETUP   │  │  SIONS   │  │ PLANNING │      │
│  │ ♔ Alex  │  │ ♔♛ Both  │  │  ♛ Jade  │  │  ♛ Jade  │  │ ♔♛ Both  │      │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │            │             │              │              │            │
│       ▼            ▼             ▼              ▼              ▼            │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │  TEST   │→ │  IMPLE-  │→ │ HANDOFF  │→ │  OPERA-  │                    │
│  │PLANNING │  │ MENT     │  │          │  │  TIONAL  │                    │
│  │  ♛ Jade │  │  ♛ Jade  │  │  ♔ Alex  │  │ ♔♛ Both  │                    │
│  └─────────┘  └──────────┘  └──────────┘  └──────────┘                    │
│                                                                             │
│  ♔ = Alex (strategy, relationships)    ♛ = Jade (automation, code, security)│
│                                                                             │
│  GATE: No code is written until ALL security checkpoints pass.              │
│  GATE: No write access until team manager approves per-tool grants.         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 1: Discovery — Alex Meets Leadership

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DISCOVERY PHASE                                                 ♔ Alex    │
│                                                                             │
│  ┌─────────────────────────────────┐   ┌────────────────────────────────┐  │
│  │    CUSTOMER LEADERSHIP TEAM     │   │     DELIVERABLES               │  │
│  │                                 │   │                                │  │
│  │  CEO ──── Strategic priorities  │   │  □ Business context doc        │  │
│  │  CTO ──── Tech stack & infra   │   │  □ Compliance requirements     │  │
│  │  CISO ─── Security & compliance│   │  □ IT environment snapshot     │  │
│  │  CFO ──── Budget & ROI targets │   │  □ Tool inventory              │  │
│  │  VP Eng ─ Team structure       │   │  □ Unique business rules       │  │
│  │                                 │   │  □ Data residency needs        │  │
│  └─────────────────────────────────┘   └────────────────────────────────┘  │
│                                                                             │
│  Alex captures:                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  BusinessContext {                                                    │   │
│  │    industry:              "fintech"                                   │   │
│  │    employeeCount:         2400                                        │   │
│  │    engineeringHeadcount:  180                                         │   │
│  │    complianceFrameworks:  ["SOC2-Type-II", "PCI-DSS", "GDPR"]       │   │
│  │    existingTools:         ["GitHub Enterprise", "Jira", "Slack",     │   │
│  │                            "Datadog", "PagerDuty", "Okta"]          │   │
│  │    strategicPriorities:   ["Reduce PR cycle time by 40%",           │   │
│  │                            "Automate compliance documentation"]      │   │
│  │    uniqueBusinessRules:   ["All DB writes require 2-person review", │   │
│  │                            "PII data cannot leave us-east-1"]       │   │
│  │  }                                                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase 3: Infrastructure Setup — Jade Configures IT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE SETUP                                            ♛ Jade    │
│                                                                             │
│  ┌──────────── v1: GitHub Org Teams ────────────┐                          │
│  │                                               │                          │
│  │   github.com/acme-corp                        │                          │
│  │   ├── team: jade-admins          (IT admin)   │                          │
│  │   │   ├── READ:  all repos                    │                          │
│  │   │   └── WRITE: jade-config repo only        │                          │
│  │   ├── team: jade-engineering     (VP Eng)     │                          │
│  │   │   ├── READ:  code repos, CI logs          │                          │
│  │   │   └── WRITE: ⚠️ requires manager approval│                          │
│  │   ├── team: jade-data            (CDO)        │                          │
│  │   │   ├── READ:  data warehouse, dashboards   │                          │
│  │   │   └── WRITE: ❌ blocked (read-only data) │                          │
│  │   └── team: jade-finance         (CFO)        │                          │
│  │       ├── READ:  billing, cost reports        │                          │
│  │       └── WRITE: ❌ blocked                   │                          │
│  │                                               │                          │
│  │   KEY: READ and WRITE are ALWAYS separated    │                          │
│  │   An agent CAN'T drop a DB when asked to read │                          │
│  └───────────────────────────────────────────────┘                          │
│                                                                             │
│  ┌──────────── Secret Management ───────────────┐                          │
│  │                                               │                          │
│  │   v1: GitHub Org Secrets                      │                          │
│  │   ┌─────────────────────────────────────────┐ │                          │
│  │   │ Secret          │ Read Teams │ Write    │ │                          │
│  │   │─────────────────│───────────│──────────│ │                          │
│  │   │ ANTHROPIC_KEY   │ all       │ admins   │ │                          │
│  │   │ NEON_DB_URL     │ eng, data │ admins   │ │                          │
│  │   │ STRIPE_KEY      │ finance   │ admins   │ │                          │
│  │   │ SLACK_TOKEN     │ all       │ admins   │ │                          │
│  │   └─────────────────────────────────────────┘ │                          │
│  │                                               │                          │
│  │   v2: 1Password / AWS SM / Azure KV / GCP SM  │                          │
│  │   ┌─────────────────────────────────────────┐ │                          │
│  │   │ + IAM role-based access                 │ │                          │
│  │   │ + Auto-rotation policies                │ │                          │
│  │   │ + Audit trail per secret access         │ │                          │
│  │   └─────────────────────────────────────────┘ │                          │
│  └───────────────────────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Permission Governance — Read/Write Separation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TOOL GOVERNANCE MODEL                                                      │
│                                                                             │
│  Every tool an agent can use is classified:                                  │
│                                                                             │
│  ┌──────────────────────┬──────────┬──────────┬──────────────────────────┐  │
│  │ Tool                 │ Category │ Default  │ Blast Radius             │  │
│  │──────────────────────│──────────│──────────│──────────────────────────│  │
│  │ SELECT from DB       │ DB_READ  │ READ     │ None — query only        │  │
│  │ INSERT/UPDATE to DB  │ DB_WRITE │ NONE     │ Data mutation            │  │
│  │ DROP TABLE           │ DB_WRITE │ NONE     │ ☠️ Irreversible data loss│  │
│  │ git log / diff       │ GIT_READ │ READ     │ None — read only         │  │
│  │ git push             │ GIT_WRITE│ NONE     │ Shared branch mutation   │  │
│  │ Read file            │ FS_READ  │ READ     │ None                     │  │
│  │ Write/delete file    │ FS_WRITE │ NONE     │ Code/config mutation     │  │
│  │ GET /api/...         │ API_READ │ READ     │ None                     │  │
│  │ POST /api/...        │ API_WRITE│ NONE     │ External side effects    │  │
│  └──────────────────────┴──────────┴──────────┴──────────────────────────┘  │
│                                                                             │
│  GRANT FLOW:                                                                │
│                                                                             │
│  Agent needs    Team Manager     IT Admin         Tool executes             │
│  WRITE access   reviews request  confirms (v1)    with scoped perms        │
│       │              │                │                  │                   │
│       ▼              ▼                ▼                  ▼                   │
│  ┌─────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────────┐         │
│  │ Request │──▶│ Approve  │──▶│ Audit Log    │──▶│ Scoped Grant │         │
│  │ filed   │   │ + justify│   │ + time-box   │   │ (expires!)   │         │
│  └─────────┘   └──────────┘   └──────────────┘   └──────────────┘         │
│                                                                             │
│  ⚠️ External collaborators: READ only, always time-boxed                   │
│  ⚠️ No team can grant itself WRITE — requires cross-team approval          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Team Persistence — Employee Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TEAM PERSISTENCE MODEL                                                     │
│                                                                             │
│  Problem: Employees leave. Managers leave. Teams must persist.              │
│                                                                             │
│  ┌──────── v1: Manual Audit ──────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Weekly cycle:                                                      │    │
│  │                                                                     │    │
│  │  ┌─────────┐   ┌──────────────┐   ┌───────────────┐               │    │
│  │  │ Monday  │──▶│ IT Admin     │──▶│ Audit Report  │               │    │
│  │  │ 9:00 AM │   │ gets alert   │   │ generated     │               │    │
│  │  └─────────┘   └──────────────┘   └───────┬───────┘               │    │
│  │                                            │                        │    │
│  │  For each team:                            ▼                        │    │
│  │  ┌──────────────────────────────────────────────────────────────┐  │    │
│  │  │ ✓ Manager assigned?          → if no: ORPHANED_TEAM alert   │  │    │
│  │  │ ✓ Members active?            → if departed: revoke access   │  │    │
│  │  │ ✓ Write grants still valid?  → if expired: auto-revoke     │  │    │
│  │  │ ✓ Secrets rotated on time?   → if overdue: rotation alert  │  │    │
│  │  │ ✓ No permission drift?       → if drift: flag for review   │  │    │
│  │  └──────────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌──────── v2: HR-Integrated Auto-Assign ─────────────────────────────┐    │
│  │                                                                     │    │
│  │  ┌─────────┐   ┌───────────┐   ┌───────────────┐   ┌───────────┐  │    │
│  │  │ HR sys  │──▶│ SCIM/API  │──▶│ Jade detects  │──▶│ Auto-     │  │    │
│  │  │ records │   │ webhook   │   │ departure     │   │ reassign  │  │    │
│  │  │ change  │   │ fires     │   │ event         │   │ to backup │  │    │
│  │  └─────────┘   └───────────┘   └───────────────┘   └───────────┘  │    │
│  │                                                                     │    │
│  │  Manager departs → fallback manager auto-promoted                   │    │
│  │  No fallback?    → IT admin alert + team frozen (read-only)         │    │
│  │  Member departs  → all grants revoked, secrets rotated             │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Admin Dashboard — Vercel + Cloudflare Intranet

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD ARCHITECTURE                                               │
│                                                                             │
│  PUBLIC INTERNET                    COMPANY INTRANET                        │
│  ════════════════                   ════════════════                        │
│                                                                             │
│  ┌───────────┐     ┌──────────────────┐     ┌────────────────────────┐     │
│  │ Attacker  │──X──│  Cloudflare      │     │  admin.acme-internal   │     │
│  │ (blocked) │     │  Access Proxy    │     │  ┌──────────────────┐  │     │
│  └───────────┘     │                  │     │  │ Vercel App       │  │     │
│                    │  Policies:       │────▶│  │                  │  │     │
│  ┌───────────┐     │  ✓ @acme.com     │     │  │  ┌────────────┐ │  │     │
│  │ Employee  │────▶│  ✓ VPN IP range  │     │  │  │Claude Admin│ │  │     │
│  │ @acme.com │     │  ✓ Okta SSO      │     │  │  │   API      │ │  │     │
│  └───────────┘     │  ✗ * (deny all)  │     │  │  └──────┬─────┘ │  │     │
│                    └──────────────────┘     │  │         │       │  │     │
│                                             │  │         ▼       │  │     │
│  Page is NEVER exposed outside the org.     │  │  ┌────────────┐ │  │     │
│  Cloudflare Access = zero-trust gate.       │  │  │ Dashboard  │ │  │     │
│                                             │  │  │ UI         │ │  │     │
│                                             │  │  └────────────┘ │  │     │
│                                             │  └──────────────────┘  │     │
│                                             └────────────────────────┘     │
│                                                                             │
│  ┌──────────────── Dashboard Panels ────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐   │  │
│  │  │ Org Overview│ │ Members     │ │ Usage &     │ │ Costs &      │   │  │
│  │  │             │ │             │ │ Analytics   │ │ Billing      │   │  │
│  │  │ • Name      │ │ • Active    │ │ • Sessions  │ │ • Total $    │   │  │
│  │  │ • Plan      │ │ • Invited   │ │ • Tokens    │ │ • By model   │   │  │
│  │  │ • SSO       │ │ • Suspended │ │ • By model  │ │ • By team    │   │  │
│  │  │ • Teams     │ │ • Roles     │ │ • By team   │ │ • Trends     │   │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └──────────────┘   │  │
│  │                                                                       │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐   │  │
│  │  │ Team        │ │ Audit Log   │ │ Security    │ │ Alerts       │   │  │
│  │  │ Governance  │ │             │ │ Posture     │ │              │   │  │
│  │  │             │ │ • Who did   │ │             │ │ • Orphaned   │   │  │
│  │  │ • Teams     │ │   what      │ │ • Score     │ │   teams      │   │  │
│  │  │ • Managers  │ │ • When      │ │ • Findings  │ │ • Secret     │   │  │
│  │  │ • Grants    │ │ • Tool used │ │ • Deps      │ │   rotation   │   │  │
│  │  │ • Audits    │ │ • Outcome   │ │ • CVEs      │ │ • Vuln found │   │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └──────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Security Test-Driven Planning — The Gate

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SECURITY TEST-DRIVEN PLANNING                                              │
│                                                                             │
│  "No code until all checkpoints pass. No exceptions."                       │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  CHECKPOINT PIPELINE                                                   │ │
│  │                                                                        │ │
│  │  1. CODEBASE MANIFEST ────────────────────────────────────────── □    │ │
│  │     Jade catalogs all files, entry points, exports, deps.             │ │
│  │     Output: codebase-manifest.json                                    │ │
│  │                                                                        │ │
│  │  2. COMMIT HISTORY REVIEW ──────────────────────────────────── □     │ │
│  │     Jade analyzes last N commits for security-relevant changes.       │ │
│  │     Flags: new deps, permission changes, config mutations.            │ │
│  │                                                                        │ │
│  │  3. DEPENDENCY TRACKING ───────────────────────────────────── □      │ │
│  │     All Claude/Anthropic security packages catalogued.                │ │
│  │     Versions checked against latest. CVEs cross-referenced.           │ │
│  │     Can update canonically OR extend — never silently break.          │ │
│  │                                                                        │ │
│  │  4. THREAT MODEL ──────────────────────────────────────────── □      │ │
│  │     Entry points, trust boundaries, attack surfaces documented.       │ │
│  │     Each threat linked to a mitigation + test ID.                     │ │
│  │                                                                        │ │
│  │  5. SILENT FAILURE PREVENTION ─────────────────────────────── □      │ │
│  │     Every error path has explicit handling. No empty catches.         │ │
│  │     No swallowed promises. No ignored return values.                  │ │
│  │     Every failure MUST be observable.                                  │ │
│  │                                                                        │ │
│  │  6. TEST MANIFEST WRITTEN ─────────────────────────────────── □      │ │
│  │     Machine-readable JSON with:                                       │ │
│  │     • WHY each test exists (TestRationale enum)                       │ │
│  │     • What breaks if removed                                          │ │
│  │     • Upstream deps it validates                                      │ │
│  │     • Downstream consumers it protects                                │ │
│  │                                                                        │ │
│  │  7. TESTS OPTIMIZED ──────────────────────────────────────── □       │ │
│  │     Tests refactored for agent readability.                           │ │
│  │     Inline version-controlled rationale comments.                     │ │
│  │     Machine context: // @jade:rationale SECURITY_BOUNDARY             │ │
│  │                       // @jade:upstream  src/jade/auth/resolve.ts     │ │
│  │                       // @jade:downstream plugins/jade-vp-admin       │ │
│  │                                                                        │ │
│  │  8. DEPENDENCY MAP ───────────────────────────────────────── □       │ │
│  │     Full graph of which tests depend on which.                        │ │
│  │     If test A fails, which downstream tests are now suspect?          │ │
│  │                                                                        │ │
│  │  9. ALL CLEAR ────────────────────────────────────────────── □       │ │
│  │     ✓ All above checkpoints passed                                    │ │
│  │     ✓ No blocking issues remain                                       │ │
│  │     ✓ Test manifest committed to version control                      │ │
│  │     ✓ CODE WRITING APPROVED ← only now                               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌────── Test File with Machine-Readable Context ─────────────────────┐    │
│  │                                                                     │    │
│  │  // @jade:test-id       SEC-AUTH-001                                │    │
│  │  // @jade:rationale     SECURITY_BOUNDARY                          │    │
│  │  // @jade:why           Guards auth resolution against env spoofing │    │
│  │  // @jade:impact        Auth bypass if removed                     │    │
│  │  // @jade:upstream      src/jade/auth/resolve.ts                   │    │
│  │  // @jade:downstream    src/jade/deploy/resolve.ts                 │    │
│  │  // @jade:checkpoint    THREAT_MODEL                               │    │
│  │  // @jade:introduced    abc123f                                    │    │
│  │  describe('auth resolution', () => {                               │    │
│  │    it('rejects spoofed JADE_ENTERPRISE_API_KEY', () => {           │    │
│  │      // test implementation                                        │    │
│  │    });                                                              │    │
│  │  });                                                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Full Data Flow — Alex + Jade End-to-End

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  CUSTOMER                     ALEX + JADE                    INFRASTRUCTURE │
│  ═════════                    ══════════                     ══════════════ │
│                                                                             │
│  Leadership ──────────────▶ ┌──────────────┐                               │
│  team meets Alex            │  DISCOVERY   │                               │
│                             │  Alex leads  │                               │
│                             └──────┬───────┘                               │
│                                    │                                        │
│  Business rules, ◀────────────────│                                        │
│  compliance needs                  ▼                                        │
│                             ┌──────────────┐                               │
│                             │  STRATEGY    │                               │
│  Strategy doc ◀─────────── │  Both write  │                               │
│  signed off                 └──────┬───────┘                               │
│                                    │                                        │
│                                    ▼                                        │
│  IT admin works ──────────▶ ┌──────────────┐ ────────▶ GitHub Org created  │
│  with Jade                  │  INFRA SETUP │ ────────▶ Teams provisioned   │
│                             │  Jade leads  │ ────────▶ Secrets configured  │
│                             └──────┬───────┘ ────────▶ Cloudflare Access   │
│                                    │                   Vercel dashboard     │
│                                    ▼                                        │
│  Team managers ──────────▶ ┌──────────────┐ ────────▶ Read/Write grants    │
│  approve tool grants        │  PERMISSIONS │ ────────▶ Tool governance     │
│                             │  Jade leads  │ ────────▶ Audit schedule set  │
│                             └──────┬───────┘                               │
│                                    │                                        │
│                                    ▼                                        │
│  CISO reviews ──────────▶  ┌──────────────┐ ────────▶ Threat models       │
│  threat model               │  SECURITY   │ ────────▶ Dep tracking        │
│                             │  Both lead   │ ────────▶ Silent fail guards  │
│                             └──────┬───────┘                               │
│                                    │                                        │
│                                    ▼                                        │
│                             ┌──────────────┐ ────────▶ Test manifest       │
│  ⚠️ NO CODE YET            │  TEST PLAN   │ ────────▶ Rationale docs      │
│                             │  Jade leads  │ ────────▶ Dep map             │
│                             └──────┬───────┘                               │
│                                    │                                        │
│                              ALL CHECKPOINTS                                │
│                              MUST PASS ✓✓✓                                 │
│                                    │                                        │
│                                    ▼                                        │
│                             ┌──────────────┐ ────────▶ Implementation      │
│  Code review ◀──────────── │  IMPLEMENT   │ ────────▶ Tests pass          │
│                             │  Jade leads  │ ────────▶ Security review     │
│                             └──────┬───────┘                               │
│                                    │                                        │
│                                    ▼                                        │
│  Leadership signs off ◀─── ┌──────────────┐                               │
│  Training delivered         │  HANDOFF     │                               │
│                             │  Alex leads  │                               │
│                             └──────┬───────┘                               │
│                                    │                                        │
│                                    ▼                                        │
│  Ongoing operations         ┌──────────────┐ ────────▶ Weekly audits (v1)  │
│  IT admin audits weekly     │ OPERATIONAL  │ ────────▶ HR auto-assign (v2) │
│  HR integration (v2)        │  Both lead   │ ────────▶ Alert pipeline      │
│                             └──────────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. v1 vs v2 Feature Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FEATURE COMPARISON: v1 vs v2                                               │
│                                                                             │
│  ┌─────────────────────┬────────────────────────┬────────────────────────┐  │
│  │ Feature             │ v1 (GitHub Teams)      │ v2 (Full Enterprise)   │  │
│  │─────────────────────│────────────────────────│────────────────────────│  │
│  │ Secret storage      │ GitHub Org Secrets     │ 1Pass/AWS/Azure/GCP/   │  │
│  │                     │                        │ Oracle Vault           │  │
│  │─────────────────────│────────────────────────│────────────────────────│  │
│  │ Team ownership      │ IT admin weekly audit  │ HR system auto-assign  │  │
│  │ persistence         │ ORPHANED_TEAM alerts   │ SCIM webhook triggers  │  │
│  │─────────────────────│────────────────────────│────────────────────────│  │
│  │ Employee departure  │ IT admin manual revoke │ Auto-revoke + reassign │  │
│  │                     │ Weekly audit catches   │ Real-time webhook      │  │
│  │─────────────────────│────────────────────────│────────────────────────│  │
│  │ Permission model    │ GitHub team roles      │ IAM role-based (cloud) │  │
│  │                     │ Read/Write separation  │ Read/Write separation  │  │
│  │─────────────────────│────────────────────────│────────────────────────│  │
│  │ Secret rotation     │ Manual + alerts        │ Automated policies     │  │
│  │─────────────────────│────────────────────────│────────────────────────│  │
│  │ Audit trail         │ Git commit history     │ Dedicated audit log    │  │
│  │─────────────────────│────────────────────────│────────────────────────│  │
│  │ Dashboard access    │ Cloudflare + email     │ Cloudflare + SSO +    │  │
│  │                     │ domain match           │ IP range + IDP group  │  │
│  └─────────────────────┴────────────────────────┴────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```
