# Customer Journey Map: Enterprise Acquisition Integration

> **Status**: Draft v1.0
> **Date**: 2026-03-11
> **Scenario**: Anthropic acquires startup "NovaMind AI" — integrate 47 employees into Jade-managed knowledge worker seats
> **Consultants**: Alex (human) + Jade (AI cofounder) from jadecli

---

## Scenario Context

Anthropic has just acquired **NovaMind AI**, a 47-person startup specializing in multimodal AI evaluation. The acquisition brings:

- 12 engineers, 4 data scientists, 3 product managers, 5 salespeople, 3 marketers, 4 finance/ops, 3 legal/compliance, 2 support, 4 researchers, 2 security, 3 executives, 2 productivity/ops leads
- Existing tooling: GitHub Enterprise, Google Workspace, Slack, Stripe billing, Neon Postgres, Supabase (backend), Vercel (frontend), 1Password Teams
- No existing AI agent infrastructure — all AI usage is ad-hoc Claude Pro subscriptions

**Goal**: Onboard all 47 NovaMind employees into Anthropic's Jade-managed knowledge worker system within 30 days, mapping each person to a VP-supervised knowledge worker role.

---

## Org Chart: Post-Acquisition S-Team Mapping

```
                        ┌──────────────────────┐
                        │   jade-cofounder      │
                        │   CEO (KW-01)         │
                        │   Strategy & OP1/OP2  │
                        └──────────┬───────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
   ┌────▼─────┐            ┌──────▼──────┐           ┌───────▼──────┐
   │ CTO      │            │ CPO         │           │ CFO          │
   │ KW-02    │            │ KW-04       │           │ KW-07        │
   │ 12 eng   │            │ 3 PM        │           │ 4 fin/ops    │
   └────┬─────┘            └──────┬──────┘           └───────┬──────┘
        │                         │                          │
   ┌────▼─────┐            ┌──────▼──────┐           ┌───────▼──────┐
   │ CSO      │            │ CRO         │           │ CDO          │
   │ KW-03    │            │ KW-05       │           │ KW-08        │
   │ 2 sec    │            │ 5 sales     │           │ 4 data sci   │
   └──────────┘            └─────────────┘           └──────────────┘
        │                         │                          │
   ┌────▼─────┐            ┌──────▼──────┐           ┌───────▼──────┐
   │ CMO      │            │ CCO         │           │ CLO          │
   │ KW-06    │            │ KW-09       │           │ KW-10        │
   │ 3 mktg   │            │ 2 support   │           │ 3 legal      │
   └──────────┘            └─────────────┘           └──────────────┘
        │                         │
   ┌────▼──────┐           ┌──────▼──────┐
   │ CSO₂      │           │ CRO₂        │
   │ KW-11     │           │ KW-12       │
   │ search    │           │ 4 research  │
   └───────────┘           └─────────────┘
        │
   ┌────▼──────┐
   │ CPO₂      │
   │ KW-13     │
   │ 2 prod/ops│
   └───────────┘
```

### Employee → Seat Assignment Matrix

| NovaMind Role | Count | KW Seat | VP Plugin | Model Tier | Budget |
|---------------|-------|---------|-----------|------------|--------|
| Software Engineer | 12 | KW-02 | jade-vp-engineering | Opus | 50 |
| Data Scientist | 4 | KW-08 | jade-vp-data | Sonnet | 35 |
| Product Manager | 3 | KW-04 | jade-vp-product | Sonnet | 40 |
| Sales Rep | 5 | KW-05 | jade-vp-sales | Sonnet | 35 |
| Marketing | 3 | KW-06 | jade-vp-marketing | Sonnet | 35 |
| Finance/Ops | 4 | KW-07 | jade-vp-finance | Sonnet | 30 |
| Legal/Compliance | 3 | KW-10 | jade-vp-legal | Sonnet | 30 |
| Support | 2 | KW-09 | jade-vp-support | Sonnet | 30 |
| Researcher | 4 | KW-12 | jade-vp-research | Opus | 50 |
| Security | 2 | KW-03 | jade-vp-security | Opus | 45 |
| Executive | 3 | KW-01 | jade-cofounder | Opus | 60 |
| Productivity/Ops | 2 | KW-13 | jade-vp-productivity | Sonnet | 30 |
| **Total** | **47** | | | | |

---

## Phase 1: IT Admin Initial Setup (Days 1–7)

### Actors
- **Alex** (human consultant, IT admin role)
- **Jade** (AI cofounder, orchestrator)

### 1.1 Definition of Done Contract

Phase 1 is governed by an XML contract that defines inputs, outputs, and completion criteria for the admin setup workflow.

#### Phase 1 Input Contract

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jade-contract version="1.0" phase="1" type="input">
  <metadata>
    <contract-id>JADE-P1-INPUT-001</contract-id>
    <created>2026-03-11T00:00:00Z</created>
    <author>alex@jadecli.com</author>
    <scenario>anthropic-novamind-acquisition</scenario>
  </metadata>

  <prerequisites>
    <requirement id="prereq-01" status="pending">
      <name>Claude Enterprise Subscription</name>
      <description>Active Claude Enterprise plan with 50+ seat capacity</description>
      <validation>GET /api/team/subscription → plan === "enterprise"</validation>
    </requirement>
    <requirement id="prereq-02" status="pending">
      <name>1Password Teams Vault</name>
      <description>1Password Business account with CLI (op) installed and authenticated</description>
      <validation>op vault list → contains "jade-team-vault"</validation>
    </requirement>
    <requirement id="prereq-03" status="pending">
      <name>GitHub Enterprise Access</name>
      <description>GitHub org with admin access for MCP token provisioning</description>
      <validation>gh api /orgs/anthropic → role === "admin"</validation>
    </requirement>
    <requirement id="prereq-04" status="pending">
      <name>Google Workspace Admin</name>
      <description>GWS admin for service account and Drive API delegation</description>
      <validation>gcloud auth list → active account with admin role</validation>
    </requirement>
    <requirement id="prereq-05" status="pending">
      <name>Slack App Installed</name>
      <description>Slack app with bot token and user token scopes for the workspace</description>
      <validation>curl -H "Authorization: Bearer $SLACK_BOT_TOKEN" https://slack.com/api/auth.test → ok</validation>
    </requirement>
    <requirement id="prereq-06" status="pending">
      <name>Stripe API Access</name>
      <description>Stripe account with restricted API key (read-only for billing)</description>
      <validation>curl https://api.stripe.com/v1/balance -u $STRIPE_KEY: → object === "balance"</validation>
    </requirement>
    <requirement id="prereq-07" status="pending">
      <name>Neon Database Project</name>
      <description>Neon serverless Postgres project for warehouse reporting</description>
      <validation>neonctl projects list → contains project "jade-warehouse"</validation>
    </requirement>
    <requirement id="prereq-08" status="pending">
      <name>Supabase Project</name>
      <description>Supabase project for real-time backend (auth, storage, edge functions)</description>
      <validation>supabase projects list → contains project "jade-backend"</validation>
    </requirement>
    <requirement id="prereq-09" status="pending">
      <name>Vercel Team</name>
      <description>Vercel team account for frontend dashboard deployment</description>
      <validation>vercel teams ls → contains team "anthropic-jade"</validation>
    </requirement>
  </prerequisites>

  <team-manifest>
    <org-name>Anthropic (NovaMind division)</org-name>
    <total-seats>47</total-seats>
    <seat-allocation>
      <seat kw-id="KW-01" plugin="jade-cofounder" count="3" />
      <seat kw-id="KW-02" plugin="jade-vp-engineering" count="12" />
      <seat kw-id="KW-03" plugin="jade-vp-security" count="2" />
      <seat kw-id="KW-04" plugin="jade-vp-product" count="3" />
      <seat kw-id="KW-05" plugin="jade-vp-sales" count="5" />
      <seat kw-id="KW-06" plugin="jade-vp-marketing" count="3" />
      <seat kw-id="KW-07" plugin="jade-vp-finance" count="4" />
      <seat kw-id="KW-08" plugin="jade-vp-data" count="4" />
      <seat kw-id="KW-09" plugin="jade-vp-support" count="2" />
      <seat kw-id="KW-10" plugin="jade-vp-legal" count="3" />
      <seat kw-id="KW-11" plugin="jade-vp-search" count="0" />
      <seat kw-id="KW-12" plugin="jade-vp-research" count="4" />
      <seat kw-id="KW-13" plugin="jade-vp-productivity" count="2" />
    </seat-allocation>
  </team-manifest>

  <integrations>
    <integration id="int-01" name="GitHub" mcp-package="@modelcontextprotocol/server-github">
      <secret-ref>op://jade-team-vault/github-mcp/token</secret-ref>
      <scopes>repo, read:org, read:user, workflow</scopes>
    </integration>
    <integration id="int-02" name="Slack" mcp-package="@modelcontextprotocol/server-slack">
      <secret-ref>op://jade-team-vault/slack/bot-token</secret-ref>
      <scopes>channels:read, chat:write, users:read</scopes>
    </integration>
    <integration id="int-03" name="Google Workspace" mcp-package="@modelcontextprotocol/server-gdrive">
      <secret-ref>op://jade-team-vault/google-workspace/service-account</secret-ref>
      <scopes>drive.readonly, docs.readonly, sheets.readonly</scopes>
    </integration>
    <integration id="int-04" name="Stripe" mcp-package="@stripe/agent-toolkit">
      <secret-ref>op://jade-team-vault/stripe/restricted-key</secret-ref>
      <scopes>read_only</scopes>
    </integration>
    <integration id="int-05" name="Neon" mcp-package="@neondatabase/mcp-server-neon">
      <secret-ref>op://jade-team-vault/neon/api-key</secret-ref>
      <scopes>project:read, branch:read, sql:execute</scopes>
    </integration>
    <integration id="int-06" name="Supabase" mcp-package="supabase-community/supabase-mcp">
      <secret-ref>op://jade-team-vault/supabase/service-role-key</secret-ref>
      <scopes>service_role</scopes>
    </integration>
    <integration id="int-07" name="Vercel" mcp-package="vercel/mcp-adapter">
      <secret-ref>op://jade-team-vault/vercel/api-token</secret-ref>
      <scopes>team:read, project:read, deployment:read</scopes>
    </integration>
    <integration id="int-08" name="1Password" mcp-package="1password/1password-mcp">
      <secret-ref>op://jade-team-vault/1password-connect/token</secret-ref>
      <scopes>vault:read</scopes>
    </integration>
  </integrations>
</jade-contract>
```

#### Phase 1 Output Contract

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jade-contract version="1.0" phase="1" type="output">
  <metadata>
    <contract-id>JADE-P1-OUTPUT-001</contract-id>
    <created>2026-03-11T00:00:00Z</created>
    <depends-on>JADE-P1-INPUT-001</depends-on>
  </metadata>

  <definition-of-done>
    <criterion id="dod-01" category="infrastructure" priority="P0">
      <name>1Password Vault Provisioned</name>
      <description>jade-team-vault exists with all integration secrets stored as op:// references</description>
      <verification>
        <command>op vault get jade-team-vault --format json</command>
        <assertion>vault.name === "jade-team-vault" AND items.length >= 8</assertion>
      </verification>
      <artifact type="config">config/jade-team.json → secrets.vault === "jade-team-vault"</artifact>
    </criterion>

    <criterion id="dod-02" category="infrastructure" priority="P0">
      <name>MCP Servers Configured</name>
      <description>All 8 MCP connectors registered and health-checked</description>
      <verification>
        <command>jade admin mcp-status --format json</command>
        <assertion>servers.every(s => s.status === "healthy")</assertion>
      </verification>
      <artifact type="config">
        <file>config/mcp/servers.json</file>
        <servers count="8">
          <server name="github" status="pending" />
          <server name="slack" status="pending" />
          <server name="google-workspace" status="pending" />
          <server name="stripe" status="pending" />
          <server name="neon" status="pending" />
          <server name="supabase" status="pending" />
          <server name="vercel" status="pending" />
          <server name="1password" status="pending" />
        </servers>
      </artifact>
    </criterion>

    <criterion id="dod-03" category="identity" priority="P0">
      <name>Jade Identity Patch Applied</name>
      <description>tweakcc cofounder identity injected into Claude Code for all 47 seats</description>
      <verification>
        <command>jade identity verify --all-seats</command>
        <assertion>seats.every(s => s.patched === true)</assertion>
      </verification>
      <artifact type="patch">src/jade/patches/cofounderIdentity.ts applied successfully</artifact>
    </criterion>

    <criterion id="dod-04" category="plugins" priority="P0">
      <name>Plugin Composition Complete</name>
      <description>Upstream KWP + jade extensions composed and validated</description>
      <verification>
        <command>npx vitest run tests/compose.test.ts</command>
        <assertion>all tests pass</assertion>
      </verification>
      <artifact type="manifest">
        <composed-manifest>
          <total-plugins min="13">At least 13 VP plugins + jade-loop + orchestrator</total-plugins>
          <total-skills min="30">All skills from upstream + jade extensions</total-skills>
          <total-commands min="20">All commands registered</total-commands>
        </composed-manifest>
      </artifact>
    </criterion>

    <criterion id="dod-05" category="data" priority="P0">
      <name>Warehouse Schema Deployed</name>
      <description>Kimball dimensional model deployed to Neon Postgres</description>
      <verification>
        <command>psql $NEON_CONNECTION_STRING -c "\dt jade_warehouse.*"</command>
        <assertion>tables include: dim_agent, dim_seat, dim_model, dim_time, fact_tool_call, fact_token_usage, fact_task_execution</assertion>
      </verification>
      <artifact type="schema">src/jade/warehouse/schema.sql deployed</artifact>
    </criterion>

    <criterion id="dod-06" category="data" priority="P1">
      <name>Supabase Real-Time Backend</name>
      <description>Supabase tables with RLS, real-time subscriptions, and edge functions</description>
      <verification>
        <command>supabase db inspect --linked</command>
        <assertion>tables include: agent_sessions, tool_invocations, task_queue, budget_tracking</assertion>
      </verification>
      <artifact type="schema">supabase/migrations/001_jade_tables.sql applied</artifact>
    </criterion>

    <criterion id="dod-07" category="auth" priority="P0">
      <name>Auth Resolution Working</name>
      <description>All three auth modes functional with 1Password fallback</description>
      <verification>
        <command>npx vitest run tests/jade-sdk.test.ts</command>
        <assertion>all auth tests pass</assertion>
      </verification>
      <artifact type="code">src/jade/auth/resolve.ts enhanced with 1password mode</artifact>
    </criterion>

    <criterion id="dod-08" category="seats" priority="P0">
      <name>47 Knowledge Workers Assigned</name>
      <description>All NovaMind employees mapped to KW seats in seats.json</description>
      <verification>
        <command>jade admin seat-audit --format json</command>
        <assertion>assigned === 47 AND unmapped === 0</assertion>
      </verification>
      <artifact type="config">src/jade/kw/seats.json updated with NovaMind repoMap entries</artifact>
    </criterion>

    <criterion id="dod-09" category="monitoring" priority="P1">
      <name>Telemetry Pipeline Active</name>
      <description>Tool call and token usage events flowing to warehouse</description>
      <verification>
        <command>psql $NEON_CONNECTION_STRING -c "SELECT count(*) FROM jade_warehouse.fact_tool_call WHERE created_at > now() - interval '1 hour'"</command>
        <assertion>count > 0 (smoke test events recorded)</assertion>
      </verification>
      <artifact type="code">webmcp/shared/telemetry.ts enhanced with Neon sink</artifact>
    </criterion>
  </definition-of-done>

  <exit-criteria>
    <gate id="gate-01">All P0 criteria pass verification</gate>
    <gate id="gate-02">At least 1 knowledge worker completes a test task end-to-end</gate>
    <gate id="gate-03">MCP health check returns healthy for all 8 connectors</gate>
    <gate id="gate-04">No plaintext secrets in any config file (op:// refs only)</gate>
  </exit-criteria>
</jade-contract>
```

### 1.2 Admin Journey Steps

```
Day 1: Alex + Jade → Initial Infrastructure
────────────────────────────────────────────
  ① Alex runs: jade admin setup --config jade-team.json
     └─ Jade validates prerequisites (XML input contract)
     └─ Jade checks 1Password CLI: op vault list
     └─ Jade provisions vault items for each integration

  ② Alex runs: jade admin mcp-install --all
     └─ For each integration in the input contract:
        └─ npm install MCP server package
        └─ Write config with op:// secret references
        └─ Health check each connector
     └─ Output: config/mcp/servers.json

  ③ Alex runs: jade identity apply --org "Anthropic (NovaMind)"
     └─ tweakcc patches Claude Code system prompt
     └─ Injects S-Team context (13 VP roles)
     └─ Writes jade-identity.json

Day 2–3: Alex + Jade → Seat Assignment & Plugin Composition
────────────────────────────────────────────────────────────
  ④ Alex provides employee roster (CSV or JSON)
     └─ Jade maps each employee to a KW seat based on role
     └─ Updates seats.json repoMap with NovaMind repos
     └─ Generates per-seat CLAUDE.md project instructions

  ⑤ Alex runs: jade compose build
     └─ Loader scans upstream KWP + jade extensions
     └─ Resolver merges plugins (jade wins conflicts)
     └─ Manifest generated with totals
     └─ All tests pass: npx vitest run

Day 4–5: Alex + Jade → Data Infrastructure
───────────────────────────────────────────
  ⑥ Alex runs: jade warehouse deploy --target neon
     └─ Deploys Kimball dimensional model (see §3 below)
     └─ Creates fact and dimension tables
     └─ Seeds dim_agent with 47 employees
     └─ Seeds dim_seat with 13 VP seats
     └─ Seeds dim_model with pricing data from models.json

  ⑦ Alex runs: jade backend deploy --target supabase
     └─ Creates real-time tables (agent_sessions, tool_invocations, etc.)
     └─ Enables RLS policies
     └─ Deploys edge functions for webhook ingestion
     └─ Sets up real-time subscriptions for dashboard

Day 6–7: Alex + Jade → Verification & Smoke Test
─────────────────────────────────────────────────
  ⑧ Alex runs: jade admin verify --contract JADE-P1-OUTPUT-001
     └─ Iterates all definition-of-done criteria
     └─ Runs verification commands
     └─ Reports pass/fail for each criterion
     └─ Flags any P0 failures as blockers

  ⑨ Alex assigns a test task to one engineer:
     /jade-loop "Write a hello-world edge function" --agent jade-vp-engineering --budget-usd 0.50
     └─ Validates end-to-end: seat detection → auth → execution → telemetry → warehouse
```

---

## Phase 2: Knowledge Workers Use AI (Days 8–30)

### Actors
- **Leadership** (executives mapped to KW-01, use jade-cofounder)
- **Knowledge Workers** (47 NovaMind employees across all seats)
- **Alex + Jade** (consultants, ongoing support)

### 2.1 Core Principle: AI Augments, Never Replaces

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE JADE AUGMENTATION MODEL                   │
│                                                                 │
│   ┌──────────┐    context     ┌──────────┐    output    ┌────┐ │
│   │  HUMAN   │──────────────▶│  JADE VP  │────────────▶│ QA │ │
│   │ (worker) │◀──────────────│  (agent)  │◀────────────│    │ │
│   │          │    review      │          │   feedback   │    │ │
│   └──────────┘                └──────────┘              └────┘ │
│                                                                 │
│   Human decides WHAT to do. Jade helps HOW to do it.           │
│   Human reviews ALL outputs. Jade never auto-publishes.        │
│   Human owns the work. Jade accelerates the work.              │
└─────────────────────────────────────────────────────────────────┘
```

Every knowledge-work task uses existing skills from the VP plugins:

| VP Seat | Example Tasks (from skills/) | Human Role |
|---------|------------------------------|------------|
| CTO (KW-02) | `code-review.md`, `sdk-codegen.md`, `architecture-review.md` | Engineer writes code, Jade reviews |
| CPO (KW-04) | `jadecli-pm-practices.md` | PM defines requirements, Jade structures PRD |
| CFO (KW-07) | Journal entries, burn analysis | Finance reviews Jade's calculations |
| CDO (KW-08) | SQL generation, dashboards | Data scientist validates queries |
| CMO (KW-06) | Content drafts, brand voice | Marketer edits and approves |
| CLO (KW-10) | Contract review, NDA drafting | Lawyer reviews all legal output |
| CRO (KW-05) | Prospect research, pipeline | Sales rep qualifies leads |
| CCO (KW-09) | Ticket triage, KB articles | Support agent verifies resolutions |
| CRO₂ (KW-12) | Literature review, deep research | Researcher validates findings |
| CSO (KW-03) | Security review, bloom eval | Security engineer reviews findings |

### 2.2 Logging Every Tool Call & Token Cost

All tool invocations flow through the existing telemetry system and are persisted to the warehouse.

#### Data Flow: Tool Call → Warehouse

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│ Knowledge │    │  WebMCP Tool │    │  Telemetry   │    │  Neon    │
│  Worker   │───▶│  Handler     │───▶│  Pipeline    │───▶│ Warehouse│
│  (human)  │    │              │    │              │    │          │
└──────────┘    └──────┬───────┘    └──────┬───────┘    └────┬─────┘
                       │                   │                  │
                       ▼                   ▼                  ▼
                 validate.ts         telemetry.ts      fact_tool_call
                 (Zod schema)        (record event)    fact_token_usage
                                                       fact_task_execution
```

#### Existing Data Models Used

From `src/jade/agent-sdk/types.ts`:
```typescript
// Every task execution records this
interface TaskResult {
  success: boolean;
  output: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  rots?: number;          // Return on Token Spend
  iterations: number;
}

// Budget constraints per task
interface BudgetConfig {
  maxTokens?: number;
  maxUsd?: number;
  maxIterations?: number;
  escalationThresholdFraction?: number;  // default 0.80
}
```

From `webmcp/shared/telemetry.ts`:
```typescript
// Every tool call records this
interface TelemetryEvent {
  toolName: string;
  timestamp: number;
  durationMs: number;
  success: boolean;
  error?: string;
}
```

From `src/jade/agent-sdk/tokenizer.ts`:
```typescript
// Cost calculation per model
estimateCostUsd(inputTokens, outputTokens, model) → number
// ROTS: value / cost
calculateRots(valueDelivered, tokensCost) → number
```

From `src/jade/models.json`:
```json
{
  "pricing": {
    "claude-opus-4-6":   { "inputPer1M": 15,   "outputPer1M": 75   },
    "claude-sonnet-4-6": { "inputPer1M": 3,    "outputPer1M": 15   },
    "claude-haiku-4-5":  { "inputPer1M": 0.25, "outputPer1M": 1.25 }
  }
}
```

---

## 3. Data Warehouse: Ralph Kimball Dimensional Model

### 3.1 Star Schema Design

```
                    ┌──────────────┐
                    │  dim_time    │
                    │──────────────│
                    │ time_key PK  │
                    │ date         │
                    │ hour         │
                    │ day_of_week  │
                    │ week_number  │
                    │ month        │
                    │ quarter      │
                    │ year         │
                    │ is_weekday   │
                    └──────┬───────┘
                           │
  ┌──────────────┐    ┌────▼──────────────┐    ┌──────────────┐
  │  dim_agent   │    │ fact_tool_call    │    │  dim_tool    │
  │──────────────│    │──────────────────│    │──────────────│
  │ agent_key PK │◀───│ agent_key FK     │───▶│ tool_key PK  │
  │ agent_id     │    │ tool_key FK      │    │ tool_name    │
  │ employee_name│    │ time_key FK      │    │ tool_type    │
  │ email        │    │ seat_key FK      │    │ category     │
  │ department   │    │ model_key FK     │    │ mcp_package  │
  │ role_title   │    │──────────────────│    │ is_internal  │
  │ hire_date    │    │ duration_ms      │    └──────────────┘
  │ source_org   │    │ success          │
  │ is_active    │    │ error_message    │    ┌──────────────┐
  └──────────────┘    │ input_tokens     │    │  dim_seat    │
                      │ output_tokens    │    │──────────────│
                      │ cost_usd         │    │ seat_key PK  │
                      │ rots             │◀───│ kw_id        │
                      └──────────────────┘    │ plugin_name  │
                                              │ title        │
  ┌──────────────┐    ┌──────────────────┐    │ vp_role      │
  │  dim_model   │    │ fact_token_usage │    │ model_tier   │
  │──────────────│    │──────────────────│    │ budget_calls │
  │ model_key PK │◀───│ model_key FK     │    │ effort_level │
  │ model_id     │    │ agent_key FK     │    └──────────────┘
  │ model_name   │    │ seat_key FK      │
  │ tier         │    │ time_key FK      │    ┌──────────────┐
  │ input_cost   │    │──────────────────│    │  dim_task    │
  │ output_cost  │    │ input_tokens     │    │──────────────│
  │ provider     │    │ output_tokens    │    │ task_key PK  │
  └──────────────┘    │ total_tokens     │    │ task_id      │
                      │ cost_usd         │    │ prompt_hash  │
                      │ session_id       │    │ agent_id     │
                      └──────────────────┘    │ seat_id      │
                                              │ budget_tokens│
  ┌──────────────────────────────────────┐    │ budget_usd   │
  │ fact_task_execution                  │    │ max_iters    │
  │──────────────────────────────────────│    │ promise      │
  │ task_key FK                          │    │ status       │
  │ agent_key FK                         │    │ created_at   │
  │ seat_key FK                          │    └──────────────┘
  │ model_key FK                         │
  │ time_key FK                          │
  │──────────────────────────────────────│
  │ iterations                           │
  │ total_input_tokens                   │
  │ total_output_tokens                  │
  │ total_cost_usd                       │
  │ rots                                 │
  │ budget_utilization_pct               │
  │ escalation_triggered                 │
  │ success                              │
  │ duration_seconds                     │
  └──────────────────────────────────────┘
```

### 3.2 Semantic Layer Declarations

```typescript
// src/jade/warehouse/semantics.ts
// TypeScript semantic layer for the Kimball model

import { z } from "zod";

/** Dimension: Agent (knowledge worker or AI agent) */
export const DimAgentSchema = z.object({
  agentKey: z.number().int().positive(),
  agentId: z.string(),          // KW employee ID or jade agent ID
  employeeName: z.string(),
  email: z.string().email(),
  department: z.string(),
  roleTitle: z.string(),
  hireDate: z.string().date(),
  sourceOrg: z.string(),        // "anthropic" | "novamind"
  isActive: z.boolean(),
});

/** Dimension: KW Seat */
export const DimSeatSchema = z.object({
  seatKey: z.number().int().positive(),
  kwId: z.string(),             // "KW-01" through "KW-13"
  pluginName: z.string(),       // "jade-vp-engineering"
  title: z.string(),            // "CTO"
  vpRole: z.string(),           // "Chief Technology Officer"
  modelTier: z.enum(["opus", "sonnet", "haiku"]),
  budgetToolCalls: z.number().int(),
  effortLevel: z.enum(["low", "medium", "high"]),
});

/** Dimension: Model (pricing and tier) */
export const DimModelSchema = z.object({
  modelKey: z.number().int().positive(),
  modelId: z.string(),          // "claude-opus-4-6"
  modelName: z.string(),        // "Claude Opus 4.6"
  tier: z.enum(["opus", "sonnet", "haiku"]),
  inputCostPer1M: z.number(),   // from models.json pricing
  outputCostPer1M: z.number(),
  provider: z.string().default("anthropic"),
});

/** Dimension: Tool (MCP or WebMCP tool) */
export const DimToolSchema = z.object({
  toolKey: z.number().int().positive(),
  toolName: z.string(),
  toolType: z.enum(["webmcp-internal", "webmcp-external", "mcp-connector"]),
  category: z.string(),
  mcpPackage: z.string().nullable(),
  isInternal: z.boolean(),
});

/** Dimension: Time (standard Kimball date dimension) */
export const DimTimeSchema = z.object({
  timeKey: z.number().int(),    // YYYYMMDDHH format
  date: z.string().date(),
  hour: z.number().int().min(0).max(23),
  dayOfWeek: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
  weekNumber: z.number().int().min(1).max(53),
  month: z.number().int().min(1).max(12),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  year: z.number().int(),
  isWeekday: z.boolean(),
});

/** Dimension: Task (jade-loop task instance) */
export const DimTaskSchema = z.object({
  taskKey: z.number().int().positive(),
  taskId: z.string().uuid(),
  promptHash: z.string(),       // SHA-256 of prompt (not the prompt itself)
  agentId: z.string(),
  seatId: z.string(),
  budgetTokens: z.number().int().nullable(),
  budgetUsd: z.number().nullable(),
  maxIterations: z.number().int(),
  promise: z.string(),          // completion_promise from jade-loop
  status: z.enum(["running", "completed", "failed", "escalated", "cancelled"]),
  createdAt: z.string().datetime(),
});

/** Fact: Tool Call (grain = one tool invocation) */
export const FactToolCallSchema = z.object({
  agentKey: z.number().int(),
  toolKey: z.number().int(),
  timeKey: z.number().int(),
  seatKey: z.number().int(),
  modelKey: z.number().int(),
  durationMs: z.number().int(),
  success: z.boolean(),
  errorMessage: z.string().nullable(),
  inputTokens: z.number().int(),
  outputTokens: z.number().int(),
  costUsd: z.number(),
  rots: z.number().nullable(),
});

/** Fact: Token Usage (grain = one session/period aggregation) */
export const FactTokenUsageSchema = z.object({
  modelKey: z.number().int(),
  agentKey: z.number().int(),
  seatKey: z.number().int(),
  timeKey: z.number().int(),
  inputTokens: z.number().int(),
  outputTokens: z.number().int(),
  totalTokens: z.number().int(),
  costUsd: z.number(),
  sessionId: z.string().uuid(),
});

/** Fact: Task Execution (grain = one jade-loop task) */
export const FactTaskExecutionSchema = z.object({
  taskKey: z.number().int(),
  agentKey: z.number().int(),
  seatKey: z.number().int(),
  modelKey: z.number().int(),
  timeKey: z.number().int(),
  iterations: z.number().int(),
  totalInputTokens: z.number().int(),
  totalOutputTokens: z.number().int(),
  totalCostUsd: z.number(),
  rots: z.number().nullable(),
  budgetUtilizationPct: z.number().min(0).max(100),
  escalationTriggered: z.boolean(),
  success: z.boolean(),
  durationSeconds: z.number().int(),
});
```

### 3.3 NPM Packages for Warehouse

```json
{
  "dependencies": {
    "@neondatabase/serverless": "^1.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "drizzle-orm": "^0.38.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.0"
  }
}
```

| Package | Purpose |
|---------|---------|
| `@neondatabase/serverless` | Neon Postgres driver (serverless-compatible, HTTP/WebSocket) |
| `@supabase/supabase-js` | Supabase client for real-time subscriptions and auth |
| `drizzle-orm` | Type-safe ORM with Kimball-friendly schema declarations |
| `drizzle-kit` | Migration generation and schema diffing |
| `zod` | Schema validation (already a dependency) |

---

## 4. Real-Time Data Pipeline

### 4.1 Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                     REAL-TIME DATA PIPELINE                          │
│                                                                      │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐              │
│  │ Tool Call    │──▶│ Supabase     │──▶│ Edge Function│              │
│  │ (WebMCP)    │   │ Real-Time    │   │ (transform)  │              │
│  └─────────────┘   │ INSERT       │   └──────┬───────┘              │
│                     └──────────────┘          │                      │
│  ┌─────────────┐                              │                      │
│  │ jade-loop   │──▶│ State File   │──▶│ Webhook ├──▶│ Supabase     │ │
│  │ stop-hook   │   │ Update       │   │ POST    │   │ edge fn      │ │
│  └─────────────┘   └──────────────┘   └─────────┘  └──────┬───────┘ │
│                                                            │         │
│  ┌─────────────┐                                           ▼         │
│  │ Cron Jobs   │──────────────────────────────────▶ ┌──────────────┐ │
│  │ (scheduled) │                                    │ Neon         │ │
│  │             │    Aggregate & load dims/facts     │ Warehouse    │ │
│  │ Every 5min: │    ────────────────────────────▶   │ (Kimball)    │ │
│  │  token agg  │                                    │              │ │
│  │ Every 1hr:  │                                    │ dim_* tables │ │
│  │  cost rollup│                                    │ fact_* tables│ │
│  │ Daily 02:00:│                                    └──────────────┘ │
│  │  dim refresh│                                                     │
│  └─────────────┘                                                     │
│                                                                      │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐              │
│  │ Vercel      │◀──│ Supabase     │◀──│ Real-Time    │              │
│  │ Dashboard   │   │ Client SDK   │   │ Subscription │              │
│  │ (Next.js)   │   │ (supabase-js)│   │ (WebSocket)  │              │
│  └─────────────┘   └──────────────┘   └──────────────┘              │
└───────────────────────────────────────────────────────────────────────┘
```

### 4.2 Cron Schedule (Admin-Managed)

| Schedule | Job | Source | Target | Owner |
|----------|-----|--------|--------|-------|
| Every 5 min | Token aggregation | supabase.tool_invocations | neon.fact_token_usage | Data Engineer |
| Every 15 min | Tool call sync | supabase.tool_invocations | neon.fact_tool_call | Data Engineer |
| Every 1 hour | Cost rollup | neon.fact_tool_call | neon.fact_token_usage (update) | Data Engineer |
| Every 1 hour | ROTS calculation | neon.fact_task_execution | neon.fact_task_execution (update) | Data Engineer |
| Daily 02:00 UTC | Dimension refresh | seats.json, models.json | neon.dim_* tables | Data Engineer |
| Daily 03:00 UTC | WBR data snapshot | neon.fact_* | neon.report_weekly_snapshot | Data Engineer |
| Weekly Mon 06:00 | WBR report generation | neon.report_weekly_snapshot | Slack #jade-reports | Leadership |
| Monthly 1st 06:00 | MBR report generation | neon.report_monthly_snapshot | Slack #jade-reports | Leadership |
| Quarterly | QBR report generation | neon.report_quarterly_snapshot | Google Docs | Leadership |

### 4.3 Data Engineer Admin Interface

Data engineers (mapped to CDO/KW-08 seat) manage pipelines through:

```typescript
// Pipeline management commands
/jade-data pipeline-status          // View all cron jobs and their last run
/jade-data pipeline-run <job-name>  // Manually trigger a pipeline job
/jade-data pipeline-pause <job-name> // Pause a cron job
/jade-data pipeline-logs <job-name> // View recent execution logs
/jade-data schema-diff              // Show pending schema migrations
/jade-data schema-apply             // Apply pending migrations
/jade-data backfill <fact-table> --from <date> --to <date>  // Backfill historical data
```

---

## 5. Leadership Operations & Reporting

### 5.1 Operational Plans: Human Labor + Agent Labor

Leadership (CEO/KW-01 seat) creates operational plans that combine human and agent labor:

```
┌───────────────────────────────────────────────────────────────┐
│                    OPERATIONAL PLAN (OP1)                      │
│                    Q2 2026 — NovaMind Integration              │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  HUMAN LABOR                    AGENT LABOR                   │
│  ────────────                   ────────────                  │
│  │ Engineer writes feature │    │ Jade reviews code        │  │
│  │ PM defines requirements │    │ Jade structures PRD      │  │
│  │ Sales qualifies leads   │    │ Jade researches prospects│  │
│  │ Finance reviews books   │    │ Jade generates journals  │  │
│  │ Legal reviews contracts │    │ Jade drafts NDAs         │  │
│  │ Data eng manages pipes  │    │ Jade generates SQL       │  │
│  │ Support handles tickets │    │ Jade triages & drafts KB │  │
│  │ Marketing approves copy │    │ Jade drafts content      │  │
│                                                               │
│  BUDGET ALLOCATION                                            │
│  ─────────────────                                            │
│  Human: 47 FTEs × standard comp                              │
│  Agent: Budget per seat (see seat matrix)                     │
│  Total agent budget: ~$X,XXX/month (Opus + Sonnet mix)       │
│                                                               │
│  KPIs (from STO fitness functions)                            │
│  ──────────────────────────────────                           │
│  CTO: p95 deploy latency < 15 min                            │
│  CEO: quarterly OP1 goal attainment > 80%                    │
│  CFO: monthly close within 3 business days                   │
│  CDO: dashboard refresh latency < 5 min                      │
│  CRO: pipeline coverage ratio > 3x                           │
└───────────────────────────────────────────────────────────────┘
```

### 5.2 Weekly Business Review (WBR)

Generated every Monday from the Kimball warehouse:

```sql
-- WBR Query: Agent utilization and cost by seat
SELECT
  ds.title AS vp_seat,
  ds.kw_id,
  COUNT(DISTINCT fte.task_key) AS tasks_completed,
  SUM(fte.iterations) AS total_iterations,
  SUM(fte.total_cost_usd) AS total_cost_usd,
  AVG(fte.rots) AS avg_rots,
  AVG(fte.budget_utilization_pct) AS avg_budget_util,
  SUM(CASE WHEN fte.escalation_triggered THEN 1 ELSE 0 END) AS escalations,
  SUM(CASE WHEN fte.success THEN 1 ELSE 0 END)::float
    / NULLIF(COUNT(*), 0) AS success_rate
FROM jade_warehouse.fact_task_execution fte
JOIN jade_warehouse.dim_seat ds ON fte.seat_key = ds.seat_key
JOIN jade_warehouse.dim_time dt ON fte.time_key = dt.time_key
WHERE dt.date >= current_date - interval '7 days'
GROUP BY ds.title, ds.kw_id
ORDER BY total_cost_usd DESC;
```

#### WBR Report Structure (posted to Slack #jade-reports)

```
📊 Weekly Business Review — Week of 2026-03-09
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AGENT LABOR SUMMARY
  Tasks Completed:    142
  Total Cost:         $847.23
  Avg ROTS:           3.2x
  Success Rate:       94.3%
  Escalations:        8

BY VP SEAT
  CTO (KW-02):  52 tasks, $312.40, ROTS 4.1x, 96% success
  CDO (KW-08):  28 tasks, $156.20, ROTS 2.8x, 93% success
  CRO (KW-05):  24 tasks, $89.10,  ROTS 3.5x, 95% success
  CPO (KW-04):  18 tasks, $102.33, ROTS 2.9x, 94% success
  ...

BUDGET UTILIZATION
  Opus seats:   72% of weekly budget consumed
  Sonnet seats: 58% of weekly budget consumed
  Total:        $847.23 / $1,200 budget (70.6%)

TOP ESCALATIONS
  1. [KW-02] Architecture review exceeded budget (3 occurrences)
  2. [KW-10] Contract review complexity (2 occurrences)

HUMAN LABOR HIGHLIGHTS (from task queue)
  Completed PRs:      34
  Tickets resolved:   67
  Docs published:     12
```

### 5.3 Monthly Business Review (MBR)

Aggregated monthly with trend analysis:

```sql
-- MBR: Month-over-month cost and efficiency trends
SELECT
  dt.month,
  dt.year,
  COUNT(DISTINCT fte.task_key) AS tasks,
  SUM(fte.total_cost_usd) AS cost_usd,
  AVG(fte.rots) AS avg_rots,
  SUM(fte.total_cost_usd) / NULLIF(COUNT(DISTINCT da.agent_key), 0) AS cost_per_agent,
  LAG(SUM(fte.total_cost_usd)) OVER (ORDER BY dt.year, dt.month) AS prev_month_cost,
  (SUM(fte.total_cost_usd) - LAG(SUM(fte.total_cost_usd)) OVER (ORDER BY dt.year, dt.month))
    / NULLIF(LAG(SUM(fte.total_cost_usd)) OVER (ORDER BY dt.year, dt.month), 0) * 100
    AS cost_change_pct
FROM jade_warehouse.fact_task_execution fte
JOIN jade_warehouse.dim_time dt ON fte.time_key = dt.time_key
JOIN jade_warehouse.dim_agent da ON fte.agent_key = da.agent_key
GROUP BY dt.month, dt.year
ORDER BY dt.year, dt.month;
```

---

## 6. MCP Server Registry: Setup vs Available

### 6.1 Dynamic MCP Tracking Log

This registry tracks what is **configured** in this deployment vs what is **available** from the MCP ecosystem.

| # | MCP Server | Package | Category | Status | Configured For |
|---|------------|---------|----------|--------|---------------|
| **Reference Servers (Official — github.com/modelcontextprotocol/servers)** |||||
| 1 | Filesystem | `@modelcontextprotocol/server-filesystem` | Dev Tools | `available` | — |
| 2 | Git | `@modelcontextprotocol/server-git` | Dev Tools | `available` | — |
| 3 | Fetch | `@modelcontextprotocol/server-fetch` | Web | `available` | — |
| 4 | Memory | `@modelcontextprotocol/server-memory` | Knowledge | `available` | — |
| 5 | Sequential Thinking | `@modelcontextprotocol/server-sequential-thinking` | Reasoning | `available` | — |
| 6 | Time | `@modelcontextprotocol/server-time` | Utility | `available` | — |
| 7 | Everything | `@modelcontextprotocol/server-everything` | Testing | `available` | — |
| **Archived Reference Servers (moved to community maintenance)** |||||
| 8 | GitHub | `@modelcontextprotocol/server-github` | Dev Tools | **`setup`** | All seats (int-01) |
| 9 | Slack | `@modelcontextprotocol/server-slack` | Communication | **`setup`** | All seats (int-02) |
| 10 | Google Drive | `@modelcontextprotocol/server-gdrive` | Productivity | **`setup`** | All seats (int-03) |
| 11 | PostgreSQL | `@modelcontextprotocol/server-postgres` | Database | `available` | — |
| 12 | SQLite | `@modelcontextprotocol/server-sqlite` | Database | `available` | — |
| 13 | Puppeteer | `@modelcontextprotocol/server-puppeteer` | Automation | `available` | — |
| 14 | Brave Search | `@modelcontextprotocol/server-brave-search` | Search | `available` | — |
| 15 | Google Maps | `@modelcontextprotocol/server-google-maps` | Maps | `available` | — |
| 16 | Sentry | `@modelcontextprotocol/server-sentry` | Monitoring | `available` | — |
| 17 | GitLab | `@modelcontextprotocol/server-gitlab` | Dev Tools | `available` | — |
| 18 | Redis | `@modelcontextprotocol/server-redis` | Database | `available` | — |
| 19 | AWS KB Retrieval | `@modelcontextprotocol/server-aws-kb-retrieval` | Cloud | `available` | — |
| 20 | EverArt | `@modelcontextprotocol/server-everart` | Creative | `available` | — |
| **Partner / First-Party Integrations** |||||
| 21 | Stripe Agent Toolkit | `@stripe/agent-toolkit` | Payments | **`setup`** | CFO (int-04) |
| 22 | Neon | `@neondatabase/mcp-server-neon` | Database | **`setup`** | CDO, CTO (int-05) |
| 23 | Supabase | `supabase-community/supabase-mcp` | Backend | **`setup`** | CDO, CTO (int-06) |
| 24 | Vercel | `vercel/mcp-adapter` | Hosting | **`setup`** | CTO (int-07) |
| 25 | 1Password | `1password/1password-mcp` | Secrets | **`setup`** | Admin only (int-08) |
| 26 | Cloudflare | `cloudflare/mcp-server-cloudflare` | Cloud/CDN | `available` | — |
| 27 | Linear | `linear/linear-mcp-server` | Project Mgmt | `available` | — |
| 28 | Notion | `notion/notion-mcp-server` | Knowledge | `available` | — |
| 29 | Figma | `figma/figma-mcp` | Design | `available` | — |
| 30 | Datadog | `DataDog/datadog-mcp-server` | Monitoring | `available` | — |
| 31 | MongoDB | `mongodb/mongodb-mcp-server` | Database | `available` | — |
| 32 | Atlassian (Jira/Confluence) | `atlassian/mcp-server` | Project Mgmt | `available` | — |
| 33 | Axiom | `axiomhq/mcp-server-axiom` | Observability | `available` | — |
| 34 | Grafana | `grafana/mcp-grafana` | Monitoring | `available` | — |
| 35 | Snowflake | `snowflake-labs/mcp` | Data Warehouse | `available` | — |
| 36 | Twilio | `twilio/mcp-server-twilio` | Communication | `available` | — |
| 37 | Shopify | `shopify/shopify-mcp` | Commerce | `available` | — |
| 38 | Square | `square/square-mcp-server` | Payments | `available` | — |
| 39 | HubSpot | `hubspot/hubspot-mcp` | CRM | `available` | — |
| 40 | Sentry (official) | `getsentry/sentry-mcp` | Monitoring | `available` | — |
| **Community / Third-Party (Notable)** |||||
| 41 | Docker | `docker/mcp-server-docker` | DevOps | `available` | — |
| 42 | Kubernetes | Community | DevOps | `available` | — |
| 43 | Terraform | Community | Infrastructure | `available` | — |
| 44 | AWS | Community | Cloud | `available` | — |
| 45 | Azure | Community | Cloud | `available` | — |
| 46 | GCP | Community | Cloud | `available` | — |

**Legend**: `setup` = configured and health-checked in this deployment | `available` = supported MCP server, not yet configured

> **Dynamic Update Policy**: This registry is refreshed weekly by the jade-vp-search (CSO₂/KW-11) agent, which queries the MCP servers repository and updates the count of available vs configured servers. New MCP servers are flagged in the WBR report.

### 6.2 MCP Config Generation

For each `setup` server, the config is generated with 1Password references:

```typescript
// src/jade/mcp/generate.ts (proposed)
interface McpServerConfig {
  name: string;
  package: string;
  command: string;
  args: string[];
  env: Record<string, string>;  // op:// references only
  healthCheck: () => Promise<boolean>;
  assignedSeats: string[];      // KW IDs that can use this server
}

function generateMcpConfigs(teamConfig: JadeTeamConfig): McpServerConfig[] {
  // Read integrations from jade-team.json
  // Resolve secret references from 1Password
  // Generate .mcp.json for each plugin that needs it
  // Health check each connector
}
```

---

## 7. Journey Timeline Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     30-DAY INTEGRATION TIMELINE                  │
├──────┬──────────────────────────────────────────────────────────┤
│ Day  │ Milestone                                                │
├──────┼──────────────────────────────────────────────────────────┤
│  1   │ Alex + Jade: Infrastructure setup (1Password, MCP)      │
│  2-3 │ Alex + Jade: Seat assignment, plugin composition        │
│  4-5 │ Alex + Jade: Warehouse deploy (Neon), backend (Supa)   │
│  6-7 │ Alex + Jade: Verification, smoke test, Phase 1 DoD ✓   │
│──────┼──────────────────────────────────────────────────────────│
│  8   │ Phase 2 kickoff: Leadership training on jade-cofounder  │
│  9-10│ Engineering team onboarding (12 engineers → KW-02)      │
│ 11-12│ Data + Research teams onboarding (KW-08, KW-12)        │
│ 13-14│ Sales + Marketing teams onboarding (KW-05, KW-06)      │
│ 15-16│ Finance + Legal teams onboarding (KW-07, KW-10)        │
│ 17-18│ Support + Security teams onboarding (KW-09, KW-03)     │
│ 19-20│ Productivity + Exec teams onboarding (KW-13, KW-01)    │
│──────┼──────────────────────────────────────────────────────────│
│ 21   │ All 47 employees active, telemetry flowing             │
│ 22-25│ First full week of operations, tune budgets             │
│ 26   │ First WBR generated from warehouse data                │
│ 27-28│ Address escalations, adjust ROTS thresholds            │
│ 29   │ Leadership reviews MBR preview                          │
│ 30   │ Integration complete. Handoff to internal admin team.   │
└──────┴──────────────────────────────────────────────────────────┘
```

---

## 8. Appendix: Existing Code References

All data models and systems referenced in this journey map are grounded in existing codebase artifacts:

| Reference | File Path | Usage in Journey |
|-----------|-----------|-----------------|
| KW Seat definitions | `src/jade/kw/seats.json` | Employee → seat mapping (§Org Chart) |
| KW detection types | `src/jade/kw/types.ts` | `KWSeat`, `KWDetectionResult`, `EffortLevel` |
| Auth resolution | `src/jade/auth/resolve.ts` | Phase 1 auth setup (3 modes + 1Password) |
| Model pricing | `src/jade/models.json` | Warehouse dim_model, cost calculations |
| Task execution types | `src/jade/agent-sdk/types.ts` | `TaskResult`, `BudgetConfig`, `AgentSpec` |
| Token cost calculation | `src/jade/agent-sdk/tokenizer.ts` | `estimateCostUsd()`, `calculateRots()` |
| Telemetry events | `webmcp/shared/telemetry.ts` | `TelemetryEvent` → fact_tool_call |
| Tool registration | `webmcp/shared/register.ts` | `WebMCPToolDefinition` → dim_tool |
| Internal tools | `webmcp/internal/tools/` | claim-task, submit-artifact, etc. |
| Plugin composition | `compose/loader.ts`, `compose/resolver.ts` | Phase 1 plugin build step |
| Jade-loop state | `plugins/jade-loop/hooks/stop-hook.sh` | Task execution tracking |
| STO system prompts | `s-team/*.md` | VP role definitions, fitness functions |
| Identity patching | `src/jade/patches/cofounderIdentity.ts` | Phase 1 identity setup |
| VP plugins | `plugins/jade-vp-*/` | Phase 2 knowledge worker skills |
| Upstream sync | `upstream-ref.json` | Phase 1 composition |

---

*This customer journey map is a living document. Updated as integration progresses and new MCP servers become available.*
