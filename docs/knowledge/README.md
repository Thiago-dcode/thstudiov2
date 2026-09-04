# A11STUDIO — Engineering Knowledge Base

**What this is.** A structured walk through your own codebase with the correct technical vocabulary attached to every piece of it, plus the general computer-science context around each topic so the knowledge transfers to systems you didn't build.

**Who it's for.** You, twice over:

1. **To learn.** You built most of this by instinct and by copying good conventions. These files put names to what you did and explain the theory underneath, so the next decision is reasoned rather than intuited.
2. **To interview.** Every file ends with drills — questions you will actually be asked, and answers grounded in code you wrote. Interviews reward *the label plus the reason*. You already have the reason.

---

## The rule that governs every file here

> **Never claim what the repo doesn't contain.**

The fastest way to fail a senior interview is a keyword that collapses on the first follow-up. Every file marks its boundary explicitly, and [`honest-gaps.md`](./honest-gaps.md) collects all of them in one place. Read that file at least twice. Confidence comes from knowing where your boundary is, not from pretending you don't have one — everything on *your* side of the line you can defend all day.

Sections are tagged so you always know what kind of claim you're reading:

| Tag | Meaning |
|---|---|
| 🟢 **In this repo** | Verified present. Cite the file path. Defend it fully. |
| 🔵 **General concept** | Industry background. Know it, but don't imply you built it. |
| 🔴 **Not in this repo** | You must not claim it. Know why you didn't do it — that's the stronger answer. |

---

## Files

### Foundations — read in this order

| File | Covers |
|---|---|
| [`architecture.md`](./architecture.md) | Monorepo vs monolith vs microservices · the tiers · layered/N-tier · hexagonal (ports & adapters) · shared kernel · composition root · dependency rule |
| [`design-patterns.md`](./design-patterns.md) | The Gang-of-Four patterns actually present in your code, each with its file · when each one is the wrong choice |
| [`databases.md`](./databases.md) | Your query builder · indexing · transactions · isolation levels · N+1 · connection pooling · expand–contract migrations |
| [`async-and-messaging.md`](./async-and-messaging.md) | The three async mechanisms and why mixing their names is a tell · BullMQ · delivery semantics · idempotency · the media pipeline |

### Distributed systems — where the interesting failures live

| File | Covers |
|---|---|
| [`scaling-and-replicas.md`](./scaling-and-replicas.md) | Horizontal vs vertical · statelessness · load balancing · health checks · what two replicas do and don't buy you |
| [`realtime-websockets.md`](./realtime-websockets.md) | Polling vs long-polling vs SSE vs WebSocket · gateway design · rooms · pub/sub backplanes · **the two-bug case study** |
| [`nginx.md`](./nginx.md) | Reverse proxies from first principles · all nine jobs your config performs · TLS · the dynamic-upstream trade-off |

### Delivery and operations

| File | Covers |
|---|---|
| [`devops-and-cicd.md`](./devops-and-cicd.md) | Docker images and layers · Compose · your CI pipeline · GHCR · the deploy script · secret handling · deploy strategies you *don't* have |
| [`security.md`](./security.md) | Authn vs authz · JWT trade-offs · 2FA · rate limiting · the trusted-proxy problem · security headers · OWASP framing |
| [`observability.md`](./observability.md) | Logs vs metrics vs traces · correlation IDs · `AsyncLocalStorage` · what you have and the one thing you must not call tracing |
| [`testing-and-quality.md`](./testing-and-quality.md) | The pyramid · what your 786 tests actually cover · CI as a quality gate · your coverage shape, honestly |

### Product surface

| File | Covers |
|---|---|
| [`frontend-architecture.md`](./frontend-architecture.md) | RSC vs SSR vs SSG vs ISR · server actions · the client/server boundary · hydration · caching · i18n |
| [`seo-and-performance.md`](./seo-and-performance.md) | Crawling and indexing · Core Web Vitals · your sitemap sharding · JSON-LD · hreflang · the fail-closed indexability gate |

### AI — the two halves, kept apart

| File | Covers |
|---|---|
| [`llm-engineering.md`](./llm-engineering.md) | What you ship: structured output · guardrails · LLM-as-judge · token metering · grounding (**not** RAG) |
| [`ai-agent-harness.md`](./ai-agent-harness.md) | How you build: Agent Skills · MCP · orchestrator–worker subagents · context engineering |

### Reference

| File | Covers |
|---|---|
| [`glossary.md`](./glossary.md) | Every term in one page, grouped by domain. Pre-interview skim. |
| [`honest-gaps.md`](./honest-gaps.md) | What you must not claim, and the known weak spots with fixes ranked by cost |
| [`interview-prep.md`](./interview-prep.md) | System-design walkthrough · behavioural STAR stories from real incidents · rapid-fire drills · questions to ask them |

---

## Suggested paths

**You have one week before an interview.**

```
Day 1  architecture.md + design-patterns.md
Day 2  async-and-messaging.md + databases.md
Day 3  scaling-and-replicas.md + realtime-websockets.md   ← your best story
Day 4  nginx.md + devops-and-cicd.md
Day 5  llm-engineering.md + ai-agent-harness.md            ← your differentiator
Day 6  security.md + observability.md + testing-and-quality.md
Day 7  honest-gaps.md + glossary.md + interview-prep.md    ← twice
```

**You have one evening.** [`interview-prep.md`](./interview-prep.md), then [`honest-gaps.md`](./honest-gaps.md), then skim [`glossary.md`](./glossary.md). The two case studies in [`realtime-websockets.md`](./realtime-websockets.md) and the throttler bug in [`security.md`](./security.md) are the highest-value things you can have loaded.

**You want to actually get better, not just interview.** Read a file, then open the code it points at, then try to explain the section out loud without looking. The explaining-out-loud step is the one that works; the reading step alone feels productive and isn't.

---

## The system in one diagram

```
                          Browser
                             │ HTTPS
                    ┌────────▼────────┐
                    │   Cloudflare    │  edge: CDN · WAF · DDoS · TLS #1
                    └────────┬────────┘
                             │ TLS #2 (origin cert)
                    ┌────────▼────────┐
                    │      nginx      │  reverse proxy: TLS termination,
                    └───┬─────────┬───┘  rate limiting, headers, host routing
                        │         │
              ┌─────────▼──┐   ┌──▼─────────┐
              │  web × 2   │   │  api × 2   │
              │ Next.js 16 │──▶│  NestJS 11 │  REST + Socket.IO gateway
              │ SSR / RSC  │   │ 42 modules │
              └────────────┘   └──┬──────┬──┘
                   (BFF)          │      │
                        ┌─────────▼─┐  ┌─▼──────────┐
                        │ postgres  │  │   redis    │
                        │ 62 tables │  │ cache +    │
                        │ system of │  │ queue +    │
                        │  record   │  │ ws pub/sub │
                        └───────────┘  └─────┬──────┘
                                             │ 16 queues
                                       ┌─────▼──────┐
                                       │   worker   │  BullMQ consumer:
                                       │  (BullMQ)  │  media · AI · mail
                                       └────────────┘
```

Every box and every arrow has a name. If you can't name one, that's the file to read next.

---

## Scale, in system terms

Numbers verified against the repo, not estimated. Use these in conversation; do **not** use user, traffic or revenue numbers — the product is pre-launch.

| Dimension | Measured |
|---|---|
| Codebase | ~100k lines of TypeScript · 3 apps · 8 shared packages |
| Cadence | 344 commits over 12 months, single author |
| API | 42 feature modules · 116 HTTP endpoints |
| Data | 62 tables · 44 migrations · hand-written ~1,800-line query/schema builder |
| Async | 16 BullMQ queues · dedicated worker container · 7 cron jobs |
| Tests | 786 test cases across 33 files |
| Frontend | 48 App Router pages · 3 locales · server-first component split |
| Infra | Cloudflare → nginx → Docker Compose on DigitalOcean · 2× api + 2× web |
| AI harness | 19 Agent Skills · 8 subagent definitions · 1 MCP server |

---

## Maintaining this

These files describe a moving codebase. When you change something structural, update the file that covers it — a knowledge base that lies is worse than none, because you'll rehearse the lie.

The counts above will drift. Re-derive rather than guess:

```bash
git ls-files | grep -E '\.(test|spec)\.tsx?$' | wc -l          # test files
ls apps/api/src/v1/modules | wc -l                             # modules
ls packages/database/src/migrations | wc -l                    # migrations
git rev-list --count HEAD                                      # commits
```

Related docs outside this folder: [`../ARCHITECTURE-AND-PATTERNS.md`](../ARCHITECTURE-AND-PATTERNS.md) (the original single-file version these were split from), [`../infrastructure.md`](../infrastructure.md), [`../SEO-AUDIT.md`](../SEO-AUDIT.md), [`../deploy-ghcr.md`](../deploy-ghcr.md).
