# Design language: editorial minimalist

Read when designing or reviewing layout, spacing or visual tone. For **public pages** the art
direction and the reusable editorial kit are in the `a11studio-design` skill
(`references/editorial-kit.md`); this file holds the principles shared with atelier.

Professional, minimalist, editorial, quietly exclusive, in light and dark. The UI disappears; only the user's portfolio/art commands attention. Three non-negotiables: **breathe**, **restraint**, **exclusivity**. Tone references (feeling, not copying): independent photography journals and art books, costarastrology.com (editorial restraint, whitespace), zara.com (sharp edges, neutral palette, sparing accent).

## Breathe (space)

- Prefer air over density: when in doubt add padding, margin or gap.
- Public pages: `max-w-6xl px-5 tablet:px-10`, `py-20` → `tablet:py-28`; homepage sections sit `gap-24 tablet:gap-32 laptop:gap-40` apart. Section openings are separated from content (`mb-14`+). (`WebSection.Container`'s own default is only `px-2 py-4`, so always pass the real padding.)
- Constrain prose: reading column `max-w-[38rem]` (~65 characters); standfirsts `max-w-xl` (portfolio/collection descriptions `max-w-3xl`); headlines `max-w-3xl`/`max-w-4xl`.
- Related items tight (`gap-2`–`gap-4`); unrelated groups `gap-8`–`gap-16` or a hairline.
- Fewer columns before smaller cards (a roomy 3-column grid beats a 5-column squeeze). On tight viewports stack; never shrink type, padding or touch targets.
- Page backgrounds calm and neutral: the `--color-bg` token (`#FAFAF9` light / `#1C1B19` dark; brand neutrals `#F2F2F2` / `#0D0D0D` not adopted yet). No gradients or decorative fills on surfaces.

## Exclusivity (curated)

- Show less, better: fewer nav items, CTAs, badges and labels per card.
- One hero moment per view: one headline, one primary action, one focus.
- Quiet chrome: nav, cards, filters, metadata stay neutral. No busy borders, pills or fills. On public pages metadata is a `SECTION / QUALIFIER` label, never a badge row.
- Editorial copy: confident, short, human. No startup jargon, exclamation marks or feature dumps.
- Empty states stay intentional: spacious, one clear next step (public: one italic line under a hairline).
- No marketplace/dashboard/social-feed patterns unless the page truly needs them.

**Reject**: 4–5+ column grids with `gap-2`/`gap-3`; edge-to-edge text with no max-width; several accent elements on one screen; stacked badges competing with artwork; boxed form panels or dashed empty boxes on public pages; sections with no vertical pause.

## Zero radius

Sharp corners everywhere (buttons, cards, inputs, modals, chips). No `rounded-sm/md/lg/xl`. Only functionally circular controls (avatars, slider thumb, scrollbar thumb) may use `rounded-full`.

## Accent rationing

`--color-accent` (`#ED2100`) only for the waitlist/primary CTA, primary registration actions, and one isolated deliberate mark (e.g. the strike through "influencer"). Never as card/section/decorative fill, border or tint, general text or link colour, gradient or glow. When in doubt use neutral tokens; secondary and ghost buttons stay neutral.

## UI as frame

Chrome (nav, cards, headers, controls) stays quiet; uploaded art is the focus. When in doubt, quieter UI.

## Typography

**Poppins only** (`apps/web/src/font.ts`; `--font-serif` resolves to it by design; never add a serif). Signal importance with size, weight and tracking, not colour or decoration: public headlines are large and light (`editorialHeadlineClass`), labels tiny, uppercase and widely tracked (`EDITORIAL_LABEL_CLASS`). Body ≥ 16px, line-height 1.6–1.75, ≤ ~65 characters per line, no skipped heading levels. Global `p`/`h*` rules are unlayered: typographic utilities on those elements need `!`.
