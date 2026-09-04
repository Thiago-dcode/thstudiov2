# Design Patterns

> The Gang-of-Four catalogue, restricted to patterns genuinely present in your code.
> Related: [`architecture.md`](./architecture.md) · [`databases.md`](./databases.md)

**How to use this.** Each entry gives the pattern, where it lives in your repo, what problem it solves, and — the part people skip — **when it's the wrong choice**. Interviewers rarely ask "what is Strategy?". They ask "why did you use it here?" and "when would you not?".

---

## 1. Repository

🟢 `packages/database/src/lib/repositories/base.repository.ts`, plus one repository per entity.

**Problem it solves:** the rest of the application shouldn't know whether data lives in Postgres, MySQL, or a file. A repository mediates between the domain and the data mapper, so callers query *an object*, not a table.

**Your version:** `BaseRepository` supplies `exists`, `updateOne`, `applyFilters`, `handleOffsetPagination` and a protected `query` handle. Entity repositories extend it and add their own methods.

🔵 **When it's wrong:** when it becomes a pass-through that only forwards to the ORM, adding a file per entity for no behaviour. The test is whether the repository *hides* anything. Yours does — pagination, soft-delete filtering, and result formatting all live behind it.

⚠️ **Known caveat:** a repository that returns raw row shapes rather than domain objects is technically a **table data gateway**, which is the honest name for what most of yours are. Not a flaw; just don't claim a rich domain model you don't have.

---

## 2. Template Method

🟢 `BaseRepository`, `CompressService`, `Client<T>`, `HttpClient`/`FetchApi`.

**Problem it solves:** several classes share the *skeleton* of an algorithm but differ in one or two steps.

**The clearest example in your code:** `CompressService.getSizeCompressed()` implements the shared byte-budget maths in the abstract base; `SharpCompressService` supplies only the actual encoding step. The base class controls the sequence; the subclass fills a hole.

🔵 **Template Method vs Strategy** — a favourite interview pairing:

| | Template Method | Strategy |
|---|---|---|
| Mechanism | Inheritance | Composition |
| Bound | Compile time | Runtime |
| Varies | A step *inside* an algorithm | The *whole* algorithm |

🟢 You use both, correctly, for different things: Template Method for the compression skeleton, Strategy for swapping the mail driver.

🔵 **When it's wrong:** deep inheritance chains. Every subclass is locked to the base's sequence, and changing that sequence breaks everyone. Composition scales better past two levels.

---

## 3. Factory Method / Static Factory

🟢 Six of them: `FactoryStorageService`, `FactoryLLMService`, `FactoryMailService`, `FactoryCompressService`, `FactoryLogService`, `FactoryViewService`.

**Problem it solves:** callers need *a thing that stores files*, not *an S3 client*. A `switch` on a config string returns a concrete adapter typed as the abstract port.

```ts
FactoryStorageService.create(s3StorageConfig)   // → StorageService
```

This is the seam that makes [ports and adapters](./architecture.md#4-ports-and-adapters-hexagonal-architecture) actually swappable. Without a factory, every call site would name a concrete class and you'd have nothing to swap.

🔵 **Pedantic but worth knowing:** GoF *Factory Method* is a virtual method on a class that subclasses override. What you have is closer to a **static factory** or **simple factory**, which isn't in GoF at all. Both names are used loosely in industry; if an interviewer is precise about it, matching their precision is a good look.

---

## 4. Strategy

🟢 The drivers those factories return. `MailService` holds an `EmailDriver`; swapping Nodemailer for Resend changes behaviour without touching `MailService`.

**Problem it solves:** interchangeable algorithms behind one interface, selected at runtime.

🔵 **When it's wrong:** when there will only ever be one implementation. A Strategy with a single concrete class is indirection with no payoff — a common form of speculative generality. Your defence is that several of these genuinely have two or more drivers (mail, log, view, payment), and the LLM one exists specifically so a provider change isn't a rewrite.

---

## 5. Builder / Fluent Interface

🟢 `packages/database/src/lib/builder/queryBuilder/index.ts`.

**Problem it solves:** constructing a complex object through many optional steps, where a constructor with fifteen parameters would be unreadable.

```ts
.select().where().whereIn().join().orderBy().limit().offset()
```

Chained calls accumulate state; a terminal call produces SQL. The chaining style specifically is a **fluent interface** — a term coined by Fowler, and *not* a synonym for Builder even though they usually appear together. Builder is the intent; fluent is the ergonomics.

🟢 Your builder also carries geospatial operations — `withinRadius`, `orderByDistance`, `selectDistance` over a Haversine expression — which is a genuinely non-trivial thing to have hand-rolled.

🔵 **When it's wrong:** when the object is simple. Builders are verbose; for three fields, use a constructor or an options object.

---

## 6. Facade

🟢 `packages/database/src/lib/facades/index.ts`:

```ts
class Schema extends SchemaBuilder {}
class Query  extends QueryBuilder {}
class Column extends ColumnBuilder {}
```

**Problem it solves:** a simplified, memorable surface over a more complex subsystem. Migration authors write `Schema.create(...)` without knowing the builder hierarchy underneath.

(This is the Laravel-style naming convention, and it *is* the Facade pattern — though a purist would note a true Facade *wraps* rather than *extends*. Yours is inheritance-based aliasing, which achieves the same ergonomic goal.)

---

## 7. Singleton

🟢 `MediaRepository.instance()`, `AiService.instance()`, `PlansRepository.instance()`.

**Problem it solves:** one shared instance per process, avoiding repeated construction of stateless collaborators.

🔵 **The trade-off you must be ready to state, because Singleton is the most-criticised GoF pattern:** it's global mutable state, it hides dependencies (a class using a singleton doesn't declare it), and it makes test isolation hard because state leaks between tests.

🟢 **You already avoid the worst of it, and this is the good answer:** `MediaProcessor` takes its repositories as *constructor arguments* rather than calling `.instance()` internally. The singleton is used at the [composition root](./architecture.md#6-composition-root-and-inversion-of-control), not buried in business logic — so the processor is fully testable with fakes.

> **Say this:** "I use singletons for stateless shared services, but they're resolved at the composition root and injected, never called from inside business logic. That keeps the testability cost at zero."

---

## 8. Adapter

🟢 `S3StorageService` translates your `StorageService` port onto the AWS SDK's very different API. Same for every driver.

**Problem it solves:** making an incompatible interface fit the one you want. This is the *whole job* of the concrete classes in `packages/backend-lib/src/services/`.

🔵 **Adapter vs Facade** — both wrap something, and interviewers use the pair to test precision. Adapter *converts* an interface to one the client expects (the client's interface is fixed). Facade *simplifies* a subsystem (the interface is newly invented for convenience). Your storage drivers are Adapters; your `Query`/`Schema` classes are Facades.

---

## 9. Observer / in-process event bus

🟢 `EventEmitter2` across `auth.service.ts`, `media.service.ts`, `portfolio.service.ts`, consumed via `@OnEvent(...)` in e.g. `plan-subscriptions.service.ts`.

**Problem it solves:** module A must trigger behaviour in module B without importing it.

A publisher emits a **domain event** (`NEW_USER_EVENT`) without knowing who listens. That's **Observer**; because it goes through a broker object it's also correctly called an **in-process event bus**.

⚠️ **Do not call this "pub/sub over a message broker."** It's the same process and the same memory, synchronous by default, and **not durable** — if the process dies, the event is gone. The distinction between this and BullMQ is covered in [`async-and-messaging.md`](./async-and-messaging.md), and mixing them up is a common tell.

🔵 **When it's wrong:** when you need the side effect to *definitely* happen. An in-process event that fails leaves no trace and no retry. Anything that must survive a crash belongs on a queue.

---

## 10. Command / dispatch table

🟢 `MediaProcessor.handle()` switches on `job.name` to route a message to a handler.

Each job is a **command message** — a name plus a typed payload — and the switch is a **dispatch table**. The typed payload comes from the [shared kernel](./architecture.md#5-shared-kernel), which is what stops producer and consumer disagreeing about its shape.

---

## 11. Chain of Responsibility

🟢 The NestJS request pipeline:

```
middleware → guard → interceptor → pipe → handler → interceptor → exception filter
```

🟢 Your global stack — `AppThrottlerGuard → AuthGuard → UserStrikesGuard` — is a chain where any link can handle, transform, or short-circuit. `apps/api/src/common/guards/` holds nine of them (`admin`, `ai-consumption`, `app-throttler`, `app-token`, `auth`, `media-type`, `prod`, `user-strikes`).

**Problem it solves:** cross-cutting checks that apply to many routes, composable per route, each ignorant of the others.

---

## 12. Decorator — with a caveat

🟢 Your custom decorators: `@Public()`, `@SkipResponseTransform()`, `@Throttle()`, `@ToInt()`.

⚠️ **These are not the GoF Decorator pattern.** GoF Decorator wraps an object to add behaviour while preserving its interface. TypeScript decorators here attach **metadata** that guards and interceptors later read. The honest name is **declarative metadata** or **annotations**.

Knowing this distinction — and volunteering it — is a stronger signal than claiming the pattern. It's a small thing that says you read the source rather than the blog post.

---

## 13. Exception translation / anti-corruption layer

🟢 `packages/database/src/lib/client/` catches driver-specific errors and rethrows domain ones: `PG_UNIQUE_VIOLATION` → `DbUniqueViolationException`.

**Problem it solves:** Postgres error codes shouldn't leak into services. A service catching `DbUniqueViolationException` doesn't need to know what database is underneath, and swapping MySQL for Postgres doesn't ripple upward.

🟢 The builder packages carry their own `exceptions/` directories (`queryBuilder/exceptions`, `schemaBuilder/exceptions`, `alterBuilder/exceptions`), so failures are typed by layer rather than by driver.

---

## Patterns you should *not* claim

🔴 Not in this repo:

- **Abstract Factory** — you have simple factories returning one product, not families of related products.
- **Visitor**, **Flyweight**, **Interpreter**, **Memento**, **Prototype**, **Bridge** — absent.
- **Proxy** — nginx is a *network* reverse proxy, not the GoF Proxy pattern. Different meaning of the same word; don't let an interviewer's question about one drift into an answer about the other.
- **Mediator** — the event bus is close, but Mediator implies a component that encapsulates *how a set of objects interact*. Yours is a generic broker. Call it an event bus.

---

## Interview drills

**"What design patterns have you used?"**
Don't list. Pick two and go deep: ports/adapters with the factory seam (because it has a real payoff you can name — provider swap without touching callers), and Template Method in the compression service (because you can describe the exact hole the subclass fills). A short, deep answer beats a long, shallow one every time.

**"When would you not use a Strategy?"**
When there's one implementation and no concrete plan for a second. Speculative generality costs indirection now for optionality you may never use. Then note where you *did* apply it and why it earned its place — mail and payment genuinely have multiple drivers.

**"Singletons are considered an anti-pattern. React to that."**
Agree with the criticism, then show you've mitigated it: global mutable state and hidden dependencies are the real problems; injecting the instance at the composition root instead of calling `.instance()` inside business logic keeps the convenience and drops the testability cost.

**"Is your `@Public()` decorator the Decorator pattern?"**
No — it's metadata read by a guard. Saying so unprompted is worth more than the pattern would have been.
