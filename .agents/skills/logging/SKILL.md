---
name: logging
description: >-
  How to write log lines in TH Studio (api, worker, web server, backend-lib) so they are
  queryable in Loki/Grafana and traceable across request → queue → Stripe →
  webhook. Use when adding or changing any LogService call, picking a log
  level (especially critical), adding a channel, or instrumenting a multi-step
  flow such as sign-up, benefit renewal or subscription changes.
---

# Logging

Lines are JSON, one per line, shipped to **Loki** and charted in **Grafana**. Write each one as an event a dashboard can count, filter and follow. Use the logger, never `console.*`.

## Building a logger

One factory per service in `@repo/backend-lib/config/logging`, taking overrides only (never the service or the buffer, which are the factory's and the process `logBuffer`):

```ts
import { logService } from '@repo/backend-lib/config/logging';

logService.worker({ channel: 'media', id: jobTraceId(job) }); // a worker job's logger
logService.dbcli({ id: () => runId });
logService.web({ id: () => traceStore.getStore() ?? null }); // apps/web/src/lib/logging/logger.ts only
logService.lib({ channel: 'stripe', name: 'api-call' });      // backend-lib's own loggers
```

- In the api, use `createApiLogger({ channel })` (`src/common/utils/api-logger.ts`): `logService.api` plus the request-bound `id`/`request` functions.
- `logService.lib` has no service of its own: each line takes the one the entrypoint set with `setLogProcessService`. Use it only inside backend-lib, where a logger runs in every app and may be built at import.
- `LogConfig.service` is required. Overrides and trace carriers (`enqueueJob(…, log)`, `apiLogConfig(config)`, `jobLogConfig`) are `Partial<LogConfig>`; factory overrides are `LogOverrides` (no `service`).

## Line shape (already produced for you)

```json
{"timestamp":"…","service":"api","replica":"…","channel":"users","operation":"new-user",
 "level":"INFO","id":"<trace id>","message":"Stripe customer created",
 "status_code":500,"request":{…},"extraInfo":{"user_id":42,"stripe_customer_id":"cus_…","step":"stripe-customer"}}
```

| Field | Role in Loki | Rule |
|---|---|---|
| `service`, `channel`, `level` | **labels** (low cardinality) | `channel` must be in `LOG_CHANNELS` (`helpers/channels.ts`). Add a new one there; never build it dynamically |
| `operation` | filter (`\| json \| operation="new-user"`) | the **flow** name, kebab-case, bounded set |
| `id` | the **trace id** | read per line from the config's `id` (a function on shared loggers). Never set it on a shared logger |
| `message` | the **event** | stable text with no ids or values inside, so `count_over_time` groups it |
| `extraInfo` (2nd arg) | details and pivot ids | small, flat, redacted: `user_id`, `stripe_*`, `media_id`, `step`, `error_name`, counts, durations |
| `status_code`, `operation` (3rd arg) | per-line fields | `LogLineFields`: safe on a shared logger, unlike `.name()` |

Never put ids, emails, usernames or numbers in `message` or `channel`. Ids go in `extraInfo` (there is no `correlation` field any more), values too. Unbounded labels break Loki, and changing messages break dashboards.

`service` is the running app's. A logger without one in its config (backend-lib's own: job-trace, stripe, s3, llm, paypal, ai, backup) writes the service the entrypoint set with `setLogProcessService` (api `main.ts`, worker `main.ts`, dbcli `bin/cli.ts`, web `lib/logging/logger.ts`). `unknown` means an entrypoint forgot it.

## Buffer and flush

- Every service (api, worker, web, dbcli) pushes its lines to **one Redis list, `logs:pending`** (`RedisLogBuffer`, the process `logBuffer` in `@repo/backend-lib/config/logging`). Its client is built on the first line (`lazyConnect`), never at import.
- **Only the worker writes them to disk**: a repeatable `JOB_FLUSH_LOGS` job on `LOG_QUEUE`, every 5 s (`scheduleLogFlush`, `LOG_FLUSH_EVERY_MS`), calls `logBuffer.flush()` and writes `storage/logs/<service>/<date>.log`. Nothing else ever calls `flush()`: not a request, a job, a cron or a process exit.
- **The list is capped** at 50,000 lines (`DEFAULT_LOG_REDIS_MAX_LENGTH`, ~50 MB). Redis is the BullMQ broker too (256 MB, `noeviction`), so a long worker outage must not fill it: past the cap the oldest lines are dropped (`LTRIM`) and stderr warns at most once a minute per process. Critical alerts are unaffected (the mail callback doesn't go through the buffer).
- Before `process.exit`, a process awaits `logBuffer.settle()` (bounded by `withTimeout`): it waits for in-flight pushes and callbacks (the critical mail) and never flushes.
- Redis down: a push falls back to writing the line directly through the process's file driver. No worker running: lines wait in Redis until one comes back. Run the worker locally to see files.
- Under Jest (`NODE_ENV=test`) the process buffer is an `InMemoryLogBuffer`, so no suite opens a Redis handle. A spec that needs Redis builds its own `RedisLogBuffer` over a fake. In api specs, `consoleLogger(config)` (`src/common/testing/console-logger.ts`) prints lines straight away for assertions.

## Web (apps/web, server side only)

Server actions, Route Handlers and Server Components log through `@/lib/logging/logger` (`server-only`), never `logService` directly and never from a Client Component. Lines go to the Redis buffer with `service: "web"`, `channel: "web"`; the worker writes `storage/logs/web/<date>.log`. Web never flushes.

- `webLogger` is shared across requests: pass the flow as `{ operation }` in the 3rd argument, never `.name()`.
- Wrap an action body in `withLogTrace(async () => …)` so its lines share one trace `id`: it runs the body in a module-local `AsyncLocalStorage` with a fresh UUID, and `webLogger` reads it through `id: () => …`.
- `critical` from web mails the admins like api/worker (`logConfig.web.callback`, which enqueues on Redis for the api's mail processor). `bullmq` and `ioredis` are web deps and in `serverExternalPackages`, so Node loads them from node_modules instead of the bundle.
- Folder for the direct-write fallback: `LOG_STORAGE_DIR` (set in compose dev/prod), else `<cwd>/../../storage/logs`.
- Check `extraInfo` keys against `redact.ts`: a key containing a sensitive word (e.g. `invitationcode`) is logged as `[REDACTED]` even for a boolean. Use names like `invited`.
- Web lines reach Loki only once the server's Alloy scrape includes `storage/logs/web/*.log`.
- Reference: `apps/web/src/modules/auth/server-actions/Oauth2Initiate.action.ts`.

## The trace: following one flow end to end

One action (for example a user signing up) should be readable as a timeline in Grafana by querying the trace `id` or `extraInfo.user_id`:

```
{service=~"api|worker"} | json | extraInfo_user_id="42" | operation="new-user"
```

(`correlation_*` queries and dashboards from before must move to `extraInfo_*`.)

1. **The trace id comes from the store, read per line.** In the api every logger is built with `createApiLogger(config)` (or `apiLogConfig(config)`), which reads `id` and `request` from the api request store: an HTTP request (`RequestService.run`), a processor job (`GlobalProcessor`, the enqueuer's id or a fresh UUID) or a cron run (`runCronExclusive`, a fresh UUID, `cron` in `extraInfo`). In the worker, a job's logger is `logService.worker({ channel, id: jobTraceId(job) })`. In the dbcli, `logService.dbcli({ id: () => runId })`.
2. **Carry it into jobs.** Enqueue with `QueueHelper.*(…, log)` / `enqueueJob(…, log)`, passing the caller's config as the trailing argument: `apiLogConfig()` in the api, `jobLogConfig(job, logConfig.worker)` in the worker, `dbcliLogConfig()` in the dbcli. The id travels in `opts.telemetry`. Don't call `queue.add` directly or the trace breaks.
3. **Name the flow with `operation`** and keep the same value on every line of that flow. Pass it per call in the 3rd argument. Never use `.name()` on a shared DI logger, because it mutates the logger for every concurrent request.
4. **Put ids in `extraInfo`** on the lines of the flow (`user_id`, `stripe_customer_id`, …), as soon as you learn them. There is no ambient context that adds them for you.
5. **Log the milestones, not every line of code.** Use a `started` line, one line per side-effect step, and then `completed` or a failure line that names the `step`:

```ts
const fields = { operation: 'new-user' };
this.logService.info('User registration started', { user_id: user.id }, fields);
let step = 'stripe-customer';
try {
  const customer = await stripe.customers.create(/* … */);
  this.logService.info('Stripe customer created', { user_id: user.id, stripe_customer_id: customer.id, step }, fields);
  step = 'free-plan';
  // …
  this.logService.success('User account created', { user_id: user.id }, fields);
} catch (error) {
  const failure = { user_id: user.id, step, error_name: error instanceof Error ? error.name : typeof error };
  this.logService.error('User registration failed', failure, fields);
  throw error;
}
```

Use `<Subject> <past-tense verb>` for messages ("Benefit renewed", "Stripe customer created") and `… started` / `… failed` for flow boundaries. Reference: `users.service.ts` `handleNewUserEvent`, `plan-subscriptions.service.ts`.

Example flows and their `operation`: `register` → `new-user` (account setup, Stripe customer, free plan, welcome mail), `benefit-renew`, `subscription-change`, `hard-delete`, `username-change`.

Stripe webhooks: the controller rejoins the originating request's id from the object's metadata (`StripeService.traceIdFromMetadata`, else the HTTP request id), logs with it and enqueues the job with it. The event's ids (`stripeEventRefs(event).ids`) go in `extraInfo`.

## Levels

| Level | Use for | Alerts? |
|---|---|---|
| `debug` | local diagnostics, never left on hot paths | no |
| `info` | a milestone happened (step done, job started) | no |
| `success` | a flow **finished** well. Grafana counts these for success rates | no |
| `warn` | expected, user-caused, or recoverable: validation failure, wrong password, rate limit, retry that will run again, 4xx | no |
| `error` | our operation failed in a known way and the system copes: a known failure mode, a non-final job attempt, a degraded optional step | no |
| `critical` | **someone must act now** (see below) | **yes**, admin mail via the config's `emailCritical` callback |

### When to use `critical`

`critical` pages a human. Use it only when **the cause isn't the user** and one of these holds:

- **Unknown or unexpected error**: a branch that "can't happen", an unhandled exception type, an unexpected 5xx from a provider.
- **Broken invariant or data damage**: an account left half-created (no Stripe customer, so it can never pay), money or benefit state out of sync, a webhook for an unknown customer.
- **Suspicious activity**: signature or HMAC mismatch on a webhook, token reuse or replay, an IP hammering auth past the throttle, access to another user's resource, an impossible state transition requested by a client.
- **A final job attempt failed** on something that matters (`isFinalAttempt(job)` from `@repo/backend-lib/utils`). Earlier attempts are `error`.

Do **not** use `critical` for user mistakes (bad input, expired link, wrong password, card declined), expected 4xx, or retries that will run again. Those are `warn`/`error`. If you can't decide, ask: "should someone wake up for this?" If not, it isn't critical.

## Never log

Secrets, tokens, cookies, passwords, full request bodies, whole DB rows or Stripe objects, or raw emails (use `maskEmailAddresses`). Log ids and `error_name` plus a masked, truncated message. `redact.ts` is a safety net. Don't rely on it.

## Checklist

- [ ] `channel` comes from `LOG_CHANNELS`, and `operation` is the flow name, used the same way on every line
- [ ] `message` is a stable event with no ids. Values and ids go in `extraInfo`
- [ ] Loggers come from `logService.<service>(overrides)` (api: `createApiLogger`); shared loggers read the trace id through `id: () => …`, never `.name()`/`.channel()`/`id =`
- [ ] The flow logs started → steps → `success`/failure line that names `step`
- [ ] Jobs are enqueued through `QueueHelper`/`enqueueJob` with the caller's log config as the trailing argument
- [ ] No `flush()` anywhere but the worker's `JOB_FLUSH_LOGS` job; a process that exits awaits `logBuffer.settle()` first
- [ ] `critical` only for unknown errors, broken invariants, suspicious activity or a final failed attempt (`isFinalAttempt(job)`)
- [ ] No PII or secrets. Specs asserting log lines still pass (`*.logging.spec.ts`)
