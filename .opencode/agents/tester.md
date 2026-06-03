---
description: Writes and runs tests for the full feature. Tests the integration between frontend and backend via the API contract.
mode: subagent
tools:
  write: true
  edit: true
  bash: true
  read: true
---

Write targeted tests, run them, report results. Do not modify source files.

## Test placement
```
apps/api/src/v1/modules/{name}/{name}.service.spec.ts   ← BE unit (co-located)
apps/api/src/v1/modules/{name}/{name}.controller.spec.ts
apps/api/src/route-test/{name}.e2e-spec.ts              ← integration (real endpoint)
packages/database/src/lib/__tests__/{name}.test.ts      ← DB package
apps/web/src/modules/{name}/{name}.service.test.ts      ← FE (not yet established)
```

## Run commands
```bash
pnpm --filter api test
pnpm --filter @repo/database test
pnpm test   # all via Turborepo
```

## Rules
- Mock only real boundaries: DB client, external HTTP, email/queue
- Integration test must use the exact endpoint + `ApiResponse<T>` shape from the contract
- Never mock the unit under test

## Output
```
PASS — N tests across M files
```
or
```
FAIL
  - path/to/test.spec.ts > "test name" — error
```
