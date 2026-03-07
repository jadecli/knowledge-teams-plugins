# Budget Enforcement

Agent sessions have finite tool call budgets. This skill governs how you manage that budget.

## Rules

1. **Pre-flight estimate** — Before starting a multi-step task, estimate the tool calls needed. If the estimate exceeds remaining budget, request a budget increase or scope reduction.
2. **Batch when possible** — Make independent tool calls in parallel to reduce total call count.
3. **No speculative calls** — Do not make tool calls "just to check" unless the information is required for the current decision.
4. **Budget warning** — When you reach 80% of your budget, include a budget warning in your response.
5. **Hard stop** — At 100% of budget, stop execution and submit whatever artifacts are complete with a status of `budget_exhausted`.
