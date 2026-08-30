---
name: api-schema-types
description: >-
  Create or update common-lib DB schemas and TypeScript types for an entity. Use
  when the DB contract changed, adding packages/common-lib schemas or types, or
  when a repository/job payload needs types that do not exist yet.
---

# API Recipe: common-lib Schema + Types

Use when the DB contract changed, or when a repository/job payload needs types that do not exist yet.

Create or update:

- `packages/common-lib/src/schemas/<entity>.ts`
- `packages/common-lib/src/types/<entity>.ts`

Schema (mirror DB columns exactly):

- `type <Entity>Schema` with all DB fields and exact nullability.
- `type <Entity>SchemaWithoutTimestamps` if needed.
- `type <Entity>SchemaColumns = TableColumn<typeof tables<Entity>, <Entity>SchemaWithoutTimestamps>`.
- `const tables<Entity> = [TABLES_ENUM.<TABLE>] as const`.

Types (only what this request uses):

- Domain type (`<Entity>`), usually omitting timestamps.
- Input types (`Create<Entity>Input`, `Update<Entity>Input`, public/admin variants) **only for methods being implemented**.
- Job payload types (`Create<Entity>JobInput`) **only if a queue job is part of this request**.

Do not add a repository, controller, or queue because schema/types were added.

## After implementing

If this is a middle change (not a typo fix), follow `.agents/skills/api-verification/SKILL.md`.

## Related skills

- `.agents/skills/api-migration/SKILL.md` — table/column changes that require this contract
- `.agents/skills/api-repository/SKILL.md` — DB access that consumes these types
- `.agents/skills/full-api-module/SKILL.md` — composing this recipe with others
