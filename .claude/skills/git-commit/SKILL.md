---
name: git-commit
description: >
  Stage changes and create a well-structured conventional commit. Invoke when work is complete
  and ready to commit, or when asked to commit/save changes.
allowed-tools: Bash(git status), Bash(git diff *), Bash(git add *), Bash(git commit *), Bash(git log *)
---

# Create Git Commit

## Step 1 — Review What Changed

!`git status`
!`git diff --staged`
!`git diff`

## Step 2 — Choose What to Stage

Stage only the files relevant to the current change. NEVER stage:
- `.env` or any `.env.*` variant
- `*.json` files containing credentials or service account keys
- `.claude/settings.local.json`

## Step 3 — Write the Commit Message

Format:
```
<type>(<scope>): <imperative summary under 72 chars>

[optional body: what changed and why — not how]

[optional footer: breaking changes, refs]
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `refactor` — restructure without behavior change
- `test` — add or fix tests
- `docs` — documentation only
- `chore` — build, config, dependencies
- `perf` — performance improvement
- `security` — security fix

**Scopes:** `auth`, `users`, `drivers`, `orders`, `addresses`, `static`, `db`, `flutter-user`, `flutter-driver`, `ci`, `config`

**Good examples:**
```
feat(orders): add real-time order tracking endpoint
fix(auth): handle expired Firebase token without 500 error
refactor(drivers): extract location validation to service layer
test(orders): add full order lifecycle integration test
chore(deps): update Fastify to 4.29.0
db: add index on orders.status for faster driver queries
```

## Step 4 — Commit

```bash
git add <files>
git commit -m "<message>"
```

Show the final commit hash after committing.
