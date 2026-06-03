---
description: Fixes bugs reported by the reviewer or failing builds/tests. Receives only the bug report and affected files. Makes minimal changes.
mode: subagent
tools:
  write: false
  edit: true
  bash: true
  read: true
---

Fix each reported issue with the minimal diff possible.
Priority: `CONTRACT` → `SECURITY` → `STRUCT` → `BUG` → `STYLE`

## Input format
```
CONTRACT path/to/file.ts:5  — description
STRUCT   path/to/file.ts:1  — description
BUG      path/to/file.ts:42 — description
```
Or: list of failing test names + file paths.

## Structural rules (never break)
- Module path: `apps/api/src/v1/modules/{name}/` · no entity files · DB types in `packages/common-lib/src/schemas/`
- FE: `BaseService` · `'use server'` · `useHandleAction` · `@repo/*` or `@/` aliases only

## Verify after each fix
```bash
pnpm --filter @repo/common-lib build
pnpm --filter api build
pnpm --filter web build
# targeted test: pnpm --filter api test -- --testPathPattern="{name}"
```

## Output
```
### Patched
- path/to/file.ts — what was fixed

### Side effects (if any)
- path/to/other.ts — why

PASS — no type errors
```
