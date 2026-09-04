# Glossary

> Everything in one page, grouped. Skim before an interview.
> 🟢 present in your repo · 🔵 general concept · 🔴 not in your repo

---

## Architecture

**monorepo** 🟢 one repo, many buildable packages · **modular monolith** 🟢 one deploy unit, enforced module boundaries · **microservices** 🔴 · **layered / N-tier** 🟢 controller → service → repository · **separation of concerns** · **dependency rule** dependencies point inward · **hexagonal architecture / ports and adapters** 🟢 abstract port, concrete adapter per provider · **driving vs driven adapters** inbound vs outbound · **Clean / Onion Architecture** 🔵 same family · **Dependency Inversion Principle** the D in SOLID · **shared kernel** 🟢 `common-lib` · **anti-corruption layer** 🟢 PG error → domain exception · **BFF (Backend for Frontend)** 🟢 the Next.js server · **composition root** 🟢 where the object graph is wired · **IoC / DI / IoC container** 🟢 Nest by decorator, worker by hand · **constructor injection** 🟢 · **CQRS** 🔴 say *command/side-effect separation* · **Event Sourcing** 🔴 · **ADR** 🔵 architecture decision record

---

## Design patterns

**Repository** 🟢 · **table data gateway** 🔵 the honest name when rows are returned raw · **Service layer** 🟢 · **Template Method** 🟢 base defines skeleton, subclass fills a step · **Factory Method / static factory** 🟢 six of them · **Strategy** 🟢 interchangeable algorithms, runtime-selected · **Builder** 🟢 · **fluent interface** 🟢 the chaining style · **Facade** 🟢 · **Singleton** 🟢 injected at the composition root, not called inside logic · **Adapter** 🟢 · **Observer** 🟢 EventEmitter2 · **dispatch table** 🟢 switch on `job.name` · **Chain of Responsibility** 🟢 the Nest pipeline · **exception translation** 🟢 · **declarative metadata** 🟢 the honest name for your decorators (*not* GoF Decorator)

---

## Async and messaging

**event-driven architecture** 🟢 · **domain event** 🟢 · **in-process event bus** 🟢 *not* pub/sub over a broker · **message broker** 🟢 Redis · **work queue / task queue** 🟢 16 of them · **producer / consumer** · **competing consumers** 🟢 · **point-to-point vs pub/sub** queue = one consumer, pub/sub = all subscribers · **at-most-once / at-least-once / exactly-once** 🔵 you have at-least-once; exactly-once *delivery* is a myth · **idempotent consumer** 🟢 `seo_generated_at` · **exponential backoff** 🟢 · **dead-letter** 🟢 `removeOnFail` retention · **debouncing** 🟢 via delayed jobs · **job deduplication** 🟢 by job ID · **deferred write / write-behind** 🟢 · **choreography vs orchestration** 🟢 yours is choreographed · **saga** 🔴 no compensating actions · **state machine** 🟢 `UPLOADING → UPDATING → GENERATING_METADATA → COMPLETED / FAILED` · **backpressure** 🔵 · **queue depth** ⚠️ unmonitored · **distributed lock** 🔵 the fix for cron-on-every-replica

---

## Real-time

**polling / long-polling / SSE / WebSocket** 🔵 know all four and when each fits · **WebSocket gateway** 🟢 · **namespace** 🟢 · **room / topic** 🟢 · **fan-out** 🟢 · **publish–subscribe** 🟢 the Socket.IO rooms, genuinely · **handshake authentication** 🟢 · **server push** 🟢 · **pub/sub backplane** 🟢 `@socket.io/redis-adapter` · **session affinity / sticky sessions** 🔴 you have none — deliberately · **subscriber mode** 🔵 why two Redis clients are needed

---

## Scaling and infrastructure

**edge / CDN / WAF** 🟢 Cloudflare · **reverse vs forward proxy** 🔵 · **TLS termination** 🟢 · **ECDHE / forward secrecy** 🟢 · **SNI** 🔵 · **AEAD** 🔵 · **horizontal vs vertical scaling** 🟢 · **replica** 🟢 2× api, 2× web · **stateless process** 🟢 the rule that makes replicas work · **round-robin load balancing** 🟢 via Docker DNS · **service discovery** 🟢 Docker embedded DNS at `127.0.0.11` · **DNS-based load balancing** 🟢 · **passive health check (`max_fails`)** 🔴 forfeited by the variable `proxy_pass` · **liveness vs readiness** 🔵 Compose has only one concept · **failover / auto-scaling** 🔴 · **resource limits** 🔴 ⚠️ missing entirely · **leaky bucket / token bucket** 🔵 · **trusted proxy problem** 🟢 `CF-Connecting-IP` not `X-Forwarded-For` · **Slowloris** 🔵 what `limit_conn` defends · **444** 🟢 nginx: close, send nothing · **`ssl_reject_handshake`** 🟢 · **HSTS / nosniff / clickjacking / COOP** 🟢 · **CSP** 🔴 absent · **Amdahl's law** 🔵 · **twelve-factor** 🔵 dev/prod parity

---

## DevOps

**namespaces / cgroups / union filesystem** 🔵 what a container actually is · **image vs container** 🔵 class vs object · **layer caching** 🔵 lockfile before source · **multi-stage build** 🟢 · **`output: "standalone"`** 🟢 · **expose vs ports** 🟢 · **quality gate** 🟢 `build-and-push: needs: test` · **immutable image tag** 🟢 `sha-<commit>` — what makes rollback possible · **rollback by SHA** 🟢 · **recreate deploy** 🟢 what you have · **rolling / blue-green / canary** 🔴 · **zero-downtime** 🔴 ⚠️ never claim · **least privilege** 🟢 scoped `GITHUB_TOKEN` · **SHA-pinned action** 🟢 tags are mutable, commits aren't · **BuildKit secret mount** 🟢 vs build-arg leaking into `mode=max` cache · **expand–contract migration** 🟢 · **dev/prod parity** 🟢

---

## Databases

**query builder vs ORM** 🟢 yours is a builder — say so · **B-tree index** 🔵 · **leftmost prefix rule** 🔵 composite index order matters · **selectivity** 🔵 · **covering index / index-only scan** 🔵 · **partial index** 🔵 pairs with soft deletes · **`EXPLAIN ANALYZE`** 🔵 · **N+1** 🔵 structurally hard to hit without lazy loading · **dataloader** 🔵 batch-and-stitch · **ACID** 🔵 · **isolation levels** 🔵 read committed is Postgres' default · **dirty / non-repeatable / phantom reads** 🔵 · **optimistic vs pessimistic locking** 🔵 · **transactions** 🔴 ⚠️ absent · **connection pool** 🟢 `max: 30` — generous for 1 vCPU · **PgBouncer** 🔵 · **soft delete** 🟢 · **cache-aside / write-through / write-behind** 🔵 · **thundering herd / cache stampede** 🔵 · **system of record** 🟢

---

## Frontend

**CSR / SSR / SSG / ISR** 🔵 · **RSC** 🟢 *not* SSR — payload vs HTML, bundle vs timing · **hydration / hydration mismatch** 🔵 · **client boundary** 🟢 `"use client"` is transitive downward · **Server Action** 🟢 a public HTTP endpoint — validate and authorise it · **request memoization / Data Cache / Full Route Cache / Router Cache** 🔵 · **`force-dynamic`** 🟢 · **Core Web Vitals: LCP / INP / CLS** 🔵 · **`localePrefix: as-needed`** 🟢 · **hreflang** 🟢 must be reciprocal and self-referencing

---

## SEO

**crawl → render → index → rank → serve** 🔵 · **crawl budget** 🔵 why `www` is a 301 · **canonical** 🟢 · **fail-closed vs fail-open** 🟢 indexability fails closed; moderation fails open — *opposite defaults, deliberately* · **sitemap sharding** 🟢 fixed ID blocks, not offsets · **soft 404** ⚠️ you have one · **JSON-LD / Schema.org / rich results** 🟢 · **`x-default`** 🔵

---

## LLM engineering (what you ship)

**provider abstraction** 🟢 · **structured output** 🟢 schema-in-prompt · **JSON mode / constrained decoding / tool calling** 🔵 stronger techniques than yours · **defensive parsing** 🟢 · **schema conformance validation** 🟢 · **output clamping** 🟢 · **output guardrails + safe fallback** 🟢 · **grounding / context injection** 🟢 · **RAG / embeddings / vector store** 🔴 not this · **prompt caching** 🟢 stable prefix · **low-temperature decoding** 🟢 `0.1` for classification · **LLM-as-judge** 🟢 · **calibrated rubric** 🟢 0–10 severity · **precision/recall trade-off** 🟢 anti-false-positive instruction · **multimodal / vision input** 🟢 · **token accounting / quota enforcement** 🟢 · **evals** 🔴 ⚠️ the real gap · **fine-tuning** 🔴 · **agentic** 🔴 not in the product

---

## Agent harness (how you build)

**agent harness** 🟢 the scaffolding around the model · **Agent Skill** 🟢 19 · **trigger description** 🟢 with negative conditions · **progressive disclosure** 🟢 body short, references on demand · **context-window management** 🟢 · **skill composition / precondition** 🟢 · **executable architectural governance** 🟢 rules in the tool, not a wiki · **MCP (Model Context Protocol)** 🟢 skills guide, MCP accesses · **stdio transport** 🟢 · **orchestrator–worker** 🟢 · **subagent** 🟢 8 · **role specialisation** 🟢 · **least-privilege tool grants** 🟢 the reviewer can't write · **context isolation** 🟢 why multi-agent works at all · **parallel fan-out / fan-in** 🟢 · **shared contract** 🟢 · **bounded retry** 🟢 · **triage policy** 🟢 · **heuristic vs deterministic** 🟢 **the key distinction** — agents advise, CI decides

---

## Observability

**logs / metrics / traces** 🔵 the three pillars · **monitoring vs observability** 🔵 known vs unknown questions · **correlation ID** 🟢 · **`AsyncLocalStorage` / continuation-local storage** 🟢 · **deferred logging** 🟢 flushed after response · **log rotation / retention** 🟢 · **secret redaction / PII scrubbing** 🟢 with tests · **four golden signals** 🔵 latency, traffic, errors, saturation · **p50 / p95 / p99** 🔵 never averages · **span / trace context / `traceparent`** 🔵 · **distributed tracing** 🔴 ⚠️ never claim it

---

## Testing

**test pyramid vs testing trophy** 🔵 · **AAA** 🔵 · **dummy / stub / spy / mock / fake** 🔵 know the differences · **coverage as floor not target** 🔵 Goodhart's law · **mutation testing** 🔵 · **E2E** 🔴 absent · **smoke test** 🔴 absent · **quality gate** 🟢

---

## Security

**authn vs authz** 🔵 · **JWT: signed not encrypted** 🔵 · **`alg: none` attack** 🔵 · **refresh token / revocation window** 🔵 · **salted slow hash — bcrypt / scrypt / Argon2id** 🔵 · **2FA hierarchy: SMS < email < TOTP < WebAuthn** 🔵 · **defense in depth** 🟢 · **allow-list over deny-list** 🟢 · **OWASP Top 10** 🔵 · **IDOR** 🔵 · **SSRF** 🔵 relevant to your vision URLs · **rate limiting: `limit_req` vs `limit_conn`** 🟢 · **fail-open vs fail-closed** 🟢
