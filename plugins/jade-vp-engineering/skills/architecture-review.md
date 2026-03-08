# Architecture Review Skill

## Activation

Auto-fires when:
- A new system design document is created
- The user asks "is this architecture good?" or "review my design"
- An ADR (Architecture Decision Record) is drafted

## Review framework

### 1. Fitness for purpose
- Does it solve the stated problem?
- Are the non-functional requirements (latency, throughput, availability) met?
- Is it appropriately complex (not over-engineered, not under-engineered)?

### 2. Scalability
- Where are the bottlenecks?
- What breaks first under 10× load?
- Is the database the bottleneck? (Usually yes.)

### 3. Reliability
- What are the failure modes?
- Is there a single point of failure?
- How does the system degrade gracefully?
- What's the recovery time objective (RTO)?

### 4. Security
- What's the attack surface?
- Is authentication/authorisation in the right layer?
- What data is persisted and where?

### 5. Operability
- Can it be observed? (metrics, traces, logs)
- Can it be deployed with zero downtime?
- Is the deployment pipeline automated?

### 6. Cost efficiency
- What are the dominant cost drivers?
- What's the projected cost at 10× current scale?
- Are there cheaper architectural alternatives?

## ADR format

When proposing an architecture decision:

```markdown
# ADR-{N}: {Title}

**Date**: YYYY-MM-DD
**Status**: proposed | accepted | deprecated | superseded

## Context
...

## Decision
...

## Consequences
**Positive**: ...
**Negative**: ...
**Risks**: ...
```

## Output

Produce a structured review covering all 6 dimensions with a
recommendation: `approve`, `approve-with-changes`, or `redesign`.
