# SEO as a System

> Technical SEO engineered rather than bolted on — and three real bugs that shaped it.
> Related: [`frontend-architecture.md`](./frontend-architecture.md) · [`nginx.md`](./nginx.md) · [`llm-engineering.md`](./llm-engineering.md)

**Why this belongs in an engineering knowledge base.** For a portfolio platform, discoverability *is* the product — an artist's page that Google can't index is a page that doesn't exist. Your SEO layer is a genuine subsystem with state, invariants and failure modes, and it's an unusual thing for a backend-leaning engineer to have built.

---

## 1. How search engines actually work 🔵

```
Crawl  →  Render  →  Index  →  Rank  →  Serve
```

- **Crawl** — fetch URLs, honour `robots.txt`, spend **crawl budget** (a finite per-site allowance)
- **Render** — execute JavaScript. Google does this, in a second pass, on a delay.
- **Index** — store what was found, deduplicate via **canonical** signals
- **Rank / serve** — order results, pick a locale

**Two consequences that drive every decision below:**

1. **Server-rendered HTML is indexed sooner and more reliably** than client-rendered content, because it skips the deferred render pass. This is a large part of why an SSR framework matters for this product.
2. **Crawl budget is finite.** Duplicate URLs, redirect chains and dead links spend it on nothing. That's why `www` is a **301 to the apex** ([`nginx.md`](./nginx.md#job-3--host-based-routing-virtual-hosts)) rather than a second copy of the site.

---

## 2. The fail-closed indexability gate 🟢

`apps/web/src/lib/seo/indexability.ts`, used by `robots.ts`, `sitemap.ts` and `[locale]/layout.tsx`.

⚠️ **The problem it solves is severe.** If a dev or staging deployment gets indexed, Google sees two sites with identical content and may rank the wrong one — or treat the real one as duplicate. Recovering is slow and partly out of your hands.

🟢 **The design decision:** `NODE_ENV` cannot distinguish environments here — dev builds run with `NODE_ENV=production` too. So indexability is gated on the **canonical host**: the container's own `APP_URL`. If it isn't the canonical production host, nothing is indexable.

🔵 **Fail-closed vs fail-open** is the key vocabulary. This gate fails *closed*: any uncertainty means "not indexable". The cost of wrongly blocking is a delay; the cost of wrongly allowing is a duplicate-content incident. **Choosing the direction of failure deliberately, per system, is the senior move** — and note you chose the *opposite* direction for content moderation, which fails open ([`llm-engineering.md`](./llm-engineering.md)). Being able to name two systems where you chose opposite defaults, with reasons, is a strong answer.

> **Say this:** "Indexability is fail-closed and keyed on the canonical host rather than `NODE_ENV`, because dev containers also build with `NODE_ENV=production` — so environment alone can't tell you whether you're the real site. If the container's own `APP_URL` isn't the canonical host, robots and sitemap serve nothing indexable. Wrongly blocking costs a delay; wrongly indexing a dev environment costs a duplicate-content problem that takes weeks to unwind."

---

## 3. Sitemap sharding, and the bug that caused it 🟢

`apps/web/src/app/sitemap.ts` + `lib/seo/sitemap-source.ts`.

🔵 **Why shard:** the sitemap protocol caps a file at 50,000 URLs / 50 MB. Beyond that you need an index pointing at multiple sitemaps. With three locales multiplying every entity, that ceiling arrives sooner than you'd think.

🟢 **The design:** shards on **fixed per-entity ID blocks** (`SITEMAP_SHARD_SIZE`) rather than on offset/pagination. The distinction matters — an offset-based shard reshuffles every URL when a row is added; an ID-block shard keeps a given URL in the same shard permanently, which is what makes it cacheable and stable for crawlers.

🟢 **`export const dynamic = "force-dynamic"`, and your comment records two real bugs behind it:**

> *1. Indexability depends on the container's `APP_URL`. A shard baked at build time carries the build environment's answer, so a dev deployment could serve a sitemap of production-identical URLs.*
>
> *2. `generateSitemaps()` runs at build against the previously deployed API, so a prerendered shard could describe stale counts — the bug where the served sitemap listed one entity twice and omitted another entirely.*

⚠️ **Both are the same underlying mistake: build-time data describing runtime state.** That's a general lesson well beyond SEO, and it's the strongest way to tell this story.

🟢 **The cost is near zero**, and the comment says why: every API call in `sitemap-source` is a `fetch` with `next: { revalidate }`, so the data stays cached for an hour and only the *assembly* is dynamic. **A precise caching decision rather than a blunt one.**

### The XML escaping bug 🟢

> *"Next's sitemap serializer interpolates url/href/image values into XML RAW (no escaping), so any `&` (e.g. in presigned S3 / CloudFront query strings) would produce invalid XML that Google rejects."*

🟢 Fixed with an explicit `xmlEscape`, plus the reasoning that Next does no further processing so there's no double-escaping.

**A great small story:** a framework's serializer that doesn't escape, a data source (signed CDN URLs) that reliably contains `&`, and a failure mode that's invisible locally because you only see it when Google rejects the file.

---

## 4. Structured data 🟢

`apps/web/src/lib/seo/json-ld.tsx` — `ImageObject`/`VisualArtwork`, `Person`, `Service` + `Offer`, `FAQPage`.

🔵 **JSON-LD** is Schema.org vocabulary in a `<script type="application/ld+json">` block. It doesn't directly improve ranking; it makes **rich results** possible — the enhanced presentations that materially change click-through.

Choosing types that match the domain (`VisualArtwork` for artwork, `Person` for an artist) rather than generic ones is what makes it useful.

---

## 5. hreflang 🟢

Every `<url>` in the sitemap carries alternates for all three locales.

🔵 **What it does:** tells Google that three URLs are the same content in different languages, so it serves the right one *and* doesn't treat them as duplicates competing with each other.

**The rules that trip people:**

- Alternates must be **reciprocal** — if A points to B, B must point back to A, or Google ignores both
- Must include a **self-referencing** alternate
- `x-default` marks the fallback for unmatched languages
- Language codes are ISO 639-1, optionally with a region (`es` vs `es-MX`)

🟢 Emitting these from the sitemap rather than per-page `<link>` tags is the more maintainable choice — one place to get right.

---

## 6. Image SEO and delivery 🟢

- **S3 + CloudFront** — stable, cacheable CDN URLs
- **`next/image`** with a CloudFront remote pattern — responsive `srcset`, lazy loading, modern formats
- **LLM-generated alt text** per locale ([`llm-engineering.md`](./llm-engineering.md))
- **Image sitemap entries** alongside page URLs
- **Sharp compression to a byte budget** in the worker

⚠️ **Why alt text is genuinely load-bearing here, not a checkbox:** for an image-first product, alt text is most of the indexable text on the page. It's simultaneously an accessibility requirement and the main SEO surface — which is a nice thing to point out, because those two goals are usually presented as separate.

🟢 The deploy script's step 6 (flushing cached user asset URLs) exists because **a cached CDN URL can outlive the asset it points at** — a cache-invalidation bug you already hit and fixed ([`devops-and-cicd.md`](./devops-and-cicd.md#4-the-deploy-script)).

---

## 7. Known issue: the soft 404 ⚠️

🟢 On the media/collection/portfolio routes, `generateMetadata` can return **indexable metadata** while the page renders a "not found" state at **HTTP 200**.

🔵 **A soft 404** is a page that says "not found" to a human while telling a crawler "200 OK, index me". Google detects and penalises the pattern, and it wastes crawl budget on pages with no content.

**The fix** is calling `notFound()` so Next returns a real 404, or returning `robots: { index: false }` from `generateMetadata` for the missing case.

⚠️ It pre-existed for `blocked_at` and was widened by the `!media.url` guard added during the video work. **Still open** — worth fixing before launch, and worth knowing as a "what do you know is broken?" answer.

---

## 8. The rest 🟢

- `robots.ts` — dynamic, gated on `isIndexableEnv()`
- Canonical URLs per page
- `www` → apex 301 at the nginx layer
- HTTPS everywhere, HSTS with preload
- Fast TTFB via `output: "standalone"` and `proxy_buffering off`

🔵 **The hierarchy worth stating:** technical SEO is the *floor*, not the ceiling. It makes content indexable and crawlable; it doesn't make it rank. Content and links do that. Knowing where engineering's contribution stops is more credible than implying you can engineer rankings.

---

## Interview drills

**"How did you approach SEO?"**
As a system with invariants, not a checklist. Lead with the fail-closed indexability gate, because the reasoning (why `NODE_ENV` can't work) is the interesting part.

**"Why is your sitemap dynamic instead of prerendered?"**
§3. Two real bugs, one underlying mistake: build-time data describing runtime state. This generalises well beyond SEO, which is what makes it a good answer.

**"What's a soft 404?"**
§7. Then volunteer that you have one and know the fix. Naming a live bug in your own system reads as ownership.

**"How do you handle multi-language content?"**
`as-needed` prefixing, reciprocal hreflang with self-reference and `x-default`, emitted from the sitemap so there's one place to get it right.

**"Does structured data improve rankings?"**
No — it enables rich results, which change click-through. Correcting that premise precisely is worth more than agreeing.
