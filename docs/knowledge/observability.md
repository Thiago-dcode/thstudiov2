# Observability

> What you have, what it's called, and the one word you must not use.
> Related: [`security.md`](./security.md) · [`async-and-messaging.md`](./async-and-messaging.md) · [`devops-and-cicd.md`](./devops-and-cicd.md)

---

## 1. The three pillars 🔵

| Pillar | Answers | You have |
|---|---|---|
| **Logs** | *What happened?* Discrete events | 🟢 Structured, correlated, redacted |
| **Metrics** | *How much / how often?* Aggregated numbers over time | ⚠️ Application-level only, not system-level |
| **Traces** | *Where did the time go?* One request across services | 🔴 **None** |

🔵 **Monitoring vs observability:** monitoring asks known questions ("is CPU above 80%?"). Observability is the property of being able to ask questions you *didn't* anticipate. Dashboards are monitoring; the ability to debug a novel failure from telemetry is observability.

---

## 2. Logging 🟢

`packages/backend-lib/src/services/log-service/`:

```
log.service.ts          abstract port
console-log.service.ts  driver
file-log.service.ts     driver
factory-log.service.ts  factory
log-path.ts             path resolution
redact.ts (+ test)      secret redaction
prune-daily-log-files.ts (+ test)  retention
```

Same [ports-and-adapters](./architecture.md#4-ports-and-adapters-hexagonal-architecture) shape as every other service.

### The good parts

🟢 **Secret redaction before write** (`redact.ts`, with tests). Secrets reach logs constantly — a logged request body with a password, an error carrying a connection string. Redacting at write time, with depth and breadth caps to bound the cost, is something most codebases lack entirely.

🟢 **Deferred logging.** `flush-logs.interceptor.ts` + `LOG_QUEUE` buffer log writes and flush *after* the response. **Disk I/O stays off the response path** — the name is **deferred/async logging**.

🟢 **Correlation IDs.** A `requestId` in the `AsyncLocalStorage` store ties every log line from one request together. 🔵 The general name is **correlation ID** or **request ID**; without one, concurrent requests interleave in the log and are unreadable.

🟢 **Retention.** `log-retention.task.ts` prunes daily at 01:00 — **log rotation / retention policy**. Unbounded logs fill the disk, and a full disk on a 1 GB droplet takes down Postgres too.

### `AsyncLocalStorage` 🟢

`apps/api/src/common/services/request.service.ts` holds per-request context: request id, user, IP, locale.

🔵 **What it solves:** *"how do I get the current user deep in a call stack without threading it through ten function signatures?"* ALS is Node's **continuation-local storage** — the async equivalent of thread-local storage. It survives `await` boundaries, which is what makes it work at all in async code.

🟢 It's also load-bearing for correctness, not just convenience: the throttler guard reads the real client IP from it ([`security.md`](./security.md#3-rate-limiting-and-the-trusted-proxy-bug-)).

⚠️ **Know the cost:** ALS has measurable overhead and creates *implicit* dependencies — a function reading from ALS doesn't declare that in its signature, which makes it harder to test and reason about. It's the right tool for genuinely cross-cutting context and the wrong one for passing ordinary arguments.

---

## 3. Metrics ⚠️

🟢 You have **application-level metrics as data**: `USER_METRICS_QUEUE` computes user metrics, and `llm_tokens_usage` meters every LLM call against per-user credits. That's real usage metering.

🔴 **What you don't have** is operational metrics: no Prometheus, no StatsD, no time-series store, no dashboards. Nothing records request rate, error rate, latency percentiles, event-loop lag, memory, or queue depth over time.

🔵 **The four golden signals** (Google SRE) — worth knowing by name:

1. **Latency** — including the distribution, not just the mean
2. **Traffic** — requests per second
3. **Errors** — rate of failed requests
4. **Saturation** — how full the system is (the leading indicator)

⚠️ **The gap that would bite you first: queue depth.** A user whose media sits in `GENERATING_METADATA` for an hour sees a broken product, and nothing tells you. Flat depth is healthy; monotonically rising means consumers can't keep up. BullMQ exposes this cheaply — it's the highest-value metric you're missing.

🔵 **Percentiles, not averages.** A mean latency of 200 ms can hide 5% of requests taking 5 seconds. **p50/p95/p99** is the standard framing, and "we look at p99 because that's someone's every request" is a good line.

---

## 4. Tracing 🔴

**You have no distributed tracing.** No OpenTelemetry, no Jaeger, no APM.

⚠️ **Do not say "tracing" or "observability platform".** You have *logging* — honestly, good logging — and the distinction is one an interviewer will test.

🔵 **What tracing actually is:** a **trace** follows one logical operation across process boundaries, composed of **spans** (one unit of work each) linked parent-to-child by a propagated **trace context** (a W3C `traceparent` header). It answers *"the request took 3 seconds — which hop?"*

**Why it would help here specifically:** your media pipeline crosses API → Redis → worker → S3 → OpenAI → back. Right now, "why did this media take 90 seconds?" is answered by manually correlating logs across two containers. A trace would show it in one view.

🟢 **The good news:** you already have correlation IDs, which is the conceptually hard half. Adding OpenTelemetry would be mostly wiring — instrument the HTTP server, propagate the context into the BullMQ job payload, and export.

> **Say this:** "I have structured logging with correlation IDs and per-request context in AsyncLocalStorage, plus application-level usage metering. What I don't have is distributed tracing — so I'm careful not to call it that. The pipeline crosses API, Redis and worker, and correlating those today means reading two logs side by side. OpenTelemetry is the obvious next step and mostly wiring, since the correlation ID already exists."

---

## 5. Alerting 🔴

**Nothing alerts.** No paging, no error-rate threshold, no uptime monitor mentioned in the repo.

🟢 The one thing that does reach you: `JOB_ERROR_500_MAIL` — 500s are emailed.

🔵 **Why that isn't enough:** email alerts don't page, don't deduplicate, don't escalate, and drown in noise. And it only covers 500s — it says nothing about a queue backing up, a replica flapping, or the site being down entirely.

⚠️ **The cheapest real improvement is an external uptime check.** UptimeRobot or Better Stack hitting the health endpoint every minute costs nothing and catches the failure mode that matters most: *the site is down and you don't know.* Everything internal shares fate with the thing it's monitoring.

---

## 6. Health checks 🟢

Docker healthchecks in `compose.prod.yaml`, gating `depends_on: service_healthy` at startup and driving restarts.

⚠️ **Two things to know:**

1. **They don't feed nginx's routing** ([`scaling-and-replicas.md`](./scaling-and-replicas.md#3-the-health-check-gap-)). A running-but-broken replica keeps getting traffic.
2. **A healthcheck is a request too.** Yours previously rendered the entire landing page — four API calls, ×2 replicas, every 30s, and every 3s during `start_period`. It was a significant contributor to the 429 incident. **A healthcheck that is expensive enough to cause the outage it's meant to detect is a genuinely good war story.**

🔵 **The lesson:** health endpoints must be *cheap* and check the right depth. A **liveness** check should test the process; a **readiness** check may test dependencies — but if it tests too deeply, a slow database makes every replica unhealthy simultaneously and you've built an outage amplifier.

---

## 7. What to add, in order ⚠️

1. **External uptime monitoring** — free, five minutes, catches total failure
2. **Queue-depth metric + threshold alert** — the failure most likely to bite silently
3. **Container resource limits** — not observability, but you can't diagnose an OOM that took the host down
4. **Error tracking (Sentry)** — grouping, deduplication, stack traces with release tagging
5. **Basic metrics + dashboard** — golden signals
6. **OpenTelemetry tracing** — highest effort, highest ceiling

**Being able to rank these by value rather than by sophistication is the answer** to "what's missing?"

---

## Interview drills

**"How do you know when something breaks in production?"**
Honest answer: 500s are emailed, and otherwise I find out by looking. Then the ranked list. **Do not oversell this** — everyone knows a solo pre-launch project doesn't have a full observability stack, and claiming one is the fastest way to lose credibility.

**"What's the difference between logging, metrics and tracing?"**
§1. Then say precisely which you have. The self-awareness is the signal.

**"How would you debug a slow request in production?"**
Today: correlation ID, grep both containers, reconstruct the timeline manually. Then name the limitation and what tracing would change. Describing your *actual* workflow, including its friction, is more convincing than describing an ideal one.

**"Tell me about a monitoring mistake."**
The healthcheck that rendered the whole landing page and helped cause the 429s. Monitoring that damages the thing it monitors is a genuinely interesting failure, and it's yours.
