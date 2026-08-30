---
name: api-verification
description: >-
  Run test, lint, and build gates for TH Studio API changes. Use after a middle
  change in apps/api, packages/database, packages/common-lib, or
  packages/backend-lib — skip only for typo-only or comment-only edits.
---

# API Recipe: Verification

Typo-only / comment-only edits may skip the gate.

If it is a middle change, not just a typo fix, it must run test, lint, and build and pass all of them. Do not finish with failures.

Run what matches the touch set:

```bash
pnpm --filter @repo/database test    # migrations / database
pnpm --filter api test -- --passWithNoTests
pnpm --filter api lint
pnpm --filter api build
```

Skip database tests if no migration changed. Prefer targeted specs when they exist.

Also run `test` / `lint` / `build` on other touched packages (`@repo/common-lib`, `@repo/backend-lib`, `@repo/database`) when those packages expose the script. Fix failures before reporting done.

## Done criteria

- Only requested recipes were implemented.
- No extra CRUD methods, jobs, mails, or module files.
- Touched join queries follow collision-prevention.
- Touched code compiles.
- If a middle change (not a typo fix): test, lint, and build all passed.
- If a queue/processor was requested: helper method exists, no raw `queue.add()`.
- If a migration was requested: `dbcli` created it and schema/types match the table.

## Related skills

- `.agents/skills/full-api-module/SKILL.md` — which recipes were in scope
- `.agents/skills/api-testing/SKILL.md` — live HTTP + Postgres checks when an endpoint must be hit
