# Two-Pizza Teams for Agent Teams

## Activation

Apply when sizing agent teams, planning parallel workstreams, or when a
task is taking too long (sign of a team that's too large).

## The Rule

A team should be small enough that two pizzas can feed it.
For AI agent teams: **2–6 concurrent agents** per workstream.

## Why it works

- Small teams communicate with lower overhead (O(n²) communication paths)
- Each agent has clear ownership
- Parallel workstreams with minimal dependencies
- Easy to measure individual ROTS

## Agent team sizing guide

| Workstream type | Recommended size |
|----------------|-----------------|
| Single feature | 1–2 agents |
| Sprint (1 week) | 3–4 agents |
| Quarter initiative | 4–6 agents |
| Full S-Team council | 13 (special case) |

## Forming an agent team

1. Define the mission (1 sentence)
2. Assign a **lead agent** (owns the output)
3. Assign **specialist agents** (max 5)
4. Set a shared jade-loop with a single budget
5. Use `jade-checkpoint` for synchronisation points

## Red flags (team too large)

- More than 2 synchronisation points per day
- Agents blocking on each other's output > 20% of time
- ROTS dropping below baseline across the team

Split into independent sub-teams when these signals appear.
