---
name: api-service
description: >-
  Add a NestJS service that orchestrates use-cases. Use when creating or updating
  an apps/api service, enqueueing via QueueHelper, or moving logic out of a
  controller — never put SQL in the service.
---

# API Recipe: Service

Use when orchestrating use-cases. Inject the repository and/or queues. Do not put SQL here.

- Sync work: call the repository and return.
- Async/side-effect work: enqueue via `QueueHelper` (see `.agents/skills/api-queue-processor/SKILL.md`). Do not do heavy work on the request path.

Controllers stay thin. Services orchestrate. Repositories own DB access.

## After implementing

If this is a middle change (not a typo fix), follow `.agents/skills/api-verification/SKILL.md`.

## Related skills

- `.agents/skills/api-repository/SKILL.md` — DB access
- `.agents/skills/api-http-endpoint/SKILL.md` — HTTP entry point
- `.agents/skills/api-queue-processor/SKILL.md` — async jobs
- `.agents/skills/api-nest-module/SKILL.md` — register the service
- `.agents/skills/full-api-module/SKILL.md` — composing this recipe with others
