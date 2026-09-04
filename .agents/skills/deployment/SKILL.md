---
name: deployment
description: >-
  Commit local changes and optionally push, then watch GitHub Actions until
  green. Use ONLY when the user explicitly asks to commit, push to origin, push
  to main or develop, or check the pipeline / Actions. Do not use during
  feature work, code review, or implementation. Never push to main or develop
  unless the user asked for that branch.
---

# Deployment (commit → gate → push → CI)

Explicit-request skill. Completing a coding task is **not** permission to commit or push.

## When this skill applies

Run it only if the user clearly asked, for example: "commit", "commit this", "push", "push to origin", "push to develop", "push to main", "check CI", "watch the pipeline".

| User said | Do |
| --- | --- |
| commit (no push) | Commit only. Stop. |
| push / push to origin | Commit if needed, then **pre-push gate**, then push the **current** branch. |
| push to develop / push to main | Same, but only to that named branch. |
| check CI / watch the pipeline | Watch the latest run. Do not commit or push unless they also asked. |

If the request is ambiguous ("ship it", "deploy this") and they did not name **commit**, **push**, **main**, or **develop**, ask which action they want. Do not guess.

## Hard rules

- Never commit unless the user asked to commit or to push (push implies commit first if there are uncommitted changes they intended to include).
- Never push to `main` or `develop` unless the user named that branch or said "push" while already on it.
- Never switch to `main`/`develop` and push just because work is done.
- Never `--force` / `--force-with-lease` to `main` or `develop`. Warn if they ask.
- Never `--no-verify`, `--no-gpg-sign`, or `git config`.
- Never interactive git (`-i`).
- Never commit `.env`, credentials, or secret files. Warn if they ask.
- Do not amend unless: the user asked, **or** HEAD was created by you in this conversation, the commit succeeded, a hook only auto-modified files, and it has **not** been pushed. If a hook **rejected** the commit, fix and make a **new** commit — do not amend.
- If already pushed, never amend unless the user explicitly asked (that requires force-push; refuse for `main`/`develop`).

## 1. Inspect (always, in parallel)

```powershell
git status
git diff
git log -12 --format="%s"
git branch --show-current
git status -sb
```

Read the diff. Draft a message that matches recent log style (`feat(scope):`, `fix(scope):`, `refactor(scope):`, `docs:`) and explains **why**, in 1–2 sentences. Do not commit files that look like secrets.

## 2. Commit (when asked)

Stage only the relevant files. Do not dump unrelated untracked docs or scratch files.

PowerShell:

```powershell
git add -- path1 path2
git commit -m @"
feat(scope): short why-focused summary
"@
git status
```

After commit, confirm with `git status`. Empty commit: skip.

If the user only asked to commit, **stop here** and report the hash + message.

## 3. Pre-push gate (mandatory before every origin push)

**Never push to origin unless this passes.** Do not skip for "small" changes.

```powershell
pnpm deploy
```

That is `pnpm lint && pnpm test && pnpm build` (turbo, whole monorepo). Same bar CI's `test` job uses for lint/tests, plus a local **build**.

If any step fails:

1. Fix the code.
2. Re-run `pnpm deploy` until it passes.
3. Commit the fix (in scope of a push request).
4. Only then push.

Do not push a known-red tree. Do not push while the gate is still running.

## 4. Push

Current branch unless they named `main` or `develop`.

```powershell
git push -u origin HEAD
```

If they named `main` or `develop` and HEAD is a different branch, **stop and ask** — do not merge or push the other branch for them.

## 5. Watch GitHub Actions (after every origin push)

Workflow: `.github/workflows/ci-cd.yml` (`CI / CD`).

- `push` to **`develop`** or **`main`** → `test`, then Docker build/push, then SSH deploy.
- **`pull_request`** → `test` only.
- Push to any other branch **does not** run this workflow unless a PR exists.

Identify the run (prefer the SHA just pushed):

```powershell
gh run list --workflow "CI / CD" --branch (git branch --show-current) --limit 5
```

If that is empty, check a PR:

```powershell
gh pr status
gh pr checks
```

If there is no run and no PR, report that CI did not start (feature-branch push without a PR). Do not invent a failure.

Watch until terminal:

```powershell
gh run watch <run-id> --exit-status
```

Docker build + deploy can take a long time. Wait for the run; do not declare success from `queued`/`in_progress`.

On failure:

```powershell
gh run view <run-id> --json conclusion,status,url,headSha,jobs
gh run view <run-id> --log-failed
```

Then follow **§6**.

## 6. CI failed → fix → commit → push → watch again

1. Read the failed job/step logs. Classify:

   | Job | Typical cause | Action |
   | --- | --- | --- |
   | `test` | lint or unit tests | Reproduce with `pnpm deploy`, fix, commit, gate, push, watch |
   | `build-and-push` / `build-and-push-prod` | Docker / image build | Fix Dockerfile or build context, same loop |
   | `deploy` / `deploy-prod` | SSH, secrets, droplet script | **Stop.** Report the log. Do not keep pushing; this is usually infra |

2. Fix in the repo when it is a code/lint/test/build failure.
3. Run `pnpm deploy` again. Do not push until it passes.
4. Commit the fix (new commit; do not amend a commit that was already pushed).
5. Push to the **same** branch they asked for.
6. Watch the new run.
7. Repeat until green, or stop after **3** fix-push cycles and report what is still failing.

Do not "fix" by skipping tests, disabling lint, or weakening CI.

## Done

Tell the user, in plain language:

- Commit hash and message (if you committed)
- Whether you pushed, and to which branch
- `pnpm deploy` result (if you pushed)
- Actions run URL and conclusion (`success` / `failure` / did not run)
- If failed: the failing job, the cause, and what you changed (or why you stopped)

## Related

- `.github/workflows/ci-cd.yml` — jobs and branch triggers
- Root `package.json` script `deploy` — local lint + test + build
- `.agents/skills/api-verification/SKILL.md` — package-scoped API gates during implementation (not a substitute for `pnpm deploy` before origin push)
