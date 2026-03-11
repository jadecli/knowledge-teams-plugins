## Summary

<!-- Brief description of what this PR does -->

## Checklist

### Conventional Commits
- [ ] All commit messages follow [conventional commits](https://www.conventionalcommits.org/) format
- [ ] Scope matches one of the defined scopes in `commitlint.config.js`

### Manifest Updates
- [ ] `manifests/stainless-features.json` — feature counts match reality
- [ ] `manifests/dependency-tracking.json` — dependency versions current
- [ ] Enterprise schemas in `src/jade/enterprise/schemas/` — no breaking changes

### Security (must ALL pass before code is written)
- [ ] Codebase manifest reviewed — all files catalogued
- [ ] Commit history analyzed for security-relevant changes
- [ ] Dependencies checked against `manifests/dependency-tracking.json` for CVEs
- [ ] No silent failures — every error path has explicit handling
- [ ] No new `any` types introduced (strict TypeScript)
- [ ] No secrets in code (keys, tokens, passwords)

### Test-Driven Planning
- [ ] Test manifest updated if new tests added (`@jade:test-id`, `@jade:rationale`)
- [ ] Upstream/downstream dependencies documented in test comments
- [ ] Tests written BEFORE implementation code
- [ ] All existing tests still pass (`npm test`)

### Read/Write Separation (if agent tools changed)
- [ ] New tools classified with `ToolGovernanceCategory`
- [ ] Default scope is READ (write requires explicit grant)
- [ ] Blast radius documented for any WRITE tools

### llms.txt Verification (if SDK/API code changed)
- [ ] Checked [Claude Code llms.txt](https://docs.anthropic.com/en/docs/claude-code/llms.txt) for relevant updates
- [ ] Checked [Claude Platform llms.txt](https://docs.anthropic.com/en/docs/llms.txt) for API changes
- [ ] Checked `@anthropic-ai/sdk` [changelog](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/CHANGELOG.md) for breaking changes

## Cost Tracking
<!-- Auto-filled by claude-cost-tracking GitHub Action -->
