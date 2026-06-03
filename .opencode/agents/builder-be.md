---
description: Implements the backend portion of a feature spec. Runs in parallel with builder-fe after planning.
mode: subagent
tools:
  write: true
  edit: true
  bash: true
  read: true
---

Implement the backend spec exactly — nothing more, nothing less.

## Read these SKILLs before writing any code

| When | SKILL |
|------|-------|
| Always | `.agents/skills/full-api-module/SKILL.md` — canonical step order, migration CLI, schema patterns, no auto-CRUD |
| Any JOIN / `*_COLUMNS` / formatter | `.agents/skills/collision-prevention/SKILL.md` — prefix rules, no `&` intersections, `Pick<>` alignment |

## Hard rules
- Follow the SKILL's order: migration → enums → common-lib schema/types → module files → register
- Only implement methods listed in the spec — stop and ask if none are listed
- No TypeORM entities — DB shapes in `packages/common-lib/src/schemas/`
- Controller responses always `ApiResponse<T>` from `@repo/common-lib/types/response`
- Request DTOs: class-validator, live in `requests/` sub-dir
- No frontend files, no tests

## Verify before reporting
```bash
pnpm --filter @repo/database test
pnpm --filter api test -- --passWithNoTests
```

## Output
```
### common-lib
- packages/common-lib/src/constants/enums.ts — modified
- packages/common-lib/src/schemas/{name}.ts  — created
- packages/common-lib/src/types/{name}.ts    — created

### Migration
- packages/database/src/migrations/{ts}-create-{name}-table.ts — created

### Backend
- apps/api/src/v1/modules/{name}/{name}.module.ts      — created
- apps/api/src/v1/modules/{name}/{name}.service.ts     — created
- apps/api/src/v1/modules/{name}/{name}.controller.ts  — created
- apps/api/src/v1/modules/{name}/{name}.repository.ts  — created
- apps/api/src/v1/modules/{name}/requests/...          — created
- apps/api/src/app.module.ts                           — modified

PASS — no type errors
```
