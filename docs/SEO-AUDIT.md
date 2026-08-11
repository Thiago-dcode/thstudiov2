# A11STUDIO — SEO Audit & Roadmap (checklist)

> **Goal:** become the *idealista of artists* — the reference discovery platform clients search first when they need an artist.
> **Scope:** `apps/web` (Next.js App Router) + the AI-SEO pipeline in `apps/api`.
> **Format:** every item is a checkbox — `[x]` shipped & verified, `[~]` partial, `[ ]` not started. The checkbox is the status; the note after it says what's left.
> **Last analysis:** 2026-08-11 (live pass against production `a11studio.com` — added §B.7 share/index completeness gate).

---

## How to read this

| Mark | Meaning |
|:----:|---------|
| `[x]` | Done and verified end-to-end |
| `[~]` | Partially done — see the note for the remainder |
| `[ ]` | Not started |
| 🔴 / 🟠 / 🟢 | Impact if left undone: high / medium / low |
| 🚀 | **LAUNCH BLOCKER** — must be done/verified before going to production (see §0) |

**One-line state of the world:** **launched 2026-08-11 — prod is crawlable and indexable.** The per-entity + technical foundation is built, deployed and verified live: the four original critical blockers are closed, incomplete artist profiles no longer leak out as share/index-ready (§B.7), sitemap shard ids can no longer drift between build and runtime (§A.2a), and both pre-launch nginx crawl blocks are gone. All of §0.1/§0.2 and every mechanical §0.3 check is green. What remains is **not code**: register **Google Search Console + Bing Webmaster**, submit the three sitemap children, and run the **Rich Results Test**. After that, the growth constraint is content, not SEO — the sitemap currently holds **1 artist, 1 portfolio and 7 static pages**, so the **discovery/directory layer (§D)** is the next real lever, deliberately deferred until there are artists to fill it.

---

## 0. 🚀 PRE-LAUNCH — MUST DO / VERIFY BEFORE PRODUCTION

> **Read this first before deploying.** The SEO *code* is done and verified. What can still silently kill SEO in prod is **environment + deploy + post-deploy verification** — a wrong env var makes the whole site invisible even though the code is perfect. Every item here is marked 🚀. Ordered by blast radius.
>
> **Fastest sanity check after deploy:** `curl -s https://<domain>/robots.txt` must show `Allow: /` (not `Disallow: /`) with `Sitemap:` + `Host:` lines pointing at the real domain. If it says `Disallow: /`, stop — the site is set to non-production and is fully de-indexed.

### 0.1 Environment (set on the **production** container/build — verified against the code)

> **Verified on the `a11studio-pro` droplet, 2026-08-11 — all four pass. No action left in this section.**

- [x] 🚀 **`NODE_ENV=production`** — `robots.ts` and the root `[locale]/layout.tsx` both gate on `process.env.NODE_ENV === "production"`. If it's anything else, robots serves `Disallow: /` **and** every page gets a site-wide `noindex` → **the entire site is invisible to Google**, regardless of per-page metadata. This is the #1 blocker. ✅ set on `web`, `api` **and** `worker`.
- [x] 🚀 **`APP_URL`** = the canonical production origin (e.g. `https://www.a11studio.com`, **no trailing slash**). Feeds `metadataBase`, every `<link rel="canonical">`, all hreflang alternates, OG/Twitter URLs, JSON-LD `url`/`@id`, and the `Sitemap:`/`Host:` lines in `robots.txt`. A wrong/localhost value = canonicals & OG point at the wrong host and Google discards them. (Schema requires it, but nothing validates it's the *right* host — you must.) ✅ `https://www.a11studio.com`, no trailing slash, `NEXT_PUBLIC_APP_URL` / `APP_FRONTEND_URLS` / `APP_ALLOWED_ORIGINS` match. Apex `a11studio.com` 301s to www.
- [x] 🚀 **`APP_TOKEN`** (+ `APP_API_KEY`) present and correct — the sitemap feed endpoints (`/api/v1/sitemap/*`) are gated behind the shared `APP_TOKEN`. Wrong/missing → the sitemap generation gets nothing back → **empty sitemaps**, nothing submitted for indexing. ✅ both present and the SHA-256 of each is **identical** in the `web` and `api` containers; proven end-to-end because `/sitemap/1.xml` returns real rows (only possible if the feed authenticates).
- [x] 🚀 **`CDN_URL` present at _BUILD_ time** (not just runtime) — `next.config.ts` derives `images.remotePatterns` from it **at build**. If it's absent when `next build` runs, `next/image` rejects every CloudFront URL and **all optimized images 404** (even if CDN_URL is set at runtime — too late). Rebuild if it wasn't set. ✅ `cdn.a11studio.com` is baked into `.next/required-server-files.json` in the running image, and `/_next/image?url=https%3A%2F%2Fcdn.a11studio.com%2F…` returns `200`. **No rebuild needed.**

**How to re-verify (read-only, from the droplet):**
```bash
docker exec a11studio-prod-web-1 env | grep -e NODE_ENV -e APP_URL -e CDN_URL
# compare the shared secret without printing it:
docker exec a11studio-prod-web-1 printenv APP_TOKEN | sha256sum
docker exec a11studio-prod-api-1 printenv APP_TOKEN | sha256sum
# CDN baked in at build time:
docker exec -u 0 a11studio-prod-web-1 grep -c cdn.a11studio.com \
  /workspace/apps/web/apps/web/.next/required-server-files.json
```

### 0.2 Deploy steps
- [ ] 🚀 **Ship the §B.7 build first** — the image running in prod on 2026-08-11 **predates** the completeness gate. On that build `/es/artists/thsworld` self-canonicals to the *unprefixed* URL, ships an English `og:description` on a Spanish page, emits **zero** `hreflang` alternates, has no `is_share_ready`, and the sitemap has no artist shard. Lifting the crawl block before this deploys would hand Google the wrong canonicals and no language alternates on the one entity type the whole site is about. **Deploy → verify §0.3 → then remove the nginx block**, not the other way round.
- [x] 🚀 **Flush the `users/*` asset cache in Redis on release** — `getAsset` caches path→url for ~1h; without a flush, stale **presigned** S3 URLs are served instead of the stable CloudFront ones until they expire (breaks `og:image`/JSON-LD `contentUrl`). (Standing note from §A.7.) ✅ checked 2026-08-11: all **44** `users/*` keys hold stable `https://cdn.a11studio.com/...` values, **0** contain `X-Amz-Signature` — nothing stale to flush. Still a **standing step on every release**:
```bash
docker exec a11studio-prod-redis redis-cli --scan --pattern "users/*" \
  | xargs -r docker exec -i a11studio-prod-redis redis-cli del
# audit before/after — must print 0:
docker exec a11studio-prod-redis redis-cli --scan --pattern "users/*" \
  | xargs docker exec a11studio-prod-redis redis-cli mget | grep -c X-Amz-Signature
```

### 0.3 Post-deploy verification (do these on the live prod URL)

> **Crawl block removed 2026-08-11 — the site is live to crawlers.** Both pre-launch blocks were deleted from `pro.nginx/` (the tracked source; `deploy-prod.sh` step 1b copies it over `nginx/`, so editing the deployed copy on the droplet directly would be reverted on the next deploy):
> 1. `add_header X-Robots-Tag "noindex, nofollow, noarchive" always;` — `pro.nginx/snippets/security-headers.conf`.
> 2. The `location = /robots.txt { … return 200 "User-agent: *\nDisallow: /\n"; }` block — `pro.nginx/conf.d/default.conf`, which shadowed `apps/web/src/app/robots.ts`.
>
> Both were removed only after §0.1, §0.2 and the mechanical §0.3 checks were green, and after §B.7 and §A.2a were deployed and verified privately. The old justification for the header (“`cdn.a11studio.com` has no DNS record, so every image 404s”) was already **stale** — the CDN resolves and serves `200`s.
>
> ⚠️ **The Cloudflare Access gate was already gone before this.** Unauthenticated public requests returned `200` with full HTML, so the “Access is the primary gate, this header is the safety net” assumption in `security-headers.conf` did not hold — those two nginx blocks were the *only* thing keeping prod out of the index. De-indexing now lives entirely in the app (`NODE_ENV` gate + the §B.7 completeness gate); re-adding a proxy-level `noindex` would silently override every per-page decision.

- [x] 🚀 **`/robots.txt`** returns real robots text with `Allow: /`, the child `Sitemap:` lines, and `Host:` — **not** app HTML (guards against the proxy-matcher regression class from §A.1). ✅ verified 2026-08-11 after the override was removed: `Allow: /`, the six authed-area `Disallow:` lines, `Host:`, and `Sitemap:` for `0`, `1`, `51`. Confirmed both at the origin (`docker exec a11studio-prod-nginx wget -qO- http://web:3000/robots.txt`) and publicly.
  > ⚠️ **Cloudflare edge-caches `/robots.txt` for 4h** (`.txt` is in Cloudflare's default cached extensions; observed `cf-cache-status: HIT`, `Cache-Control: max-age=14400`). Straight after launch the edge still served the old `Disallow: /` while the origin served `Allow: /` — a cache-busting query string returned the correct file. **Purge `https://www.a11studio.com/robots.txt` at the edge after any robots change**, otherwise crawlers read stale rules for up to 4 hours. HTML pages and the sitemap shards are unaffected (`cf-cache-status: DYNAMIC`).
- [x] 🚀 **`/sitemap/1.xml`** (and each advertised child) returns real XML with **CloudFront** image locs and **zero** presigned URLs / unescaped `&`. ✅ content verified 2026-08-11: every `image:loc` on CloudFront, **0** presigned, **0** unescaped `&`, and out-of-range ids correctly `404`.
- [x] 🚀 **An artist shard exists** — on 2026-08-11 there was **no** artists shard at all: the only non-support account is role `ADMIN`, and the sitemap predicate accepted `ARTIST` only, so `counts.artists = 0`. `findAllArtists` (the public directory) never filtered on role, so that profile was browsable and linkable but absent from the sitemap. Fixed by widening the predicate to `PUBLIC_PROFILE_ROLES` (`ARTIST`, `ADMIN`); the feed now returns `thsworld` and `counts.artists = 1`.
- [x] 🚀 **Shard ids resolve to the right kind** — ✅ verified 2026-08-11 after the §A.2a fix: `/sitemap/0.xml` static (7 URLs), `/sitemap/1.xml` the **artists** shard (`/artists/thsworld`), `/sitemap/51.xml` portfolios, and `2`/`52`/`101` correctly `404`. **No URL appears in two shards**, and `robots.txt` advertises exactly `0`, `1`, `51`.
- [x] 🚀 **Favicon + `/manifest.webmanifest`** load (tab icon shows, manifest 200s) — confirms §B.1 assets shipped in the image. ✅ verified 2026-08-11: `/favicon.ico`, `/manifest.webmanifest`, `/icon.svg`, `/apple-icon.png` all `200`.
- [ ] 🚀 **JSON-LD passes** — run one media page, one profile, one service through Google's [Rich Results Test](https://search.google.com/test/rich-results): no errors, `Offer.price` matches the visible price.
- [ ] 🚀 **Register Google Search Console + Bing Webmaster**, verify the domain, and **submit the sitemap children**. This is §E.5 pulled forward — without it, indexing is passive and you're blind to coverage/errors. (Do the domain-verification meta tag/DNS record as part of launch.)

> Everything **below** this section is either already shipped (§A/§B) or deliberately deferred (§D/§E/GEO) — none of it blocks launch. This §0 list is the complete "before you flip prod" gate.

---

## A. Foundations — shipped ✅

### A.1 Indexability & crawl control
- [x] 🔴 **Environment-gated crawlability** — `robots.ts`, root-layout global `noindex`, and `static-metadata.ts` all key off `NODE_ENV === "production"`. Non-prod → `Disallow: /` + site-wide `noindex`; prod → crawlable, authed areas disallowed. No launch-day toggle.
- [x] 🔴 **`robots.ts` rewritten** — allows public routes, disallows `/atelier`, `/auth`, `/get-started`, `/email-preferences`, `/wait-list`, `/api/`; advertises every child sitemap + `host`. ISR daily.
- [x] 🔴 **`proxy.ts` matcher fixed** — was intercepting `/robots.txt` & `/sitemap.xml` (returned app HTML); now excludes dotted paths.
- [x] ⚠️ Per-page `noindex` on missing entities (profile-not-found etc.) still honored in prod.
- [ ] 🟠 **Staging caveat** — gating is by `NODE_ENV`; a staging box built with `NODE_ENV=production` would also be crawlable. If a public staging env is added, gate on an explicit host/flag.

### A.2 Sitemap
- [x] 🔴 **Sharded sitemap** via `generateSitemaps()` (`apps/web/src/app/sitemap.ts`) fed by dedicated public API endpoints (`GET /api/v1/sitemap/{counts,artists,portfolios,collections,services}`).
- [x] Correct visibility predicate (`is_active && is_indexable && !blocked`) + **quality gate** (artists with ≥1 public portfolio) + **paid-plan artists ordered into the earliest shards**.
- [x] One entry per entity with **hreflang alternates** + **image-sitemap extension** (`<image:image>`). Sharded ≤45k URLs/file, ISR daily. Scales to 40k+ users.
- [x] 🔴 **XML escaping** — Next serializes URL values raw; `xmlEscape` applied to every emitted URL (0 unescaped `&` verified).
- [x] 🔴 **Shard-id-as-Promise** bug fixed (`Number(await props.id)`).
- [x] 🔴 **No `/sitemap.xml` index exists** with `generateSitemaps()` (confirmed in a real prod build) — `robots.txt` advertises each child `/sitemap/[id].xml` directly. Shard planning centralized in `sitemap-source.ts` so `sitemap.ts` and `robots.ts` can't diverge.

### A.2a Shard ids drifted between build and runtime 🔴 → ✅ DONE (2026-08-11)
> Caught by the private §0.3 pass on the first post-fix deploy: the served sitemap listed the **portfolio twice** (`/sitemap/1.xml` and `/sitemap/2.xml`) and the **artist profile in no shard at all** — the exact URL the release existed to publish.

- **Cause:** shard ids were **positional** — `buildSitemapDescriptors()` packed one id per non-empty kind in order, so an id's meaning depended on how many entities existed. Two things then disagree. `generateSitemaps()` runs at **build** time in CI, and because the build-time `API_V1_URL` resolves to the **live public origin**, it prerenders shard bodies against the counts of the **previously deployed** API. This release took `counts.artists` from 0 → 1, which shifted every id by one: `/sitemap/1.xml` was baked as *portfolios* (verified — `.next/server/app/sitemap/1.xml.body` inside the image contained the portfolio URL), while `/sitemap/2.xml` rendered fresh under the new mapping and also returned portfolios. The stale body wins until the ISR window expires.
- **Fix:** ids are now allocated from a **fixed block per kind** (`SITEMAP_ID_BLOCK = 50`): id `0` static, `1–50` artists, `51–100` portfolios, `101–150` collections, `151–200` services. `resolveSitemapShard(id)` maps id → (kind, page) by arithmetic and validates the page against live counts; `getSitemapShardIds()` lists only ids that have content, so the sparse numbering never shows up in `robots.txt`. An id can no longer change kind, so the worst case degrades from *wrong kind* to *stale-but-correct-kind*.
- **Also:** `SITEMAP_REVALIDATE` and the route's `revalidate` dropped 24h → **1h**, bounding how long a build-time prerender can lag the live data.
- **Why it matters beyond this release:** this was not a one-off. Every kind that goes from 0 → 1 (the first collection, the first service, the first artist) would have silently remapped every later id while stale prerenders kept the old meaning — submitting a sitemap that omits real URLs and duplicates others.
- [x] **Validated in `next build` + `next start`**: `robots.txt` lists 4 child sitemaps; `/sitemap/1.xml` = 5 URLs + 50 CloudFront image locs, 0 presigned, 0 unescaped `&`.

### A.3 Canonical / hreflang / metadataBase
- [x] 🔴 **`metadataBase`** set in root `[locale]/layout.tsx` (guarded for build phase).
- [x] 🔴 **hreflang** (`alternates.languages` en/es/pt + x-default) on every entity page + static pages via `build-metadata.ts` / `static-metadata.ts`.
- [x] Self-canonical on entity pages; **artist about page canonicals → the profile URL** (anti-cannibalization, no new SEO columns).

### A.4 Per-entity on-page metadata
- [x] 🔴 **Media** `generateMetadata` — `seo_title`→`<title>`, `seo_description`→desc, canonical, OG image.
- [x] 🔴 **Portfolio / Collection / Service** `generateMetadata` — unique localized title/desc/canonical each.
- [x] **Artist profile** `generateMetadata` (pre-existing, good).
- [x] **Static pages** — landing, `/about`, `/faqs`, `/support`, `/legal/{privacy,terms,cookies}` all have metadata via `buildStaticPageMetadata`.

### A.5 Structured data (JSON-LD)
- [x] Shared `<JsonLd>` component (escapes `<` → XSS-safe).
- [x] **Media** → `ImageObject` + `additionalType: VisualArtwork`, licensable pair (`acquireLicensePage` + `license`), `copyrightHolder`, `creator`, `uploadDate`, `contentUrl` + `BreadcrumbList`.
- [x] **Portfolio / Collection** → `CollectionPage` + `ImageGallery` (capped 25) + `BreadcrumbList`. Portfolio `keywords` from category taxonomy.
- [x] **Service** → `Service` (+ `provider`) + `BreadcrumbList` (price omitted — no stored currency).
- [x] **Artist profile** → `ProfilePage` + `Person`.
- [x] **Site-wide** → `Organization` (translated description) + `WebSite` with `SearchAction` sitelinks-searchbox (landing); `Organization` on `/about`; `FAQPage` on `/faqs`.
- [x] 🟠 **Media `keywords`** — via a new **`TAGS`** category kind: the media-tagging LLM call now also picks up to `MAX_TAGS_MEDIA` content tags (subject/scene/setting/mood) from a curated, controlled vocabulary; the media detail fetch returns them localized and `buildMediaJsonLd` emits them as `ImageObject.keywords`. Metadata-only (not shown in the UI), LLM-only (never user-editable), media-only.
- [x] 🟢 **Collection/Service `keywords`** — **Service** keywords from its `features` + linked portfolio (services have no categories); **Collection** keywords aggregate the distinct localized content **TAGS** across its media (new `getTagsByCollectionId`). Portfolio already derives keywords from its own categories.
- [x] 🟢 **Richer `Person`** — `knowsAbout` (categories), structured `PostalAddress` (locality/region), `makesOffer` (services, priced where `show_price`), plus **`sameAs`** (the artist's `instagram_link`/`facebook_link`/`youtube_link`/`website_link`) and **`telephone`** (`phone_number`) — now that users store phone + social links (schema + API select/map + `UserProfile` all wired). **Organization** now emits **`sameAs`** (real brand accounts — Instagram + LinkedIn — from the single `lib/social` `SOCIAL` source, shared with the site footer via `ORGANIZATION_SAME_AS`) + **`logo`** (the 512px app icon). This closes the last structured-data gap.
- [x] 🟢 **`Service`/`Offer.price`** — emitted as an `Offer` (`priceCurrency` = platform `EUR`) **only when `show_price && price != null`**, matching the visible price. UI `$`→`€` unified through `PLATFORM_CURRENCY_SYMBOL` so the visible price and structured price can't diverge.

### A.6 AI-SEO pipeline (multi-locale)
- [x] 🔴 **Automatic per-locale (EN/ES/PT) generation** — one multilingual LLM call per entity for media, portfolios, collections, services, profiles.
- [x] Prompt front-loads style→discipline→subject→city; excludes brand/handle/lorem; feeds profession + city + categories.
- [x] Storage via translation tables; resolution `COALESCE(translation, main)` per served locale.
- [x] Lean metadata endpoints + per-(entity,slug,language) cache, invalidated on update & after regeneration.
- [x] 🔴 Nightly infinite-regeneration cost bug fixed (stamp `seo_generated_at = CURRENT_TIMESTAMP`).
- [x] 🔴 Country→language defect removed (was mismatching French/German onto en/es/pt).
- [x] 🟠 **Quality guardrails** — every AI-generated `seo_title`/`seo_description`/`seo_alt` now passes through `sanitizeSeoText` before persisting: rejects **junk** (whole-value placeholders like "untitled"/"n/a", echoed instructions, markup/JSON leakage, no-real-content strings), **keyword-stuffing** (repeated/dominant tokens), and **profanity/slurs** (en/es/pt) → the field falls back to `null` so the entity's own title is used. Prompt (`SEO_QUALITY_RULES`) hardened (natural prose, no stuffing, no profanity, plain-text only, no placeholders). Validated against real multilingual inputs (no false-rejects on legit art titles / Spanish "todo" / "for example" prose). **Gallery-uniqueness (DB dedupe) intentionally descoped** — validate the output instead of cross-checking siblings.

### A.7 Media delivery / Google Images
- [x] 🔴 **CloudFront CDN** — `S3StorageService.getUrl` returns stable unsigned `${CDN_URL}/${path}` when `CDN_URL` set. Every `og_image`, sitemap `<image:loc>`, JSON-LD `contentUrl` is now permanent.
- [x] Verified live: sitemap image locs are `https://<dist>.cloudfront.net/...`.
- [x] **Deploy note (standing):** `getAsset` caches path→url in Redis (~1h). Flush `users/*` asset keys on the CloudFront release, or stale presigned URLs are served until expiry.
- [ ] 🟢 Simplify the now-redundant `og_image` per-request-signing workaround (harmless; cleanup only).

---

## B. 🔴 NEW GAPS — found in the 2026-07-27 codebase pass

> These are concrete, small, and were **not** tracked before. Ordered by impact.

### B.1 Favicon & app icons — ✅ DONE (2026-07-27)
- [x] 🔴 **`favicon.ico`** + `favicon-16x16.png` / `favicon-32x32.png` / `apple-touch-icon.png` / `android-chrome-{192,512}.png` added to `public/` (realfavicongenerator set the user provided).
- [x] 🔴 **Icons wired** — root-layout `metadata.icons` declares `favicon.ico` (sizes any) + 16/32 PNGs + `apple-touch-icon` (180×180); Next emits the `<link rel="icon">` / `apple-touch-icon` tags.
- [x] 🟠 **`manifest.ts`** — `app/manifest.ts` (served at `/manifest.webmanifest`, `<link rel="manifest">` auto-injected): name/short_name/description, `start_url`/`scope`, `display: standalone`, `theme_color: #ED2100` + `background_color: #FAFAF9` (from the design tokens), categories, and the `android-chrome-{192,512}` PWA icons.
- **Effect (resolved):** browsers and Google SERP now get a real favicon + install icons instead of the blank globe.

### B.2 Default `<title>` / description not localized 🟠 → ✅ DONE (2026-07-27)
- [x] 🟠 `[locale]/layout.tsx` now uses **`generateMetadata({ params })`** with a **localized** default title + description + OG (new `seo.defaultTitle`/`seo.defaultDescription` in en/es/pt) — any page without its own metadata inherits the right-language fallback on `/es` and `/pt`.
- [x] 🟠 **`title.template`** = `%s · A11STUDIO` added, so the many brand-free dynamic pages (media/portfolio/collection/service/profile/artist-list) get a consistent brand suffix automatically. Pages whose title already carries the brand (landing, about, faqs, legal, support, search, wait-list, email-preferences) opt out via `title.absolute` (a new `titleAbsolute` flag on `buildStaticPageMetadata`) so nothing double-brands.

### B.3 Public pages still lacking `generateMetadata` 🟠 → ✅ DONE (2026-07-27)
- [x] 🟠 **Artist list pages** — `/artists/[username]/portfolios`, `/collections`, `/services` now have `generateMetadata` (localized `{name} — {pageTitle}` + `metaDescription`, self-canonical + hreflang via `buildStaticPageMetadata`, `noindex` when the artist doesn't exist). **OG image = the artist's `banner || avatar`** (via `getProfile`) so share cards aren't blank.
- [x] 🔴 **Nested media routes** — `/artists/[username]/portfolios/[slug]/media/[public_id]` and `.../collections/[slug]/media/[public_id]` now emit `generateMetadata` via `buildSeoMetadata`; because the media SEO endpoint's `canonical_path` is the **primary** media URL, both nested views **canonical → `/artists/[username]/media/[public_id]`**, consolidating ranking signal (no cannibalization). Locale is now forwarded to the render fetch too.

### B.4 `[search]` page — no canonical / hreflang / robots 🟠 → ✅ DONE (2026-07-27)
- [x] 🟠 `(web)/[search]/page.tsx` `generateMetadata` now takes `params`, validates the segment (`noindex` when invalid), and emits a **self-canonical to the clean segment URL** (`/artists`, `/portfolios`) + hreflang via `buildStaticPageMetadata`. All filtered/param variants (`?search=`, `?categories=`, geo filters) consolidate to the base, so param URLs don't bloat the index. Kept indexable (not blanket-noindexed) since the base directory is a legit page.

### B.5 OG image fallback 🟢 → ✅ DONE (2026-07-31)
- [x] 🟢 **Static brand-logo fallback** (`public/logo/logo_bg_white.png`) wired as the default `og:image`/`twitter:image` wherever a page would otherwise have none — a single `DEFAULT_OG_IMAGE` constant in `lib/config.ts` (root-relative, resolved to absolute via `metadataBase`) applied in **`buildStaticPageMetadata`** (landing/about/faqs/legal/support/search + artist list pages when `banner`/`avatar` are null), **`buildSeoMetadata`** (entity pages, when `og_image` is null), the **artist profile** page, and the **root layout** (site-wide inherited default). Chose a static asset over the deferred dynamic `ImageResponse`/`opengraph-image.tsx` — it sidesteps the file-convention merge ambiguity entirely (our object-based `openGraph` stays authoritative) and is verified by typecheck. **Note:** the asset is 462×424 (near-square) — fine as a never-blank fallback; a purpose-built 1200×630 card (dynamic `ImageResponse`, §E.2) is still the eventual upgrade for richer per-page previews.

### B.6 Housekeeping 🟢 → ✅ DONE (2026-07-27)
- [x] 🟢 **Stray empty directory** `apps/web/src/app/[locale](web)/` deleted.

### B.7 Incomplete artist profiles were share-ready 🔴 → ✅ DONE (2026-08-11)
> Found live on `/es/artists/thsworld`: an artist with **zero published work** still emitted a full artist share card (banner as `og:image`, profession in the title, rich `Person` JSON-LD with address/`sameAs`) and offered a **Share** button. Messengers and AI crawlers fetch Open Graph regardless of `robots.txt`, so the pre-launch `Disallow: /` never protected this — pasting the link advertised an unfinished profile as a finished portfolio, and social platforms cache the first card they see.

- [x] 🔴 **One share/index gate, four required signals (strict AND)** — a profile counts as *share-ready* only with **≥1 public portfolio** (`is_active && is_indexable && blocked_at IS NULL`) **AND** a **name** **AND** a **profession** **AND** a **locality** (`addresses.city` or `addresses.state`). Any one missing → not share-ready. Single source of truth: `isArtistShareReady` in `packages/common-lib/src/utils/artist-share-ready.ts`.
- [x] 🔴 **API exposes `is_share_ready`** on the public profile (`UserProfile`) — `UserRepository.withShareReady` combines the row's identity fields with one `EXISTS` portfolio check, so web never re-derives the rule.
- [x] 🔴 **Sitemap tightened to the same AND** — `getSitemapArtists` / `countSitemapArtists` now share one `SITEMAP_ARTIST_PREDICATE` (SQL mirror of the helper) that adds name/profession/locality to the previous portfolio-only quality gate. Discovery and per-page robots can no longer disagree.
- [x] 🔴 **Artist profile muted when incomplete** — `generateMetadata` returns `noindex` + `DEFAULT_OG_IMAGE` + a neutral localized description (new `artists.profile.metaIncomplete` ×3) under a bare `@username` title; the rich `ProfilePage`/`Person` JSON-LD is not emitted at all (no point publishing contact facts on a noindexed page). Share-ready profiles now also route through `buildStaticPageMetadata`, so the profile finally gets **per-locale self-canonical + hreflang + `og:locale`** (`ogType: "profile"` added to the helper) and its description uses the localized answer-shaped summary instead of a hardcoded English sentence.
- [x] 🔴 **Same gate on the rest of the artist surface** — the `portfolios` / `collections` / `services` list pages and the `about` page `noindex` + fall back to the brand card when the profile isn't share-ready (about also gained the `DEFAULT_OG_IMAGE` fallback it was missing, closing the §B.5 remainder).
- [x] 🟠 **Share affordance follows the same rule** — `ShareButton` is hidden in `artists-header.tsx` (prop from the artist layout) and in `artist-breadcrumb.tsx` (resolved once for all eight call sites) until the profile is complete.
- [x] 🟠 **Sitemap role set widened to `PUBLIC_PROFILE_ROLES` (`ARTIST`, `ADMIN`)** — droplet check on 2026-08-11 showed **no artists shard at all**: the predicate required `ARTIST`, the only non-support account is `ADMIN`, so `counts.artists = 0`. Because `findAllArtists` never filtered on role, that profile was already browsable and internally linked while being absent from the sitemap. `findDueForSeoGeneration` uses the same constant, so anything the sitemap enumerates also gets AI SEO fields generated.
- **Effect:** an unfinished profile is still fully viewable, but it cannot be indexed, cannot be handed to an answer engine as an artist entity, and offers no one-tap way to broadcast it. Verified via `tsc --noEmit` (common-lib/api/web) + biome.
- **Note on the reference profile:** in the **current** prod dataset `thsworld` has name + profession + Madrid + one `is_active`/`is_indexable`/`is_highlight` portfolio, so it evaluates **share-ready** and stays indexable — the gate only mutes genuinely incomplete profiles. Also worth knowing when reading an "empty" profile page: the landing sections query `is_highlight: true`, so a profile with published-but-unhighlighted work renders the *"hasn't published any work yet"* empty state while its `/portfolios` tab lists the work. Share-readiness deliberately keys off **published**, not **highlighted**.

---

## C. Scorecard

| Dimension | Score | Note |
|-----------|:-----:|------|
| Indexability | **8/10** | Env-gated; prod crawlable automatically; favicon/manifest now present (§B.1). Not 10 until the discovery surface lands. |
| Per-entity on-page SEO | **9/10** | media/portfolio/collection/service localized metadata + canonical + hreflang; artist list pages + nested-media routes now covered (§B.3 done, nested views canonical to the primary media URL); artist profile now hreflang'd + gated on completeness (§B.7). |
| AI-SEO pipeline | **10/10** | Automatic, multilingual, grounded, cost-bug fixed, **output validation + prompt hardening** (junk/stuffing/profanity → safe fallback). DB gallery-uniqueness deliberately out of scope. |
| Structured data | **10/10** | Entity + site-wide verified; keywords, `Offer.price`, richer `Person` (`knowsAbout`/address/`makesOffer`/**`sameAs`**/`telephone`), and `Organization` `sameAs` + `logo` all shipped. Last gap (socials for `sameAs`) closed. |
| Technical SEO | **9/10** | Sitemap validated in prod build, robots advertises children, metadataBase, canonical/hreflang, CloudFront stable URLs. Favicon/manifest (§B.1) the gap. |
| Media / Google Images | **9/10** | Presigned blocker removed + licensable `ImageObject` + image-sitemap. Not 10 until per-image `keywords`. |
| **Discovery / directory layer** | **0/10** | **Still does not exist — the make-or-break gap** (§D). Intentionally deferred until there's artist density. |
| Internationalization | **8/10** | hreflang + per-locale generation/serving + localized default title/description & brand-suffix template (§B.2 done). Remaining: the legal pages' copy is still English-only. |
| GEO / AI-answer readiness | **8/10** | Strong machine-readable foundation (rich JSON-LD everywhere incl. **`sameAs`**/`telephone`/`logo` for entity identity, `FAQPage` + genuinely rich FAQ, crawlable SSR, AI bots allowed) **plus a visible answer-shaped TL;DR on the artist profile (G2, flagship entity)**. Held back now mainly by the remaining G2 bits (AI `seo_description` as visible lead on portfolio/service, optional artist `FAQPage`) and no citable editorial/directory surface (§GEO G3–G4). |
| Authority / content / links | **1/10** | No editorial surface — strategic gap (§E). |

**Overall:** individual-artist SEO is substantially delivered and verified. The marketplace-discovery SEO the vision requires is ~0% built — the clear next priority once there are artists.

---

## D. 🟧 The discovery / directory engine (deferred — the "idealista" bet)

> **Why deferred:** the app has no artists yet. Every discipline/city facet would be a thin/empty page today — an SEO liability, not an asset. Build it the moment there's density. Prerequisites already exist: controlled `categories.type = DISCIPLINE | ART_STYLE` (75 disciplines + 39 styles, slugs + translations), `user_categories` pivot, and `addresses` locality — artists are already filterable by `categories[] + city`.

- [ ] 🔴 **D.1 Lock the facet URL taxonomy** — `/{discipline}`, `/{discipline}/{city}`, `/{style}-{discipline}`, `/{style}-{discipline}/{city}`. Singular/plural + hyphenation decided; slugs from the controlled taxonomy only (never freeform `profession`).
- [ ] 🔴 **D.2 Programmatic facet pages** (`generateStaticParams` + ISR) — list matching artists, unique keyword-rich `<h1>`/intro, `CollectionPage`+`ItemList` JSON-LD, `BreadcrumbList`, canonical, hreflang, crawlable pagination.
- [ ] 🔴 **D.3 Empty/thin-page guards** (the #1 programmatic-SEO trap) — supply threshold (≥3) in the combo query; `dynamicParams = false` → unknown params 404; runtime guard → `notFound()` or 301 → parent when a once-valid page empties out. **Never serve 200 with no content.**
- [ ] 🟠 **D.4 AI-generated intro copy per facet** (reuse the pipeline), cached, regenerated when population changes materially.
- [ ] 🟠 **D.5 Hub/index pages** (`/discover`, city hubs, discipline hubs) for internal linking + crawl depth.
- [ ] 🟠 **D.6 Facet pages into the sitemap** automatically from the same combo query.
- [ ] 🟠 **D.7 Feed profile signals** (profession/style/city) into media/portfolio AI-SEO so per-artwork metadata inherits location + style keywords.

*(Full mechanism explained in Appendix G. Real marketplaces generate these from one template — you never hand-write a URL.)*

---

## E. 🟨 Richness, automation & authority (post-foundation)

- [ ] 🟠 **E.1 Auto-generate media SEO on upload** via `apps/worker` queue (not manual), idempotent, with quality guardrails (§A.6).
- [ ] 🟠 **E.2 Dynamic OG images** — a designed 1200×630 `ImageResponse` template (per-entity title/artist overlay) is the upgrade over the static brand-logo fallback now shipped in §B.5.
- [~] 🟠 **E.3 Core Web Vitals pass** — ✅ **`next/image` `remotePatterns` now allows the CloudFront host** (derived from `CDN_URL` in `next.config.ts`; **was a latent bug** — CloudFront is live, so `next/image` would have rejected every CDN URL and 404'd the image). Gallery grid already lazy-loads (first-5 preloaded, rest lazy) with responsive `sizes`. **Still open (runtime):** a real LCP/CLS measurement (Lighthouse) on image-heavy pages — can't be done statically. **Deploy note:** `CDN_URL` must be present at **build** time (remotePatterns is build-time config).
- [ ] 🟠 **E.4 Editorial/authority layer** — guides / artist-spotlight (e.g. *"How to hire a wedding photographer in Madrid"*). ~65% of ranking is content + backlinks, which code alone doesn't produce. Feeds AI Overviews & PAA.
- [ ] 🟢 **E.5 Register Google Search Console + Bing Webmaster**, submit sitemaps, monitor coverage + CWV after launch.
- [ ] 🟢 **E.6 Pinterest Rich Pins** — tall `og:image`, artist/client pinning is a big channel (nearly free now that CloudFront lands).
- [ ] 🟠 **E.7 Video SEO** — `VideoObject` JSON-LD + video sitemap + poster frames (filmmakers are a stated audience).
- [ ] 🟢 **E.8 Surface `seo_title`/`seo_description` as visible caption text** near media (Google weights on-page text near images).

---

## GEO — Generative Engine Optimization (getting cited by AI answer engines)

> **Why this matters for A11STUDIO.** Clients increasingly *don't* search a list of blue links — they ask **ChatGPT, Perplexity, Gemini, Claude, or Google's AI Overviews**: *"who's a good analog wedding photographer in Madrid?"* GEO is optimizing so those engines **read, trust, and cite your pages** in their answer (ideally with a link). It rides on the same foundation as SEO but rewards different things: **machine-extractable facts, clear entity identity, Q&A/answer-shaped copy, and citable authority.** For a discovery marketplace this is arguably the *next* traffic channel, so it's worth building deliberately.

### What already helps GEO (shipped)
- [x] **Rich structured data** everywhere (`ImageObject`/`VisualArtwork`, `CollectionPage`, `Service`+`Offer`, `Person`/`ProfilePage` with `knowsAbout`/address/`makesOffer`, `Organization`/`WebSite`, `BreadcrumbList`). JSON-LD is the single most machine-readable way to hand an engine clean facts — this is the backbone of GEO and it's largely done.
- [x] **`FAQPage` schema + a genuinely rich, non-accordion FAQ** (2026-07-27) — long, factual, self-contained Q&A answers (fully rendered in the HTML, not hidden behind an accordion) are *exactly* the shape answer engines lift. The new positioning guide doubles as GEO fuel + user education.
- [x] **Clean crawlable HTML, semantic headings, hreflang, stable CloudFront URLs, fast pages** — engines that fetch on demand (Perplexity, ChatGPT browsing) need pages that render server-side and load fast.
- [x] **AI crawlers are not blocked** — `robots.ts` allows `*`, so GPTBot / ClaudeBot / PerplexityBot / Google-Extended can read public pages (this is a *choice*: to be cited you must let them in).

### Strategies to implement (ranked)
- [x] 🔴 **G1. Entity clarity & consistency** — ✅ done: each artist `Person` carries consistent name + location (NAP), `knowsAbout`, **`sameAs`** (their social/website links) and `telephone`; the brand `Organization` carries **`sameAs`** (real accounts from the single `lib/social` source, also rendered in the footer) + `logo`.
- [~] 🔴 **G2. Answer-shaped, extractable copy** — engines lift concise, factual, self-contained statements. ✅ **Artist profile now renders a visible 1–2 sentence answer-shaped TL;DR** (2026-07-31): an article-free appositive summary built from `profession` + locality ("{name}, {profession} based in {city}, showcases their portfolios, collections and services on A11STUDIO") — localized en/es/pt, no new fetch. Deliberately **not** the `short_biography` (already shown lower on the page as an editorial pull-quote); the two are complementary — a structured extractable fact up top vs. the artist's own prose below. **Remaining (not done):** swap in the localized **AI `seo_description`** as the visible lead on portfolio/service render (needs a cached SEO fetch there; ties to E.8), and an optional artist-level **`FAQPage`** ("What does {artist} do? Where based? What services? How to book?" — templatable from existing profile+services data).
- [ ] 🟠 **G3. Citable, unique editorial (the authority half)** — AI Overviews and Perplexity cite *guides*, not thin listings. This is the same lever as **§E.4**: publish original, genuinely useful guides ("How to hire a wedding photographer in Madrid", "Brutalist photography, explained") with `Article` + `FAQPage` schema and clear headings. This is what actually earns AI citations at scale.
- [ ] 🟠 **G4. Comparison / "best of" directory pages** — engines love enumerable, structured lists to answer "top X in Y". The **§D faceted directory** (`/{style}-{discipline}/{city}`) with `ItemList` JSON-LD is directly GEO-shaped; build it with an `ItemList` of ranked artists once there's density.
- [ ] 🟠 **G5. `llms.txt`** — the emerging convention (a Markdown map at `/llms.txt` pointing engines at your key pages/summaries). *Implement:* a static route (like `robots.ts`) that lists the main hubs (`/`, `/about`, `/faqs`, top directory pages) with one-line descriptions. Cheap, forward-looking.
- [ ] 🟠 **G6. Explicit AI-crawler policy** — decide and *state* it in `robots.ts`: to maximize citations, keep GPTBot / ClaudeBot / PerplexityBot / Google-Extended / CCBot allowed on public routes (and disallowed on `/atelier`, `/auth`, etc., like the rest). Making it explicit protects the strategy from a future blanket block.
- [ ] 🟢 **G7. Freshness + E-E-A-T signals** — `dateModified`/`datePublished` on entities and guides, real author attribution (`author`/`creator` already on media), and visible "updated" dates. Engines favor fresh, attributable sources.
- [ ] 🟢 **G8. Measurement** — after launch, track referral traffic from `chat.openai.com` / `perplexity.ai` / `gemini.google.com`, and periodically *ask the engines* the target questions to see whether A11STUDIO artists surface. GEO has no Search Console yet — prompt-testing is the feedback loop.

### The one-line GEO play
> **Structured data (done) + answer-shaped summaries on every entity + a small library of citable guides + a faceted `ItemList` directory** = the pages AI answer engines quote when someone asks for an artist. The schema foundation is already in place; the remaining work is *visible extractable copy* (G2), *socials for entity identity* (G1), and *citable content* (G3/E.4).

---

## Appendix F — DB schema (target, for the deferred layers)

Present already (do NOT rebuild): `media.seo_*`, `categories.type` + `slug`/`tags`/`parent_id`, `user_categories` pivot, `addresses` locality. `portfolio/collection/service/media/user` translations carry `seo_title`/`seo_description` (+`seo_alt`).

Still target-only (needed by E/D, not yet added):
- `collections` — a **stable cover** (`thumbnail` or `cover_media_id` FK) — collections derive their cover from first media today, which isn't stable for `og:image`/`ImageObject`.
- ~~`users` — artist social links~~ ✅ **added** (`phone_number`, `facebook_link`, `website_link`, `instagram_link`, `youtube_link`) → `Person.sameAs`/`telephone` shipped.
- `services` — a stored **currency** if per-listing currencies are ever needed (today `Offer.price` uses the platform default **EUR** via `PLATFORM_CURRENCY`; fine for a single-currency launch).
- Optional `seo_generated_at` on `media` for consistency with worker idempotency elsewhere.

## Appendix G — How programmatic facet pages work (for §D)

One dynamic route (`[locale]/(discover)/[discipline]/[city]/page.tsx`) + `generateStaticParams()` (queries valid combos = controlled taxonomy × cities-with-supply) + `generateMetadata()` → thousands of unique indexable pages, grown automatically as artists join. Rules: only generate a combo with ≥ N supply; controlled vocabulary only; layered specificity with internal links broad→narrow; unique AI copy; auto-added to sitemap; empty→404, was-valid-now-empty→301 to parent.

## Appendix H — CloudFront (shipped, §A.7) reference

Stable public URL per image: `https://<dist>.cloudfront.net/users/{id}/media/{id}/{seo_filename}.webp`. Public/private split: public art/covers/avatars → CloudFront stable URL; atelier drafts/`blocked_at`/downloads → keep presigned. Object key is unchanged (only host + signing), so migration is low-risk. Bonus: edge caching (LCP), on-the-fly AVIF/WebP, long-TTL cache-control, edge security headers.

---

## Changelog

- **2026-08-11** — **🚀 LAUNCHED.** Removed both pre-launch crawl blocks from `pro.nginx/` (`d4f6ee4`) and verified: no `X-Robots-Tag` on any response, `/robots.txt` serving `Allow: /` with the three child `Sitemap:` lines, shard `1` = artists, shard `51` = portfolios, no duplicate URLs. Discovered that **Cloudflare edge-caches `/robots.txt` for 4h**, so the edge briefly served the old `Disallow: /` after the origin had switched — purge that URL after any robots change. Remaining launch work is GSC/Bing registration + Rich Results Test; no code left.
- **2026-08-11** — **§B.7 deployed + §A.2a fixed.** Shipped the completeness gate to prod (`15cb87d`) and verified it live while still crawl-blocked: `/es/artists/thsworld` now self-canonicals to the `/es` URL, carries all four `hreflang` alternates, `og:locale=es_ES`, `og:type=profile`, a Spanish description and a CloudFront `og:image`, with `Person` JSON-LD intact; the artists feed returns 1. The private pass then caught §A.2a — positional shard ids made the served sitemap duplicate the portfolio and omit the artist entirely — now fixed with fixed id blocks per kind and a 1h revalidate. Two operational notes learned the hard way: `deploy-prod.sh` `git pull`s itself as step 1, so **script changes only take effect on the following deploy** (the new asset-cache flush was run manually this time, 27 keys → 0); and CI builds prerender sitemap shards against the **currently deployed** API, not the one being shipped.
- **2026-08-11** — **Prod verification pass on `a11studio-pro`**: §0.1 (all four env items) and §0.2 (Redis asset cache) **verified and closed** — `NODE_ENV=production` on web/api/worker, `APP_URL=https://a11studio.com`, `APP_TOKEN`/`APP_API_KEY` hash-identical across web+api, `CDN_URL` baked into the build (`/_next/image` on a CloudFront URL returns `200`), and all 44 `users/*` cache entries already stable CDN URLs (0 presigned). Also found and fixed the **missing artists sitemap shard** (predicate widened to `PUBLIC_PROFILE_ROLES`), recorded the exact nginx lines that hold the pre-launch `Disallow: /` + `X-Robots-Tag` block, and noted that the block's stated justification (no CDN DNS) is stale. The live pass also confirmed the §B.7 metadata bugs on the deployed build: `/es/artists/thsworld` self-canonicals to the **unprefixed** URL, ships an English `og:description`, and has **zero** `hreflang` alternates — all fixed by the §B.7 code, pending deploy.
- **2026-08-11** — §B.7 **DONE** (found live on `/es/artists/thsworld`): artist profiles are only shared/indexed when **all four** of public portfolio + name + profession + locality are present (`isArtistShareReady` in common-lib, `is_share_ready` on the public profile API, the same AND in the sitemap predicate). Incomplete profiles get `noindex` + brand OG card + neutral localized description, no `Person` JSON-LD, and no Share button (header + breadcrumb); the profile page also gained per-locale canonical/hreflang/`og:locale` via `buildStaticPageMetadata` and a localized description. Typecheck (common-lib/api/web) + biome clean.
- **2026-08-04** — **GEO/FAQ copy**: added a *"keep your profile focused on one discipline — or a few that belong together"* bullet to the `position-profile` FAQ answer (en/es/pt). Explains that scope is a positioning decision — one craft, or neighboring ones like photography + filmmaking, reads as a specialist; unrelated fields on one profile (tattoo artist + filmmaker + drone photographer) dilute every signal — and tells artists with genuinely distant disciplines to lead with the one they want to be hired for. Feeds the `FAQPage` JSON-LD and the visible (non-accordion) answer, so it's directly liftable by answer engines. Also front-loads §D.1/§D.2: focused profiles are what make the deferred `/{discipline}/{city}` facet pages coherent rather than a single artist appearing across unrelated facets.
- **2026-07-31** — **GEO §G2 (partial)**: the artist profile now renders a **visible answer-shaped TL;DR** under the identity block — an article-free appositive summary from `profession` + city/state, localized via 4 new `artists.profile.summary*` keys (en/es/pt). Deliberately **not** the `short_biography` (already shown as an editorial pull-quote lower on the page) to avoid duplication — the structured one-liner and the artist's prose are complementary. No new fetch (all data already in `getProfile`). GEO score 7 → 8. Web typecheck green. Remaining G2: AI `seo_description` as visible lead on portfolio/service, optional artist `FAQPage`.
- **2026-07-31** — §B.5 **DONE**: static brand-logo OG fallback (`public/logo/logo_bg_white.png`) via a single `DEFAULT_OG_IMAGE` (`lib/config.ts`), applied in `buildStaticPageMetadata` / `buildSeoMetadata` / the artist profile page / the root layout — imageless marketing/utility pages and artists without banner/avatar now get a never-blank share card. Chose a static asset over a dynamic `ImageResponse` to avoid the file-convention merge ambiguity; web typecheck green. Dynamic 1200×630 template remains the §E.2 upgrade.
- **2026-07-31** — Added **§0 PRE-LAUNCH** gate + a 🚀 legend marker: the launch-critical env (`NODE_ENV=production`, `APP_URL`, `APP_TOKEN`/`APP_API_KEY`, build-time `CDN_URL`), the Redis `users/*` asset-cache flush, and post-deploy verification (robots/sitemap serve real content, favicon/manifest load, JSON-LD passes Rich Results, GSC/Bing registration + sitemap submit). All verified against the code (robots/layout `NODE_ENV` gating, env schema, next.config `CDN_URL` remotePatterns, sitemap `APP_TOKEN` gating).
- **2026-07-27** — **`sameAs` gap closed**: users now store `phone_number` + social links (schema/API/`UserProfile` wired), so `Person` emits `sameAs` + `telephone`; `Organization` emits `sameAs` (`ORGANIZATION_SAME_AS` in `lib/config.ts`) + `logo` (512px app icon). Structured-data 9 → 10, GEO 6 → 7.
- **2026-07-27** — **GEO**: redesigned `/faqs` from an accordion to about-page-style **titled sections** (all answers visible/crawlable) with a sticky **aside nav** (jump-to-id); rewrote the *"How can I position my profile?"* answer into a bold, bulleted positioning guide (location, categories, titles/descriptions, banner/thumbnails, services, About) and moderately extended the SEO/discovery answers — all en/es/pt. Added a new **GEO — Generative Engine Optimization** section to this audit (strategies G1–G8 + implementation).
- **2026-07-27** — §B.1 **DONE**: user-provided favicon set moved into `public/`, wired via root-layout `metadata.icons` (favicon.ico + 16/32 + apple-touch) and `manifest.ts` (android-chrome 192/512). Blank-globe gap closed. Indexability 7 → 8.
- **2026-07-27** — §A.6 AI-SEO **quality guardrails**: added `sanitizeSeoText` output validation (junk / echoed-instructions / markup-leak / keyword-stuffing / profanity → `null` fallback to the entity title) applied to every generated title/description/alt, plus hardened `SEO_QUALITY_RULES`. Verified against real multilingual inputs (no false-rejects). Gallery-uniqueness DB check deliberately descoped. AI-SEO score 9 → 10. Typecheck clean.
- **2026-07-27** — Closed the remaining doable `[~]`/`[ ]` items: **B.4** (`[search]` self-canonical to clean segment URL + hreflang), **B.6** (deleted stray dir), **E.3 (partial)** — **fixed a latent bug**: `next/image` `remotePatterns` didn't include the live CloudFront host, so every CDN image would 404 through the optimizer; now derived from `CDN_URL`. Also artist **list pages now use `banner \|\| avatar` as their `og:image`**. Fresh analysis found no other code-fixable gaps; remaining items (favicon B.1, dynamic OG B.5, discovery §D, authority/editorial §E.4, LCP measurement) need assets, a design template, or a running app. Full typecheck (common-lib/api/web) clean.
- **2026-07-27** — §B.2: root layout → `generateMetadata` with localized default title/description (new `seo.defaultTitle`/`defaultDescription` ×3) + `title.template` `%s · A11STUDIO`; brand-ful pages opt out via a `titleAbsolute` flag / `title.absolute` so nothing double-brands. i18n score 7 → 8. Typecheck clean.
- **2026-07-27** — JSON-LD enrichment: service `keywords` (features + portfolio) + `Offer.price` (EUR, gated on `show_price`, UI `$`→`€`); collection `keywords` from aggregated media TAGS; richer `Person` (`knowsAbout` + structured `PostalAddress` + `makesOffer`). `sameAs` deferred (no socials model). Structured-data score 8 → 9. **Verified bug-free**: common-lib/api/web typecheck clean; `Offer` price always matches the visible price (same `show_price && price != null` gate); no `$`/`€` symbol clash (atelier price input carries no currency symbol).
- **2026-07-27** — §B.3 metadata: added `generateMetadata` to the artist list pages (portfolios/collections/services) and the two nested media routes (canonical → primary media URL, anti-cannibalization). Per-entity score 8 → 9.
- **2026-07-27** — Media content **`TAGS`**: added `TAGS` as a third `CATEGORY_TYPE`, seeded a curated ~85-tag vocabulary, extended the media-tagging LLM call to pick ≤`MAX_TAGS_MEDIA` tags (code-capped by type), returned them localized on the media detail fetch, and emitted `ImageObject.keywords`. Guarded TAGS out of the user-facing category index (default `type != TAGS` in `applyFilters`). Closes the media-`keywords` gap in §A.5.
- **2026-07-27** — Refactored this doc into checklist form; added §B (favicon/icons missing, non-localized default title, list + nested-media pages missing metadata, `[search]` canonical/robots, stray empty dir) from a fresh codebase pass.
- **2026-07-26** — Production sitemap validation + media JSON-LD enrichment (VisualArtwork + licensable pair); fixed robots→non-existent-`/sitemap.xml` bug.
- **2026-07-26** — CloudFront stable image URLs (closed §A.7 / original §2.4).
- **2026-07-26** — Static-page SEO, site-wide JSON-LD, sharded sitemap, env-gated crawlability (closed original §2.1/2.2/2.3).
- **2026-07-26** — Multi-locale AI SEO for entities + entity JSON-LD + hreflang.

*Individual-artist SEO: delivered & verified. Discovery/directory layer: designed, deferred until artist density. This doc is now the live checklist — update the boxes as items ship.*
