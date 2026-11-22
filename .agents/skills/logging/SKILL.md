---
name: logging
description: >-
  How to write log lines in TH Studio (api, worker, web server, backend-lib) so they are
  queryable in Loki/Grafana and traceable across request → queue → Stripe → webhook.
  Use when adding or changing any LogService call, picking a log level (especially
  critical), adding a channel, or instrumenting a flow with side effects such as
  sign-up, benefit renewal or subscription changes.
---

# Logging

Lines are JSON, one per line, shipped to **Loki** and charted in **Grafana**. Write each as an event a dashboard can count, filter and follow. Use the logger, never `console.*`.

Read on demand:
- Tracing a multi-step flow or enqueueing jobs → `references/tracing.md`
- Logging from `apps/web` → `references/web.md`
- Buffer, flush, shutdown, deploy → `references/buffer-and-flush.md`

## Building a logger

`LogService` (`packages/backend-lib/src/services/log-service`) is a standalone library with no channel, service name or request type. The project layer is `@repo/backend-lib/config/logging`: one factory per service, taking overrides only (`id`, `globalContext`, `defaultOptions`, `format`, `callback`). Each service has its own typed `globalContext`, written as the line's redacted `request`.

| Service | Build it with | `globalContext` (the line's `request`) |
|---|---|---|
| api | `RequestService.log(channel, { operation, traceId })` (DI) or `apiLogger(channel, options)` (`main.ts`, cron, module consts) | the HTTP request, read per line (`ApiLogContext`) |
| worker | `workerLogger(channel, job, { operation })` (`apps/worker/src/logging.ts`) | the BullMQ job: `queue`, `job_name`, `job_id`, `attempt`, `max_attempts` |
| web | `webLogger` + `withLogTrace` (`apps/web/src/lib/logging/logger.ts` only) | the server action or route pattern |
| dbcli | `audited(command, action)` (`packages/database/src/bin/dbcli-audit.ts`) | `{ command }` |
| lib | `logService.lib({ defaultOptions: { channel } })` (backend-lib only) | none; takes the entrypoint's `setLogProcessService` service |

- The **channel** is a default option, not a LogService concept: `defaultOptions: { channel }`. No channel means `system`. Loggers are immutable, so one shared logger is safe across concurrent requests and jobs.
- **`globalContext`** is an allow-list read per line through a function. Never headers, cookies, tokens, bodies or job payloads.
- **Build a logger once** (constructor, field or per-flow local), never per line: `this.log = requestService.log('users', { operation: 'new-user' })`.
- Api spec helper: `consoleLogger(config)` (`src/common/testing/console-logger.ts`).

## Line shape

`log.info(message, options?)`: two arguments. `options` is an object or an `Error` (becomes `extraInfo: { name, message, stack }`), merged over the logger's `defaultOptions` (the call wins).

```ts
log.info('Stripe customer created', { user_id: user.id, stripe_customer_id: customer.id, step });
log.warn('Login rejected', { reason: 'bad-password', status_code: 401 });
```

`buildLogEntry` lifts `channel`, `operation`, `status_code` and a **string** `method` (login method, provider) out of the options; everything else becomes redacted `extraInfo`.

| Field | Rule |
|---|---|
| `service`, `channel`, `level`, `method` | Loki **labels**, low cardinality. `channel` must be in `LOG_CHANNELS` (`packages/common-lib/src/constants/log.ts`), else it is written as `system`; add new ones there, never build dynamically. `level` is uppercase in the line, lowercase in calls |
| `operation` | the **flow** name, kebab-case, bounded set |
| `id` | the trace id, read per line (`''` when none) |
| `message` | a stable event with **no ids or values**, so `count_over_time` groups it |
| `extraInfo` | small, flat details and pivot ids: `user_id`, `stripe_*`, `step`, `error_name`, counts |
| `status_code` | a number only |
| `request` | the service's context, not a label |

Never put ids, emails or numbers in `message` or `channel`. `service` is the running app's; `unknown` means an entrypoint forgot `setLogProcessService`.

## What the framework already logs (do not repeat)

- **`api.access`**: one line per HTTP request when it finishes (`route`, `status_code`, `duration_ms`, `aborted`), including guard rejections, unknown routes and aborts. Never log "request received/completed".
- **`api.error`**: the exception filter logs every error reaching it: 4xx `warn`, **every 5xx `critical`** (admin mail). An unknown-route 404 is not logged by it. So **don't `log.warn/error` and then `throw` an `HttpException`** with the same message (double line, one trace). Log before a throw only when it adds something the client message can't: a different internal reason, or state the request doesn't carry.
- **Jobs**: `GlobalProcessor` and the worker's job runner log start, completion, each retry and the permanent failure. A processor doesn't, and doesn't `log.error` + rethrow just to report failure.
- **Queue**: `QueueHelper`/`enqueueJob` log the enqueue on channel `queue`.

## Levels

| Level | Use for | Alerts? |
|---|---|---|
| `debug` | local diagnostics, never on hot paths | no |
| `info` | a milestone (step done, job started) | no |
| `success` | a flow **finished** well; Grafana counts these | no |
| `warn` | expected, user-caused or recoverable: validation, wrong password, rate limit, a retry that will run, 4xx | no |
| `error` | our operation failed in a known way and the system copes: a non-final job attempt, a degraded optional step | no |
| `critical` | **someone must act now** | **yes**, admin mail |

### `critical`

Only when **the cause isn't the user** and one of these holds:
- **Unknown or unexpected error**: a branch that "can't happen", an unexpected provider 5xx.
- **Broken invariant or data damage**: account half-created (no Stripe customer), money or benefit state out of sync, a webhook for an unknown customer.
- **Suspicious activity**: webhook signature mismatch, token replay, an IP hammering auth past the throttle, access to another user's resource.
- **A final job attempt failed** on something that matters (`isFinalAttempt(job)` from `@repo/backend-lib/utils`); earlier attempts are `error`.

Not for bad input, expired links, wrong passwords, declined cards, expected 4xx or retries. Ask: "should someone wake up for this?"

## Never log

Secrets, tokens, cookies, passwords, full request bodies, job payloads, whole DB rows or Stripe objects, or raw emails (use `maskEmailAddresses`). Log ids and `error_name` plus a masked, truncated message. `redact.ts` is a safety net, not a plan.

## Checklist

- [ ] `channel` from `LOG_CHANNELS`; the same `operation` on every line of a flow
- [ ] `message` is a stable event; ids and values go in options
- [ ] Logger comes from the service's builder, built once; shared loggers read trace id and context through functions
- [ ] Flow logs started → steps → `success`/failure naming the `step`
- [ ] Jobs enqueued via `QueueHelper`/`enqueueJob` with the trace carrier as trailing argument
- [ ] `flush()` only in the worker's `JOB_FLUSH_LOGS`; an exiting process awaits `logBuffer.settle()`
- [ ] `critical` only per the rules above
- [ ] No duplicate of framework lines, no PII or secrets; `*.logging.spec.ts` still pass
