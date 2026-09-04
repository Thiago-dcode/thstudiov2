# Frontend Architecture

> Next.js App Router, the server/client boundary, and the rendering vocabulary.
> Related: [`architecture.md`](./architecture.md) · [`seo-and-performance.md`](./seo-and-performance.md) · [`nginx.md`](./nginx.md)

---

## 1. What you have

🟢 Next.js 16.3 / React 19.2, App Router. Measured:

| | Count |
|---|---|
| Route pages (`page.tsx`) | 48 |
| Total `.tsx` files | 217 |
| Files with `"use client"` | 107 |
| Server-action files (`.action.ts`) | 44 |
| Locales | 3 (en / es / pt), ~2,280 message lines each |

**~51% client components.** For a media-heavy app with galleries, modals, drag-and-drop and live notifications, that's a reasonable split — interactive surfaces genuinely need client JavaScript. Worth knowing your own number, because "server-first" is a claim an interviewer can check.

---

## 2. Rendering strategies 🔵

The vocabulary interviewers actually test:

| Strategy | When HTML is produced | Use for |
|---|---|---|
| **CSR** — client-side | In the browser, after JS loads | Dashboards behind auth |
| **SSR** — server-side | Per request, on the server | Personalised, fresh content |
| **SSG** — static generation | At build time | Marketing pages |
| **ISR** — incremental static regeneration | At build, then revalidated on a schedule | Content that changes occasionally |
| **RSC** — React Server Components | On the server, streamed as a payload | The default in App Router |

🔵 **RSC is not SSR**, and conflating them is a common tell. SSR renders a component tree to *HTML* per request. RSC renders Server Components to a *serialised payload* that never ships their code to the browser at all. A Server Component's dependencies — a date library, a markdown parser — stay on the server. **RSC is about bundle size and data access; SSR is about when HTML is generated.** They compose.

🟢 Your sitemap route uses `export const dynamic = "force-dynamic"` — the explicit opt-out of caching, with a comment explaining exactly why ([`seo-and-performance.md`](./seo-and-performance.md)).

---

## 3. The server/client boundary 🟢

**`"use client"` marks a boundary, not a file.** Everything imported by a client component becomes part of the client bundle — the directive is where the tree splits, and it's transitive downward.

**Rules worth stating:**

- Server Components can import Client Components. **The reverse is not true.**
- A Client Component *can* render a Server Component passed as `children` or a prop — this is the escape hatch, and knowing it is the difference between fighting the model and using it.
- Props crossing the boundary must be serialisable — no functions, no class instances.

⚠️ **Your recorded convention:** *never add `"use client"` as a side effect of unrelated work* (e.g. adding i18n to a component). Each one is a deliberate decision, because the directive is contagious downward and one careless addition can pull a whole subtree into the bundle.

🟢 `.opencode/agents/reviewer.md` enforces this — *"Default Server Components — flag unnecessary `'use client'`"*. An architectural rule with no lint rule to express it, which is exactly what the reviewer subagent is for ([`testing-and-quality.md`](./testing-and-quality.md#6-quality-gates-and-ai-assisted-code-)).

🔵 **Hydration** is React attaching event listeners to server-rendered HTML. A **hydration mismatch** — server and client rendering different output, typically from `Date.now()`, `Math.random()` or `window` — is the classic App Router bug.

---

## 4. Server Actions 🟢

44 `.action.ts` files. Conventions enforced by the reviewer: `'use server'` as the first line, in a `server-actions/` directory, `.action.ts` suffix, called through a `useHandleAction` hook rather than raw `useTransition`/`useActionState`.

🔵 **What a Server Action is:** a function that runs on the server, callable from client code as if it were local. Next.js generates an RPC endpoint; the "call" is a POST.

⚠️ **The security consequence people miss: a Server Action is a public HTTP endpoint.** It must validate its inputs and check authorisation exactly like any controller. "It's only called from my form" is not a security property — anyone can POST to it directly. 🟢 Zod schemas on the inputs are the mitigation.

🟢 `apps/web/next.config.ts` sets `bodySizeLimit: "300mb"`, with a comment noting it must stay in sync with nginx's `client_max_body_size` (320m) and `MAX_VIDEO_UPLOAD_MB`. **Three limits in three systems that must agree** — and the comment naming all three files is exactly the right way to handle a constraint that can't be expressed in one place.

---

## 5. Caching 🔵

Next.js caching is layered, and being able to name the layers is the skill:

| Layer | Scope |
|---|---|
| **Request memoization** | One render pass — identical `fetch`es dedupe |
| **Data Cache** | Persistent across requests; `revalidate` controls it |
| **Full Route Cache** | Rendered HTML/RSC payload |
| **Router Cache** | Client-side, in-memory, per session |

🟢 Your sitemap shows a deliberate combination: `force-dynamic` on the *route* so assembly always runs, while the underlying `fetch` calls keep `next: { revalidate }` so the *data* stays cached for an hour.

**"Only the assembly is dynamic"** — that's a precise, sophisticated caching decision and a good thing to be able to explain.

⚠️ **The general trap:** aggressive caching plus per-user content leaks one user's data to another. The rule is that anything varying by user must be excluded from shared caches. 🟢 Your BFF layer holds the session token server-side, which is what makes public pages cacheable at all — and there's a related memory: *public fetches need a stable header set to be cacheable*, because a varying header set fragments the cache to uselessness.

---

## 6. Internationalisation 🟢

`next-intl`, three locales, ~2,280 message lines each.

🟢 **`localePrefix: "as-needed"`** — English (default) is unprefixed, `es`/`pt` are prefixed:

```
/artists/thiago        → en
/es/artists/thiago     → es
/pt/artists/thiago     → pt
```

🔵 **The SEO consequence, which is the real reason this matters:** each locale needs a distinct, crawlable URL, and they must reference each other via **hreflang** so Google serves the right one and doesn't treat them as duplicates. Covered in [`seo-and-performance.md`](./seo-and-performance.md).

⚠️ Guardrail from prior work: **don't edit `proxy.ts` or the locale resolver** — routing/locale resolution is settled and changes there have wide blast radius.

---

## 7. Performance 🟢

- **`output: "standalone"`** — minimal server bundle, only reachable `node_modules`. Chosen for the 1 vCPU / 1 GB droplet.
- **`next/image` with a CloudFront remote pattern** — optimisation, responsive `srcset`, lazy loading.
- **`proxy_buffering off` in nginx** — so streamed RSC payloads aren't held until complete ([`nginx.md`](./nginx.md#job-9--buffering-and-streaming)).
- **`typescript: { ignoreBuildErrors: true }`** — safe because CI type-checks first ([`testing-and-quality.md`](./testing-and-quality.md#5-static-analysis-and-types-)).

🔵 **Core Web Vitals** — know the three and what moves them:

| Metric | Measures | Driven by |
|---|---|---|
| **LCP** | Largest Contentful Paint | Image size/format, TTFB, render-blocking resources |
| **INP** | Interaction to Next Paint | Main-thread work, long tasks |
| **CLS** | Cumulative Layout Shift | Images without dimensions, injected content |

⚠️ **You have no field data** — no Real User Monitoring, no Lighthouse CI. Don't claim numbers. LCP is the one that matters most for an image-heavy portfolio product, and CloudFront plus `next/image` is the right foundation for it.

---

## 8. Component organisation 🟢

Conventions the reviewer enforces:

- `.component.tsx` suffix; route-local components in `_components/`
- Service classes extend `BaseService` and use `fetchApi()` — no hardcoded URLs
- No hardcoded hex/px — colours use `globals.css` token aliases; cards use `surface-card`/`surface-card-strong`
- Form fields have **visible labels**, not placeholder-only

🟢 That last one is an accessibility rule enforced in tooling, backed by `.agents/skills/accessibility/` with WCAG reference files. **Placeholder-as-label is one of the most common a11y failures**, and catching it automatically rather than in review is a good detail.

⚠️ **A shared-client hazard worth remembering:** `FetchApi` must never hold per-request state. The shared client is reused across concurrent SSR requests, so per-request values (like an auth token) must be snapshotted per call — otherwise two simultaneous requests swap each other's tokens. **That's a genuinely nasty concurrency bug class and a great thing to be able to describe.**

---

## Interview drills

**"What's the difference between SSR and React Server Components?"**
§2. One of the most common 2026 frontend questions and most answers are mush.

**"When do you use a Client Component?"**
When it needs state, effects, browser APIs or event handlers. Default to server; each `"use client"` is deliberate because the boundary is transitive. Then the number: 107 of 217, and why a media app with galleries and modals sits there.

**"Are Server Actions secure by default?"**
No. They're public HTTP endpoints. Validate and authorise exactly as you would a controller.

**"How does your i18n affect SEO?"**
Distinct crawlable URLs per locale, `as-needed` prefixing, hreflang alternates linking them. Without hreflang they compete as duplicates.

**"Tell me about a concurrency bug."**
The shared `FetchApi` holding per-request state — two concurrent SSR requests swapping tokens. It's subtle, it only appears under load, and it's exactly the class of bug that separates people who've run SSR in production from people who've built it locally.
