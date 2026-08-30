---
name: api-queue-processor
description: >-
  Add a BullMQ queue, job, QueueHelper method, and NestJS processor. Use when the
  user asked for a processor, a job, async side effects, retries, or deferred
  persistence — not because a module or HTTP endpoint exists.
---

# API Recipe: Queue + Processor (BullMQ)

Use when the user asked for a processor, a job, or async side effects (email, retries, deferred persistence). Do **not** add a queue because a module or HTTP endpoint exists.

Canonical references:

- `packages/backend-lib/src/utils/queue-helper.ts`
- `apps/api/src/v1/modules/wait-list/wait-list.processor.ts`
- `packages/common-lib/src/constants/queues.ts`
- `apps/api/src/common/processors/global.processor.ts`

Redis is already configured in `apps/api/src/app.module.ts` (`BullModule.forRootAsync`). Register only this module's queue name.

Flow: **service enqueues via `QueueHelper` → processor handles the job**.

Never call `queue.add()` from a service or processor. Add a `QueueHelper` static method and use that.

## Constants and payload

In `packages/common-lib/src/constants/queues.ts`:

- Queue: `export const <ENTITY>_QUEUE = '<kebab-entity>' as const;` (reuse the existing queue if the module already has one).
- Job: `export const JOB_<ACTION> = '<kebab-action>' as const;`

Job payload type in `packages/common-lib/src/types/<entity>.ts` only if the worker needs fields the public HTTP DTO does not have. Wait-list: `CreateWaitListJobInput` adds `language`.

## QueueHelper method

Add a static method on `QueueHelper`. Default options unless `queue-helper.ts` documents a special case:

```ts
{
  jobId: `<entity>-${uniqueKey}`,
  priority: 10,
  removeOnComplete: true,
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
}
```

`jobId` rules:

- **Deterministic (no timestamp)** — one pending job per key; BullMQ rejects a duplicate id. Wait-list create: `wait-list-create-${email}`. SEO: `single-entity-metadata-${entity}-${id}`. Also set `removeOnFail: true` so a failed job does not block a later enqueue.
- **Unique (include `Date.now()`)** — every enqueue runs (metrics, LLM usage).
- Batch / fire-and-forget may omit `jobId` (wait-list invite batch).

If the service uses a deterministic `jobId`, treat “job already exists” as success (`WaitListService.create`).

## Module wiring

```ts
imports: [
  BullModule.registerQueue(
    { name: <ENTITY>_QUEUE },
    { name: LOG_QUEUE },
    // plus any other queues this processor/service enqueues into
  ),
],
providers: [
  <Entity>Processor,
  {
    provide: LogService,
    useFactory: (logQueue: Queue) =>
      FactoryLogService.createLogService('file', { channel: '<entity>' }, logQueue),
    inject: [getQueueToken(LOG_QUEUE)],
  },
],
```

If the module already registers the queue and logger, only add the new job constant, helper method, and `switch` case.

## Enqueue and consume

Service: `@InjectQueue(<ENTITY>_QUEUE)`, call the helper, return immediately.

```ts
@InjectQueue(WAIT_LIST_QUEUE) private readonly waitListQueue: Queue

await QueueHelper.createWaitListEntryJob(this.waitListQueue, { email, language });
```

Processor: `@Processor(<ENTITY>_QUEUE)`, extend `GlobalProcessor`, `switch (job.name)`, rethrow so BullMQ retries, flush logs in `finally`. Unknown job names throw.

```ts
@Processor(WAIT_LIST_QUEUE)
export class WaitListProcessor extends GlobalProcessor {
  async process(job: Job): Promise<unknown> {
    try {
      switch (job.name) {
        case JOB_CREATE_WAIT_LIST_ENTRY:
          return await this.createWaitListEntry(job.data);
        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.logger.flushAsync();
    }
  }
}
```

`GlobalProcessor` already logs permanent failures. Do not duplicate that. The processor owns persistence races, emails, and other side effects.

## Processor-only checklist

- [ ] Queue + job constants (new job on an existing queue is enough)
- [ ] Job payload type if needed
- [ ] `QueueHelper` method (never raw `queue.add`)
- [ ] Processor on `GlobalProcessor` with a `job.name` case
- [ ] Module `registerQueue` + processor provider + `LOG_QUEUE` logger (skip if already present)
- [ ] An enqueue call only if something must produce the job (service, task, or another processor)

## After implementing

If this is a middle change (not a typo fix), follow `.agents/skills/api-verification/SKILL.md`.

## Related skills

- `.agents/skills/api-service/SKILL.md` — enqueue from the request path
- `.agents/skills/api-schema-types/SKILL.md` — job payload types
- `.agents/skills/api-mail/SKILL.md` — email side effects from the processor
- `.agents/skills/api-nest-module/SKILL.md` — register the queue and processor
- `.agents/skills/full-api-module/SKILL.md` — composing this recipe with others
