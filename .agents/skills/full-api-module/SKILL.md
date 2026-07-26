---
name: full-api-module
description: Full API module implementation workflow for TH Studio 2026. Use when creating a new backend module with migration, common-lib schema/types, and apps/api module scaffolding.
---

# Full API Module (TH Studio 2026)

Use this skill when implementing a new API module end-to-end in this monorepo.

## 2026 Execution Rules

1. Start from the database contract first (migration), then types/schemas, then API module code.
2. Do not generate full CRUD by default.
3. Ask for the exact methods to implement if the user did not list them.
4. Keep controllers thin, services for business logic, repositories for DB access.
5. Load and apply `.agents/skills/collision-prevention/SKILL.md` before writing join queries.
6. ALWAYS create and run migrations through the `dbcli` command. Never hand-author a
   migration file in `packages/database/src/migrations/`, and never run a migration by
   executing a source `.ts` file directly. The compiled CLI runs from `dist` (`.js`),
   which is what the `migrations` ledger records; bypassing it produces `.ts`/`.js`
   name mismatches that break `rollback` and cause re-runs.

## Required Order

### 1) Create migration first

Always generate the migration with the `dbcli make:migration` command — never create the
file by hand. From repo root:

```bash
pnpm --filter @repo/database dbcli make:migration create-<entity>-table
```

`dbcli` maps to `node dist/src/bin/cli.js`, so build the package first if `dist` is stale
(`pnpm --filter @repo/database build`). Do NOT run the CLI against the TypeScript source
(e.g. `tsx src/bin/cli.ts`) to create or apply migrations: the ledger would record `.ts`
names that the compiled (`.js`) rollback cannot resolve.

Then implement migration following the same pattern used by:

- `packages/database/src/migrations/2026-05-29-19-25-26-383-create-wait-list-table.ts`

Migration checklist:

- Import `TABLES_ENUM` from `@repo/common-lib/constants/enums`.
- Use `Schema.table(TABLES_ENUM.<TABLE>).withTimestamps(true).createIfNotExists([...])`.
- Use `Column.*` builders (`id`, `string/email`, `enum`, `foreignKey`, timestamps).
- Add safe `down` with `dropIfExists()`.
- If a new enum/table constant is needed, update `packages/common-lib/src/constants/enums.ts` first.

### 2) Create common-lib contract

After migration, define contract types in `packages/common-lib`.

Create:

- `packages/common-lib/src/schemas/<entity>.ts`
- `packages/common-lib/src/types/<entity>.ts`

Schema file checklist (mirror DB columns exactly):

- `type <Entity>Schema` with all DB fields and exact nullability.
- `type <Entity>SchemaWithoutTimestamps` if needed.
- `type <Entity>SchemaColumns = TableColumn<typeof tables<Entity>, <Entity>SchemaWithoutTimestamps>` pattern.
- `TABLES_ENUM`-backed table tuple like `const tables<Entity> = [TABLES_ENUM.<TABLE>] as const`.

Types file checklist:

- Domain type for API usage (`<Entity>`), usually omitting timestamps.
- Input types (`Create<Entity>Input`, `Update<Entity>Input`, and public/admin variants if needed).
- Keep input types aligned with actual methods requested by the user (do not pre-create unused CRUD inputs).

### 3) Create API module folder in `apps/api`

Use `apps/api/src/v1/modules/wait-list/` as the structural reference.

Create folder:

- `apps/api/src/v1/modules/<entity>/`

Typical files:

- `<entity>.module.ts`
- `<entity>.controller.ts`
- `<entity>.service.ts`
- `<entity>.repository.ts`
- `requests/*.request.ts` only for implemented methods
- `events/*.event.ts`, `processor.ts`, `mails/*` only when workflow requires async jobs/emails

Module rules:

- Register only required providers/imports/queues.
- Export service only if other modules need it.
- Add module wiring in parent modules only where needed (for example `app.module.ts`, admin/auth modules).

Controller/service rules:

- Controller: route mapping + guards + DTO validation, no business logic.
- Service: orchestrates repository + events.
- Repository: all DB queries, formatters, pagination.

### 4) Query and join safety (mandatory)

Before implementing any multi-table select/join:

- Read and apply `.agents/skills/collision-prevention/SKILL.md`.

Hard rules:

- Main table columns keep original names.
- Prefix only colliding columns from joined tables.
- Avoid schema intersections (`&`) when collisions exist.
- Select only needed columns and keep formatter output aligned.

### 5) Method-scoped implementation only

Never auto-implement full CRUD.

If user did not specify methods, ask one direct question like:

`Which methods should I implement now (example: create, findAll, findOne, updateStatus, delete)?`

Then implement only requested methods across:

- request DTOs
- controller routes
- service methods
- repository methods
- related events/processors (if necessary)

## Recommended Build Sequence (Copy/Paste)

```text
1. Confirm method list with user (no default CRUD)
2. Generate migration via cli.ts make:migration
3. Implement migration up/down following wait-list pattern
4. Add/confirm TABLES_ENUM and enum constants
5. Create common-lib schema + types for new table
6. Scaffold apps/api module folder and core files
7. Implement only requested methods end-to-end
8. Apply collision-prevention rules to every join query
9. Wire module imports/exports where required
10. Run targeted tests/lint/typecheck
```

## Verification

Run at minimum:

```bash
pnpm --filter @repo/database test
pnpm --filter api test -- --passWithNoTests
```

If available for the touched module, also run targeted specs and typecheck.

## Done Criteria

- Migration exists and follows project pattern.
- Matching schema and types exist in `packages/common-lib`.
- Module exists under `apps/api/src/v1/modules/<entity>/`.
- Only user-requested methods are implemented.
- Join queries follow collision-prevention rules.
- Module is wired where needed and compiles.
