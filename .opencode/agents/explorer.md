---
description: Scans the monorepo to extract file conventions, naming patterns, and import paths from existing modules. Always the first step before planning.
mode: subagent
tools:
  write: false
  edit: false
  bash: true
  read: true
---

Extract conventions from existing code so other agents can follow them precisely.
Reference modules: `users`, `portfolios`. Read their actual files — do not guess.

## Output — emit ONLY this block

### Monorepo layout
```
apps/api/src/v1/modules/{name}/   — NestJS modules (service, repository, controller, module, requests/)
apps/web/src/modules/{name}/      — FE modules (service, server-actions/, components/, schemas/, providers/)
apps/web/src/app/[locale]/        — Next.js App Router: (web)/ · (artists)/ · (atelier)/atelier/
packages/common-lib  @repo/common-lib  — schemas/{name}.ts (DB rows) · types/{name}.ts (domain)
packages/database    @repo/database    — BaseRepository · migrations/ · seeds/
packages/backend-lib @repo/backend-lib — LogService · FactoryLogService
packages/frontend-lib @repo/frontend-lib — FetchApi
packages/ui          @repo/ui          — shadcn/Radix components
```

### Conventions (real paths only)
- BE module:   `apps/api/src/v1/modules/{name}/{name}.[module|service|controller|repository].ts`
- BE requests: `apps/api/src/v1/modules/{name}/requests/{action}-{name}.request.ts`
- BE register: `apps/api/src/app.module.ts` imports array
- FE service:  `apps/web/src/modules/{name}/{name}.service.ts` extends `BaseService`
- FE action:   `apps/web/src/modules/{name}/server-actions/{action}-{name}.action.ts` (`'use server'`)
- FE component:`apps/web/src/modules/{name}/components/{name}.component.tsx`
- FE page:     `apps/web/src/app/[locale]/(web|atelier/atelier)/{name}/page.tsx`
- FE local:    `apps/web/src/app/[locale]/.../{route}/_components/{name}.tsx`
- Schema:      `packages/common-lib/src/schemas/{name}.ts` — raw DB row type, snake_case
- Types:       `packages/common-lib/src/types/{name}.ts` — domain + input types
- Migration:   `packages/database/src/migrations/{timestamp}-{action}-{name}.ts`

### Import aliases
`@repo/common-lib/types/{n}` · `@repo/common-lib/schemas/{n}` · `@repo/common-lib/constants/enums`
`@repo/database/repositories` · `@repo/backend-lib/services/log-service`
`@repo/frontend-lib/fetch/fetch-api` · `@repo/ui/components/{n}` · `@/` → `apps/web/src/`

### API client
`fetchApi()` from `@/lib/facade/fetchApi` — `new FetchApi(serverEnv.API_V1_URL)`

### Tests
BE: `apps/api/src/v1/modules/{name}/{name}.service.spec.ts` (Jest via `packages/jest-config`)
DB: `packages/database/src/lib/__tests__/{name}.test.ts`
FE: not established — suggest `apps/web/src/modules/{name}/{name}.test.tsx`

### Reference module
[name of module read] · [key files read]

## Rules
- Real paths only — if pattern is absent write `not established — suggest: [path]`
- Output under 50 lines
