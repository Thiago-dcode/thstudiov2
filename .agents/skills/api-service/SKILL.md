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

## Logging

A method with a side effect (Stripe, queue, mail, delete, auth state) logs through `.agents/skills/logging/SKILL.md`: build `this.requestService.log('<channel>', { operation: '<flow>' })` once, log the milestones and the failing `step` with ids in the options, pass `this.requestService.traceCarrier()` to `QueueHelper`. Validation that throws a 4xx needs no log: the exception filter writes it.

## After implementing

If this is a middle change (not a typo fix), follow `.agents/skills/api-verification/SKILL.md`.

## Related skills

- `.agents/skills/api-repository/SKILL.md` — DB access
- `.agents/skills/api-http-endpoint/SKILL.md` — HTTP entry point
- `.agents/skills/api-queue-processor/SKILL.md` — async jobs
- `.agents/skills/api-nest-module/SKILL.md` — register the service
- `.agents/skills/full-api-module/SKILL.md` — composing this recipe with others
