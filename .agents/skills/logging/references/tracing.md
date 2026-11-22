# Tracing one flow end to end

Read when instrumenting a multi-step flow (sign-up, renewal, subscription change) or enqueueing jobs.

A flow should read as a timeline in Grafana by querying the trace `id` or `extraInfo.user_id`:

```
{service=~"api|worker"} | json | extraInfo_user_id="42" | operation="new-user"
```

1. **The trace id comes from the store, per line.** Api: `RequestService.log` / `apiLogger` read `id` and `request` from the request store: an HTTP request (`RequestService.run`), a processor job (`GlobalProcessor`: the enqueuer's id or a fresh UUID) or a cron run (`runCronExclusive`: fresh UUID, `cron` in `extraInfo`). Worker: `workerLogger(channel, job)` uses `jobTraceId(job)`. dbcli: `audited` gives each run a UUID.
2. **Carry it into jobs.** Enqueue with `QueueHelper.*(…, carrier)` / `enqueueJob(…, carrier)`, passing the caller's trace carrier last: `requestService.traceCarrier()` (`apiTraceCarrier()` outside DI) in the api, `workerTraceCarrier(job)` in the worker, `dbcliTraceCarrier()` in the dbcli. The id travels in `opts.telemetry`. Never call `queue.add` directly.
   - A carrier is a `LogTraceCarrier` (`@repo/backend-lib/utils`): `{ service?, id?, globalContext? }`, and the helpers read only those. Never `defaultOptions`, `format` or `callback`. The helpers' own lines are on channel `queue` (operations `enqueue`, `job`) and `failed-job`.
3. **Name the flow with `operation`**, the same value on every line: a per-call option, or the logger's `defaultOptions.operation` when the whole logger is one flow. Never rebuild a shared logger per line.
4. **Put ids in `extraInfo`** as soon as you learn them (`user_id`, `stripe_customer_id`). No ambient context adds them.
5. **Log milestones, not every line**: `started`, one line per side-effect step, then `completed` or a failure line naming the `step`.

```ts
const log = this.requestService.log('users', { operation: 'new-user' }); // built once
log.info('User registration started', { user_id: user.id });
let step = 'stripe-customer';
try {
  const customer = await stripe.customers.create(/* … */);
  log.info('Stripe customer created', { user_id: user.id, stripe_customer_id: customer.id, step });
  step = 'free-plan';
  // …
  log.success('User account created', { user_id: user.id });
} catch (error) {
  log.error('User registration failed', { user_id: user.id, step, error_name: error instanceof Error ? error.name : typeof error });
  throw error;
}
```

Messages: `<Subject> <past-tense verb>` ("Benefit renewed"), `… started` / `… failed` at flow boundaries. Reference: `users.service.ts` `handleNewUserEvent`, `plan-subscriptions.service.ts`.

Example operations: `new-user`, `benefit-renew`, `subscription-change`, `hard-delete`, `username-change`.

**Stripe webhooks**: the controller rejoins the originating request's id from the object's metadata (`StripeService.traceIdFromMetadata`, else the HTTP request id), logs with it and enqueues the job with it. The event's ids (`stripeEventRefs(event).ids`) go in `extraInfo`.
