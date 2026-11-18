---
name: logging
description: >-
  How to write log lines in TH Studio (api, worker, backend-lib) so they are
  queryable in Loki/Grafana and traceable across request → queue → Stripe →
  webhook. Use when adding or changing any LogService call, picking a log
  level (especially critical), adding a channel, or instrumenting a multi-step
  flow such as sign-up, benefit renewal or subscription changes.
---

# Logging

Lines are JSON, one per line, shipped to **Loki** and charted in **Grafana**. Write each one as an event a dashboard can count, filter and follow. The logger lives in `@repo/backend-lib/services/log-service`. Use it, never `console.*`.

## Line shape (already produced for you)

```json
{"timestamp":"…","service":"api","replica":"…","channel":"users","operation":"new-user",
 "level":"INFO","id":"<trace id>","message":"Stripe customer created",
 "correlation":{"user_id":42,"stripe_customer_id":"cus_…"},"request":{…},"extraInfo":{"step":"stripe-customer"}}
```

| Field | Role in Loki | Rule |
|---|---|---|
| `service`, `channel`, `level`, `status` | **labels** (low cardinality) | `channel` must be in `LOG_CHANNELS` (`channels.ts`). Add a new one there; never build it dynamically |
| `operation` | filter (`\| json \| operation="new-user"`) | the **flow** name, kebab-case, bounded set |
| `id` | the **trace id** | set for you from the request/job context. Don't pass it by hand |
| `correlation` | pivot ids | ids only: `user_id`, `job_id`, `stripe_*`, `media_id`… (`LogCorrelation`) |
| `message` | the **event** | stable text with no ids or values inside, so `count_over_time` groups it |
| `extraInfo` (2nd arg) | details | small, flat, redacted: `step`, `error_name`, counts, durations |

Never put ids, emails, usernames or numbers in `message` or `channel`. They go in `correlation`/`extraInfo`. Unbounded labels break Loki, and changing messages break dashboards.

## The trace: following one flow end to end

One action (for example a user signing up) should be readable as a timeline in Grafana by querying the trace `id` or `correlation.user_id`:

```
{service=~"api|worker"} | json | correlation_user_id="42" | operation="new-user"
```

1. **The trace id is automatic.** HTTP requests (`RequestService`), BullMQ jobs (`runJobWithLogContext`) and crons each run inside `runWithLogContext`. Enqueue with `QueueHelper` / `enqueueJob`, and the job inherits the same `id` plus correlation (`parent_job_id` is set). Don't call `queue.add` directly or the trace breaks.
2. **Name the flow with `operation`** and keep the same value on every line of that flow. Pass it per call in the 3rd argument. Never use `.name()` on a shared DI logger, because it mutates the logger for every concurrent request.
3. **Add ids as soon as you learn them** with `addLogCorrelation({ user_id, stripe_customer_id })`. Every later line in the context carries them, including lines from jobs it enqueues.
4. **Log the milestones, not every line of code.** Use a `started` line, one line per side-effect step, and then `completed` or a failure line that names the `step`:

```ts
const fields = { operation: 'new-user', correlation: { user_id: user.id } };
this.logService.info('User registration started', undefined, fields);
let step = 'stripe-customer';
try {
  const customer = await stripe.customers.create(/* … */);
  addLogCorrelation({ stripe_customer_id: customer.id });
  this.logService.info('Stripe customer created', { step }, fields);
  step = 'free-plan';
  // …
  this.logService.success('User account created', undefined, fields);
} catch (error) {
  const failure = { step, error_name: error instanceof Error ? error.name : typeof error };
  this.logService.error('User registration failed', failure, fields);
  throw error;
}
```

Use `<Subject> <past-tense verb>` for messages ("Benefit renewed", "Stripe customer created") and `… started` / `… failed` for flow boundaries. Reference: `users.service.ts` `handleNewUserEvent`, `plan-subscriptions.service.ts`.

Example flows and their `operation`: `register` → `new-user` (account setup, Stripe customer, free plan, welcome mail), `benefit-renew`, `subscription-change`, `hard-delete`, `username-change`.

## Levels

| Level | Use for | Alerts? |
|---|---|---|
| `debug` | local diagnostics, never left on hot paths | no |
| `info` | a milestone happened (step done, job started) | no |
| `success` | a flow **finished** well. Grafana counts these for success rates | no |
| `warn` | expected, user-caused, or recoverable: validation failure, wrong password, rate limit, retry that will run again, 4xx | no |
| `error` | our operation failed in a known way and the system copes: a known failure mode, a non-final job attempt, a degraded optional step | no |
| `critical` | **someone must act now** (see below) | **yes**, admin mail via the critical handler |

### When to use `critical`

`critical` pages a human. Use it only when **the cause isn't the user** and one of these holds:

- **Unknown or unexpected error**: a branch that "can't happen", an unhandled exception type, an unexpected 5xx from a provider.
- **Broken invariant or data damage**: an account left half-created (no Stripe customer, so it can never pay), money or benefit state out of sync, a webhook for an unknown customer.
- **Suspicious activity**: signature or HMAC mismatch on a webhook, token reuse or replay, an IP hammering auth past the throttle, access to another user's resource, an impossible state transition requested by a client.
- **A final job attempt failed** on something that matters (`currentJobAttempt()?.is_final`). Earlier attempts are `error`.

Do **not** use `critical` for user mistakes (bad input, expired link, wrong password, card declined), expected 4xx, or retries that will run again. Those are `warn`/`error`. If you can't decide, ask: "should someone wake up for this?" If not, it isn't critical.

## Never log

Secrets, tokens, cookies, passwords, full request bodies, whole DB rows or Stripe objects, or raw emails (use `maskEmailAddresses`). Log ids and `error_name` plus a masked, truncated message. `redact.ts` is a safety net. Don't rely on it.

## Checklist

- [ ] `channel` comes from `LOG_CHANNELS`, and `operation` is the flow name, used the same way on every line
- [ ] `message` is a stable event with no ids. Values go in `extraInfo` and ids in `correlation`
- [ ] The flow logs started → steps → `success`/failure line that names `step`
- [ ] Jobs are enqueued through `QueueHelper`/`enqueueJob` so the trace carries over
- [ ] `critical` only for unknown errors, broken invariants, suspicious activity or a final failed attempt
- [ ] No PII or secrets. Specs asserting log lines still pass (`*.logging.spec.ts`)
