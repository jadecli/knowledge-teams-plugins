# Bloom Eval Gates

## Activation

Auto-fires at jade-loop completion checkpoints to evaluate whether agent
outputs meet quality and safety thresholds before proceeding.

## What are Bloom Eval Gates?

Inspired by Bloom's Taxonomy of learning objectives, Bloom Eval Gates are
a tiered quality assessment system for agent outputs. Each gate checks a
different cognitive level of the output quality.

## Gate levels

| Level | Bloom Level | Question |
|-------|-------------|----------|
| L1 | Remember | Does the output address the stated task? |
| L2 | Understand | Is the reasoning coherent and explained? |
| L3 | Apply | Are the right methods/tools applied? |
| L4 | Analyse | Are trade-offs considered? |
| L5 | Evaluate | Is the output critically assessed? |
| L6 | Create | Does it produce novel, high-quality work? |

## Gate configuration

Gates are configured per jade-loop in `.claude/jade-loop.local.md`:

```yaml
bloom_gate:
  min_level: 3       # Minimum Bloom level required to pass
  security_gate: true # Apply security-specific eval
  auto_block: false  # Block exit on gate failure (vs. warn only)
```

## Security-specific gate

When `security_gate: true`, additionally checks:
- No hardcoded secrets in generated code
- No prompt injection patterns in outputs
- No unexpected file deletions or network calls
- No use of `eval`, `exec`, or similar dangerous patterns

## Gate output format

```xml
<bloom_eval>
  <gate level="L3" status="pass|fail|warn">
    <rationale>...</rationale>
  </gate>
  <security_gate status="pass|fail">
    <findings>
      <finding type="hardcoded-secret" severity="critical">...</finding>
    </findings>
  </security_gate>
  <overall status="pass|fail" bloom_level_achieved="4"/>
</bloom_eval>
```

## Integration with jade-loop

The stop hook checks for `<bloom_eval>` in the last output. If
`overall status="fail"` and `auto_block: true`, the loop continues with
a corrective prompt rather than exiting.
