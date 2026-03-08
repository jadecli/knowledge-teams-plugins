---
description: "Run automated code review on a file, PR, or directory"
argument-hint: "TARGET [--pr N] [--focus security|performance|style|all]"
---

# /code-review

Triggers an automated code review using the `code-review` skill.

Analyses the target for correctness, security, performance, style, and
test coverage. Outputs structured XML review results.

## Arguments

| Arg | Description |
|-----|-------------|
| `TARGET` | File path, directory, or `--pr N` for a GitHub PR |
| `--pr N` | Review GitHub PR number N (requires GitHub MCP) |
| `--focus` | Limit review scope: `security`, `performance`, `style`, `all` (default) |

## Output

```xml
<code_review>
  <summary severity="critical|high|medium|low|info">...</summary>
  <findings>
    <finding severity="..." file="..." line="...">
      <description>...</description>
      <suggestion>...</suggestion>
    </finding>
  </findings>
  <score overall="0-100" security="0-100" performance="0-100" style="0-100"/>
</code_review>
```

## Example

```
/code-review src/auth/
/code-review --pr 42 --focus security
```
