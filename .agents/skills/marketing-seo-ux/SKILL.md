---
name: marketing-seo-ux
description: >-
  SEO, metadata, sitemap, structured data and conversion rules for TH Studio's public pages
  (apps/web). Use when building or changing a public page, landing page, metadata, OG/share
  images, canonical or hreflang, sitemap, robots, noindex, redirects, JSON-LD, or copy meant
  to rank or convert.
---

# Marketing, SEO & UX (public pages)

SEO and UX are the same job: fast, clear pages that complete the user's task. Visual rules live in `frontend`, accessibility in `accessibility`. Generic JSON-LD shapes and the launch checklist are in `references/structured-data-and-checklist.md`.

## Project SEO layer (use it, don't reinvent)

All in `apps/web/src/lib/seo/`:

| Need | Use |
|---|---|
| Page metadata (title, description, canonical, hreflang, OG) | `buildSeoMetadata` (dynamic) / `buildStaticPageMetadata` (static); `languageAlternates(path)`, `localizedUrl(locale, path)` |
| Private / signed-in pages | `buildPrivatePageMetadata` (noindex) |
| Share image | `ogImage(src, alt)` → always via the **`/og-image.jpg`** route (1200×630 JPEG). Raw CDN images broke WhatsApp previews. |
| Structured data | `json-ld.tsx` |
| Sitemaps | `sitemap-source.ts` (sharded, `SITEMAP_REVALIDATE` 3600 s) with `app/sitemap.ts`, `app/sitemap_index.xml/route.ts` |
| Indexable environment | `isIndexableEnv()` (`indexability.ts`) |

## Invariants (break these and rankings or privacy suffer)

1. **Non-prod hosts (local, previews) must never be indexable.** (The dev environment is retired; only local and prod exist.) `NODE_ENV` can't tell environments apart; gate robots, sitemap and meta robots on `isIndexableEnv()` (canonical host `a11studio.com`, fail-closed).
2. **One public-visibility predicate per entity**, shared by the sitemap and the page's noindex decision, so a URL is listed if and only if it is indexable. Add or change a predicate in both at once.
3. **Missing or hidden content returns a real 404** (`notFound()`), never a 200 shell. **Never put `loading.tsx` above public routes**: streaming a fallback makes soft 404s. (`atelier/` is private, so it may have one.)
4. **Directory gate**: `/artists` and `/portfolios` stay hidden (404 and no entry points: nav, sitemap, links) until `isDirectoryOpen()` (`lib/directory-visibility.ts`) says so.
5. **URL changes need redirects.** A renamed username or slug 301s from the old URL (`redirectToCurrentUsername`); never orphan an indexed URL. Artist pages live at the root (`/{username}`), so a new top-level route must be reserved in `RESERVED_USERNAMES` (common-lib) first; `redirectToCurrentUsername` 404s any segment that fails `isArtistRouteSegment` before calling the API.
6. **Product scope is photographers.** Don't add other-discipline landing pages until there are enough real artists.
7. Signed-out public HTML is cached at the edge; per-user content must not render into it (it is purged on change).

## Indexing is earned, not configured

The technical layer above is done and verified against production. What keeps pages out of Google now is **value and authority**, not tags. On 2026-11-24 only the homepage was indexed; `/es`, `/pt`, `/about`, `/faqs`, `/for/photographers` and the artist profile were all "Crawled – currently not indexed": Google fetched them and chose not to keep them. More tags won't fix that. Rules that follow from it:

1. **The sitemap is a statement of intent.** List only URLs you would defend as useful on their own. A sitemap entry does not get a page indexed, and hundreds of weak URLs on a young domain lower Google's opinion of the whole site.
2. **Visible, unique main content on every indexable page.** Google ranks the body, not `<head>`. A meta description is a snippet, not content, and a generic fallback `<h1>` repeated across pages ("Artwork by {name}") is duplicate content. Before shipping an indexable template, curl it as Googlebot and count the words inside `<main>`. If it is a few words plus an image, the page needs real text, or it should be `noindex` and dropped from the sitemap until it has some.
3. **AI-written text at scale is fine only on top of a real page.** Google's scaled-content-abuse policy targets many low-value pages made to rank. AI titles and descriptions on pages that already have substance are fine. On empty pages they are the pattern that policy describes.
4. **Translations don't multiply authority.** `/es` and `/pt` are indexed on their own merit; hreflang only says which version to show and never gets a page indexed. Keep them, but expect them to trail English until they have their own links and searches.
5. **Concentrate before you expand.** New page types (place pages, discipline × city, guides) wait until the existing ones are indexed (see the directory gate and the photographer focus).

## Verify with real data (the GSC and GA4 MCPs are connected)

Never guess about indexing or traffic. Check:

- `mcp__gsc__batch_url_inspection` (property `sc-domain:a11studio.com`): coverage state per URL. "Crawled – currently not indexed" = quality/authority; "Discovered – not crawled" = crawl priority/links; "Unknown to Google" = no links to it and not picked up from the sitemap yet.
- `mcp__gsc__get_advanced_search_analytics`, dimensions `query,page` (also filter `page contains dev.` to check that no non-canonical host is getting impressions).
- `mcp__analytics-mcp__run_report` (property `558764023`), `sessionSourceMedium` and `landingPagePlusQueryString`: where visitors actually come from.
- Live HTML: `curl -A "Googlebot" https://a11studio.com/<path>`, then check the title, canonical, hreflang, the `<h1>` count and text, and the word count inside `<main>`.

## Metadata and on-page rules

- Unique `title` (50–60 chars, primary keyword first, brand last) and `description` (150–160 chars, with a reason to click) per page; one `<h1>` with the primary keyword; no skipped heading levels.
- The `<h1>` and the opening copy are the page's real topic: they must be specific to that page, never a shared fallback string.
- Canonical on every page, hreflang for each supported locale (`en`, `es`, `pt`) plus `x-default`.
- Descriptive, lowercase, hyphenated slugs; no `?id=` URLs.
- Images: `next/image`, descriptive `alt`, WebP/AVIF, `priority` only on the LCP image. Links use descriptive anchor text, never "click here".
- JSON-LD: escape with `JSON.stringify(data).replace(/</g, "\\u003c")`. Mark up only what the page shows. Validate with Google's Rich Results Test.
- Core Web Vitals: LCP < 2.5 s, CLS < 0.1, INP < 200 ms.

## Marketing and conversion

- State what the product does and for whom above the fold (an artist-facing value proposition in one line).
- One primary CTA per view, action-specific ("Join the waitlist", not "Submit"). Accent colour is rationed (see `frontend`).
- Put social proof (real artists and work) near conversion points. Short, confident, editorial copy with no jargon.
- Write copy in all three locales through the i18n messages, never hard-coded.
- For AI search (AI Overviews, ChatGPT, Perplexity): these answer from pages that already rank and from third-party mentions (Reddit, press, directories). Clear semantic HTML and accurate structured data help, but being cited depends on being indexed and mentioned elsewhere. `llms.txt` is cheap to keep current, but Google doesn't use it.
- Discipline landings live at `/for/{discipline}` (`modules/landings/discipline-landings.ts`). Only photographers exist today. A new one needs its own copy, real examples and a reason to exist, never a template with the noun swapped.
- Keyword targets, the backlink approach and the growth order: `references/growth-playbook.md`.
- Visual treatment of public pages (labels, headlines, layout) follows `a11studio-design` and its editorial kit. A restyle never changes URLs, metadata, canonical/hreflang, JSON-LD or `notFound`/redirect logic.
- The homepage is one list, `SECTIONS` in `app/[locale]/(web)/page.tsx` (order, anchor ids and `SECTION / 00N` numbering all come from it), with copy in `landing.*`. There is no v1/v2 split or flag; changing the homepage HTML needs a Cloudflare purge of `/`, `/es`, `/pt` after deploy.

## Where the status lives

`docs/seo/CLAUDE.md` (shipped snapshot and open code tasks) and `docs/seo/YOU.md` (tasks for the owner). Move finished items into "Shipped".
