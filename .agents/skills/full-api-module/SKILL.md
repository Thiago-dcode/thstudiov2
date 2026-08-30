---
name: full-api-module
description: >-
  Modular API implementation menu for TH Studio. Use when implementing a full API
  module, or when the request spans more than one recipe (migration, schema/types,
  repository, Nest module, HTTP, service, queue/processor, mail). Always pick only
  requested recipes — not a full module by default. For a single piece, use that
  recipe skill instead.
---

# API Module Guide (A11 Studio 2026)

This is a **menu of recipes**, not a pipeline. Implement **only** the pieces the user asked for.

Do not scaffold a full CRUD module, queue, processor, or mailer because a neighboring recipe exists. If the request is ambiguous, ask which pieces to implement before writing files.

**Load the matching skill before implementing that piece.** Do not copy unused files from a neighboring recipe.

## Recipe skills

| Recipe | Skill | Load when |
| --- | --- | --- |
| Migration | `.agents/skills/api-migration/SKILL.md` | Adding/altering a table or column |
| Schema + types | `.agents/skills/api-schema-types/SKILL.md` | DB contract changed, or repo/job types missing |
| Repository | `.agents/skills/api-repository/SKILL.md` | Adding DB access |
| Nest module | `.agents/skills/api-nest-module/SKILL.md` | Folder/module missing; registering providers |
| HTTP endpoint | `.agents/skills/api-http-endpoint/SKILL.md` | Exposing a route |
| Service | `.agents/skills/api-service/SKILL.md` | Orchestrating a use-case |
| Queue + processor | `.agents/skills/api-queue-processor/SKILL.md` | Processor, job, or async side effects |
| Mail | `.agents/skills/api-mail/SKILL.md` | Sending email |
| Join queries | `.agents/skills/api-join-queries/SKILL.md` | A select joins tables |
| Collision prevention | `.agents/skills/collision-prevention/SKILL.md` | Joined columns / formatters (required with join queries) |
| Verification | `.agents/skills/api-verification/SKILL.md` | After a middle change (not a typo fix) |

## Decide scope first

Map the request to recipes above. Common intents:

| User asked for | Implement | Do not also add |
| --- | --- | --- |
| Migration only | Migration | Controller, service, processor, CRUD |
| Migration + repository | Migration → schema/types → repository | Controller, service, queue unless asked |
| Repository only (table exists) | Schema/types if missing → repository | New migration, HTTP layer |
| Processor / queue only | Queue recipe on the **existing** module | New table, CRUD, extra jobs |
| HTTP endpoint | Request DTO → controller → service (+ repo method if needed) | Other CRUD, queue |
| Full module | Ask which methods, then compose recipes | Unrequested methods/jobs |

Hard rules (always):

- Never generate full CRUD by default. If methods were not listed, ask: `Which methods should I implement now (example: create, findAll, findOne, updateStatus, delete)?`
- Controllers stay thin. Services orchestrate. Repositories own DB access.
- Load `.agents/skills/collision-prevention/SKILL.md` before any join query.
- Create and run migrations only through `dbcli`. Never hand-author files in `packages/database/src/migrations/`, and never run a `.ts` migration directly.
- If it is a middle change, not just a typo fix, it must run test, lint, and build and pass all of them. Follow `.agents/skills/api-verification/SKILL.md`.

Reference module: `apps/api/src/v1/modules/wait-list/`. Copy structure from it; do not copy unused files (processor, mails, tasks) unless that recipe was requested.
