# Deep Research Skill

## Activation

Auto-fires when the user asks "research X", "what do we know about Y",
or "compare A and B".

## Research methodology

1. **Question decomposition** — break the research question into sub-questions
2. **Source identification** — identify relevant source types
3. **Parallel retrieval** — gather sources in parallel (jade-loop with sub-agents)
4. **Synthesis** — integrate findings, resolve contradictions
5. **Confidence scoring** — rate each claim by evidence strength

## Evidence strength scale

| Level | Description |
|-------|-------------|
| Strong | Multiple independent primary sources |
| Moderate | Single primary source or multiple secondary |
| Weak | Single secondary source or inference |
| Speculative | No direct evidence, reasoned extrapolation |

## Output format

```markdown
# Research: {Topic}

**Date**: YYYY-MM-DD
**Depth**: shallow | deep
**Confidence**: high | medium | low

## Summary
[3–5 sentence executive summary]

## Findings
### Finding 1: ...
[Evidence: Strong | Moderate | Weak | Speculative]
...

## Gaps & open questions
- ...

## Recommended next steps
- ...
```
