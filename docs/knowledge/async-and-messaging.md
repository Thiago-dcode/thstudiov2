# Asynchronous Processing and Messaging

> Three different mechanisms with three different names. Mixing them up is a tell; keeping them straight is a strong signal.
> Related: [`architecture.md`](./architecture.md) · [`realtime-websockets.md`](./realtime-websockets.md) · [`scaling-and-replicas.md`](./scaling-and-replicas.md)

---

## 1. The three mechanisms

🟢 Your codebase contains three distinct async mechanisms. People routinely call all three "pub/sub" or "events". Don't.

| | In-process event bus | Work queue | WebSocket fan-out |
|---|---|---|---|
| Technology | `EventEmitter2` | BullMQ over Redis | Socket.IO + Redis adapter |
| Crosses processes? | ❌ | ✅ | ✅ |
| Durable? | ❌ | ✅ | ❌ |
| Delivery | Synchronous call | At-least-once, retried | Best-effort |
| Pattern name | **Observer** | **Producer/consumer** | **Publish–subscribe** |
| Consumers per message | All listeners | **Exactly one** | All subscribers |

That last row is the one people get wrong. **A queue is point-to-point — one consumer gets each message. Pub/sub is broadcast — every subscriber gets a copy.**

⚠️ "I used BullMQ for pub/sub" is wrong. "Work queue with competing consumers" is right.

---

## 2. In-process event bus (Observer)

🟢 `this.eventEmitter.emit(NEW_USER_EVENT, new NewUserEvent(user))` in `auth.service.ts`, `media.service.ts`, `portfolio.service.ts`; consumed by `@OnEvent(...)` in e.g. `plan-subscriptions.service.ts`.

- Same process, same memory, **synchronous by default**.
- **Not durable.** Process dies → event is gone. No retry, no record.
- Correct names: **domain events**, **in-process event bus**, **Observer pattern**.

**Purpose:** decoupling modules that shouldn't import each other. When a user registers, the subscriptions module needs to act — but `AuthService` importing `PlanSubscriptionsService` would couple two domains permanently.

🔵 **When this is the wrong tool:** when the side effect *must* happen. A listener that throws leaves no trace. Anything that must survive a crash belongs on a queue — and the useful mental test is *"if the process died right now, would losing this be acceptable?"*

---

## 3. Work queue — BullMQ over Redis

🟢 **16 queues** in `packages/common-lib/src/constants/queues.ts`:

```
media · media-update · ai · ai-media · stripe-webhooks · mail · log
user-notifications · user-metrics · user-contacts · storage-requests
plan-subscriptions · email-preferences · profile-status · wait-list · location
```

🟢 **15 processors in `apps/api`** plus `apps/worker/src/processors/media.processor.ts` — the heavy one, isolated in its own container.

### Vocabulary

- **Message queue / work queue / task queue** — the structure.
- **Producer / consumer** — the two sides.
- **Competing consumers** — several workers draining one queue; each job goes to exactly one.
- **At-least-once delivery** — with `attempts: 3` and retries, a job can run more than once. **This is the default guarantee of nearly every real queue** and the reason idempotency matters.
- **Exponential backoff** — retry delays grow (1s, 2s, 4s…) so a struggling dependency isn't hammered.
- **Dead-letter handling** — your `removeOnFail: 5000` retains failed jobs for inspection rather than discarding them.
- **Broker** — Redis, here.

### Delivery semantics 🔵

| Guarantee | Meaning | Cost |
|---|---|---|
| At-most-once | Fire and forget | Messages can be lost |
| **At-least-once** | Retried until acked | **Duplicates possible** |
| Exactly-once | The holy grail | Not achievable end-to-end in a distributed system without idempotency at the consumer |

"Exactly-once delivery" is essentially marketing. What systems actually provide is at-least-once delivery plus **idempotent processing**, which produces exactly-once *effects*. Saying that precisely is a strong senior signal.

### Idempotency 🟢

**An idempotent operation produces the same result whether run once or five times.**

Your mechanisms:

- **`seo_generated_at` stamp** — a job that runs twice doesn't regenerate. The name is **idempotent consumer**.
- **Job deduplication by job ID** — same ID within the window collapses to one job.
- **Debouncing via delayed jobs** — `queue-helper.ts` documents that repeated triggers for the same entity inside a delay window collapse into one generation. That's **debouncing**, and it's a cost-control mechanism: without it, ten rapid edits would mean ten LLM calls.

> **Say this:** "Anything slow or failure-prone goes on a BullMQ queue — image transcoding, LLM calls, Stripe webhooks, mail. Producers are in the API, consumers in a separate worker container. Delivery is at-least-once with exponential backoff, so consumers are written to be idempotent — the SEO path stamps a timestamp so a re-run is a no-op, and rapid edits are debounced into one generation with a delayed job so I'm not paying for ten LLM calls."

---

## 4. Why a separate worker process

🟢 `apps/worker` runs `media.processor.ts` in its own container.

🔵 **The core reason is the Node event loop.** Node is single-threaded for JavaScript. A CPU-bound operation — Sharp transcoding a large image — **blocks the entire process**. Every other request on that process waits.

Moving it to a separate container means:

- The API's event loop never blocks on transcoding.
- The worker can be scaled or restarted independently.
- A worker crash from a malformed image doesn't take the API down.
- Worker and API can have different resource profiles.

🔵 **The alternative you should know:** `worker_threads` keeps it in-process but off the main thread. Cheaper operationally, but shares a fate — process dies, everything dies — and doesn't scale independently. A separate process is the right call when the work is genuinely heavy.

> **Say this:** "Node is single-threaded, so anything CPU-bound blocks every request on that process. Image compression is CPU-bound, so it runs in a separate worker container — the API's event loop stays free, and the worker can crash or be scaled without touching the API."

---

## 5. The media pipeline, named hop by hop

🟢 An excellent whiteboard answer — trace an upload and name every step:

```
1. POST /media          → Controller validates DTO             [request validation]
2. Service writes row   → status = UPLOADING                   [state machine]
3. Service enqueues     → MEDIA_QUEUE                          [producer / deferred write]
4. HTTP 202 returns immediately                                [non-blocking request path]
   ─────────────── request ends, work continues ───────────────
5. Worker consumes      → MediaProcessor.handle                [competing consumer]
6. Sharp compresses     → iterative quality/resize loop        [byte-budget targeting]
7. S3 upload            → adapter behind StorageService port   [ports & adapters]
8. LLM: SEO + moderation→ status = GENERATING_METADATA         [async enrichment]
9. Enqueue notification → USER_NOTIFICATIONS_QUEUE             [queue chaining]
10. Consumer persists row + emits over WebSocket               [server push]
11. Browser updates without polling                            [real-time UI]
```

Names for the whole shape: **asynchronous processing pipeline**, **choreographed workflow**, and an explicit **state machine**.

### The state machine 🟢

`packages/common-lib/src/constants/enums.ts`:

```ts
MEDIA_STATUS: ['UPLOADING', 'UPDATING', 'GENERATING_METADATA', 'COMPLETED', 'FAILED']
```

**Why an explicit status column is good design:** the UI always has something truthful to render, a failure has a defined resting state rather than a row stuck in limbo, and a stalled job is *queryable* — you can find every media in `GENERATING_METADATA` for over an hour.

🟢 A nice detail in `constants/user-notification.ts`: the notify-on list is an **allow-list** of terminal statuses rather than a deny-list of in-flight ones, with the comment explaining that a future transient status would otherwise leak notifications. **Allow-list over deny-list is the safer default**, and knowing why is worth stating.

### Choreography vs orchestration 🔵

- **Choreography** — each step knows what comes next and enqueues it. Decentralised, no coordinator, easy to extend, **hard to see the whole flow** in one place.
- **Orchestration** — a central coordinator drives each step. Visible and controllable, but the coordinator is a bottleneck and a single point of failure.

🟢 Yours is **choreographed**. Be ready for the follow-up: *"how do you know where a media is in the pipeline?"* — the status column, which is exactly the observability that choreography otherwise lacks.

🔵 **Saga pattern** — the related term for a multi-step distributed transaction with **compensating actions** to undo earlier steps. ⚠️ You don't implement compensation; a failure leaves `FAILED` and stops. Say "choreographed pipeline", not "saga", unless you add compensation.

---

## 6. Scheduled work

🟢 7 cron jobs via `@nestjs/schedule`:

| Job | Schedule |
|---|---|
| `log-retention.task.ts` | daily 01:00 |
| `ai.task.ts` — 5 jobs | daily midnight |
| `wait-list.task.ts` | `0 12 * * *` UTC |

⚠️ **The distributed-cron problem, and you should raise it before an interviewer does.** `ScheduleModule.forRoot()` is registered unconditionally (`app.module.ts:193`) and `compose.prod.yaml:93` sets `replicas: ${API_REPLICAS:-2}`, so **both API replicas run every cron job.** Ten invocations a night from `ai.task.ts`, not five. There is no lock, no leader election, and no env gate anywhere in the repo.

**Firing twice only matters if the work isn't idempotent, so go job by job — that's the answer that lands.**

🟢 **The four metadata sweeps are deduped, one layer down.** `createGenerateEntityMetadataJob` builds its id from `Date.now()` (`queue-helper.ts:112`), so the two sweeps *don't* collapse — both enqueue, both query `findDueForSeoGeneration()`, both fan out. The collapse happens at the fan-out: `createGenerateSingleEntityMetadataJob` uses the deterministic `single-entity-metadata-${entity}-${id}` (`queue-helper.ts:134`), and BullMQ drops an add whose id is already queued. So the duplicate's per-entity jobs are dropped, and even if one completed and freed its id first, `seo_generated_at` means the row is no longer due. **Two independent layers would have to miss for you to pay for a duplicate LLM call.** The waste is two sweep jobs doing a query and a no-op fan-out — cheap.

The same idiom covers `wait-list.task.ts:61`, where the reminder mail's jobId is `wait-list-reminder-${row.id}-${row.reminder_count}` — which is why duplicate cron firing doesn't send duplicate emails.

🟢 **`ai-credits-reset` was the one genuinely exposed, and is now guarded.** It reads due rows and writes them back, with no condition on the write. The month advance was never at risk — both replicas derive `nextReset` from the same value they read, so they compute the same result rather than double-advancing. The exposure was `ai_credits_consumed = 0` landing twice, discarding credits a user spent between the two writes. The fix is `resetAiCreditsIfDue` (`user-extra-data.repository.ts`), which repeats the due condition in the `UPDATE ... WHERE`: the second writer matches no rows, because `next_ai_credits_reset` is a month ahead by then. The task counts those as skipped and logs them.

🔵 **Worth knowing why that guard is a range check, not a compare-and-set on the exact value read.** `next_ai_credits_reset` defaults to `NOW()`, and a row created through that default carries microsecond precision that a JS `Date` round-trip truncates to milliseconds. An `=` guard would silently match nothing and leave those users never reset — a correctness bug that is invisible in logs. Matching the caller's `<=` due condition is precision-independent.

🔵 **The general fixes**, for when the interviewer pushes past this specific code: a **distributed lock** (Redis `SET NX` with a TTL) so only one replica wins; a dedicated single-replica scheduler container; or BullMQ's **repeatable jobs**, which store the schedule in Redis so exactly one worker picks up each occurrence. The third is the natural fit — you already run BullMQ, and the deterministic-jobId idiom above is the same instinct applied one layer down.

> **Say this:** "Cron lives in the API and the API runs at two replicas, so every job fires twice — I don't have a lock. I went through them rather than assuming. The SEO sweeps are safe because the fan-out uses a deterministic BullMQ job id, so the duplicate is dropped before it costs an LLM call. The credits reset was the real one — the month advance was fine, but it re-zeroed consumed credits, so I made the update conditional on the row still being due and the second writer no-ops. The structural fix is repeatable jobs so the schedule lives in Redis and one worker claims each run."

**Naming which job was actually unsafe, and why the others weren't, is what separates people who ran something in production from people who read about it.**

---

## 7. Stripe webhooks — why the queue matters

🟢 Eight webhook event types are processed asynchronously off `STRIPE_WEBHOOKS_QUEUE`.

🔵 **Why not process inline?** Stripe expects a `2xx` within seconds and **retries on timeout**. If you do the work synchronously and it takes too long, Stripe retries, and you process the same event twice. Acknowledging immediately and queueing the work makes the HTTP response fast and the processing durable.

**Webhook correctness checklist** — good interview material:

1. **Verify the signature** before trusting anything.
2. **Respond fast** — ack, then work.
3. **Be idempotent** — Stripe explicitly guarantees at-least-once and can send duplicates.
4. **Handle out-of-order delivery** — events are not guaranteed ordered.
5. **Don't trust the payload as state** — refetch from the API for anything that matters.

---

## 8. Backpressure and queue depth 🔵

**Backpressure** is what a system does when work arrives faster than it can be processed.

Your queues absorb bursts by design — that's a large part of why they exist. But an unbounded queue converts a throughput problem into a *latency* problem: jobs still complete, just an hour late, and nothing surfaces that.

⚠️ **You have no queue-depth monitoring.** A user whose media sits in `GENERATING_METADATA` for an hour sees a broken product; nothing alerts you. The metric that matters is **queue depth over time** — flat is healthy, monotonically rising means consumers can't keep up. See [`observability.md`](./observability.md).

---

## Interview drills

**"What's the difference between a queue and pub/sub?"**
Point-to-point vs broadcast; one consumer vs all subscribers. Then name yours: BullMQ is a queue with competing consumers, Socket.IO rooms over the Redis adapter are genuine pub/sub. Having both in one system and knowing which is which is the answer.

**"How do you handle a job that fails?"**
Three retries with exponential backoff, then retained via `removeOnFail: 5000` for inspection. Then go further than asked: retries mean at-least-once, which means consumers must be idempotent, which is why the SEO path stamps a timestamp.

**"How do you guarantee exactly-once processing?"**
You don't — nobody does. At-least-once delivery plus idempotent consumers gives exactly-once *effects*. Correcting the premise politely is the point of the question.

**"Your cron jobs run on two replicas. Isn't that a problem?"**
See §6. Volunteer it; don't wait to be caught.

**"Why a separate worker instead of just running it in the API?"**
The event loop, §4. Then the honest scale note: on a 1 vCPU droplet the worker and API share a core anyway, so the benefit is isolation and independent restart rather than parallelism.
