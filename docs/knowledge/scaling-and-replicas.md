# Scaling, Replicas and Statelessness

> What two replicas actually buy you, and what they don't.
> Related: [`nginx.md`](./nginx.md) · [`realtime-websockets.md`](./realtime-websockets.md) · [`devops-and-cicd.md`](./devops-and-cicd.md)

---

## 1. What a replica is

🟢 `compose.prod.yaml`:

```yaml
api:
  deploy:
    replicas: ${API_REPLICAS:-2}
```

Two identical, independent copies of the container. Same image, same environment, same code — **two separate OS processes, each with its own memory.**

🟢 Note what's deliberately absent, and the comment you wrote about it:

```yaml
# No container_name / fixed host port: this service sits behind nginx and is
```

You can't give them a fixed name or host port — there are two. They're reachable only on the internal Docker network as the hostname `api`, and Docker's embedded DNS (`127.0.0.11`) answers a lookup for `api` with **both** container IPs.

🔵 **Horizontal vs vertical scaling:**

| | Horizontal (scale out) | Vertical (scale up) |
|---|---|---|
| Method | More copies | Bigger machine |
| Ceiling | Very high | Hardware limit |
| Requires | **Statelessness** | Nothing |
| Failure benefit | One dies, others serve | None — single point |
| Cost curve | Linear-ish | Superlinear at the top |

---

## 2. Who decides which replica serves a request

🟢 **Not the app.** There is no failover logic anywhere in your code, and the app has no idea replicas exist. That's the entire point of statelessness.

The decision happens outside, per request:

1. nginx evaluates `set $api_upstream api:8080; proxy_pass http://$api_upstream;`
2. Because the target is a **variable**, nginx re-resolves through Docker DNS, cached 10s
3. Docker DNS returns **both** IPs, rotating the order
4. nginx connects to the first

Result: **round-robin at request granularity** — not per user, not per session, not per connection. **Two clicks from the same browser can land on different replicas.** That single fact is the root of the WebSocket bug in [`realtime-websockets.md`](./realtime-websockets.md).

Full mechanics in [`nginx.md`](./nginx.md#job-2--load-balancing-and-service-discovery).

---

## 3. The health-check gap ⚠️

🟢 The healthchecks in `compose.prod.yaml` are **Docker** healthchecks. They govern restart behaviour and `depends_on: service_healthy` gating at startup. **They do not feed nginx's routing decision.**

And because you route through a variable, there's no `upstream {}` block — so none of nginx's upstream machinery exists: no `max_fails`, no `fail_timeout`, no `proxy_next_upstream`, no `least_conn`, no `ip_hash`. Docker DNS returns records for every *running* container regardless of health.

**Consequence: a replica that is running but broken still receives its share of traffic**, and users get 502s until Docker's restart policy notices.

| Approach | Dynamic scaling | Passive health checks | Session affinity |
|---|:--:|:--:|:--:|
| `proxy_pass` to a **variable** (yours) | ✅ | ❌ | ❌ |
| Static `upstream {}` block | ❌ | ✅ | ✅ |

You optimised for column one. Naming the trade honestly is worth more than pretending it isn't one.

🔵 **Liveness vs readiness** — the distinction Kubernetes made standard:

- **Liveness:** is the process alive? Fail → restart it.
- **Readiness:** can it serve traffic *right now*? Fail → stop routing, don't restart.

A container warming a cache or awaiting a DB connection is *live but not ready*. Docker Compose has only one healthcheck concept and no readiness-based routing, which is precisely the gap above.

> **Say this:** "nginx resolves the upstream through Docker DNS at request time rather than startup, so it picks up new replicas without a config change. The trade-off is I gave up nginx's passive health checks and sticky sessions — Docker healthchecks handle restarts but don't influence routing, so a running-but-broken replica still gets traffic until it's recycled."

---

## 4. Why two replicas — honestly

🔵 The four standard justifications:

1. **Throughput.** Node is single-threaded; one process saturates one core.
2. **Crash resilience.** One dies, `restart: unless-stopped` revives it while the other serves.
3. **Event-loop insurance.** One blocks on something synchronous, the other still answers.
4. **Zero-downtime deploys.** Restart replicas one at a time.

🟢 **Now which do you actually get, on a 1 vCPU droplet?**

- ⚠️ **Reason 1 needs more than one core.** Two Node processes on 1 vCPU timeshare one core and add context-switching overhead. You pay 2× memory for roughly the same capacity.
- ⚠️ **Reason 4 needs rolling updates, which plain Compose does not do.** Staggered replacement is a Swarm/Kubernetes feature. `docker compose up -d` recreates containers together.
- ✅ **Reasons 2 and 3 are real even on one core.** Those are the honest justifications.

🟢 **You have evidence in your own repo** that the replica count amplified a problem — the `web` healthcheck comment:

> *"every probe rendered the whole landing page — four API calls each, **x2 replicas**, every 30s, and every 3s during start_period. That alone was a large share of the 429s."*

⚠️ **There is also no `mem_limit` or CPU reservation on any service.** With 2× api + 2× web + postgres + redis + nginx + worker on a small box, one unbounded Node process can exhaust memory and take Postgres with it. **This is the cheapest fix on your entire list.**

🟢 `API_REPLICAS` and `WEB_REPLICAS` are environment variables, so testing one-vs-two is a one-line experiment, not a rewrite.

> **Say this:** "I run two replicas for crash resilience and event-loop headroom, not throughput — on a single core two Node processes just timeshare one CPU. And I don't get zero-downtime deploys from it either, because Compose doesn't do rolling updates; that needs Swarm or Kubernetes. It's a deliberate, limited benefit rather than cargo-culted scaling."

**Knowing exactly which benefits you get and which you don't is far stronger than claiming you "scaled horizontally."**

---

## 5. Statelessness — the rule that makes it work

🔵 Two replicas behave like one bigger server only if **every request can be served correctly by either copy**. That property is **statelessness**: the process holds no *per-user* state in its own memory between requests.

🟢 Your HTTP API is stateless, and it's worth knowing exactly why:

| State | Where it lives | Why either replica can serve |
|---|---|---|
| Auth | **JWT** carried by the client | Either verifies with the shared secret |
| Sessions, notifications, media | **Postgres** | Shared |
| Cache | **Redis** | Shared |
| Queue jobs | **Redis** | Shared |

Everything that must be remembered is pushed *out* of the process into shared infrastructure. **Stateless processes scale horizontally; stateful ones don't.**

🔵 This is why JWTs are popular in horizontally-scaled systems: a **server-side session** would need shared storage or sticky sessions. JWTs move the state to the client. The cost is that you can't easily revoke one — covered in [`security.md`](./security.md).

---

## 6. Where statelessness breaks: WebSockets

🟢 An HTTP request is fire-and-forget. A **WebSocket is a long-lived open TCP connection** — it has to be held *somewhere*, and that somewhere is the memory of one specific replica.

`client.join(userNotificationRoom(user.id))` adds the socket to an **in-memory** map of `room → sockets`. **Replica 2 has no idea that socket exists.**

This is the one piece of state you left in process memory, and the one piece that can't be. The full case study — two distinct failure modes, why the obvious fix is only half a fix, and the verification — is in [`realtime-websockets.md`](./realtime-websockets.md). **It's the best system-design story you have.**

---

## 7. Scaling concepts worth knowing 🔵

**Stateless vs stateless-ish.** Most "stateless" services hold *some* state — connection pools, caches, in-flight requests. The precise claim is *no per-user state that another instance couldn't reconstruct.*

**Sticky sessions / session affinity.** Routing one client consistently to one backend. Solves WebSocket handshakes and in-memory sessions; costs you even load distribution and makes a replica's death lose its clients' state.

**The scaling ladder**, in the order most systems climb it:

```
1. Optimise queries / add indexes        ← cheapest, biggest wins, usually skipped
2. Cache aggressively
3. Vertical scale
4. Move heavy work off the request path  ← you did this with the worker
5. Horizontal scale the app tier         ← you did this with replicas
6. Read replicas for the database
7. Shard the database                    ← almost nobody actually needs this
```

**Naming where you are on that ladder is a good answer.** You're at 5 with 1 and 2 done, and the database is a single instance — which is fine, and knowing it's the next constraint is the point.

**Amdahl's law.** Speedup is limited by the serial fraction. With one database everything serialises there eventually, so app-tier replicas only help until the DB is the bottleneck.

**The stateless-app / stateful-data split.** The general principle: push state to purpose-built stateful systems (Postgres, Redis) and keep application processes disposable. Your architecture follows it everywhere except the WebSocket, which is exactly why that's where it broke.

---

## 8. Capacity, honestly ⚠️

You have **no load testing and no performance baseline**. You don't know your requests-per-second ceiling, your p95 latency, or where it degrades.

Don't invent numbers. The honest and still-good answer:

> "I haven't load-tested it — it's pre-launch, and the current constraint is a single small droplet, so the number I'd get would tell me about the droplet rather than the code. If it needed to scale I'd start with `k6` against the read-heavy public endpoints, because that's where SSR plus four API calls per landing page render already showed up as a rate-limiting problem."

**That references a real thing you found**, which is worth more than a number you can't defend.

---

## Interview drills

**"How does your system scale?"**
Ladder in §7. Where you are, what's next, and the honest constraint: single database, single droplet.

**"You have two replicas. What breaks?"**
The best question you can get. Cron jobs run twice ([`async-and-messaging.md`](./async-and-messaging.md#6-scheduled-work)); WebSocket emits hit the wrong replica ([`realtime-websockets.md`](./realtime-websockets.md)); a broken-but-running replica keeps getting traffic (§3). Three concrete answers from your own system.

**"Why not Kubernetes?"**
One droplet, one engineer. K8s buys rolling updates, readiness-gated routing, autoscaling and self-healing — all real things you don't have. It costs a control plane, a networking model, and a permanent operational tax. At this size Compose is right; the honest note is that the *specific* things you're missing (§3, §4) are the things K8s would give you, so that's the trigger to switch.

**"What's your p95?"**
You don't know. Say so, say why measuring now would measure the droplet, and say what you'd do. Never invent a number — it's the one answer that can't survive a follow-up.
