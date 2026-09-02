# A11STUDIO — Architecture & Patterns

**What this document is for.** You have built a lot of things correctly by instinct and by copying good conventions. What you are missing is the *vocabulary* — the shared names engineers and interviewers use for those things. This document walks your own codebase and puts the correct technical name on each thing you already built, with the file path as proof, and a sentence you can actually say out loud.

**How to use it.** Read a section, then open the file it points at. The point is not to memorize terms — it's to connect a name you've heard in job descriptions to code you wrote yourself. That connection is what makes you able to defend it in an interview.

**A warning that matters more than the rest of the document.** The last section is *Honest Gaps*. Some of the words currently in job posts do **not** describe what you built. Using them anyway is the single fastest way to fail a senior interview — the interviewer asks one follow-up and the claim collapses. Knowing exactly where your boundary is will make you *more* confident, not less, because everything on your side of the line you can defend all day.

---

## Table of contents

1. [System architecture — the shape of the thing](#1-system-architecture--the-shape-of-the-thing)
2. [Architectural patterns (macro)](#2-architectural-patterns-macro)
3. [Design patterns (micro)](#3-design-patterns-micro)
4. [Asynchronous & event-driven vocabulary](#4-asynchronous--event-driven-vocabulary)
5. [Replicas, statelessness, and the real-time bug they exposed](#5-replicas-statelessness-and-the-real-time-bug-they-exposed)
6. [nginx — what a reverse proxy actually does](#6-nginx--what-a-reverse-proxy-actually-does)
7. [LLM engineering vocabulary](#7-llm-engineering-vocabulary)
8. [The agent harness you built without knowing the name](#8-the-agent-harness-you-built-without-knowing-the-name)
9. [Cross-cutting concerns](#9-cross-cutting-concerns)
10. [Vocabulary cheat sheet](#10-vocabulary-cheat-sheet)
11. [Honest gaps — what you must NOT claim](#11-honest-gaps--what-you-must-not-claim)

---

## 1. System architecture — the shape of the thing

### The name for your overall architecture

You have a **modular monolith deployed as a small distributed system**, organized as a **monorepo**.

Break that down, because each half is a separate claim:

- **Monorepo** — one Git repository, multiple independently-built packages, managed by a build orchestrator (Turborepo) with a dependency graph and remote-cacheable tasks. Not the same as a monolith.
- **Modular monolith** — `apps/api` is *one* deployable process containing 42 domain modules with enforced boundaries (each module owns its controller, service, repository, and DTOs). It is **not** microservices: the modules share a process, a database, and a deploy unit.
- **Small distributed system** — you run three separate processes (`api`, `web`, `worker`) plus Postgres, Redis and nginx, communicating over HTTP, Redis-backed queues and WebSockets. The API and web tiers each run **two replicas**.

> **Say this:** "It's a modular monolith in a monorepo, with the async work split out into a separate worker process. I deliberately didn't go microservices — at one engineer and one database, the operational cost would buy me nothing."

That last sentence is what a senior interviewer wants to hear. **Knowing why you didn't do something is a stronger signal than having done it.**

### The tiers

```
Browser
   │ HTTPS
Cloudflare ─────────────── edge: CDN, WAF, DDoS absorption, TLS #1
   │
nginx ──────────────────── reverse proxy: TLS #2 termination, rate limiting,
   │                        security headers, host-based routing
   ├──▶ web × 2 ────────── Next.js SSR / RSC  (BFF for the browser)
   └──▶ api × 2 ────────── NestJS REST + Socket.IO gateway
            │
            ├──▶ postgres  (system of record)
            └──▶ redis     (cache + queue broker + session-ish state)
                    │
                 worker ─── BullMQ consumer: media, AI, mail
```

Names for each piece:

| Piece | The technical name |
|---|---|
| Cloudflare in front | **Edge layer** / **CDN** / **WAF** |
| nginx | **Reverse proxy**, doing **TLS termination**, **L7 load balancing**, **rate limiting** |
| Two api/web containers | **Horizontal scaling** with **round-robin load balancing** via Docker DNS |
| Next.js server calling your API | **BFF — Backend for Frontend** |
| `worker` process | **Asynchronous worker** / **background job consumer** |
| Redis under BullMQ | **Message broker** |
| Postgres | **System of record** |
| `expand–contract` migrations | **Backward-compatible schema evolution** |

### The N-tier / layered pattern inside the API

Every module in `apps/api/src/v1/modules/<entity>/` follows the same layering, and you enforce it in your own skill files (`.agents/skills/api-service/SKILL.md` literally says *"never put SQL in the service"*):

```
Controller   → HTTP only: routing, DTO validation, guards.        (thin)
   ↓
Service      → use-case orchestration, enqueues jobs, emits events. (no SQL)
   ↓
Repository   → all SQL, formatters, pagination.                    (no HTTP)
   ↓
QueryBuilder → dialect-aware SQL generation.
```

The names: **Layered architecture** (a.k.a. **N-tier**), enforcing **separation of concerns**, with the **Repository pattern** isolating persistence and the **Service layer pattern** holding use-cases. The rule "no SQL above the repository, no HTTP below the controller" is the **dependency rule** — dependencies point inward, toward the domain.

> **Say this:** "Each module is layered — thin controller, service for use-case orchestration, repository for all data access. The constraint I enforce is that SQL never leaks above the repository and HTTP concepts never leak below the controller."

---

## 2. Architectural patterns (macro)

### 2.1 Ports and Adapters (Hexagonal Architecture)

**This is the biggest one you built without naming it.**

Look at `packages/backend-lib/src/services/`. Every service follows an identical shape:

```
storage-service/   storage.service.ts (abstract)  → s3-storage.service.ts
llm-service/       llm.service.ts     (abstract)  → openAi-llm.service.ts
mail-service/      mail.service.ts    (abstract)  → nodemailer-… / resend-…
compress-service/  compress.service.ts(abstract)  → sharp-compress.service.ts
log-service/       …                              → file / console drivers
view-service/      …                              → ejs / pug drivers
```

The abstract class is a **port** — the interface your application depends on. Each concrete class is an **adapter** — the thing that knows about the outside world (S3, OpenAI, Sharp, Resend). Your application code depends only on the port.

That is **Hexagonal Architecture**, also called **Ports and Adapters**, and the underlying principle is the **Dependency Inversion Principle** (the D in SOLID): *high-level modules should not depend on low-level modules; both should depend on abstractions.*

The practical payoff, which is what an interviewer will probe for: **you can swap OpenAI for Anthropic, or S3 for R2, by writing one new adapter and changing one factory line — nothing in `apps/api` or `apps/worker` changes.** That is not a theoretical benefit; it's why `apps/worker/src/processors/media.processor.ts` can construct its whole dependency set in eight lines.

> **Say this:** "External systems sit behind ports — abstract service classes in a shared package — with one adapter per provider. Application code never imports the OpenAI or AWS SDK directly, so providers are swappable and everything is mockable in tests."

### 2.2 Shared kernel

`packages/common-lib` holds types, schemas, constants and pure utilities used by **all three** apps. In Domain-Driven Design that shared, jointly-owned model is called a **shared kernel**.

The important consequence: your API and worker can't disagree about the shape of a job payload, because both import `GenerateMediaMetadataInput` from the same file. Types are the **contract** between processes.

> **Say this:** "Job payloads and DB row shapes are typed once in a shared package that all three apps import, so the producer and consumer of a queue message can't drift apart — a contract change is a compile error, not a runtime surprise."

### 2.3 CQRS-*flavoured* read/write split — be careful here

You do **not** implement CQRS. But you do have a related, real thing worth naming precisely: **write-behind** / **deferred persistence**. An HTTP request validates, enqueues, and returns; the durable side effects happen in a consumer.

Do not say "CQRS". Say **"command/side-effect separation"** or **"deferred write path"**. Precision here is a signal of competence — misusing CQRS is a well-known tell.

### 2.4 Composition root

`MediaProcessor.handle()` in `apps/worker/src/processors/media.processor.ts` constructs every dependency in one place and injects them through the constructor:

```ts
const instance = new MediaProcessor(
  job,
  FactoryStorageService.create(s3StorageConfig),
  FactoryCompressService.create(compressConfig),
  AiService.instance(FactoryLLMService.create(openAiLLMConfig)),
  MediaRepository.instance(),
  …
);
```

That single place where the object graph is wired is the **composition root**. Everything below it receives its collaborators via **constructor injection** and never news-up its own dependencies. In `apps/api` you get the same effect from Nest's **IoC container** (Inversion of Control) — the worker does manually what Nest does by decorator, which is a nice thing to be able to explain.

---

## 3. Design patterns (micro)

These are Gang-of-Four names. Each is genuinely present in your code.

### Repository
`packages/database/src/lib/repositories/base.repository.ts` + one repository per entity.
Mediates between the domain and the data mapper; the rest of the app queries an object, not a table.

### Template Method
`BaseRepository`, `CompressService`, `Client<T>`, `HttpClient`/`FetchApi`.
The abstract base defines the *skeleton* of an algorithm and defers specific steps to subclasses. Example: `CompressService.getSizeCompressed()` implements the shared byte-budget maths in the base class; `SharpCompressService` only supplies the actual encoding step.

### Factory Method / Static Factory
Six of them: `FactoryStorageService`, `FactoryLLMService`, `FactoryMailService`, `FactoryCompressService`, `FactoryLogService`, `FactoryViewService`.
A `switch` on a config string returns a concrete adapter typed as the abstract port. Callers ask for *what* they need, not *which implementation*.

### Strategy
The drivers those factories return. `MailService` holds an `EmailDriver`; swapping Nodemailer for Resend changes behaviour at runtime without touching `MailService`. Interchangeable algorithms behind one interface = **Strategy**.

### Builder / Fluent Interface
`packages/database/src/lib/builder/queryBuilder/index.ts` (1,060 lines).
Chained method calls that accumulate state and produce a complex object at the end: `.where().join().orderBy().paginate()`. The chaining style specifically is a **fluent interface**.

### Facade
`packages/database/src/lib/facades/index.ts` — literally:

```ts
class Schema extends SchemaBuilder {}
class Query  extends QueryBuilder {}
class Column extends ColumnBuilder {}
```

A simplified, memorable surface over a more complex subsystem. (This is the Laravel-style naming convention, and it *is* the Facade pattern.)

### Singleton
`MediaRepository.instance()`, `AiService.instance()`, `PlansRepository.instance()`.
One shared instance per process. Worth knowing the trade-off: singletons are convenient but make test isolation harder — which is exactly why the *processor* takes them as constructor arguments instead of calling `.instance()` internally.

### Adapter
`S3StorageService` translates your `StorageService` port onto the AWS SDK's very different API. Same for every driver. **Adapter** = making an incompatible interface fit the one you want.

### Observer / Publish–Subscribe (in-process)
`EventEmitter2` across `auth.service.ts`, `media.service.ts`, `portfolio.service.ts`, consumed via `@OnEvent(...)` in e.g. `plan-subscriptions.service.ts`.
A publisher emits a **domain event** (`NEW_USER_EVENT`) without knowing who listens. This is the **Observer** pattern, and because it goes through a broker object it is also correctly called an **in-process event bus**.

### Command / Handler dispatch
`MediaProcessor.handle()` switches on `job.name` to route a message to a handler. That's a **dispatch table** over **command messages** — each job is a command object with a name and a typed payload.

### Decorator
Your custom decorators — `@Public()`, `@SkipResponseTransform()`, `@Throttle()`, `@ToInt()` — attach **metadata** consumed by guards and interceptors. (TypeScript decorators, technically **annotation/metadata**, are related to but not identical to the GoF Decorator; the honest name is **declarative metadata**.)

### Chain of Responsibility
The NestJS request pipeline: `middleware → guard → interceptor → pipe → handler → interceptor → exception filter`. Each link can handle, transform, or pass along. Your global stack — `AppThrottlerGuard → AuthGuard → UserStrikesGuard` — is a chain where any link can short-circuit the request.

### Exception translation
`packages/database/src/lib/client/index.ts` catches driver-specific errors and rethrows domain ones (`PG_UNIQUE_VIOLATION` → `DbUniqueViolationException`). This keeps Postgres error codes from leaking upward — a form of **anti-corruption layer**.

---

## 4. Asynchronous & event-driven vocabulary

You asked specifically about this. There are **three different mechanisms** in your codebase and they have three different names. Mixing them up is a common tell; keeping them straight is a strong one.

### (a) In-process event bus — Observer

`this.eventEmitter.emit(NEW_USER_EVENT, new NewUserEvent(user))`

- Same process, same memory, **synchronous by default**.
- **Not durable.** Process dies → event is gone.
- Correct names: **domain events**, **in-process event bus**, **Observer pattern**.
- ❌ Do **not** call this "pub/sub over a message broker."

**Purpose:** decoupling modules that shouldn't import each other.

### (b) Distributed job queue — BullMQ over Redis

`QueueHelper.createOrUpdateUserNotificationJob(...)` → Redis → consumer in `apps/api` or `apps/worker`.

- **Crosses process boundaries.** Producer and consumer are different containers.
- **Durable** — jobs survive a restart, with `attempts: 3` and **exponential backoff**.
- Correct names: **message queue**, **work queue**, **task queue**, **producer/consumer**, **competing consumers** (multiple workers draining one queue), **at-least-once delivery**, **retry with exponential backoff**, **dead-letter handling** (your `removeOnFail: 5000` retention).
- This is the heart of your **event-driven architecture** claim.

**Nuance worth knowing:** a *queue* is point-to-point (one consumer gets each message). *Pub/sub* is broadcast (every subscriber gets a copy). BullMQ is a **queue**, not pub/sub. Saying "I used BullMQ for pub/sub" is wrong; saying "work queue with competing consumers" is right.

**Two more things you built here that have names:**

- **Debouncing via delayed jobs.** `queue-helper.ts` documents that repeated triggers for the same entity inside a delay window *collapse into one generation*. That's **debouncing** plus **job deduplication by job ID** — an idempotency technique.
- **Idempotency.** Your `seo_generated_at` stamp exists so a job that runs twice doesn't do the work twice. The name is **idempotent consumer**, and it is the standard answer to at-least-once delivery.

> **Say this:** "Anything slow or failure-prone goes on a BullMQ queue — image transcoding, LLM calls, Stripe webhooks, mail. Producers are in the API, consumers run in a separate worker container. Delivery is at-least-once with exponential backoff, so consumers are written to be idempotent."

### (c) WebSocket fan-out — the closest thing you have to real pub/sub

Covered in its own section below, because there's a catch.

### The end-to-end flow, named properly

Trace a media upload and name every hop — this is an excellent whiteboard answer:

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
9. Enqueue notification → USER_NOTIFICATIONS_QUEUE             [queue chaining / saga-ish]
10. Notification consumer persists row + emits over WebSocket  [server push]
11. Browser updates without polling                            [real-time UI]
```

Names for the whole shape: **asynchronous processing pipeline**, **choreographed workflow** (each step enqueues the next, versus an *orchestrated* one where a central coordinator drives it), and the status column is an explicit **state machine** (`UPLOADING → UPDATING → GENERATING_METADATA → COMPLETED / FAILED`).

> **Say this:** "The upload endpoint does the minimum synchronously and returns 202; everything expensive is a chain of queue steps, each one advancing an explicit status state machine, so the UI always has something truthful to render and a failure has a defined resting state."

---

## 5. Replicas, statelessness, and the real-time bug they exposed

### First: what a "replica" actually is

In `compose.prod.yaml`:

```yaml
api:
  deploy:
    replicas: ${API_REPLICAS:-2}
```

That tells Docker Compose: **run two identical, independent copies of the api container.** Same image, same environment, same code — two separate operating-system processes, each with its own memory.

Notice what's deliberately absent from that service definition, and the comment you wrote explaining it:

```yaml
# No container_name / fixed host port: this service sits behind nginx and is
```

You can't give them a fixed name or a fixed host port, because there are *two* of them. Instead they're only reachable on the internal Docker network as the hostname `api`, and Docker's embedded DNS resolver (`127.0.0.11`) answers a lookup for `api` with **both** container IPs. nginx picks one of them per request (the mechanics are in §6, Job 2). That's **horizontal scaling** (add more copies) as opposed to **vertical scaling** (make one copy bigger), and the distribution across copies is **load balancing**.

### Who decides which replica handles a request? (Not the app.)

A natural assumption is that something "switches" between replicas — that the app fails over, or that traffic moves to the healthy copy when one struggles. **None of that exists in this setup.** There is no failover logic anywhere in your code, and the app has no idea replicas exist. That's the entire point of statelessness.

The decision happens outside the app, per request:

1. nginx evaluates `set $api_upstream api:8080; proxy_pass http://$api_upstream;`
2. Because the target is a **variable**, nginx re-resolves the hostname through Docker's embedded DNS (`127.0.0.11`), with a 10-second cache
3. Docker DNS returns **both** container IPs, rotating the order between lookups
4. nginx connects to the first one

The result is **round-robin at request granularity** — not per user, not per session, not per connection. Two clicks from the same browser can land on different replicas.

### The health-check gap this creates

The healthchecks in `compose.prod.yaml` are **Docker** healthchecks. They govern restart behaviour and `depends_on: service_healthy` gating at startup. **They do not feed nginx's routing decision.**

And because you route through a variable, there is no `upstream {}` block — which means none of nginx's upstream machinery is available: no `max_fails`, no `fail_timeout`, no `proxy_next_upstream` retry, no `least_conn`, no `ip_hash`. Docker Compose's DNS returns records for every *running* container regardless of its health state.

The consequence: **a replica that is running but broken still receives its share of traffic**, and users get 502s until Docker's restart policy notices and recycles it.

This is a real trade-off, and naming it is worth more than pretending it isn't one:

| Approach | Dynamic scaling (`--scale` with no config change) | Passive health checks | Session affinity |
|---|:--:|:--:|:--:|
| `proxy_pass` to a **variable** (what you have) | ✅ | ❌ | ❌ |
| Static `upstream {}` block | ❌ resolved once at startup | ✅ `max_fails` / `fail_timeout` | ✅ `ip_hash` |

You optimized for the first column — scaling without touching nginx config. The price was the other two. And the missing third column is precisely what causes the WebSocket handshake failure described below.

> **Say this:** "nginx resolves the upstream through Docker DNS at request time rather than at startup, so it spreads traffic across replicas and picks up new ones without a config change. The trade-off is that I gave up nginx's upstream health checks and sticky sessions — Docker's healthchecks handle restarts, but they don't influence routing, so a running-but-broken replica still gets traffic."

### Why two replicas — and whether two is right *here*

The four standard justifications:

1. **Throughput.** Node is single-threaded; one process saturates one core. More processes, more cores used.
2. **Crash resilience.** One dies, `restart: unless-stopped` revives it while the other keeps serving.
3. **Event-loop insurance.** If one process blocks on something synchronous, the other still answers.
4. **Zero-downtime deploys.** Restart replicas one at a time so the service is never fully down.

**Now be honest about which of these you actually get.** Assuming a small single-core droplet:

- **Reason 1 requires more than one core.** Two Node processes on 1 vCPU do not double throughput — they timeshare one core and add context-switching overhead. You pay 2× memory for roughly the same capacity.
- **Reason 4 requires rolling updates, which plain Docker Compose does not do.** Staggered, one-at-a-time replica replacement is a Swarm/Kubernetes feature. `docker compose up -d` recreates containers together, so the zero-downtime benefit is largely unrealized.
- **Reasons 2 and 3 are real even on one core.** Those are the honest justifications for keeping two.

There is also no `mem_limit` or CPU reservation on **any** service in `compose.prod.yaml`. With 2× api + 2× web + postgres + redis + nginx + worker on a small box, one unbounded Node process can exhaust memory and take Postgres down with it. **Resource limits are the missing guardrail**, independent of the replica count.

You already have evidence in your own repo that the replica count amplified a problem — the healthcheck comment on the `web` service:

> *"every probe rendered the whole landing page — four API calls each, **x2 replicas**, every 30s, and every 3s during start_period. That alone was a large share of the 429s."*

**What to do:** `API_REPLICAS` and `WEB_REPLICAS` are environment variables, so this is a one-line experiment rather than a rewrite. Set both to `1`, watch p95 latency and memory for a day, and compare. Two may still be right for reasons 2 and 3 — but it should be a **measured** decision, not an inherited default. Add `mem_limit` either way.

> **Say this:** "I run two replicas for crash resilience and event-loop headroom, not for throughput — on a single core two Node processes just timeshare one CPU. And I don't get true zero-downtime deploys from it either, because Compose doesn't do rolling updates; that would need Swarm or Kubernetes. It's a deliberate, limited benefit rather than cargo-culted scaling."

That answer — knowing exactly which benefits you get and which you don't — is far stronger than claiming you "scaled horizontally."

### The rule that makes replicas work: statelessness

Two replicas only behave like one bigger server if **every request can be served correctly by either copy**. That property is called being **stateless** — meaning the process holds no *per-user* state in its own memory between requests.

Your HTTP API is stateless and it's worth understanding exactly why:

- Auth is a **JWT** — a signed token the client carries. Either replica can verify it with the shared secret. No server-side login memory needed.
- Sessions, notifications, media rows live in **Postgres** — shared by both.
- Cache lives in **Redis** — shared by both.
- Queue jobs live in **Redis** — shared by both.

Everything that must be remembered is pushed *out* of the process into shared infrastructure. This is the whole trick. **Stateless processes scale horizontally; stateful ones don't.**

### Where that breaks: WebSockets are inherently stateful

An HTTP request is a fire-and-forget round trip — connect, respond, disconnect. A **WebSocket is a long-lived open TCP connection**. It has to be held *somewhere*, and that somewhere is the memory of one specific replica.

So when a browser connects, Socket.IO stores, **in that one replica's RAM**, an object representing the socket, and `client.join(userNotificationRoom(user.id))` adds it to an in-memory map of `room → set of sockets`.

**Replica 2 has no idea that socket exists.** Its own room map is empty for that user. There is no shared infrastructure holding this — unlike sessions, unlike cache, unlike jobs. This is the one piece of state you left in process memory, and it's the one piece that can't be.

### Failure mode 1 — the silent one: dropped notifications

Follow a real notification:

```
1. Worker finishes processing media
2. Worker enqueues a job on USER_NOTIFICATIONS_QUEUE (in Redis)
3. BOTH api replicas are consuming that queue  ← competing consumers
4. Redis hands the job to whichever replica asks first — call it replica 2
5. Replica 2's processor writes the notification row to Postgres  ✅
6. Replica 2 calls gateway.notifyUser(...)
       → server.to("user:42").emit(...)
       → replica 2 looks in ITS OWN room map
       → the room is empty; the user's socket lives on replica 1
       → the emit goes nowhere. No error. No log. Nothing.  ❌
```

The user's browser shows nothing. Then they refresh, the row is fetched from Postgres over HTTP, and the notification appears — so it looks like "real-time is a bit flaky" rather than a structural bug.

Because the browser lands on a random replica and the job lands on a random replica, they match **about half the time**. You should expect to lose roughly **50% of live notifications**.

The name for the missing piece is a **pub/sub backplane** (also: **adapter**, **broadcast bus**). With the Socket.IO Redis adapter, `emit` no longer means "look in my local map" — it means "publish to a Redis pub/sub channel", and *every* replica receives that publication and relays it to whichever of its own local sockets are in the room. Redis becomes the shared nervous system, exactly like it already is for your cache and queues.

### Failure mode 2 — the noisy one: the handshake itself

This one I'd expect you've already *seen* without recognizing it, because it produces visible console errors and reconnect loops.

`apps/web/src/lib/hooks/useWebsocket.ts` creates the connection without specifying transports:

```ts
const socket = io(`${clientEnv.NEXT_PUBLIC_WS_URL}/${namespace}`, {
  reconnectionDelayMax: 10000,
  auth: { token: session.token },
});
```

Socket.IO's default is `["polling", "websocket"]`. It does **not** open a WebSocket first. It starts with **HTTP long-polling** — a series of ordinary HTTP requests — and only *then* attempts to upgrade to a real WebSocket. That's a deliberate compatibility design: polling works through proxies that block WebSocket upgrades.

But polling means the handshake spans **multiple separate HTTP requests**, and each one gets load-balanced independently:

```
GET  /socket.io/?EIO=4&transport=polling      → replica 1 → creates session "abc"
POST /socket.io/?EIO=4&transport=polling&sid=abc → replica 2 → "abc"? never heard of it
                                                 → 400 {"code":1,"message":"Session ID unknown"}
```

The client retries, and only connects when it happens to hit the same replica repeatedly for long enough to complete the upgrade. Symptoms: intermittent connection failures, reconnect storms, and `Session ID unknown` in the network tab.

The general name for the requirement this violates is **session affinity**, more commonly **sticky sessions** — routing all requests from one client to the same backend. Your nginx has no affinity at all: `set $api_upstream api:8080; proxy_pass http://$api_upstream;` resolves through Docker DNS at request time with no notion of which client it is serving, so consecutive requests land wherever (§6, Job 2).

### The fixes, and why you need more than one

| Fix | Fixes #1 (dropped emits) | Fixes #2 (handshake) |
|---|:--:|:--:|
| `transports: ["websocket"]` on the client | ❌ | ✅ |
| Sticky sessions (`ip_hash`) in nginx | ❌ | ✅ |
| **`@socket.io/redis-adapter`** | ✅ | ❌ |

They solve different problems, so the correct answer is **the Redis adapter plus one of the other two**. The adapter is non-negotiable — no amount of affinity helps when the *emit* originates on a replica the user was never connected to. Forcing `transports: ["websocket"]` is the cheaper partner (one upgrade request, no multi-request session to lose) and also drops the polling overhead; sticky sessions are the alternative if you ever need polling for compatibility.

> **Say this — it's one of the best answers you have:** "I run the API at two replicas, and WebSockets are the one thing that isn't stateless — the socket lives in one replica's memory. Two consequences: with default Socket.IO transports the polling handshake spans several requests and breaks without sticky sessions, and an emit from the replica that consumed the job never reaches a socket held by the other one. The fix is a Redis pub/sub backplane so any node can reach any socket, plus forcing the WebSocket transport so the handshake is a single request."

Being able to describe a scaling failure mode in your own system — the mechanism, the symptom, and why the obvious fix is only half a fix — is a stronger senior signal than never having had the bug.

### ✅ Both are now fixed — what shipped

**1. The backplane** — `apps/api/src/common/adapters/redis-io.adapter.ts`

A custom `IoAdapter` subclass that swaps Socket.IO's default in-memory adapter for `@socket.io/redis-adapter`. Every `emit` becomes a Redis pub/sub publish that all replicas receive and relay to their own local sockets, so any node can reach any socket.

Two Redis clients are required, and the reason is worth knowing: **a Redis connection in subscriber mode cannot issue ordinary commands**, so publishing needs its own connection. That's why the code calls `pubClient.duplicate()`.

Wired in `apps/api/src/main.ts` *before* `app.listen()`, and guarded — if `REDIS_URL` is unset the app falls back to the in-memory adapter and logs a warning, so single-process local development still works.

The shutdown handler deliberately does **not** call `app.enableShutdownHooks()`. That would switch on Nest's lifecycle hooks globally and change how every BullMQ processor in the app shuts down — a side effect far wider than this fix. A targeted `SIGTERM`/`SIGINT` handler keeps the blast radius to the adapter.

No new infrastructure: Redis was already a hard dependency for BullMQ and the cache.

**2. The handshake** — `apps/web/src/lib/hooks/useWebsocket.ts`

Added `transports: ["websocket"]`, which stops Socket.IO from starting on HTTP long-polling. A WebSocket upgrade is a single request, so the connection is pinned to one replica from the start and there is no multi-request session for the load balancer to break. This also removes the polling overhead entirely.

Sticky sessions in nginx would have solved the same problem, but they'd have meant giving up the dynamic upstream resolution described in §6 — a much larger trade for the same result.

**Verified, not assumed.** The fix was proven by simulating the production topology: two Socket.IO servers (two "replicas"), a client connected to server A, and the emit issued from server B — exactly what happens when BullMQ hands the notification job to the wrong replica.

```
=== Redis adapter DISABLED (previous prod behaviour) ===
   [replica :4101] socket connected, joined user:42
   [replica :4102] emitting to user:42 (this replica holds no sockets)
   Client received notification: NO
   RESULT: FAIL — notification silently dropped

=== Redis adapter ENABLED (the fix) ===
   [replica :4101] socket connected, joined user:42
   [replica :4102] emitting to user:42 (this replica holds no sockets)
   Client received notification: YES
   RESULT: PASS — cross-replica emit delivered
```

The failing run matters as much as the passing one: it confirms the bug was real and reproducible rather than theoretical.

> **Say this — it's one of the best answers you have:** "I run the API at two replicas, and WebSockets are the one thing that isn't stateless — the socket lives in one replica's memory. That gave me two bugs: with default Socket.IO transports the polling handshake spans several requests and breaks without sticky sessions, and an emit from the replica that consumed the notification job never reached a socket held by the other one — silently, because the row still landed in Postgres. I fixed it with a Redis pub/sub backplane so any node can reach any socket, plus forcing the WebSocket transport so the handshake is a single request. I reproduced it with two local Socket.IO servers first, so I could prove the failure before and the delivery after."

### What you built (and got right)

`apps/api/src/v1/modules/user-notifications/user-notifications.gateway.ts`:

- **WebSocket gateway** on a dedicated **namespace**.
- **Handshake authentication** — `server.use(...)` is Socket.IO **middleware** that verifies the JWT *before* the connection is established, and rejects otherwise. (Authenticating at handshake rather than per-message is the correct design; be ready to say why: you get one auth check instead of one per frame, and unauthenticated sockets never consume a connection slot.)
- **Rooms** — `client.join(userNotificationRoom(user.id))` puts each socket in a per-user **topic**. Emitting to a room is **fan-out to subscribers of a topic**, which *is* the **publish–subscribe** model.
- **Server push** — the server initiates; the client doesn't poll. Compare/contrast vocabulary: **polling** vs **long-polling** vs **SSE (Server-Sent Events, unidirectional)** vs **WebSockets (bidirectional)**.

> **Say this:** "Notifications are pushed over an authenticated WebSocket namespace. Each socket joins a per-user room, so publishing a notification is a fan-out to that topic rather than a broadcast the client has to filter."

The design of the gateway itself is sound — the bug was in how it met the replica topology, not in the gateway. No change to `user-notifications.gateway.ts` was needed; the fix lives entirely in the adapter registration and the client transport option.

---

## 6. nginx — what a reverse proxy actually does

### The one-sentence definition

A **forward proxy** sits in front of *clients* and makes requests on their behalf (a corporate web filter, a VPN). A **reverse proxy** sits in front of *servers* and receives requests on their behalf. The client thinks it's talking to the application; it's actually talking to nginx, which decides what to do with the request and who should handle it.

Everything below is a job your `pro.nginx/` config actually performs. Each has a name, and each is a thing an interviewer may ask about.

### Job 1 — TLS termination

Your traffic is encrypted twice, in two separate hops:

```
Browser ──TLS #1──▶ Cloudflare ──TLS #2──▶ nginx ──plain HTTP──▶ web / api
        (Cloudflare's           (Cloudflare Origin
         public cert)            Certificate)
```

nginx holds the private key, decrypts the request, and forwards **plain HTTP** over the internal Docker bridge network. That decryption point is **TLS termination**. The app containers never deal with certificates at all — which is exactly the point: one place to configure TLS, one place to rotate a certificate, and Node never spends CPU on crypto.

Your `snippets/tls.conf` sets the policy:

```nginx
ssl_protocols             TLSv1.2 TLSv1.3;
ssl_ciphers               ECDHE-ECDSA-AES128-GCM-SHA256:...;
ssl_session_tickets       off;
```

- TLS 1.0/1.1 disabled — deprecated and broken.
- **ECDHE** = Elliptic Curve Diffie–Hellman **Ephemeral**. "Ephemeral" means a throwaway key pair per session, which gives **forward secrecy**: stealing the server's private key later does not let an attacker decrypt traffic they recorded earlier.
- Session tickets off because, without regular key rotation, they undermine that forward secrecy.

Cloudflare is in **Full (Strict)** mode, meaning it validates your origin certificate rather than accepting anything. A self-signed cert would be rejected.

### Job 2 — Load balancing and service discovery

```nginx
resolver 127.0.0.11 valid=10s ipv6=off;
set $api_upstream api:8080;
proxy_pass http://$api_upstream;
```

Three separate things are stacked in those lines. Take them apart in order, because this is one of the least obvious pieces of config in the repo.

#### `api` and `web` are not nginx concepts

They are **Docker Compose service names**. When Compose creates the `a11studio-prod` bridge network it registers each service name as a DNS hostname on that network, so from inside any container `api` resolves to the api containers' IPs and `web` to the web containers'.

`8080` and `3000` are the **container-internal ports** — the values in your `expose:` blocks. They are never published to the host; only nginx can reach them. That is precisely the difference between `expose` (reachable on the Docker network) and `ports` (reachable from outside the host).

So `api:8080` is nothing more exotic than `hostname:port`.

#### `set` creates an nginx runtime variable

`set $name value;` comes from nginx's rewrite module and is evaluated **per request**. `$api_upstream` is a name you chose — it carries no special meaning and could be called anything.

Which raises the real question: why introduce a variable at all instead of writing `proxy_pass http://api:8080;`?

#### The answer: the variable changes *when* DNS is resolved

This is a deliberate technique, not a style preference.

| Form | When `api` is resolved | Consequence |
|---|---|---|
| `proxy_pass http://api:8080;` | **Once, at startup.** IP cached for the worker's lifetime. | nginx refuses to start if the name doesn't resolve; never sees new or moved containers. |
| `set $api_upstream api:8080;`<br>`proxy_pass http://$api_upstream;` | **At request time**, via the `resolver`, cached per `valid=`. | Picks up new IPs and new replicas automatically. |

nginx cannot know a variable's value while parsing the config, so the mere *presence* of a variable in `proxy_pass` is what flips it into runtime-resolution mode. **The variable is a marker, not a container for anything useful.**

#### Why this matters here — and the reason is not scaling

Two payoffs, and the first is the one that would break you daily:

1. **Deploys change container IPs.** Every `docker compose up -d` recreates the api and web containers, and they return with **new IPs on the bridge network**. With a literal hostname, nginx would keep serving the stale IPs and return **502 on every request until nginx was reloaded** — a broken deploy, every single time.
2. **Scaling without touching config.** `docker compose up -d --scale api=4` adds containers, Docker DNS starts answering with four records, and nginx picks them up within the cache window. No config edit, no reload.

#### The `resolver` line, field by field

```nginx
resolver 127.0.0.11 valid=10s ipv6=off;
```

- **`127.0.0.11`** — Docker's embedded DNS server. Docker injects this address into `/etc/resolv.conf` of every container on a user-defined bridge network. It is what knows that `api` means those particular containers.
- **`valid=10s`** — cache each answer for 10 seconds, overriding the record's own TTL. So resolution is **not literally per request**: it happens at most every 10 seconds, and requests in between reuse the cached addresses.
- **`ipv6=off`** — don't request AAAA records. Without it nginx queries A *and* AAAA; on a v4-only Docker network every AAAA lookup fails and adds latency to each resolution.

**The `resolver` and the variable are a pair.** Omit the `resolver` and the variable form fails outright with `no resolver defined to resolve api`.

How the spreading actually happens: Docker DNS returns the records of a multi-container service in rotating order, and nginx re-resolves on that 10-second cycle. Between them you get distribution across replicas — **DNS-based load balancing**, with **service discovery** supplied by Docker. Note the implication: nginx is balancing across addresses it was handed, with no knowledge of what's behind them. That is the root of the health-check gap in §5.

#### Two footguns worth knowing

**A trailing slash changes the semantics.** `proxy_pass http://$var;` forwards the original URI untouched. `proxy_pass http://$var/;` means "replace the matched location prefix with `/`". With variables this catches people constantly. Yours has no trailing slash, which is correct for a bare `location /`.

**The "clean" alternative is a commercial feature.** The obvious tidier solution looks like this:

```nginx
upstream api_backend {
    server api:8080 resolve;   # ← the `resolve` parameter is nginx Plus only
}
```

The `resolve` parameter requires **nginx Plus**. Open-source nginx cannot re-resolve hostnames inside an `upstream {}` block, which is exactly why the `set` + variable idiom exists in the community. You are not working around a limitation you invented — this is *the* standard OSS workaround, and it is also why you forfeit `max_fails`, `fail_timeout` and `ip_hash` along with it (§5).

#### A different kind of variable, for contrast

Also in your config:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

`map` also declares a variable, but a **derived** one — "compute `$connection_upgrade` from the value of `$http_upgrade`" — evaluated lazily, only if something reads it. `set` assigns unconditionally; `map` is a lookup table.

And `$http_upgrade` is a **built-in**: nginx exposes any request header as `$http_<lowercased_name_with_underscores>`. Same family as `$host`, `$remote_addr`, `$scheme`, `$request_uri`, `$binary_remote_addr`.

> **Say this:** "The upstream goes through a variable on purpose. A literal hostname in `proxy_pass` is resolved once at startup and cached forever, so every deploy — which gives containers new IPs — would 502 until nginx was reloaded. Routing through a variable defers resolution to request time via Docker's DNS, so new and rescaled containers are picked up automatically. The clean `upstream … resolve` form is nginx Plus only, and the cost of the OSS workaround is losing upstream health checks and sticky sessions."

### Job 3 — Host-based routing (virtual hosts)

One IP address, one nginx, three hostnames, different destinations:

```nginx
server { server_name a11studio.com;      … proxy_pass → web:3000  }
server { server_name api.a11studio.com;  … proxy_pass → api:8080  }
server { server_name www.a11studio.com;  … return 301 → apex      }
```

nginx reads the HTTP `Host` header and matches it against `server_name`. Each block is a **virtual host** (**vhost**); the technique is **host-based routing**. Your comments record *why* www is a 301 rather than a second copy of the site: two hostnames serving identical content splits crawl budget and cookies and leaves Google guessing the canonical.

### Job 4 — Rate limiting

```nginx
limit_req_zone  $binary_remote_addr zone=general:10m rate=30r/s;
limit_req_zone  $binary_remote_addr zone=auth:10m    rate=10r/m;
limit_conn_zone $binary_remote_addr zone=conn_per_ip:10m;
```

The algorithm is a **leaky bucket**. Requests drain at a fixed rate; `burst=60` allows a short queue above that rate; `nodelay` serves the burst immediately instead of pacing it; anything beyond gets **HTTP 429**.

- `$binary_remote_addr` is the client IP in packed form (4 bytes for IPv4), so a 10 MB **shared memory zone** tracks roughly 2.5 million distinct IPs. "Shared" means shared across nginx worker processes — the counters have to be global or each worker would enforce its own limit.
- `limit_req` caps request *rate*; `limit_conn` caps *simultaneous connections* (50/IP). Different attacks: request floods vs connection exhaustion (Slowloris).
- Auth endpoints get their own far tighter zone (10 requests per **minute**) because that's where credential stuffing, password-reset spraying and 2FA brute force land.

Your comment states the right principle: nginx rate limiting is a **first layer**, not a replacement for the NestJS `ThrottlerGuard`. That's **defense in depth** — the proxy limit is cheap and stops floods before they reach Node; the app limit understands users and routes.

### Job 5 — Real client IP resolution

This is the subtlest thing in the config and the source of a real bug you already fixed.

By the time a request reaches nginx it has passed through Cloudflare, so the TCP peer *is* Cloudflare. Without correction, every log line and every rate-limit bucket would be keyed to Cloudflare's edge IP — all visitors collapsing into one bucket.

`snippets/cloudflare.conf` fixes this with nginx's `realip` module:

```nginx
real_ip_header CF-Connecting-IP;
```

Note **which** header. `X-Forwarded-For` is **client-supplied** — anyone can forge it before reaching the edge. `CF-Connecting-IP` is written by Cloudflare and cannot be spoofed by the client. Trusting the wrong one poisons every IP-based control you have.

Your `proxy.conf` carries the same reasoning further:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;   # not $proxy_add_x_forwarded_for
```

The usual idiom **appends** to whatever the client sent. You **overwrite** instead, with the comment explaining why: appending preserves attacker-controlled entries, and since there's exactly one trusted hop in front, a single honest value is the correct representation. This is the **trusted proxy problem**, and getting it wrong is how IP allowlists and audit logs get forged.

### Job 6 — Origin lockdown

Your droplet has a public IP, so an attacker can skip Cloudflare and hit it directly — bypassing the WAF and DDoS protection entirely. Two defenses:

```nginx
if ($is_cloudflare = 0) { return 444; }
```

`geo` builds an allowlist of Cloudflare's published ranges; anything else gets **444**, an nginx-specific code meaning *close the TCP connection with no response at all*. A scanner learns nothing — not even that something is listening.

```nginx
server {
    listen 443 ssl default_server;
    server_name _;
    ssl_reject_handshake on;
}
```

The **`default_server`** catch-all handles requests with an unknown or missing **SNI** (Server Name Indication — the hostname sent during the TLS handshake). Without it, a connection straight to the droplet IP would fall through to the *first* 443 block and be served the production app. `ssl_reject_handshake` drops the handshake before a certificate is even offered.

### Job 7 — Security response headers

`snippets/security-headers.conf`, applied at `server` level with `always` so they cover 4xx/5xx responses too:

| Header | What it prevents |
|---|---|
| `Strict-Transport-Security` | **HSTS** — browser refuses plain HTTP to this host; `preload` extends that to the very first visit |
| `X-Content-Type-Options: nosniff` | **MIME sniffing** — stops a user-uploaded file from being reinterpreted as HTML and executed |
| `X-Frame-Options: SAMEORIGIN` | **Clickjacking** via cross-origin iframes |
| `Referrer-Policy` | Leaking full URLs (with tokens or search terms) to third parties |
| `Permissions-Policy` | Reduces attack surface — camera/mic/geolocation denied outright |
| `Cross-Origin-Opener-Policy` | Cross-origin windows holding a JS reference to your page (**Spectre-class** side channels) |

One nginx gotcha worth knowing because it bites people: **`add_header` does not merge across levels.** If any `location` block declares its own `add_header`, it silently discards *every* header inherited from the `server` block. That's why all of these live in one snippet at server level and no location adds headers of its own.

### Job 8 — Protocol handling for WebSockets

```nginx
map $http_upgrade $connection_upgrade { default upgrade; '' close; }

proxy_http_version 1.1;
proxy_set_header Upgrade    $http_upgrade;
proxy_set_header Connection $connection_upgrade;
```

A WebSocket begins life as an HTTP request carrying `Upgrade: websocket`. A proxy that doesn't explicitly forward the `Upgrade` and `Connection` headers — and that doesn't use HTTP/1.1 — silently breaks the upgrade and the connection falls back to polling forever. The `map` exists so the `Connection` header is `upgrade` for upgrade requests and `close` for everything else. **You configured this correctly**, which is worth knowing: the §5 bug is a replica-topology problem, not a proxy misconfiguration.

### Job 9 — Buffering and streaming

```nginx
proxy_buffering off;
```

By default nginx buffers the entire upstream response before sending it on. That's usually good — it frees the backend worker sooner. But Next.js **streams** RSC payloads progressively, and buffering would hold the whole page until complete, destroying **time to first byte** and streaming SSR. Turning it off is a deliberate trade: slightly longer-held upstream connections in exchange for progressive rendering.

### Why have nginx at all when Cloudflare is already in front?

A fair interview question, and you have a real answer:

- Cloudflare can be **bypassed** — the origin IP is reachable. nginx is what enforces that it wasn't (Job 6).
- Cloudflare doesn't know your internal topology: two `api` replicas, two `web` replicas, Docker DNS names. **Load balancing and service discovery are origin-side concerns** (Job 2).
- Rate limiting at the origin still applies to anything that reaches it, and is free.
- Host routing, TLS policy and security headers stay in **version-controlled config you own** rather than a vendor dashboard — and they're identical in dev and prod because both read from the same tracked `dev.nginx/` / `pro.nginx/` sources.

> **Say this:** "Cloudflare is the edge — CDN, WAF, DDoS. nginx is the origin's front door: it terminates TLS, load-balances across replicas via Docker DNS, does host-based routing, enforces rate limits keyed on the real visitor IP from `CF-Connecting-IP`, adds the security headers, and refuses any connection that didn't come through Cloudflare. They do different jobs, and the origin one can't be delegated because the origin IP is reachable regardless."

---

## 7. LLM engineering vocabulary

Now the honest part, because this is where CVs get people in trouble.

### What you built is *not* agentic. Here's what it actually is.

An **agent** is an LLM in a loop with tools, deciding its own next action until a goal is met. Your `AiService` makes **single-shot, structured completion calls** with no tool use and no loop. That is **not** an agent, and calling it one will end badly.

But what you *did* build has real, senior-sounding names — and several of them are practices most people who say "I've done LLM work" have never implemented:

| What's in your code | The name for it |
|---|---|
| Abstract `LLMService` + `openAi-llm.service.ts` | **Provider abstraction / model-agnostic interface** |
| One call returns EN/ES/PT together | **Multi-output structured generation** (a batching strategy that cuts cost ~3×) |
| Passing `EXPECTED_JSON` as the shape to fill | **Structured output** via **schema-in-prompt** |
| Stripping ```` ```json ```` fences before parsing | **Output fencing / defensive parsing** |
| `matchesExpectedResponse` check | **Schema conformance validation** |
| `Math.min(10, Math.max(0, round(severity)))` | **Output clamping / range coercion** |
| Deriving `is_allowed` from severity, ignoring the model's own boolean | **Not trusting model self-assessment** — you use the graded signal and apply your own threshold. This is a genuinely sophisticated move. |
| `temperature: 0.1` for moderation | **Low-temperature decoding for classification** (determinism over creativity) |
| The 0–10 severity rubric in the prompt | **Calibrated rubric grading**, i.e. **LLM-as-judge** / **LLM-as-classifier** |
| "If unsure, it is NOT present — return the lower severity" | **Anti-false-positive instruction**; you are deliberately tuning the **precision/recall trade-off** |
| Defaulting to allowed when parsing fails | **Fail-open policy** (a deliberate choice — know that the alternative is **fail-closed**, which is what you chose for SEO indexability) |
| Sending an image URL as a content part | **Multimodal / vision input** |
| Stable system-prompt prefix | **Prompt caching optimization** — providers cache a shared prefix, so a stable prefix cuts input cost |
| Feeding profession, city, categories into the prompt | **Grounding** / **context injection** (this is the same idea RAG serves, without a vector store — call it *grounding from structured application data*, not RAG) |
| `sanitizeSeoText` rejecting junk/stuffing/profanity | **Output guardrails / post-generation validation** with a **safe fallback** |
| `llm_tokens_usage` table + per-user credits | **Token accounting / cost observability / usage metering and quota enforcement** |
| Media moderation feeding a 3-strike ban | **Human-free content-safety pipeline with graduated enforcement** |

> **Say this:** "It's not agentic — they're single-shot structured generation calls behind a provider-agnostic interface. What I focused on is everything around the call: schema validation on the way out, clamping, guardrails that fall back to a safe value rather than persisting junk, and per-call token metering against user quotas. The moderation path is an LLM-as-judge with a calibrated severity rubric, and I derive the allow/block decision from the score rather than trusting the model's own boolean, because those two disagree more often than you'd expect."

That paragraph is worth more in an interview than the word "agentic" ever would be.

---

## 8. The agent harness you built without knowing the name

**This is the section you'll be most surprised by.** You said you suspected you'd already implemented "harness, skills, MCP" — you're right, and more thoroughly than most people who list those words.

### 8.1 Agent Skills — `.agents/skills/`

You have **19 skill directories**, each with a `SKILL.md` carrying YAML frontmatter:

```yaml
---
name: api-repository
description: >-
  Add TH Studio NestJS repository DB access for an entity. Use when creating a
  repository, adding query methods, formatters, or pagination in
  apps/api/src/v1/modules, without requiring a controller or service.
---
```

Every element here has a name:

- **Agent Skill** — a packaged, model-invoked capability: instructions plus optional resources, loaded on demand.
- The `description` field is a **routing trigger** — it tells the model *when* to load this skill. Yours are written in the correct style ("Use when…", plus explicit negative conditions like "without requiring a controller or service"). Negative triggers are an advanced touch; they prevent over-firing.
- **Progressive disclosure** — the skill body stays short and links to `references/` files (e.g. `accessibility/references/A11Y-PATTERNS.md`) that are only read when needed. This is deliberate **context-window management**: you keep tokens for the task instead of spending them on documentation the model may not need.
- **Skill composition** — `full-api-module` chains other skills; `api-repository` instructs the agent to load `collision-prevention` *first*. That's a **dependency graph between skills**, and a **precondition**.
- **Codified conventions** — the skills encode your architectural invariants ("all queries, formatters and pagination live here", "never put SQL in the service"). The name for this is **executable architectural governance**: your layering rules aren't in a wiki nobody reads, they're in the tool that writes the code.

> **Say this:** "I wrote a set of Agent Skills for the repo — nineteen of them — that encode the project's conventions as model-invoked recipes. Each has a trigger description and uses progressive disclosure so only the relevant instructions enter the context window. They compose: the repository skill requires the collision-prevention skill before writing a join."

### 8.2 MCP — `opencode.json`

```json
"mcp": {
  "postgres": {
    "type": "local",
    "command": ["npx","-y","@modelcontextprotocol/server-postgres", "postgres://…"]
  }
}
```

**MCP = Model Context Protocol** — an open standard for connecting a model to external tools and data sources, so any MCP-speaking client can use any MCP server without bespoke glue.

You are running a **local (stdio-transport) MCP server** that exposes your Postgres database to the agent. And you *use* it meaningfully: `.agents/skills/api-testing/SKILL.md` instructs the agent to hit `localhost:8080` with curl and then **verify the resulting database side effects through the Postgres MCP server**. That is a closed **act → observe → verify** loop against real infrastructure, which is exactly what MCP is for.

> **Say this:** "I run a Postgres MCP server locally so the agent can verify database side effects directly. My API-testing skill uses it to close the loop — call the endpoint, then assert the row actually changed — instead of trusting the HTTP response."

### 8.3 Multi-agent orchestration — `.opencode/agents/`

Eight agent definitions: `orchestrator`, `planner`, `explorer`, `builder-be`, `builder-fe`, `reviewer`, `debugger`, `tester`.

Read `orchestrator.md` again with the vocabulary attached:

| What you wrote | The name |
|---|---|
| `mode: primary` delegating to `mode: subagent` | **Orchestrator–worker pattern** (a.k.a. **supervisor**, **coordinator**) |
| One agent per phase, each with a narrow job | **Role specialization** |
| `tools: {write: false, edit: false, bash: false}` on orchestrator/planner/reviewer | **Least-privilege tool grants** — a reviewer that *cannot* edit gives you a trustworthy review |
| "Send only what each agent needs — no full conversation history" | **Context isolation** / **context engineering** — the core reason multi-agent systems work at all |
| Phases 3a and 3b run in parallel | **Parallel fan-out**, then **fan-in** at review |
| FAIL → debugger → re-review; FAIL → debug → re-test | **Feedback loop** with **bounded retry** |
| "API contract both builders share" | A **shared contract / interface-first coordination artifact** — the thing that lets two agents work in parallel without colliding |
| explorer runs first to extract conventions | **Grounding phase** — reduces hallucinated conventions by reading real code first |
| debugger priority `CONTRACT → SECURITY → STRUCT → BUG → STYLE` | **Triage policy / severity ordering** |

The whole thing — the skills, the agent definitions, the MCP servers, the permission config in `.claude/settings.local.json`, the `.cursorrules` — is collectively the **agent harness**: the scaffolding around the model that determines what it can see, what it can do, and when.

> **Say this:** "I built an agent harness for the repo: an orchestrator that delegates to seven specialist subagents, with least-privilege tool grants per role — the reviewer literally can't write files — and deliberate context isolation so each agent gets only its slice. The two builders run in parallel against a shared API contract produced in the planning phase, and there's a debug-and-retry loop before anything is accepted."

**Why this matters for your job search:** in 2026 a lot of candidates say "I use Cursor." Very few have designed a multi-agent pipeline with role separation, tool-permission boundaries and context budgeting. That is *AI engineering*, and it is a real differentiator — arguably more so than the LLM features in the product itself.

---

## 9. Cross-cutting concerns

"**Cross-cutting concern**" is the term for something every request needs but no single module owns. You handle these with **Aspect-Oriented Programming**-style interception, which in NestJS means guards, interceptors, filters and middleware.

| Concern | Where | Name |
|---|---|---|
| Per-request context (id, user, IP, locale) | `common/services/request.service.ts` | **`AsyncLocalStorage`** — **continuation-local storage**, the Node equivalent of thread-local. Solves *"how do I get the current user deep in a call stack without passing it through ten function signatures?"* |
| Uniform response envelope | `response.interceptor.ts` | **Response shaping / DTO mapping** |
| Uniform error shape | `response-exception.filter.ts` | **Global exception filter** / **error normalization** |
| Auth, admin, strikes, throttle | `common/guards/` | **Authorization guards** in a **chain of responsibility** |
| Buffered logs flushed after response | `flush-logs.interceptor.ts` + `LOG_QUEue` | **Deferred/async logging** — keeps I/O off the response path |
| Secret redaction before write | `backend-lib/.../redact.ts` | **Log sanitization** / **PII scrubbing**, with depth and breadth caps to bound cost |
| Correlating logs for one request | `requestId` in the ALS store | **Correlation ID** / **request tracing** |
| Daily log pruning | `prune-daily-log-files.ts` + cron | **Log rotation / retention policy** |

**One high-value story lives here.** Your `AppThrottlerGuard` resolves the *real* end-user IP through `RequestService` rather than the socket peer, because SSR traffic arrives from the Next.js server and every visitor was collapsing into a single rate-limit bucket, producing site-wide 429s. The vocabulary: **the trusted-proxy problem**, **`X-Forwarded-For` / `CF-Connecting-IP` resolution**, **`trust proxy`**, and **per-identity rate-limit keying**. Interviewers love this class of bug because it only appears in real deployments.

---

## 10. Vocabulary cheat sheet

Compressed, for reading before an interview.

**Architecture:** monorepo · modular monolith · layered / N-tier · separation of concerns · dependency rule · hexagonal architecture · ports and adapters · shared kernel · BFF · composition root · IoC container · constructor injection · anti-corruption layer

**Patterns:** repository · service layer · template method · factory method · strategy · builder · fluent interface · facade · singleton · adapter · observer · dispatch table · chain of responsibility · exception translation

**Async:** event-driven architecture · domain events · in-process event bus · message broker · work queue · producer/consumer · competing consumers · at-least-once delivery · idempotent consumer · exponential backoff · dead-letter · debouncing · job deduplication · deferred write · choreography vs orchestration · state machine

**Real-time:** WebSocket gateway · namespace · room/topic · fan-out · publish–subscribe · handshake authentication · server push · SSE vs WebSocket · pub/sub backplane · sticky sessions

**Infra:** edge · CDN · WAF · reverse proxy · forward vs reverse proxy · TLS termination · forward secrecy · horizontal vs vertical scaling · replica · stateless process · round-robin load balancing · service discovery · session affinity / sticky sessions · passive health check (`max_fails`) · liveness vs readiness · readiness gate · failover · resource limits · leaky bucket rate limiting · trusted proxy problem · expand–contract migration · immutable image tags · rollback by SHA · rolling update · least privilege · secret mount

**LLM:** provider abstraction · structured output · schema conformance · defensive parsing · output guardrails · safe fallback · grounding / context injection · prompt caching · low-temperature decoding · LLM-as-judge · calibrated rubric · precision/recall trade-off · fail-open vs fail-closed · token accounting · quota enforcement · multimodal input

**Agents:** agent harness · Agent Skills · trigger description · progressive disclosure · context window management · context isolation · skill composition · MCP (Model Context Protocol) · stdio transport · MCP server · orchestrator–worker · subagent · role specialization · least-privilege tool grants · parallel fan-out / fan-in · shared contract · bounded retry

---

## 11. Honest gaps — what you must NOT claim

Read this twice. Confidence comes from knowing your boundary, not from ignoring it.

**Do not claim — not in this codebase:**

- **Microservices.** You have a modular monolith plus a worker. Say so, and say why it was the right call.
- **CQRS or Event Sourcing.** No separate read/write models, no event log as the source of truth.
- **Kubernetes, Terraform, service mesh, Istio.** Docker Compose on a droplet.
- **Agentic AI in the product.** Single-shot completions, no tool-use loop, no planning. (The *agents* are in your dev harness — a different, still-impressive claim. Keep them separate.)
- **RAG or vector databases.** You ground prompts with structured application data. That's grounding, not retrieval-augmented generation.
- **Fine-tuning, evals, model training.** None present.
- **Kafka, RabbitMQ, NATS.** Redis-backed BullMQ.
- **gRPC, GraphQL.** REST plus WebSockets.
- **Distributed tracing / OpenTelemetry / APM.** You have structured file logs with correlation IDs — that's *logging*, and honestly it's good logging, but it isn't tracing.
- **Blue-green, canary, or rolling deploys.** Plain Compose recreates containers together; staggered replacement is a Swarm/Kubernetes feature. Say "deploy with a brief restart window."
- **Zero-downtime deployments.** Follows from the above — the replicas don't buy you this without rolling updates.
- **Auto-scaling or failover.** The replica count is fixed in config, and nothing promotes, demotes, or routes around a sick instance. It's static horizontal scaling with round-robin, which is still worth saying — just say *that*.
- **`better-auth`.** It's in `apps/web/package.json` with zero imports. Auth is your own JWT/session implementation — which is the stronger claim anyway.

**Genuinely weak spots, if you want to close them:**

1. ~~**The Socket.IO backplane** (§5).~~ ✅ **Fixed** — Redis adapter in `apps/api/src/common/adapters/redis-io.adapter.ts`, WebSocket-only transport on the client, verified against a two-replica simulation. This is now a story to tell rather than a gap to hide.
2. **No distributed tracing.** Adding OpenTelemetry would let you honestly say "tracing", and you already have correlation IDs, so it's mostly wiring.
3. **No resource limits on any container** (§5). No `mem_limit`, no CPU reservation, in a stack running 2× api + 2× web + postgres + redis + nginx + worker. One unbounded Node process can OOM the host and take the database with it. This is the cheapest fix on the list.
4. **nginx has no passive health checking** (§5). Docker healthchecks drive restarts, not routing, and the variable-based `proxy_pass` gives up `max_fails`/`fail_timeout`. A running-but-broken replica keeps receiving traffic. Know the trade-off you made; decide whether you still want it.
5. **The replica count is unvalidated.** Two replicas were never measured against one on this hardware. Reasons 2 and 3 in §5 justify it; reasons 1 and 4 don't apply here. Run the experiment so it's a decision rather than a default.
6. **Test coverage is lopsided.** ~9,100 of your test lines cover the query builder; the API layer is comparatively thin. If asked about testing strategy, say that plainly — "I tested the thing everything else depends on first" is a defensible answer, and knowing your own coverage shape is the point.
7. **`README.md` still has an unresolved merge conflict** on top of Turborepo boilerplate. Anyone you send to the repo sees that first.

---

## Closing note

The gap you described isn't a knowledge gap — it's a labeling gap. You built ports and adapters, a composition root, an idempotent consumer over an at-least-once queue, an LLM-as-judge with a calibrated rubric, and a multi-agent harness with least-privilege tool grants. You built all of it for the right reasons. You just called them "the services folder", "the worker", and "the agent files".

Interviews reward the label plus the reason. You already have the reason — that's the hard half, and it's the half that can't be crammed. Learn the labels from this document, and when you're asked why, answer from the code, because you were there when the decision was made.
