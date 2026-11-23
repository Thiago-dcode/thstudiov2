---
name: a11studio-design
description: >-
  A11STUDIO art direction for public pages: the quiet editorial / art-publication look (small
  uppercase `SECTION / 001` labels, hairlines, large light Poppins headlines, italic standfirsts,
  no cards or badges), the shared editorial kit in packages/ui (`EditorialHeader`,
  `EditorialChapter`, `editorialHeadlineClass`, `EDITORIAL_*` classes), page recipes, colour,
  imagery, motion and the Journal brief. Use when designing, restyling or reviewing any public
  page, landing section, empty state or copy in apps/web or packages/ui, and before planning UI
  work. Not for atelier. Source of truth: docs/a11studio.md section 14.
---

# A11STUDIO art direction

**The interface is the frame. The art is the protagonist.** Speak less. Mean more.

Public A11STUDIO pages read like an independent art publication, a Japanese photography book or a carefully curated exhibition: timeless, quiet, intentional. Never a SaaS dashboard, a social feed or a generic blog.

- Brand source: `docs/a11studio.md` (sections 11, 14, 15). Build rules (tokens, Server Actions, components): `frontend`. Accessibility: `accessibility`. SEO: `marketing-seo-ux`. This skill decides **how it looks**.
- **Build with the kit, don't hand-roll it**: `packages/ui/src/components/custom/editorial.tsx`. Components, classes and page recipes: [references/editorial-kit.md](references/editorial-kit.md). Read it before touching a public page.

## Scope

- **In:** every public route: landing, about, faqs, support, report, legal, `/for/*`, `[search]` directories, auth and get-started, email-preferences, wait-list, artist pages (`(artists)`), 404 and error views.
- **Out: atelier** (`app/[locale]/(atelier)`), which keeps its app UI. When a component is shared with atelier, add the editorial look as an **opt-in prop or variant** (or style it at the public call site); never change the shared default. Known exception: `[locale]/error.tsx` and `lib/components/not-found-view.tsx` also render for atelier 404s and crashes.

## Principles

1. **Art first.** Artwork supplies the colour, emotion and focal point. Chrome never competes with it.
2. **Typography builds hierarchy.** Not boxes, badges, fills or colour. A tiny label against a huge headline *is* the hierarchy; no mid-sized bold in between.
3. **Whitespace is rhythm.** Generous, consistent, deliberate. When in doubt, add air.
4. **Restraint.** Every element earns its place. Don't add sections, buttons or badges to fill space.
5. **Precision.** One 12-column grid per page; labels, headlines and reading columns share column lines. Asymmetry only on top of that grid.
6. **Slow down.** No endless feeds, engagement counters or urgency. Paginate or end the list.

## Typography

- **Poppins only** (`apps/web/src/font.ts` loads it for `--font-brand` and `--font-body`; `--font-serif` resolves to it). Settled by the user on 2026-11-23: **never add or swap in a serif or other typeface, never edit `font.ts`, and don't strip the existing `font-serif!`/`italic` classes.** Hierarchy comes from size, light weight, tracking and space.
- **Headline:** `editorialHeadlineClass(size)`: light (400), tight leading (1.04), slight negative tracking, sentence case, often ending in a full stop (*Chasing silence in Lanzarote.*). Three sizes: `page` (h1, 36/48/60px), `section` (h2, 30/36/48px), `sub` (chapter/card titles, 24/30px). One dominant headline per view. The user asked for these sizes; don't scale them back up.
- **Standfirst:** one sentence of italic under the headline, `EDITORIAL_STANDFIRST_CLASS` (18→20px, muted, `max-w-xl`; wider, `max-w-3xl`, for portfolio and collection descriptions).
- **Metadata label:** `EditorialLabel` / `EDITORIAL_LABEL_CLASS`: 12px, uppercase **via CSS**, `tracking-[0.24em]`, muted. Never a pill, chip or badge.
- **Body:** ≥ 16px, leading 1.75, ≤ ~65 characters (`EDITORIAL_PROSE_CLASS`, `max-w-[38rem]`).
- One `<h1>` per page, no skipped levels. Labels are `<p>`/`<span>`, not headings, unless they really title a block (then `<h2 className={EDITORIAL_LABEL_CLASS}>`).

### Labels: `SECTION / QUALIFIER`

```
HOW IT WORKS / 001      JOURNAL / NOVEMBER 2026      PHOTO ESSAY / ICELAND
VALUES / 002            BEHIND THE WORK / NO. 004    LANDSCAPE / TRAVEL
```

- The qualifier is **real data**: section position (`editorialNumber(index)` → `001`), a date, place, category list or count. Never invent a number or place.
- Homepage numbers come from the section's position in `SECTIONS` (`index` prop; hero = 0, not shown). A section that renders nothing leaves a gap in the sequence; that's accepted.
- Label text goes through i18n (en/es/pt) like any copy. The `/` separator is `aria-hidden` and muted (`text-text-muted/60`).
- Categories, professions and similar metadata become labels (`LANDSCAPE / TRAVEL`), not `Badge` rows.

## Colour

| Role | Brand value | Token in use |
|---|---|---|
| Accent (scarlet) | `#ED2100` | `--color-accent` (matches) |
| Light background | `#F2F2F2` | `--color-bg` is `#FAFAF9` |
| Dark background | `#0D0D0D` | `.dark --color-bg` is `#1C1B19` |
| Secondary text | muted grey, ≥ 4.5:1 | `--color-text-muted` |
| Hairlines | | `border-border`, short rules `bg-border-em` |

- Scarlet **at most once or twice per view**: the primary CTA and, rarely, one deliberate mark (e.g. the strike through "influencer"). Never a fill, border, link colour, gradient or glow.
- No gradients (except the functional fade over the featured-portfolio grid), no decorative shadows, no cream/beige or neon.
- Tokens only, never raw hex. **Neutral drift:** the tokens are warmer than the brand neutrals. Moving them is a visible site-wide change, so propose it, never slip it into other work.

## Layout and imagery

- Every piece (portfolio, collection, story) is a **curated story**, not a card in a feed. Index views are typographic first: title, label, one image, whitespace.
- Page shell: `max-w-6xl` with `px-5 tablet:px-10`, `py-20 tablet:py-28`. Homepage sections are separated by `gap-24 tablet:gap-32 laptop:gap-40`.
- A section opens with a hairline + label + headline (`EditorialHeader`); its content sits in the reading column (`EDITORIAL_COLUMN_CLASS`, from the 4th grid column on laptop+).
- **No boxed panels**: forms and lists sit under a single `border-t border-border` with space, not inside `border bg-fg-2/20` cards. Empty states: one italic line under a hairline, not a dashed box.
- Large, immersive imagery; full-bleed where it earns it. **Keep native aspect ratios**; never force every image into one card ratio. `next/image` with real dimensions or `fill` + `sizes`; no CLS.
- Zero radius (except functionally circular controls such as avatars), no content shadows, no decorative frames around icons.

## Interaction and motion

- Quiet links: `EDITORIAL_LINK_CLASS` (label-style text with a hairline that darkens on hover) for standalone actions; `EDITORIAL_PROSE_LINK_CLASS` inside prose. Icon buttons are borderless, 44×44.
- Hover: muted→full colour, a hairline darkening, an image scale ≤ 1.02. No lifts, glows, bounces or parallax.
- Reveal: fade with ≤ 8px translate, 300–600 ms, `ease-out`, once. Scroll-linked reveals sit inside `@media (prefers-reduced-motion: no-preference)`; entrance animations use `motion-safe:`.
- Nothing new animates continuously (the existing values marquee and next-section arrow are legacy; don't copy them).
- Visible keyboard focus on everything interactive; hover is never the only way to reach information.

## Voice

Artist speaking to artist: clear, human, confident, short. No startup jargon, exclamation marks, "engagement", "leverage", "unlock". One sentence over three (examples: `docs/a11studio.md` section 15). Never promise SEO, traffic or ranking; label unreleased features as such.

## Recipe: the Journal (not built yet)

- **Index:** masthead label (`JOURNAL / NOVEMBER 2026`), one line of intent, then an editorial sequence: one lead story with a large image and big headline, then quieter entries with varied image treatments. Real data only. No sidebars, tag clouds, view counts or "load more".
- **Entry:** `EditorialHeader as="h1"` (label, headline, standfirst, byline and date as labels), full-width hero image, body in the reading column, images breaking out wider with captions. End with the artist and one quiet link onward, not a recommendation feed.
- Preserve routes, slugs, metadata, JSON-LD and the public-visibility predicate (`marketing-seo-ux`).

## Review checklist

- [ ] Built from the editorial kit; no hand-rolled label/headline classes, no new serif/font
- [ ] One focal point; label + headline do the hierarchy; one `<h1>`, no skipped levels
- [ ] Labels `SECTION / QUALIFIER`, data-derived, translated, uppercase via CSS
- [ ] Typographic classes on `p`/`h*` carry `!` (see kit: global element rules are unlayered)
- [ ] No cards, badges, pills, boxed panels, dashed empty boxes, gradients, shadows or radius
- [ ] Scarlet ≤ 2 per view; never fill, border or link
- [ ] Images keep their aspect ratio, have alt text and dimensions, no CLS
- [ ] Prose ≤ 65 characters, ≥ 16px, ≥ 4.5:1; reduced motion respected; focus visible
- [ ] 375px to ultrawide, light and dark: no horizontal scroll, calm in both
- [ ] Atelier unchanged; shared components changed only through an opt-in variant

When a choice trades one principle for another, say so. If in doubt, make the interface quieter and the artwork larger.
