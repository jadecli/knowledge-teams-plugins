---
skill: customer-simulation
domain: data-engineering
description: Uses real customer case studies to generate simulation test scenarios
---

# Customer Simulation Framework

Use crawled customer blog posts as source material for generating realistic test scenarios. Each customer case study describes a real-world integration of Claude — these become templates for simulation tests.

## Simulation pattern

1. **Extract** structured facts from a customer blog post (company, industry, problem, solution, metrics)
2. **Abstract** the integration pattern into a reusable template
3. **Generate** a test scenario that exercises the same pattern using Jade infrastructure
4. **Validate** that Jade could hypothetically support the customer's use case

## Example

Customer: Stripe deploys Claude Code to 1,370 engineers
→ Pattern: Enterprise rollout, zero-config, code generation at scale
→ Simulation: Test Jade orchestrator with N concurrent agent sessions, verify budget enforcement, checkpoint management

## Future work

- Automated simulation generation from blog post JSON facts
- Coverage matrix: which Jade capabilities are exercised by which customer patterns
- Gap analysis: customer use cases Jade cannot yet support
