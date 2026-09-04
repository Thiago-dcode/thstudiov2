# Architecture

> The shape of the system, and the names for that shape.
> Related: [`design-patterns.md`](./design-patterns.md) · [`async-and-messaging.md`](./async-and-messaging.md) · [`scaling-and-replicas.md`](./scaling-and-replicas.md)

---

## 1. Naming what you have

🟢 **In this repo.** A11STUDIO is a **modular monolith deployed as a small distributed system, organised as a monorepo.**

Three separate claims. Each has to be defended on its own.

### Monorepo

One Git repository containing multiple independently-buildable packages, coordinated by a build orchestrator with a dependency graph.

```
apps/          api · web · worker              ← deployable processes
packages/      backend-lib · common-lib · database · frontend-lib
               ui · eslint-config · jest-config · typescript-config
```

Turborepo reads the dependency graph from each `package.json` and runs tasks in topological order, caching outputs. Change `packages/common-lib` and everything downstream rebuilds; change `apps/web` and nothing else does.

🔵 **The general trade-off:**

| | Monorepo | Polyrepo |
|---|---|---|
| Atomic cross-package change | ✅ one commit, one PR | ❌ coordinated releases |
| Shared types can't drift | ✅ compile error | ❌ runtime surprise |
| Tooling cost | Higher — needs an orchestrator | Lower per repo |
| CI granularity | Needs affected-detection | Natural |
| Access control | All-or-nothing | Per repo |

**A monorepo is not a monolith.** This confusion is common enough that stating the distinction unprompted reads well: a monorepo is a *source layout*; a monolith is a *deployment unit*. Google runs a monorepo with thousands of services. You could run a monolith across five repos.

### Modular monolith

`apps/api` is **one** deployable process containing 42 domain modules, each owning its controller, service, repository and DTOs. Modules share a process, a database and a deploy unit.

🔵 **Why this is the right call at your scale**, and this is the part interviewers actually want:

Microservices buy you independent deployability, independent scaling, and team autonomy — and they cost you distributed transactions, network failure modes, service discovery, distributed tracing, versioned inter-service contracts, and an operational burden that assumes a platform team.

At one engineer and one database, you'd pay every cost and collect none of the benefits. Team autonomy is meaningless with one team. Independent scaling is meaningless when the bottleneck is a single 1 vCPU droplet.

> **Say this:** "It's a modular monolith in a monorepo, with async work split into a separate worker process. I deliberately didn't go microservices — at one engineer and one database, the operational cost would buy me nothing. The module boundaries are enforced in code, so if it ever needs to split, the seams are already there."

That last clause matters. A modular monolith is the *correct precursor* to microservices — you extract a service when a boundary proves itself, not before. The failure mode people know about is going distributed too early.

### Small distributed system

Three processes (`api`, `web`, `worker`) plus Postgres, Redis and nginx, talking over HTTP, Redis-backed queues and WebSockets. API and web each run two replicas.

So the system *is* distributed, even though the API is a monolith. That's not a contradiction — it's why the precise phrase is "modular monolith deployed as a small distributed system." Being able to hold both ideas at once is the signal.

---

## 2. The tiers

```
Browser
   │ HTTPS
Cloudflare ─────────── edge: CDN, WAF, DDoS absorption, TLS #1
   │
nginx ──────────────── reverse proxy: TLS #2 termination, rate limiting,
   │                    security headers, host-based routing
   ├──▶ web × 2 ────── Next.js SSR / RSC  (BFF for the browser)
   └──▶ api × 2 ────── NestJS REST + Socket.IO gateway
            │
            ├──▶ postgres  (system of record)
            └──▶ redis     (cache + queue broker + ws backplane)
                    │
                 worker ─── BullMQ consumer: media, AI, mail
```

| Piece | The technical name |
|---|---|
| Cloudflare in front | **Edge layer** / **CDN** / **WAF** |
| nginx | **Reverse proxy** — TLS termination, L7 load balancing, rate limiting |
| Two api/web containers | **Horizontal scaling**, round-robin via Docker DNS |
| Next.js server calling your API | **BFF — Backend for Frontend** |
| `worker` process | **Asynchronous worker** / background job consumer |
| Redis under BullMQ | **Message broker** |
| Postgres | **System of record** |
| expand–contract migrations | **Backward-compatible schema evolution** |

### The BFF pattern, since it gets asked

🔵 A **Backend for Frontend** is a server-side layer that exists to serve *one* client type, shaping and aggregating calls to the real backend so the client doesn't have to.

🟢 Your Next.js server is a BFF: it calls the NestJS API server-side, composes the response into rendered HTML/RSC payloads, and holds the session token so it never reaches client JavaScript.

The benefit worth naming: **the browser never talks to the API directly for page loads**, which means the token stays server-side and the client can't be tricked into leaking it. The cost: an extra network hop and a second thing to deploy.

⚠️ This tier is also where a real bug lived — because SSR calls arrive at the API *from the Next.js server*, every visitor initially shared one rate-limit bucket. See [`security.md`](./security.md#the-trusted-proxy-problem).

---

## 3. Layered architecture (N-tier) inside the API

🟢 Every module in `apps/api/src/v1/modules/<entity>/`:

```
Controller   → HTTP only: routing, DTO validation, guards.        (thin)
   ↓
Service      → use-case orchestration, enqueues jobs, emits events. (no SQL)
   ↓
Repository   → all SQL, formatters, pagination.                    (no HTTP)
   ↓
QueryBuilder → dialect-aware SQL generation.
```

The names: **layered architecture** (a.k.a. **N-tier**), enforcing **separation of concerns**, with the **Repository pattern** isolating persistence and the **Service layer pattern** holding use-cases.

The constraint — *no SQL above the repository, no HTTP below the controller* — is the **dependency rule**: dependencies point inward, toward the domain, never outward toward delivery mechanisms.

🟢 You enforce this in your own tooling. `.agents/skills/api-service/SKILL.md` literally says *"never put SQL in the service"*, and `.opencode/agents/reviewer.md` checks module structure on every change. The name for encoding architectural rules into the tool that writes the code is **executable architectural governance** — see [`ai-agent-harness.md`](./ai-agent-harness.md).

> **Say this:** "Each module is layered — thin controller, service for use-case orchestration, repository for all data access. The constraint I enforce is that SQL never leaks above the repository and HTTP concepts never leak below the controller."

### Why the layering pays for itself

The concrete payoff, not the theoretical one: **the worker can reuse repositories without dragging in HTTP.** `apps/worker` imports `MediaRepository` and gets data access with no NestJS request pipeline, no DTOs, no guards. If SQL had leaked into services — which typically depend on request context — that reuse would be impossible and you'd have two copies of every query.

🔵 **When layering is wrong:** for a CRUD endpoint with no logic, controller → service → repository is three files to move a row. Some teams collapse to controller → repository for trivial cases. You didn't, and the defensible reason is uniformity: 42 modules that all look identical are navigable by a newcomer (or an agent) in a way that 42 bespoke shapes are not.

---

## 4. Ports and Adapters (Hexagonal Architecture)

🟢 **The biggest pattern you built without naming it.**

`packages/backend-lib/src/services/` — every service has the same shape:

```
storage-service/   storage.service.ts  (abstract)  → s3-storage.service.ts
llm-service/       llm.service.ts      (abstract)  → openAi-llm.service.ts
mail-service/      mail.service.ts     (abstract)  → nodemailer-… / resend-…
compress-service/  compress.service.ts (abstract)  → sharp-compress.service.ts
log-service/       …                               → file / console drivers
view-service/      …                               → ejs / pug drivers
payment-service/   …                               → stripe / paypal drivers
request-service/   …                               → rest-request.service.ts
```

The abstract class is a **port** — the interface your application depends on. Each concrete class is an **adapter** — the thing that knows about the outside world (S3, OpenAI, Sharp, Resend, Stripe).

That is **Hexagonal Architecture**, also called **Ports and Adapters**. The underlying principle is the **Dependency Inversion Principle** (the D in SOLID): *high-level modules should not depend on low-level modules; both should depend on abstractions.*

### The payoff an interviewer will probe for

**You can swap OpenAI for Anthropic, or S3 for R2, by writing one adapter and changing one factory line. Nothing in `apps/api` or `apps/worker` changes.**

That's not theoretical — it's why `apps/worker/src/processors/media.processor.ts` constructs its entire dependency set in eight lines, and why every one of those dependencies is mockable in a test without touching the network.

🔵 **The vocabulary around it:**

- **Driving (primary) adapters** — things that call *into* your app: HTTP controllers, queue consumers, CLI commands.
- **Driven (secondary) adapters** — things your app calls *out* to: S3, OpenAI, Postgres, SMTP.
- **The hexagon** — your domain in the middle, ignorant of both sides.

The shape is also called **Onion Architecture** or **Clean Architecture**. They differ in detail and emphasis; the shared idea is *the domain must not depend on infrastructure.*

> **Say this:** "External systems sit behind ports — abstract service classes in a shared package — with one adapter per provider. Application code never imports the OpenAI or AWS SDK directly, so providers are swappable and everything is mockable in tests."

⚠️ **Don't over-claim.** Ports and adapters at the *infrastructure* boundary is what you have. Full Clean Architecture also demands the domain model be free of framework types — and your services take NestJS decorators and your repositories return DB row shapes. Say "hexagonal at the infrastructure boundary", which is true and still strong.

---

## 5. Shared kernel

🟢 `packages/common-lib` holds types, schemas, constants and pure utilities used by **all three** apps.

🔵 In Domain-Driven Design, a shared, jointly-owned model between bounded contexts is a **shared kernel**.

The consequence that matters: your API and worker cannot disagree about the shape of a job payload, because both import the same type from the same file. **Types are the contract between processes** — and a contract change is a compile error rather than a 3am runtime surprise.

This is the single biggest practical argument for the monorepo. In a polyrepo you'd version and publish this package, and the two sides would drift between releases.

🔵 **The DDD caution:** a shared kernel is the *tightest* possible coupling between contexts, and DDD literature treats it as a last resort for exactly that reason — everyone who depends on it is affected by every change. With one team it's free. With five teams it becomes the thing everybody fights over. Know that, because "why not duplicate the types?" is a real question with a real answer.

> **Say this:** "Job payloads and DB row shapes are typed once in a shared package all three apps import, so the producer and consumer of a queue message can't drift apart. It's a shared kernel — tight coupling by design, which is cheap at one team and would need revisiting at five."

---

## 6. Composition root and Inversion of Control

🟢 `apps/worker/src/processors/media.processor.ts`:

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

The single place where the object graph is wired is the **composition root**. Everything below it receives collaborators via **constructor injection** and never news-up its own dependencies.

🔵 **The vocabulary chain**, which is worth getting exactly right because these are used loosely:

- **Inversion of Control (IoC)** — the general principle: the framework calls you, you don't call the framework. A superset.
- **Dependency Injection (DI)** — one specific form of IoC: dependencies are handed in rather than constructed internally.
- **IoC container** — a thing that resolves and constructs the graph for you. Nest's DI system is one.
- **Composition root** — the one place in an application where the graph is assembled. Should be at the entry point and nowhere else.

🟢 `apps/api` gets this from Nest's container by decorator. `apps/worker` does it manually. **Being able to explain that these are the same idea with different ergonomics is a good answer** — the worker version shows you understand what the container is doing rather than treating `@Injectable()` as magic.

> **Say this:** "The worker's composition root wires the whole object graph explicitly in one place; the API gets the same thing from Nest's IoC container. Same pattern, one automated. Doing it by hand in the worker keeps the worker free of the Nest runtime, which is why it starts in a fraction of the time."

---

## 7. CQRS — the trap

🔴 **You do not implement CQRS.** No separate read and write models, no separate stores, no projections.

🟢 What you *do* have is related and worth naming precisely: **write-behind** / **deferred persistence**. An HTTP request validates, enqueues, returns 202; the durable side effects happen in a consumer.

The correct terms are **command/side-effect separation** or **deferred write path**.

🔵 Misusing "CQRS" is a well-known interview tell — it's one of the most over-claimed terms in the industry. Precision here reads as competence. If asked whether you considered it: CQRS earns its complexity when read and write loads have genuinely different shapes and you need to scale or model them separately. One Postgres instance serving both is not that.

---

## 8. Anti-corruption layer

🟢 `packages/database/src/lib/client/` catches driver-specific errors and rethrows domain ones — `PG_UNIQUE_VIOLATION` → `DbUniqueViolationException`.

🔵 The DDD name for a translation layer that stops a foreign model leaking into yours is an **anti-corruption layer (ACL)**. Here it stops Postgres error codes propagating upward, so a service can catch a meaningful exception without knowing what database is underneath.

Same idea, different scale: each adapter in §4 is an ACL for its provider.

---

## 9. Architecture Decision Records

🔴 You don't keep formal ADRs — but 🟢 your config files carry unusually good inline rationale. From `.github/workflows/ci-cd.yml`:

```yaml
# Deliberately a literal, not `secrets.SSH_PORT`. A port number is not a secret,
# and storing one has two costs: GitHub masks every occurrence of the value in
# every log line … and a typo'd value surfaces only as `parse "***" as int`
```

🔵 An **ADR** records *context, decision, consequences* for a significant choice, so the next person (or you, in a year) doesn't relitigate it. Yours are ADRs scattered as comments.

If asked how you document decisions, that's an honest and good answer — with the caveat you should volunteer: comments live next to the code they justify, which is great for discoverability and bad for anything spanning several files. The replica-count decision in [`scaling-and-replicas.md`](./scaling-and-replicas.md) is exactly the kind that has no natural home.

---

## Interview drills

**"Walk me through your architecture."**
Start at the browser, go down the tier diagram, name each hop and say what it does. Finish with the one sentence that shows judgment: *"It's a modular monolith because at one engineer that's the shape that pays for itself; the seams are enforced so it can split if it ever needs to."* Ninety seconds, no more, then stop and let them steer.

**"Why not microservices?"**
Costs bought vs benefits collected. Independent deployability and team autonomy are the benefits; they require multiple teams to mean anything. Distributed transactions, service discovery and tracing are the costs; they apply immediately. Then the kicker: *"and the module boundaries are enforced already, so the migration path exists if the answer changes."*

**"What's the hardest architectural decision you made?"**
The hand-written query builder over an ORM ([`databases.md`](./databases.md)). It's the one with real costs you can articulate honestly — and knowing the costs of your own choice is the actual signal.

**"How do you stop the layers leaking?"**
Convention, plus tooling that enforces it: the skill files encode the rule, the reviewer subagent checks it on every change, and the import boundaries are checked. Be honest that it isn't a compile-time guarantee — there's no lint rule that stops SQL in a service. Naming that limit is stronger than implying an enforcement you don't have.

**"What would you change if the team grew to five?"**
Good answer, and you should have one ready: resource limits per container, then real health-checked routing, then splitting the shared kernel so five teams don't serialise on one package, then ADRs as actual files. Notice none of those are "rewrite as microservices" — that's the point.

---

## Boundary

🔴 Not in this repo, do not claim: **microservices** · **CQRS** · **Event Sourcing** · **service mesh** · **Domain-Driven Design as a practice** (you use some DDD *vocabulary*; there are no aggregates, value objects, or bounded-context maps) · **Clean Architecture in full** (framework types reach the domain).

Full list: [`honest-gaps.md`](./honest-gaps.md).
