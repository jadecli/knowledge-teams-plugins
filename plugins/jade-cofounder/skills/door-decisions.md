# One-Way / Two-Way Door Decisions

## Activation

Auto-fires when the user or an agent needs to make a consequential decision.
Helps classify whether the decision is reversible and calibrate the speed
and rigour of the decision process.

## Classification

### Two-Way Door (reversible)
- Can be undone with low cost
- **Decision speed**: Fast (bias for action)
- **Approval required**: None or team lead
- **Examples**: Feature flags, library upgrades, prompt tweaks, test strategies

### One-Way Door (irreversible or costly to reverse)
- Hard or expensive to undo
- **Decision speed**: Slow (high rigour)
- **Approval required**: S-Team council
- **Examples**: Database migrations, public API contracts, pricing changes,
  architectural shifts, firing/hiring decisions

## Decision template

```yaml
decision:
  title: "..."
  type: one-way | two-way
  reversibility_cost: low | medium | high
  options:
    - name: "Option A"
      pros: [...]
      cons: [...]
      rots_estimate: ...
    - name: "Option B"
      ...
  recommended: "Option A"
  rationale: "..."
  owner: "..."
  reviewers: [...] # empty for two-way doors
  deadline: "YYYY-MM-DD"
```

## Rule of thumb

> "Most decisions are two-way doors. Treat them that way.
>  Reserve S-Team review for the 5% that are truly one-way."
