# The editorial kit

Read before building or restyling any public page or component. Everything lives in
`packages/ui/src/components/custom/editorial.tsx` (import from
`@repo/ui/components/custom/editorial`). It is pure presentation: pass already-translated text,
no data fetching, no business logic. Atelier does not use it.

## The one gotcha: `!` on typography

`packages/ui/src/styles/globals.css` styles `h1`–`h6` and `p` with **unlayered** element rules
(font family, size, weight, letter-spacing, line-height). Unlayered rules beat every Tailwind
utility that lacks `!`. So:

- On a `<p>` or `<h*>`, every typographic utility needs `!` (`text-lg!`, `leading-relaxed!`,
  `font-normal!`, `tracking-[0.24em]!`, `font-sans!`). Without it, the rule silently does nothing.
- The kit's classes already carry `!`. Use them and you never think about it. Elements such as
  `span`, `dt`, `dd`, `li`, `ul`, `blockquote` and `a` are not affected.

## Pieces

| Export | Use for |
|---|---|
| `EditorialHeader` | Every section or page opening. Props: `label`, `qualifier`, `title`, `standfirst`, `children` (byline, date, one action), `align` (`start` grid / `stack` / `center`), `as` (`h1`/`h2`), `size`, `rule`. |
| `EditorialChapter` | One chapter of a long read (about page): number/label in the left column, `sub` headline + body in the reading column. |
| `EditorialLabel` | A standalone `SECTION / QUALIFIER` line (`qualifier` adds the muted ` / ` and tabular figures). |
| `EditorialRule` | The short centred hairline above a centred statement. |
| `editorialHeadlineClass(size)` | A headline you lay out yourself (`page` h1, `section` h2, `sub` item/chapter titles). |
| `editorialNumber(n)` | `3` → `003` for the qualifier. |
| `EDITORIAL_LABEL_CLASS` | Label type on any element, including a real `<h2>` that titles a block, `<dt>`, list items, small meta. |
| `EDITORIAL_STANDFIRST_CLASS` | The italic one-sentence subtitle. Change width with `cn(EDITORIAL_STANDFIRST_CLASS, "max-w-3xl")` (`cn` = twMerge, so the later class wins). |
| `EDITORIAL_STATEMENT_CLASS` | A pull quote / mission statement inside prose. |
| `EDITORIAL_PROSE_CLASS` | Body paragraphs of a long read (≥ 16px, leading 1.75, `max-w-[38rem]`). |
| `EDITORIAL_COLUMN_CLASS` | Content under a `start` header that should begin on the headline's column (laptop+). |
| `EDITORIAL_LINK_CLASS` | A standalone action link ("View the full portfolio", "Browse all artists"). |
| `EDITORIAL_PROSE_LINK_CLASS` | A link inside a sentence. |

Homepage sections also get these through `WebSection` (`_components/landing/web-section.tsx`):
`WebSection.EditorialHeader`, `WebSection.Label`, plus re-exported `editorialNumber` and
`EDITORIAL_LINK_CLASS`. Artist and directory pages use `Web.Header` (`lib/components/web-page.component.tsx`),
which already renders label, headline and a wide standfirst.

## Page recipes (as built)

- **Content page** (about, legal, faqs): `max-w-6xl px-5 py-20 tablet:px-10 tablet:py-28`;
  `EditorialHeader as="h1"` (label, title, standfirst); chapters or sections under it in the reading
  column (`EditorialChapter`, or `EDITORIAL_COLUMN_CLASS` + `max-w-[38rem]`). Legal: `legal-doc.tsx`.
- **Narrow form page** (support, report, email preferences): `max-w-3xl` (or `2xl`);
  `EditorialHeader as="h1" align="stack" rule={false}`; the form under `mt-14 border-t border-border pt-10`.
  No boxed panel.
- **Homepage section**: receives `index` from `SECTIONS` in `(web)/page.tsx`; opens with
  `WebSection.EditorialHeader` with `qualifier={index ? editorialNumber(index) : undefined}`; adds a
  `NextSectionArrow`. Order and numbering live only in `SECTIONS`.
- **Closing statement / CTA**: `EditorialRule`, label, `editorialHeadlineClass("section")`,
  standfirst, the one accent button. Centred, `max-w-4xl`, generous `py-24`.
- **Artist and directory pages**: `Web.Container` + `Web.Header` (`label` for categories or
  profession, e.g. `LANDSCAPE / TRAVEL`). Lists use `Web.List` or `artist-sections` (hairline +
  `sub` title + label-style "view all").
- **Auth**: `AuthCard` (no card: a hairline with space), `PageComponent.Title` renders the `sub` headline.
- **404 / error**: `not-found-view.tsx`, `[locale]/error.tsx`. Note: also shown inside atelier.
- **Empty state**: one italic line under a hairline
  (`border-t border-border font-serif text-lg italic text-text-muted`), never a dashed box.

## Building a new component

1. **Look for a piece first.** Most needs are an `EditorialHeader` plus content. Don't re-type label,
   headline or standfirst classes; if you're copying a class string from another file, it belongs in
   the kit.
2. **Add to the kit only when a pattern is genuinely reused** (a second real call site) and it is
   pure presentation. Keep it in `editorial.tsx`, typed props, `className` passthrough via `cn`,
   `!` on typography, a one-line doc comment. One-off layout stays at the call site.
3. **Shared with atelier?** Add an opt-in `variant`/prop and keep the default unchanged, or style the
   public call site instead (see `FaqsContent`'s `variant="editorial"` and `header` props).
4. **Data-derived labels only**; copy in en/es/pt; uppercase via CSS.
5. **Check**: one `<h1>`, no skipped levels; 375px and ultrawide; light and dark; reduced motion; keyboard focus.

## Layout constants worth knowing

- Grid: 12 columns, `gap-x-10`, the label spans 3 and content 9 on laptop+. `EDITORIAL_COLUMN_CLASS`
  is that offset (`25% + 0.625rem`).
- Reading column: `max-w-[38rem]`. Headline caps: `max-w-4xl` (start), `max-w-3xl` (centred).
- Homepage section gap: `gap-24 tablet:gap-32 laptop:gap-40`.
- Breakpoints: `phone` 480, `phone-lg` 640, `tablet` 768, `tablet-lg` 1024, `laptop` 1280,
  `desktop` 1536, `desktop-lg` 1920, `ultrawide` 2560.
