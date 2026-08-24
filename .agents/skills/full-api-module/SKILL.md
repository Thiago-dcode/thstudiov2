---
name: full-api-module
description: Modular API implementation guide for TH Studio 2026. Use when adding a migration, common-lib schema/types, repository, Nest module, controller, service, mail, or BullMQ processor — any subset, not a full module by default.
---

# API Module Guide (A11 Studio 2026)

This is a **menu of recipes**, not a pipeline. Implement **only** the pieces the user asked for.

Do not scaffold a full CRUD module, queue, processor, or mailer because a neighboring recipe exists. If the request is ambiguous, ask which pieces to implement before writing files.

## 1) Decide scope first

Map the request to recipes below. Common intents:

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
- If it is a middle change, not just a typo fix, it must run test, lint, and build and pass all of them.

Reference module: `apps/api/src/v1/modules/wait-list/`. Copy structure from it; do not copy unused files (processor, mails, tasks) unless that recipe was requested.

## 2) Recipe: migration

Use when adding/altering a table or column.

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

## 3) Recipe: common-lib schema + types

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

## 4) Recipe: repository

Use when adding DB access. Needs schema/types. Does **not** require a controller or service.

- File: `apps/api/src/v1/modules/<entity>/<entity>.repository.ts`
- All queries, formatters, and pagination live here.
- Implement only the methods requested.
- Joins: apply collision-prevention (recipe 10).

If the Nest module does not exist yet and the user only wanted a repository, create a minimal `<entity>.module.ts` that provides/exports the repository — no controller, queue, or CRUD.

## 5) Recipe: Nest module scaffold

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

## 6) Recipe: HTTP endpoint (controller + request DTO)

Use when exposing a route. Pair with a service method. Add a repository method only if persistence is needed and missing.

- Request DTO in `requests/` for that method only.
- Controller: route + guards + DTO validation. No business logic, no DB.

## 7) Recipe: service

Use when orchestrating use-cases. Inject the repository and/or queues. Do not put SQL here.

- Sync work: call the repository and return.
- Async/side-effect work: enqueue via `QueueHelper` (recipe 8). Do not do heavy work on the request path.

## 8) Recipe: queue + processor (BullMQ)

Use when the user asked for a processor, a job, or async side effects (email, retries, deferred persistence). Do **not** add a queue because a module or HTTP endpoint exists.

Canonical references:

- `packages/backend-lib/src/utils/queue-helper.ts`
- `apps/api/src/v1/modules/wait-list/wait-list.processor.ts`
- `packages/common-lib/src/constants/queues.ts`
- `apps/api/src/common/processors/global.processor.ts`

Redis is already configured in `apps/api/src/app.module.ts` (`BullModule.forRootAsync`). Register only this module's queue name.

Flow: **service enqueues via `QueueHelper` → processor handles the job**.

Never call `queue.add()` from a service or processor. Add a `QueueHelper` static method and use that.

### 8a) Constants and payload

In `packages/common-lib/src/constants/queues.ts`:

- Queue: `export const <ENTITY>_QUEUE = '<kebab-entity>' as const;` (reuse the existing queue if the module already has one).
- Job: `export const JOB_<ACTION> = '<kebab-action>' as const;`

Job payload type in `packages/common-lib/src/types/<entity>.ts` only if the worker needs fields the public HTTP DTO does not have. Wait-list: `CreateWaitListJobInput` adds `language`.

### 8b) QueueHelper method

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

### 8c) Module wiring

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

### 8d) Enqueue and consume

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

Processor-only checklist:

- [ ] Queue + job constants (new job on an existing queue is enough)
- [ ] Job payload type if needed
- [ ] `QueueHelper` method (never raw `queue.add`)
- [ ] Processor on `GlobalProcessor` with a `job.name` case
- [ ] Module `registerQueue` + processor provider + `LOG_QUEUE` logger (skip if already present)
- [ ] An enqueue call only if something must produce the job (service, task, or another processor)

## 9) Recipe: mail

Use when the user asked to send email. Mailables live in `mails/`. Prefer `MailService.sendAsync` / `sendBatchAsync` from the processor or service that owns the side effect. Do not add a wait-list-style mailer because a processor exists.

## 10) Recipe: join queries

Use whenever a select joins tables. Read `.agents/skills/collision-prevention/SKILL.md` first.

- Main table columns keep original names.
- Prefix only colliding columns from joined tables.
- Avoid schema intersections (`&`) when collisions exist.
- Select only needed columns; keep formatter output aligned.

## Verification

Typo-only / comment-only edits may skip the gate.

If it is a middle change, not just a typo fix, it must run test, lint, and build and pass all of them. Do not finish with failures.

Run what matches the touch set:

```bash
pnpm --filter @repo/database test    # migrations / database
pnpm --filter api test -- --passWithNoTests
pnpm --filter api lint
pnpm --filter api build
```

Skip database tests if no migration changed. Prefer targeted specs when they exist.

Also run `test` / `lint` / `build` on other touched packages (`@repo/common-lib`, `@repo/backend-lib`, `@repo/database`) when those packages expose the script. Fix failures before reporting done.

## Done criteria

- Only requested recipes were implemented.
- No extra CRUD methods, jobs, mails, or module files.
- Touched join queries follow collision-prevention.
- Touched code compiles.
- If a middle change (not a typo fix): test, lint, and build all passed.
- If a queue/processor was requested: helper method exists, no raw `queue.add()`.
- If a migration was requested: `dbcli` created it and schema/types match the table.
