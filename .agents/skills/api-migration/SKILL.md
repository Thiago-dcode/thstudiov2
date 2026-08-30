---
name: api-migration
description: >-
  Create or alter TH Studio database tables/columns through dbcli. Use when adding
  a migration, creating a table, altering a column, or when the user mentions
  dbcli, packages/database migrations, or Schema.table.
---

# API Recipe: Migration

Use when adding or altering a table or column. Do **not** add a controller, service, processor, or CRUD because a migration exists.

Create and run migrations only through `dbcli`. Never hand-author files in `packages/database/src/migrations/`, and never run a `.ts` migration directly.

From repo root:

```bash
pnpm --filter @repo/database dbcli make:migration create-<entity>-table
```

`dbcli` maps to `node dist/src/bin/cli.js`. Build first if `dist` is stale (`pnpm --filter @repo/database build`). Do not run `tsx src/bin/cli.ts`: the ledger would record `.ts` names that compiled `.js` rollback cannot resolve.

Pattern: `packages/database/src/migrations/2026-05-29-19-25-26-383-create-wait-list-table.ts`

- If a new enum/table constant is needed, update `packages/common-lib/src/constants/enums.ts` **first**.
- Import `TABLES_ENUM` from `@repo/common-lib/constants/enums`.
- `Schema.table(TABLES_ENUM.<TABLE>).withTimestamps(true).createIfNotExists([...])`.
- `Column.*` builders (`id`, `string/email`, `enum`, `foreignKey`, timestamps).
- Safe `down` with `dropIfExists()`.

A new table almost always needs the **schema/types** recipe next (DB contract). Stop after that unless the user also asked for a repository or HTTP layer.

## After implementing

If this is a middle change (not a typo fix), follow `.agents/skills/api-verification/SKILL.md`.

## Related skills

- `.agents/skills/api-schema-types/SKILL.md` — matching schema/types after a table change
- `.agents/skills/full-api-module/SKILL.md` — composing this recipe with others
