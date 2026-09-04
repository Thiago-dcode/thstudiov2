# Interview Preparation

> Drills, stories, and the system-design walkthrough.
> Read [`honest-gaps.md`](./honest-gaps.md) before this file, and again after.

---

## 1. Your five strongest assets

Know these cold. Everything else is support.

| # | Asset | Why it lands |
|---|---|---|
| 1 | **The WebSocket replica bug** | Distributed-systems reasoning, two failure modes with one root cause, partial vs complete fix, empirical verification, and bugs in your own fix ([`realtime-websockets.md`](./realtime-websockets.md)) |
| 2 | **The agent harness** | Almost nobody has designed one. Skills + subagents + MCP + the heuristic/deterministic distinction ([`ai-agent-harness.md`](./ai-agent-harness.md)) |
| 3 | **The trusted-proxy 429 incident** | Two independent causes, real symptom, general lesson ([`security.md`](./security.md#3-rate-limiting-and-the-trusted-proxy-bug-)) |
| 4 | **Owning the whole delivery path** | CI gate → GHCR → SSH deploy → migrations → rollback by SHA, with the security reasoning ([`devops-and-cicd.md`](./devops-and-cicd.md)) |
| 5 | **Production LLM engineering** | Everything *around* the call, plus knowing it isn't agentic ([`llm-engineering.md`](./llm-engineering.md)) |

---

## 2. The 90-second system-design walkthrough

Practise until it's fluent. Stop at 90 seconds and let them steer.

> "A11STUDIO is a portfolio platform for photographers. Architecturally it's a modular monolith in a monorepo, deployed as a small distributed system.
>
> Traffic comes through Cloudflare for CDN and WAF, then hits nginx on my droplet, which terminates TLS, rate-limits, and load-balances across replicas. Two tiers behind it: a Next.js app doing SSR and acting as a BFF, and a NestJS API with 42 modules and 116 endpoints. Postgres is the system of record; Redis does cache, queues and WebSocket pub/sub.
>
> The interesting part is that nothing slow happens on the request path. An upload validates, writes a row, enqueues, and returns 202. A separate worker container drains sixteen BullMQ queues — image compression, LLM calls for multilingual SEO and moderation, Stripe webhooks, mail. Each step advances an explicit status state machine, so the UI always has something truthful to render, and the last step pushes a notification over an authenticated WebSocket.
>
> I built it solo, and I own the delivery path too — GitHub Actions gates every push on lint and 786 tests before an image is built, ships SHA-tagged images to GHCR, then deploys over SSH with migrations before the restart."

**Then stop.** They'll pick a thread. Every thread has a file.

---

## 3. Behavioural stories (STAR)

Four stories, each reusable for several questions.

### Story A — the silent bug ⭐ *your best*

**Situation.** Live notifications were unreliable. The row always appeared after a refresh, so it read as flaky rather than broken.

**Task.** Find out why real-time worked about half the time.

**Action.** Traced the path. The API runs at two replicas; a WebSocket is the one piece of state that lives in one replica's memory. Both replicas consume the notification queue, so an emit from the replica that got the job never reached a socket held by the other — silently, because the DB write succeeded. Separately, Socket.IO's default transports start on HTTP long-polling, and a multi-request handshake without sticky sessions fails with "session ID unknown". Reproduced both with two local Socket.IO servers before changing anything. Fixed with a Redis pub/sub backplane plus forcing the WebSocket transport — the adapter being non-negotiable, since affinity can't help when the emit starts on the wrong node.

**Result.** Cross-replica delivery verified against the same simulation that reproduced the failure. And the fix had two bugs of its own: my SIGTERM handler removed Node's default termination so the container hung until Docker killed it, and I hadn't attached error listeners to the Redis clients — which in node-redis means an uncaught exception on any reconnect. I caught the first only because I stopped trusting a Windows test and re-ran it in a Linux container.

**Answers:** hardest bug · debugging approach · distributed systems · a mistake you made · how you verify.

### Story B — the outage with two causes

**Situation.** Site-wide 429s in production.

**Task.** Ordinary traffic was being rate-limited.

**Action.** Two independent causes. The throttler keyed on the socket peer, but with SSR the peer is my own Next.js server, so every visitor shared one bucket. And the container healthcheck was rendering the entire landing page — four API calls, ×2 replicas, every 30 seconds, and every 3 seconds during start-up.

**Result.** Real client IP resolved from request context in `AsyncLocalStorage`; healthcheck pointed at something cheap. The general name is the trusted-proxy problem, and the security half is that the IP must come from a header your edge writes, not one a client can forge.

**Answers:** production incident · a monitoring mistake · a subtle bug · security.

### Story C — the decision with real costs

**Situation.** Needed a data layer.

**Task.** ORM or build it.

**Action.** Wrote a query builder — ~1,800 lines, 62 tables, 44 migrations — for direct control of query shape and indexing, and to genuinely understand the layer. Backed it with ~9,100 lines of tests because it's what everything else depends on.

**Result.** No hidden N+1, no planner surprises, and I can explain every query. The honest cost is that everything an ORM gives free is mine — transactions are the notable gap. **On a team I'd have used Prisma.**

**Answers:** a technical decision · a trade-off · something you'd do differently · build vs buy.

### Story D — working with AI without trusting it

**Situation.** Solo on a 100k-line codebase, wanting agent speed without agent drift.

**Task.** Keep quality independent of how clean generated code looks.

**Action.** Built a harness: 19 skills encoding the repo's conventions with trigger descriptions and progressive disclosure, 8 subagents with least-privilege tool grants — the reviewer literally can't write files, so it reports rather than quietly fixing — and a Postgres MCP server so the testing skill verifies DB side effects instead of trusting an HTTP 200. Underneath it, CI runs lint and 786 tests, and nothing is built unless both pass.

**Result.** The reviewer is a heuristic layer; the CI gate is the deterministic one. Agents advise, CI decides.

**Answers:** how you use AI · code quality · working alone · productivity.

---

## 4. Rapid-fire drills

Cover the answer. Say it out loud. If you can't, open the linked file.

| Question | File |
|---|---|
| Monorepo vs monolith? | [architecture](./architecture.md) |
| Why not microservices? | [architecture](./architecture.md) |
| Ports and adapters — what does it buy you? | [architecture](./architecture.md) |
| Queue vs pub/sub? | [async](./async-and-messaging.md) |
| How do you guarantee exactly-once? | [async](./async-and-messaging.md) |
| Why a separate worker process? | [async](./async-and-messaging.md) |
| What breaks when you add a second replica? | [scaling](./scaling-and-replicas.md) |
| Stateless — what does it actually mean? | [scaling](./scaling-and-replicas.md) |
| Why is there a variable in your `proxy_pass`? | [nginx](./nginx.md) |
| `CF-Connecting-IP` vs `X-Forwarded-For`? | [nginx](./nginx.md) |
| Do you have zero-downtime deploys? | [devops](./devops-and-cicd.md) |
| How do you keep secrets out of images? | [devops](./devops-and-cicd.md) |
| How do you roll back? | [devops](./devops-and-cicd.md) |
| Composite index column order? | [databases](./databases.md) |
| What happens on two concurrent writes? | [databases](./databases.md) |
| Expand–contract — why four steps? | [databases](./databases.md) |
| RSC vs SSR? | [frontend](./frontend-architecture.md) |
| Are Server Actions secure by default? | [frontend](./frontend-architecture.md) |
| Is your AI agentic? | [llm](./llm-engineering.md) |
| RAG or grounding? | [llm](./llm-engineering.md) |
| How do you trust AI-written code? | [harness](./ai-agent-harness.md) |
| Logging, metrics or tracing — which do you have? | [observability](./observability.md) |
| What's your test strategy? | [testing](./testing-and-quality.md) |
| What's your biggest gap? | [gaps](./honest-gaps.md) |

---

## 5. Traps

| Trap | Why it's asked | Answer |
|---|---|---|
| "So it's basically microservices?" | Testing whether you'll accept a flattering wrong label | "No — modular monolith plus a worker." Correct it. |
| "You have zero-downtime deploys, right?" | Leading question | "No. Recreate with a brief restart window." |
| "Tell me about your observability stack" | Assumes one exists | "Structured logs with correlation IDs. Not tracing — I'm careful about that word." |
| "That's agentic AI then?" | The most tempting one in 2026 | "Not in the product — single-shot. The agents are in my dev harness." |
| "How much faster did AI make you?" | Fishing for an invented number | "I didn't measure it, so I won't give you a number." |
| "What's your p95?" | Only answerable if you measured | "I haven't load-tested it." Then what you'd do. |

🔵 **The pattern:** each offers a flattering label that's slightly wrong. **Accepting it costs more than declining it.** Interviewers plant these deliberately.

---

## 6. Senior-level signals to hit

Beyond correctness, they're scoring:

- **Ownership** — "I own Sercom", "I run the droplet", "I found it and fixed it"
- **Trade-off reasoning** — never a technology without its cost
- **Knowing what you didn't do, and why** — stronger than having done it
- **Measurement over assertion** — "I reproduced it first", "metering caught the cost bug"
- **Honest boundaries** — volunteer a gap before you're asked
- **Judgment about scale** — "on a team I'd have used Prisma", "that would need K8s"

⚠️ **The seniority question you'll get.** Jan 2023 → now is ~3 yrs 8 mo. "Senior" is defensible in Spain and defensible *by scope*, but it will be probed in NL/DE/Nordic screens. Don't argue the title — answer with scope:

> "By years I'm at the junior end of senior. By scope, I own a production platform end to end — architecture, data layer, infrastructure, CI/CD and the incidents. I'd rather be judged on the second."

---

## 7. Questions to ask them

Signal-bearing, not filler:

- "How does code get from a PR to production, and how long does that take?"
- "What's on call like, and how often does it actually fire?"
- "How do you use AI tooling on the team, and what guardrails did you put around it?"
- "What's the oldest piece of the system, and what would you rewrite?"
- "How do you decide what gets a test?"
- "What does the first 90 days look like for this role?"

🔵 The AI-tooling one is worth asking in 2026 — the answer tells you a lot about the engineering culture, and asking it signals you've thought about the problem rather than the tool.

---

## 8. The night before

1. [`honest-gaps.md`](./honest-gaps.md) — twice. The boundary is what makes the rest confident.
2. The 90-second walkthrough (§2) — out loud, timed.
3. Stories A and B (§3) — out loud.
4. [`glossary.md`](./glossary.md) — skim.
5. Stop. **Do not** try to learn something new the night before; it displaces what you already know.

**The single most useful habit:** for every claim you make, know the file that proves it. If you can't name the file, don't make the claim.
