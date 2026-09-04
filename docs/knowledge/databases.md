# Databases and the Data Layer

> Your hand-written query builder, and the database theory you need around it.
> Related: [`architecture.md`](./architecture.md) · [`design-patterns.md`](./design-patterns.md) · [`devops-and-cicd.md`](./devops-and-cicd.md)

---

## 1. What you built

🟢 `packages/database` — a hand-written, dialect-aware PostgreSQL/MySQL query and schema builder, a migration runner, and a CLI. Roughly 1,800 lines of builder covering 62 tables and 44 migrations, backed by ~9,100 lines of tests.

```
packages/database/src/lib/
  builder/
    queryBuilder/    SELECT · INSERT · UPDATE · DELETE · joins · where groups · geo
    schemaBuilder/   CREATE TABLE
    alterBuilder/    ALTER TABLE
    columnBuilder/   column type DSL
  client/            Pool management + exception translation
  repositories/      BaseRepository + per-entity repositories
  facades/           Schema · Query · Column
  scripts/           migrate · rollback · seed
  bin/cli.ts         the dbcli entry point
```

**This is not an ORM, and the distinction matters.** An ORM maps rows to objects and manages identity, change tracking and lazy loading. Yours generates SQL and returns rows. The accurate term is **query builder** — the same category as Knex or Kysely, not Prisma or TypeORM.

⚠️ Calling it "a custom ORM" on a CV invites a question you'd lose. "Query builder" is both true and more impressive to anyone who knows the difference.

---

## 2. Why not an ORM — the decision you must defend

🔵 An interviewer *will* ask this, and "I wanted to learn" is a weak answer on its own even though it's the honest origin.

**The real defensible case:**

| Gained | Cost |
|---|---|
| Direct control of query shape — the SQL is what you wrote | Every feature is yours to build |
| No hidden N+1 from lazy loading | No ecosystem, no docs, no Stack Overflow |
| No ORM query-planner surprises at scale | Onboarding cost for anyone else |
| Indexing decisions stay explicit | **No transactions** (see §5) |
| Learning value — you understand every layer | Maintenance is permanently yours |

> **Say this:** "It's a query builder, not an ORM — closer to Knex than Prisma. I built it for direct control over query shape and indexing, and because I wanted to understand the layer rather than treat it as magic. The honest cost is that everything an ORM gives you free is mine to build, and I haven't built all of it — transactions are the notable gap. On a team I'd have used Prisma; solo the trade paid off in understanding."

That last sentence is the one that lands. **Knowing when your own choice would be wrong is the senior signal.**

---

## 3. Indexing — the highest-value database topic in interviews

🔵 **What an index actually is.** A B-tree index is a sorted, balanced structure mapping column values to row locations. It turns an O(n) sequential scan into an O(log n) tree descent.

**The cost, which people forget:** every index must be updated on every `INSERT`, `UPDATE` and `DELETE` touching its columns, and it consumes disk. Indexes make reads fast and writes slower. An unused index is pure overhead.

**Key concepts to have ready:**

- **Composite index column order matters.** An index on `(user_id, created_at)` serves `WHERE user_id = ?`, and `WHERE user_id = ? ORDER BY created_at`, but **not** `WHERE created_at > ?` alone. This is the **leftmost prefix rule**.
- **Selectivity.** An index on a boolean is usually worthless — it can't narrow enough for the planner to prefer it over a scan.
- **Covering index.** If the index contains every column the query needs, Postgres can answer from the index alone — an **index-only scan**.
- **Partial index.** `CREATE INDEX … WHERE deleted_at IS NULL` — smaller and faster when you always filter that way. Directly relevant to your soft-delete pattern.
- **`EXPLAIN ANALYZE`** is how you check any of this. Know that `Seq Scan` on a large table in a hot path is the smell, and that the planner choosing a scan over your index usually means selectivity is poor or statistics are stale.

🟢 **In your repo:** 7 migration files declare explicit indexes. Your Invbit work is the stronger indexing story — SQL optimization plus Redis caching taking endpoints from 1–3s to under 300ms.

⚠️ **Honest gap:** 7 of 44 migrations declaring indexes is thin for 62 tables. If asked about your indexing strategy, say you index foreign keys and known query paths and that a systematic `pg_stat_user_tables` review is on the list — rather than implying a rigour that isn't there.

---

## 4. N+1 queries

🔵 **The problem:** fetch 20 media rows, then loop and fetch each one's owner — 21 queries instead of 2.

ORMs cause this silently through lazy loading. **Your builder can't** — there's no lazy loading, so a related fetch is something you wrote deliberately. That's a genuine architectural benefit of the no-ORM choice and worth naming.

**The fixes, in order of preference:** a `JOIN`; or a second query with `WHERE id IN (…)` and an in-memory stitch (the **dataloader** pattern); or denormalisation if the read pattern justifies it.

🟢 `.agents/skills/api-join-queries/SKILL.md` encodes your join conventions, and `collision-prevention` exists specifically to stop column-name collisions in joins — a real hazard when you're generating SQL by hand.

---

## 5. ⚠️ Transactions — the real gap

🔴 **There is no transaction support anywhere in this codebase.** No `BEGIN`/`COMMIT`/`ROLLBACK` in `packages/database/src/lib/client/`, no transaction wrapper on the pool, and no usage in `apps/api`. The only "rollback" in the repo is *migration* rollback in `bin/cli.ts`.

**Why this matters.** Any operation writing two tables that must both succeed or both fail is currently at risk. If the second write throws, the first stays committed and the data is inconsistent with no automatic repair.

🔵 **The theory you need anyway:**

**ACID** — Atomicity (all or nothing), Consistency (constraints hold), Isolation (concurrent transactions don't corrupt each other), Durability (committed means survived).

**Isolation levels**, weakest to strongest:

| Level | Prevents | Still allows |
|---|---|---|
| Read Uncommitted | — | Dirty reads |
| Read Committed *(Postgres default)* | Dirty reads | Non-repeatable reads, phantoms |
| Repeatable Read | + non-repeatable reads | Phantoms (in the standard) |
| Serializable | Everything | Nothing — but retries under contention |

**Optimistic vs pessimistic locking.** Pessimistic takes the lock up front (`SELECT … FOR UPDATE`); optimistic uses a version column and fails the write if it changed. Optimistic wins under low contention, pessimistic under high.

> **Say this if asked:** "Transactions are the honest gap in my data layer — it's a query builder I wrote, and I never added them. Anything that writes two tables relies on ordering and idempotent retry rather than atomicity. Adding a `withTransaction` wrapper that passes a client through the repository call chain is the first thing I'd do if this needed to handle money directly. Stripe is the one place where it would already matter, and there the webhook queue's at-least-once delivery plus idempotent handlers cover most of it."

**Volunteering a known gap with the fix and the mitigation is a strong answer.** Hiding it and being found out is fatal.

---

## 6. Connection pooling

🟢 `packages/database/src/lib/client/index.ts`:

```ts
new PgPool({ …, max: 30, idleTimeoutMillis: 30000 })
```

🔵 **Why pool at all:** a TCP connection plus Postgres authentication costs milliseconds and a backend process. Pooling amortises that across requests.

**The sizing trap, and it applies directly to you.** Postgres allocates a **process** per connection. `max: 30` per client instance × 2 api replicas × (plus the worker) can exceed a small droplet's `max_connections` (default 100) and its memory budget. Postgres doesn't degrade gracefully at that point — it refuses connections.

The standard formula is roughly `connections ≈ (2 × cores) + effective_spindles`. On 1 vCPU, **30 is generous**; a much smaller pool would likely perform the same or better, because 30 concurrent queries on one core just queue anyway.

⚠️ Worth measuring. `SELECT count(*) FROM pg_stat_activity;` under load tells you what you actually use.

🔵 **PgBouncer** is the standard next step — an external pooler in transaction mode letting many clients share few server connections. Not present here, and correctly so at this scale, but know the name.

---

## 7. Migrations and expand–contract

🟢 44 migrations, applied by `scripts/deploy-prod.sh` **before** services restart, after a Postgres health check.

🟢 The CLI refuses to roll back in production:

```ts
Logger.error('❌ You cannot rollback migrations in production');
```

That's a deliberate guard rail: a down-migration that drops a column destroys data, and "roll back the schema" under pressure is how outages become incidents.

🔵 **Expand–contract** (a.k.a. parallel change) is the technique that makes schema changes safe when old and new code run simultaneously — which is *always* true during a deploy:

```
1. EXPAND    add the new column, nullable. Old code ignores it.
2. MIGRATE   backfill; write to both old and new.
3. SWITCH    deploy code that reads the new column.
4. CONTRACT  a later deploy drops the old column.
```

Four deploys instead of one, and the reason is that **step 1 and step 4 are individually safe at any moment**, whereas rename-in-place is broken for the entire window where both versions are live.

> **Say this:** "Migrations run before the new containers start, and the CLI blocks rollback in production because a down-migration is data loss under pressure. Schema changes go expand–contract — add nullable, backfill, switch reads, drop later — so old and new code can both be live during the deploy window."

---

## 8. Soft deletes

🟢 Built into the builder — `softDeletes()` and `setSoftDelete()`.

🔵 **The trade-off:** rows are marked, not removed. You keep audit history and make "undo" possible; you pay with every query needing a `WHERE deleted_at IS NULL` filter, unique constraints that must account for deleted rows, and tables that grow forever.

The filter being *in the builder* rather than in each query is the right call — a forgotten filter is a data leak, and centralising it means it can't be forgotten. **Partial indexes** (§3) are the natural companion.

---

## 9. Caching

🟢 Redis, shared by both API replicas. `scripts/deploy-prod.sh` step 6 flushes cached user asset URLs after each deploy.

🔵 **Vocabulary:**

- **Cache-aside (lazy loading)** — check cache, miss → read DB → populate. The common one.
- **Write-through** — write cache and DB together. Consistent, slower writes.
- **Write-behind** — write cache, flush to DB later. Fast, risks loss.
- **TTL** vs **explicit invalidation** — time-based expiry is simple and eventually correct; explicit invalidation is precise and easy to get wrong.
- **Thundering herd / cache stampede** — a hot key expires and a thousand requests hit the DB at once. Mitigations: jittered TTLs, a lock on repopulation, or serving stale while refreshing.

**"There are only two hard things in computer science: cache invalidation and naming things."** The deploy-time flush in your script exists because a cached CDN URL outlives the asset it points at — a concrete invalidation bug you already solved.

---

## 10. The `dbcli` workflow

🟢 `scripts/dbcli-dev.sh` / `dbcli-prod.sh` wrap the CLI.

⚠️ **Workflow quirk worth remembering:** `make:migration` scaffolds into `dist`. Author the real migration in `src` reusing the generated timestamp, then build, then migrate. Getting this backwards means editing a file that the next build overwrites.

---

## Interview drills

**"Why did you write your own query builder?"**
See §2. Lead with control and learning, then volunteer the cost — including transactions — and end with "on a team I'd have used Prisma."

**"How would you speed up a slow endpoint?"**
Measure first — `EXPLAIN ANALYZE`, find the actual plan. Then in order: index the filter/sort columns, eliminate N+1, reduce selected columns, cache if the data tolerates staleness, denormalise last. The order matters and stating it is the answer.

**"How do you handle a schema change with zero downtime?"**
Expand–contract, four steps, §7. Explain *why* rename-in-place breaks: both code versions are live during the deploy.

**"What happens if two requests update the same row simultaneously?"**
Be honest: you have no transactions and no optimistic locking, so last-write-wins. Then say what you'd add — a version column and a conditional update — and where it would matter most.

**"What's `max: 30` doing for you on a 1 vCPU box?"**
Probably less than you'd think. Postgres forks a process per connection; 30 concurrent queries on one core queue regardless. Say you'd measure `pg_stat_activity` and likely lower it.
