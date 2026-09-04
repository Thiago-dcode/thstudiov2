# Honest Gaps

> Read this twice. Confidence comes from knowing your boundary, not from ignoring it.

**Why this file is the most valuable one here.** A keyword that collapses on the first follow-up is the fastest way to fail a senior interview. Everything on *your* side of the line you can defend all day — and knowing exactly where the line sits makes you **more** confident, not less.

There is also an asymmetry worth internalising: **volunteering a gap reads as competence; being caught in one reads as dishonesty.** Several items below are things you should raise *before* being asked.

---

## Part 1 — Do not claim. Not in this codebase.

### Architecture

| ❌ Don't say | ✅ Say instead |
|---|---|
| Microservices | Modular monolith plus a worker — and why that was right ([`architecture.md`](./architecture.md)) |
| CQRS | Command/side-effect separation, deferred write path |
| Event Sourcing | Domain events for decoupling; Postgres is the system of record |
| Domain-Driven Design | Some DDD *vocabulary* — shared kernel, anti-corruption layer. No aggregates, value objects or context maps |
| Clean Architecture | Hexagonal **at the infrastructure boundary**. Framework types do reach the domain |
| Saga pattern | Choreographed pipeline — there are no compensating actions |

### Infrastructure

| ❌ Don't say | ✅ Say instead |
|---|---|
| Kubernetes, Terraform, service mesh | Docker Compose on a droplet, config in version control |
| **Zero-downtime deployments** | Recreate with a brief restart window |
| Blue-green / canary / rolling deploys | Compose recreates containers together |
| Auto-scaling, failover | Static horizontal scaling with round-robin |
| Kafka, RabbitMQ, NATS | Redis-backed BullMQ |
| gRPC, GraphQL | REST plus WebSockets |
| **Distributed tracing / OpenTelemetry / APM** | Structured logs with correlation IDs — good logging, *not* tracing ([`observability.md`](./observability.md)) |
| Load tested / known capacity | No load testing has been done |

⚠️ **"Zero-downtime" and "tracing" are the two most tempting and most checkable.** One follow-up exposes either.

### AI

| ❌ Don't say | ✅ Say instead |
|---|---|
| **Agentic AI in the product** | Single-shot structured completions. The agents are in the *dev harness* — separate, still impressive |
| RAG, vector databases, embeddings | Grounding / context injection from structured application data |
| Fine-tuning, model training, MLOps | None present |
| **Evals** | Guardrails and schema validation — which is not the same thing |
| "AI made me X% faster" | No measurement exists. Describe the qualitative change instead |

### Dependencies

⚠️ **`better-auth`** is in `apps/web/package.json` with **zero imports** in `apps/web/src`. Never list it. Auth is your own JWT/session implementation, which is the stronger claim anyway. **Consider removing the dependency** so nobody reading your `package.json` draws the wrong conclusion.

---

## Part 2 — Known weak spots, ranked by cost-to-value

### 1. No container resource limits ⚠️ *cheapest fix on the list*

No `mem_limit`, no CPU reservation on **any** service — with 2× api + 2× web + postgres + redis + nginx + worker on **1 vCPU / 1 GB** (confirmed in `apps/web/next.config.ts`). One unbounded Node process can OOM the host and take Postgres with it.

**Fix:** add `mem_limit` to every service in `compose.prod.yaml`. Minutes of work.

### 2. No transactions in the data layer ⚠️ *most serious correctness gap*

No `BEGIN`/`COMMIT`/`ROLLBACK` anywhere in `packages/database`, and no usage in `apps/api`. Any operation writing two tables that must both succeed relies on ordering and idempotent retry rather than atomicity.

**Fix:** a `withTransaction` wrapper threading a client through the repository chain. Real work, but bounded. ([`databases.md`](./databases.md#5-️-transactions--the-real-gap))

### 3. No alerting

500s are emailed (`JOB_ERROR_500_MAIL`). Nothing else pages. **If the site goes down, you find out by looking.**

**Fix:** an external uptime monitor is free and takes five minutes. Everything internal shares fate with the thing it monitors. ([`observability.md`](./observability.md#5-alerting-))

### 4. No queue-depth monitoring

Media stuck in `GENERATING_METADATA` for an hour is a broken product with no signal. Queue depth is the metric most likely to bite silently.

### 5. Cron jobs run on every replica

7 cron jobs in an API running at `replicas: 2` — **both replicas fire every job.** The AI tasks are idempotent enough to converge, but that's a property you're relying on rather than enforcing.

**Fix:** BullMQ repeatable jobs, so the schedule lives in Redis and exactly one worker claims each run. ([`async-and-messaging.md`](./async-and-messaging.md#6-scheduled-work))

### 6. nginx has no passive health checking

Docker healthchecks drive restarts, not routing. The variable-based `proxy_pass` gives up `max_fails`/`fail_timeout`. **A running-but-broken replica keeps receiving traffic.** A deliberate trade — know it, and decide whether you still want it. ([`scaling-and-replicas.md`](./scaling-and-replicas.md#3-the-health-check-gap-))

### 7. The replica count is unvalidated

Two replicas were never measured against one on this hardware. Reasons 2 and 3 (crash resilience, event-loop insurance) justify it; reasons 1 and 4 (throughput, zero-downtime) don't apply on one core with Compose. `API_REPLICAS` is an env var — this is a one-line experiment.

### 8. Test coverage is lopsided

~9,100 lines cover the query builder; the API layer is thinner, particularly authorisation paths. **Defensible as a strategy** — "I tested the thing everything else depends on" — but say it plainly rather than implying uniformity. ([`testing-and-quality.md`](./testing-and-quality.md#3-your-coverage-shape-honestly-))

### 9. No E2E tests, no post-deploy smoke test

Nothing verifies a user can sign up and upload. The pipeline's last word is "containers started", not "the site works."

**Highest-value single addition:** one happy-path E2E crossing API → queue → worker → S3 → LLM → WebSocket.

### 10. No dependency or image scanning

No Dependabot, no `npm audit` gate, no SCA, no Trivy. Cheap to add, and a standard question.

### 11. No Content-Security-Policy

The strongest security header, and absent. Hard to deploy on Next.js because inline scripts need nonces or hashes — know that's *why*, rather than being surprised. ([`security.md`](./security.md#5-owasp-top-10-mapped-))

### 12. The soft 404 on media routes

`generateMetadata` can return indexable metadata while the page renders "not found" at **HTTP 200**. Pre-existed for `blocked_at`, widened by the `!media.url` guard. **Still open.** ([`seo-and-performance.md`](./seo-and-performance.md#7-known-issue-the-soft-404-))

### 13. No evals for LLM output

You can't prove a prompt change improved anything — only that it doesn't break the schema. ([`llm-engineering.md`](./llm-engineering.md))

### 14. WebSocket auth outlives token expiry

A JWT verified once at handshake stays valid for the life of the connection. No periodic re-auth, no max connection lifetime. ([`realtime-websockets.md`](./realtime-websockets.md#why-authenticate-at-the-handshake-))

### 15. `transports: ["websocket"]` removes the polling fallback

Users behind proxies blocking WebSocket upgrades now get **nothing** instead of degraded-but-working polling. A real trade for a consumer product.

### 16. The agent skills path is stale

`opencode.json` points `skills.paths` at `.opencode/skills`, which **doesn't exist** — the skills are in `.agents/skills/`. One-line fix, and it should be done before anyone clones the repo. ([`ai-agent-harness.md`](./ai-agent-harness.md#2-agent-skills--agentsskills-))

### 17. `README.md` has an unresolved merge conflict

On `main`, on top of Turborepo boilerplate. **Anyone you send to the repo — including from your CV — sees a conflict marker first.** This single file undoes a large part of what the project is meant to prove.

### 18. Directory typo

`apps/api/src/common/intecerceptors/` — misspelled. Cosmetic, but it's the kind of thing a reviewer notices and quietly downgrades you for.

---

## Part 3 — How to talk about a gap

**The structure that works:**

1. **Name it plainly.** No hedging, no burying.
2. **Say why it's acceptable *here*** — scale, stage, cost.
3. **Say what you'd do**, specifically.
4. **Say what would trigger doing it.**

> "I don't have transactions in my data layer. It's a query builder I wrote, and I never added them — so anything writing two tables relies on ordering and idempotent retry rather than atomicity. At pre-launch scale with no direct money movement in my own tables, that's survivable. The fix is a `withTransaction` wrapper threading a client through the repository chain. The trigger would be the first feature where a partial write leaves a user in a broken state they can't fix themselves."

**Steps 3 and 4 are what separate "I know my gaps" from "I have gaps."**

---

## Part 4 — Before you send the CV

Ordered by how visible each is to someone evaluating you:

- [ ] **Fix `README.md`** — the merge conflict is the first thing a recruiter clicking your repo link sees
- [ ] **Fix the `opencode.json` skills path** — a stale config undercuts the harness claim
- [ ] **Remove `better-auth`** from `package.json` — an unused dependency that contradicts your auth story
- [ ] **Add `mem_limit`** — minutes of work, removes the worst operational risk
- [ ] Fix the `intecerceptors` typo
- [ ] Decide on the soft 404

The first three cost almost nothing and each one closes a gap between what you claim and what a curious reader finds.
