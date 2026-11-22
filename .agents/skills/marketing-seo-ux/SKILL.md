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

1. **Dev and preview must never be indexable.** `NODE_ENV` can't tell environments apart; gate robots, sitemap and meta robots on `isIndexableEnv()` (canonical host `a11studio.com`, fail-closed).
2. **One public-visibility predicate per entity**, shared by the sitemap and the page's noindex decision, so a URL is listed if and only if it is indexable. Add or change a predicate in both at once.
3. **Missing or hidden content returns a real 404** (`notFound()`), never a 200 shell. **Never put `loading.tsx` above public routes**: streaming a fallback makes soft 404s. (`atelier/` is private, so it may have one.)
4. **Directory gate**: `/artists` and `/portfolios` stay hidden (404 and no entry points: nav, sitemap, links) until `isDirectoryOpen()` (`lib/directory-visibility.ts`) says so.
5. **URL changes need redirects.** A renamed username or slug 301s from the old URL (`redirectToCurrentUsername`); never orphan an indexed URL.
6. **Product scope is photographers.** Don't add other-discipline landing pages until there are enough real artists.
7. Signed-out public HTML is cached at the edge; per-user content must not render into it (it is purged on change).

## Metadata and on-page rules

- Unique `title` (50–60 chars, primary keyword first, brand last) and `description` (150–160 chars, with a reason to click) per page; one `<h1>` with the primary keyword; no skipped heading levels.
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
- For AI search: clear semantic HTML, a logical heading hierarchy, and accurate structured data.

## Where the status lives

`docs/seo/CLAUDE.md` (shipped snapshot and open code tasks) and `docs/seo/YOU.md` (tasks for the owner). Move finished items into "Shipped".
