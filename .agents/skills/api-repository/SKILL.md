---
name: api-repository
description: >-
  Add TH Studio NestJS repository DB access for an entity. Use when creating a
  repository, adding query methods, formatters, or pagination in
  apps/api/src/v1/modules, without requiring a controller or service.
---

# API Recipe: Repository

Use when adding DB access. Needs schema/types. Does **not** require a controller or service.

- File: `apps/api/src/v1/modules/<entity>/<entity>.repository.ts`
- All queries, formatters, and pagination live here.
- Implement only the methods requested.
- Joins: load `.agents/skills/collision-prevention/SKILL.md` first (see also `.agents/skills/api-join-queries/SKILL.md`).

If the Nest module does not exist yet and the user only wanted a repository, create a minimal `<entity>.module.ts` that provides/exports the repository — no controller, queue, or CRUD. Follow `.agents/skills/api-nest-module/SKILL.md`.

If schema/types are missing, follow `.agents/skills/api-schema-types/SKILL.md` first.

## After implementing

If this is a middle change (not a typo fix), follow `.agents/skills/api-verification/SKILL.md`.

## Related skills

- `.agents/skills/api-schema-types/SKILL.md` — DB contract this repository uses
- `.agents/skills/api-nest-module/SKILL.md` — register the repository
- `.agents/skills/api-join-queries/SKILL.md` — joined selects
- `.agents/skills/collision-prevention/SKILL.md` — column aliasing on joins
- `.agents/skills/full-api-module/SKILL.md` — composing this recipe with others
