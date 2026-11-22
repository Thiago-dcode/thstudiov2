# Design language: editorial minimalist

Read when designing or reviewing layout, spacing or visual tone.

Professional, minimalist, editorial, quietly exclusive. Light-first with dark mode. The UI disappears; only the user's portfolio/art commands attention. Three non-negotiables: **breathe**, **restraint**, **exclusivity**. Tone references (feeling, not copying): costarastrology.com (editorial restraint, whitespace), zara.com (sharp edges, neutral palette, sparing accent).

## Breathe (space)

- Prefer air over density: when in doubt add padding, margin or gap.
- Section rhythm: `py-20` mobile → `py-28` tablet+; section headers separated from content (`mb-12`+). `WebSection.Container` uses `px-6 py-20 tablet:px-10 tablet:py-28`; match or exceed it on marketing surfaces.
- Constrain prose and headings (`max-w-lg` / `max-w-xl`).
- Related items tight (`gap-2`–`gap-4`); unrelated groups `gap-8`–`gap-16` or a divider.
- Fewer columns before smaller cards (a roomy 3-column grid beats a 5-column squeeze). On tight viewports stack; never shrink type, padding or touch targets.
- Page backgrounds calm and neutral (`#F8F6F2` light / `#1C1B19` dark). No gradients or decorative fills on surfaces.

## Exclusivity (curated)

- Show less, better: fewer nav items, CTAs, badges and labels per card.
- One hero moment per view: one headline, one primary action, one focus.
- Quiet chrome: nav, cards, filters, metadata stay neutral. No busy borders, pills or fills.
- Editorial copy: confident, short, human. No startup jargon, exclamation marks or feature dumps.
- Empty states stay intentional: centered, spacious, one clear next step.
- No marketplace/dashboard/social-feed patterns unless the page truly needs them.

**Reject**: 4–5+ column grids with `gap-2`/`gap-3`; edge-to-edge text with no max-width; several accent elements on one screen; stacked badges competing with artwork; sections with no vertical pause.

## Zero radius

Sharp corners everywhere (buttons, cards, inputs, modals, chips, avatars). No `rounded-sm/md/lg/xl`. Only functionally circular controls (slider thumb, scrollbar thumb) may use `rounded-full`.

## Accent rationing

`--color-accent` (`#B20000`) only for the waitlist/primary CTA, primary registration actions, and isolated punchy words for deliberate emphasis. Never as card/section/decorative fill, border or tint, general text or link colour, gradient or glow. When in doubt use neutral tokens; secondary and ghost buttons stay neutral.

## UI as frame

Chrome (nav, cards, headers, controls) stays quiet; uploaded art is the focus. When in doubt, quieter UI.

## Typography

Serif (`--font-serif`) for editorial headings, sans for UI and labels. Scale `--size-xs` (0.75rem) … `--size-lg` (1.125rem) via `text-xs/sm/base/lg`. Signal importance with weight and size, not colour or decoration. Body ≥ 16px, line-height 1.5–1.7, 60–80 characters per line, max 2 typefaces, no skipped heading levels.
