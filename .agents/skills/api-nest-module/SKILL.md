---
name: api-nest-module
description: >-
  Scaffold or wire a NestJS module under apps/api/src/v1/modules. Use when a
  module folder is missing, registering providers, exporting a repository, or
  adding a module to app.module.ts — without scaffolding unused CRUD files.
---

# API Recipe: Nest Module Scaffold

Use when a folder/module is missing and some other recipe needs to register providers.

`apps/api/src/v1/modules/<entity>/`

Add **only** files required by the requested recipes:

- `<entity>.module.ts` — always if registering providers
- `<entity>.controller.ts` / `requests/*.request.ts` — HTTP recipe
- `<entity>.service.ts` — service recipe
- `<entity>.repository.ts` — repository recipe
- `<entity>.processor.ts` / `mails/*` — queue / mail recipes

Module rules:

- Register only required providers/imports/queues.
- Export a provider only if another module needs it.
- Wire into `app.module.ts` (or admin/auth) only when this module must be loaded.

Reference module: `apps/api/src/v1/modules/wait-list/`. Copy structure from it; do not copy unused files (processor, mails, tasks) unless that recipe was requested.

## After implementing

If this is a middle change (not a typo fix), follow `.agents/skills/api-verification/SKILL.md`.

## Related skills

- `.agents/skills/api-repository/SKILL.md`
- `.agents/skills/api-http-endpoint/SKILL.md`
- `.agents/skills/api-service/SKILL.md`
- `.agents/skills/api-queue-processor/SKILL.md`
- `.agents/skills/api-mail/SKILL.md`
- `.agents/skills/full-api-module/SKILL.md` — composing this recipe with others
