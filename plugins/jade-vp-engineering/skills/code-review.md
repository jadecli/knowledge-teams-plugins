# Code Review Skill

## Activation

Auto-fires when:
- A file is saved with a `.ts`, `.py`, `.go`, `.rs`, or `.js` extension
- The user runs `/code-review`
- A jade-loop completes a code generation task

## Review dimensions

### 1. Correctness
- Logic errors and off-by-one bugs
- Null/undefined handling
- Error propagation (are errors swallowed?)
- Type safety (TypeScript: no unsafe `any`, proper generics)

### 2. Security
- Input validation and sanitisation
- SQL injection / command injection vectors
- Secrets in code or logs
- Authentication and authorisation checks
- Dependency vulnerabilities (cross-ref with advisory DB)

### 3. Performance
- N+1 query patterns
- Unnecessary re-renders or re-computations
- Missing indexes (for DB queries)
- Memory leaks (unclosed streams, event listeners)

### 4. Style
- Consistency with codebase conventions
- Meaningful variable/function names
- Dead code
- Comment quality

### 5. Test coverage
- Are happy paths tested?
- Are error paths tested?
- Are edge cases covered?

## Output format

Produce structured XML:

```xml
<code_review>
  <summary severity="critical|high|medium|low|info">
    One-paragraph summary of the overall quality.
  </summary>
  <findings>
    <finding severity="critical" file="src/auth.ts" line="42">
      <description>JWT secret read from hardcoded string instead of env var.</description>
      <suggestion>Use `process.env.JWT_SECRET` and validate it's set at startup.</suggestion>
    </finding>
  </findings>
  <score overall="72" security="40" performance="85" style="90"/>
</code_review>
```

## Severity guide

| Severity | Meaning |
|----------|---------|
| critical | Must fix before merge; security or data loss risk |
| high | Should fix before merge; likely bug |
| medium | Fix in follow-up; code quality issue |
| low | Nice to fix; style or minor perf |
| info | Observation; no action required |
