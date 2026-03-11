# Claude Environment Setup

Setup guide for Claude Code across device surfaces (local CLI, Claude web, CI/CD).
The `gh` CLI and GitHub API access require a `GH_TOKEN` — this doc explains how to
provide it in each environment.

## Why GH_TOKEN is needed

Scripts like `npm run pr:manifest` use `gh pr edit` to update PR bodies programmatically.
Without `GH_TOKEN`, `gh` can't authenticate to the GitHub API. The local git proxy only
handles git operations (push/pull/fetch), not REST API calls.

## Environment-specific setup

### 1. Local CLI (your machine)

```bash
# Option A: gh auth login (interactive, stores token in ~/.config/gh/)
gh auth login

# Option B: 1Password CLI integration
# Requires 1Password CLI (op) + GitHub credential stored in vault
export GH_TOKEN=$(op read "op://Private/GitHub PAT/token")

# Option C: Export from .env
echo 'GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx' >> .env
source .env
```

After auth, verify:
```bash
gh auth status
gh pr view 13 --json title  # should return PR data
```

### 2. Claude Code on the web

Claude Code web sessions start fresh — no persistent `~/.config/gh/` state.
Use a **SessionStart hook** to inject `GH_TOKEN` at session start.

**Option A: GitHub secret + hook (recommended)**

Create `.claude/hooks.json` in your repo:

```json
{
  "hooks": [
    {
      "event": "SessionStart",
      "command": "echo 'Setting up GH_TOKEN from environment' && export GH_TOKEN=${GH_TOKEN:-}"
    }
  ]
}
```

Then set `GH_TOKEN` as a Claude Code environment variable in your project settings,
sourced from 1Password or your secrets manager.

**Option B: 1Password Connect (for teams)**

If your team uses 1Password Connect or Service Accounts:

```json
{
  "hooks": [
    {
      "event": "SessionStart",
      "command": "export GH_TOKEN=$(op read 'op://Jade Vault/GitHub PAT/token' 2>/dev/null || echo '')"
    }
  ]
}
```

Requires `OP_SERVICE_ACCOUNT_TOKEN` set in the Claude Code environment.

### 3. GitHub Actions CI/CD

CI workflows already have `GITHUB_TOKEN` from the Actions runner. For `gh` CLI calls
within Claude Code Action steps, pass it explicitly:

```yaml
- uses: anthropics/claude-code-action@v1
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    prompt: |
      Run npm run pr:manifest and update the PR body with the output.
```

For cross-repo operations or elevated permissions, use a GitHub App token or PAT
stored in repo secrets:

```yaml
env:
  GH_TOKEN: ${{ secrets.GH_PAT_JADE }}
```

### 4. Cloud .env (Codespaces, Gitpod, Railway, etc.)

Set `GH_TOKEN` in your cloud provider's environment variable configuration:

- **GitHub Codespaces**: Settings → Codespaces → Secrets → `GH_TOKEN`
- **Gitpod**: Dashboard → Settings → Variables → `GH_TOKEN` (scope: `jadecli/*`)
- **Railway / Render**: Project settings → Environment → `GH_TOKEN`

## Token permissions

The `GH_TOKEN` (PAT or GitHub App token) needs these scopes:

| Scope | Why |
|-------|-----|
| `repo` | Read/write PRs, issues, commits |
| `read:org` | Read org membership (for team-scoped operations) |

For fine-grained PATs, enable:
- **Pull requests**: Read and write
- **Issues**: Read and write
- **Contents**: Read (for `gh pr diff`, `gh api`)

## Verification

After setup, run this from any surface to verify:

```bash
# Should print your GitHub username
gh auth status

# Should update PR #13 body with token manifest
npm run pr:manifest > /tmp/manifest.md
CURRENT_BODY=$(gh pr view 13 --json body -q '.body')
gh pr edit 13 --body "${CURRENT_BODY}

$(cat /tmp/manifest.md)"
```

## Security notes

- Never commit `GH_TOKEN` to the repo (`.env` is in `.gitignore`)
- Prefer short-lived tokens: GitHub App tokens (1h) > fine-grained PATs (90d) > classic PATs
- 1Password integration is preferred for teams — no plaintext tokens on disk
- Rotate tokens if exposed; check `gh auth status` shows the expected account
