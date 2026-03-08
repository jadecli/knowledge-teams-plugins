# Prospect Research Skill

## Activation

Auto-fires when the user mentions a company name in a sales context or
runs `/prospect`.

## ICP fit scoring

Score prospects on 5 dimensions (1–5 each):

| Dimension | Signal |
|-----------|--------|
| Industry fit | Matches target verticals |
| Company size | Within ACV target range |
| Tech stack | Compatible with our product |
| Pain fit | Known pain we solve |
| Timing | Active buying signals |

**ICP score** = sum / 25 × 100

## Call brief format

```yaml
prospect:
  company: "..."
  domain: "..."
  icp_score: 80
  pain_points: [...]
  talking_points: [...]
  discovery_questions: [...]
  next_step: "..."
```
