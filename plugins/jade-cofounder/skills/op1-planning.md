# OP1/OP2 Planning Methodology

## Activation

Auto-fires when the user initiates `/op1` or asks about annual planning,
strategic goals, or OKR setting.

## OP1 Process (Q4 → January lock)

Amazon-style OP1 planning adapted for AI-native teams:

### Phase 1: Narratives (weeks 1–2)
Each VP produces a 6-page narrative covering:
1. What did we accomplish last year?
2. What are we committing to this year?
3. What do we need (resources / token budget)?
4. What are the top 3 risks?

No PowerPoints. Prose forces clarity.

### Phase 2: S-Team Review (week 3)
- Convene `/s-team` with all narratives
- Challenge: "Is this goal big enough?"
- Challenge: "Is this goal measurable?"
- Challenge: "Do we have the token budget?"
- Output: YAML addendum per VP

### Phase 3: Goal Tree (week 4)
Goals decomposed into a tree:
```
Vision
└── Strategic Theme A
    ├── Goal G1: [metric] by [date]
    │   ├── Initiative I1
    │   └── Initiative I2
    └── Goal G2: ...
```

### Phase 4: Resource Allocation
Map token budgets to goals using ROTS targets:
- Must-have goals: uncapped budget
- Should-have goals: fixed budget
- Nice-to-have: opportunistic only

### OP2 (July refresh)
- Mid-year check-in against OP1 goals
- Adjust resource allocation
- Add/remove initiatives based on learnings

## Output Format

```markdown
# OP1 {YEAR}

## Vision
[One sentence]

## Goals
| ID | Goal | Metric | Target | Budget ($) | Owner |
|----|------|--------|--------|------------|-------|
| G1 | ... | ... | ... | ... | ... |

## Big Bets
1. ...
2. ...

## S-Team Feedback
[YAML addendum from each VP]
```
