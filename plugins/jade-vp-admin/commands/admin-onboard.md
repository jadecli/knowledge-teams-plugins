---
description: "Generate an enterprise onboarding plan and track provisioning progress"
argument-hint: "[--org ORG_ID] [--plan teams|enterprise|api] [--status]"
---

# /admin-onboard

Generates a phased onboarding plan for deploying Claude Code across an
organization, or reports on current provisioning progress.

## Options

- `--org ORG_ID` — Organization identifier
- `--plan teams|enterprise|api` — Billing model for the deployment
- `--status` — Show current onboarding checklist status

## Output

Produces an onboarding plan with: organization setup steps, authentication
configuration, policy deployment, distribution plan, monitoring setup,
and project standards templates. Tracks completion percentage.
