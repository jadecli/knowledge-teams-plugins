# jadecli PM Practices

Extends upstream `product-management` plugin with jade-specific product practices.

## When to apply

Use these practices when working on jadecli product artifacts — PRDs, user stories, sprint planning, or roadmap prioritization.

## Practices

1. **Safety-first feature design** — Every feature PRD must include a "Safety Implications" section that maps to at least one safety-research repo from the jadecli org.

2. **STO validation** — Before a feature ships, the relevant S-team STO (CPO for product, CTO for infra, etc.) must produce a structured assessment.

3. **Budget-aware scoping** — Every user story includes an estimated `budget_tool_calls` cost so the team can forecast agent compute spend.

4. **Compose-layer awareness** — Features that touch upstream KWP plugins must specify whether they extend, override, or wrap the upstream behavior.
