---
name: frontend
description: >
  Frontend rules for Next.js, UI components, Server Actions, and styling — combined with
  expert UI/UX best practices. Use when working with apps/web, packages/ui,
  packages/frontend-lib, or when building React components, pages, or styling.
  Also triggers whenever the user asks to design, review, audit, or build any web page,
  landing page, dashboard, component, or UI — even if they don't say "UX" or "Next.js"
  explicitly. Triggers include: "build me a page", "design this", "make it look good",
  "review my layout", "create a component", "improve my UI", "is this good UX?",
  or any front-end design task. Always use this skill for any front-end work.
---

# Frontend Rules (Next.js + UX)

---

## 1. Psychology & UX — PRIORITY #1

**UX > Code / Performance / Aesthetics.** Users first: clear flows, obvious affordances, low friction.

- **Cognitive Load**: Minimize mental effort (Gestalt). Don't make users think.
- **Hick's Law**: Simplify choices. Break complex tasks into steps.
- **Fitts's Law**: Large, distinct, easy-to-hit CTAs.
- **Feedback**: Immediate response (hover, active, skeletons, toasts) is mandatory.
- **Perceived Perf**: Skeletons & optimistic UI beat actual speed.
- **Emotion**: Delight with micro-interactions. Human, empathetic copy — especially on errors.

---

## 2. Design Language — Warm Editorial

**Style**: Light-first warm editorial with dark mode support. Brand color is orange.

- **Colors**: Use design tokens from `globals.css` — never hardcode hex values.
  - **Brand scale**: `--brand-subtle` → `--brand-light` → `--brand` (#ff8932) → `--brand-dark` → `--brand-text` → `--brand-ink`.
  - **Surfaces**: `--surface` (bg) → `--surface-raised` → `--surface-border` → `--surface-muted` → `--surface-secondary` → `--surface-primary` → `--surface-ink` (text).
  - **Semantic aliases**: `--color-bg`, `--color-fg`, `--color-fg-1`, `--color-fg-2`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-border`.
  - Dark mode overrides via `.dark` class — all tokens adapt automatically.
- **Typography**:
  - **Serif** (`--font-serif`) for editorial headings where appropriate.
  - **Sans** for UI, labels, and interactive elements.
  - **Scale**: `--size-xs` (0.75rem), `--size-sm` (0.875rem), `--size-base` (1rem), `--size-lg` (1.125rem). Use Tailwind `text-xs/sm/base/lg`.
- **Layout**: Ample negative space. Subtle warm background gradients (brand-tinted radial gradients on body).
- **Tone**: Warm, confident, editorial. Approachable but professional.

---

## 3. Visual Hierarchy & Layout

- Use Tailwind spacing scale (based on 4px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px).
- Place the most important content top-left (F-pattern reading).
- **One primary action per view** — never compete for attention.
- Group related elements; separate unrelated ones with whitespace.
- Keep above-the-fold content self-explanatory — the user should know what the page is without scrolling.

---

## 4. Typography (Detailed)

- Body text: **≥ 16px**, line-height 1.5–1.7.
- Max **2 typefaces** per page (heading + body).
- Clear heading hierarchy: H1 → H2 → H3, never skip levels.
- Line length: **60–80 characters** for body text.
- Contrast ratio: **≥ 4.5:1** for body, ≥ 3:1 for large text (WCAG AA).
- Use `--radius-sm` (0.5rem), `--radius-md` (0.75rem), `--radius-lg` (1rem), `--radius-xl` (1.25rem) for border-radius — map to Tailwind `rounded-sm/md/lg/xl`.

---

## 5. Color Tokens

All colors come from `packages/ui/src/styles/globals.css`. **Never hardcode hex values — always use CSS variables or their Tailwind aliases.**

| Purpose | Token | Tailwind class |
|---------|-------|----------------|
| Background | `--color-bg` | `bg-bg` |
| Foreground surface | `--color-fg` | `bg-fg` |
| Elevated surface | `--color-fg-1`, `--color-fg-2` | `bg-fg-1`, `bg-fg-2` |
| Primary text | `--color-text` | `text-text` |
| Muted text | `--color-text-muted` | `text-text-muted` |
| Accent (brand orange) | `--color-accent` | `bg-accent`, `text-accent` |
| Accent text | `--color-accent-text` | `text-accent-text` |
| Accent muted | `--color-accent-muted` | `bg-accent-muted` |
| Secondary | `--color-secondary` | `bg-secondary` |
| Border | `--color-border` | `border-border` |
| Success | `--color-success` / `--color-success-fg` | `text-success`, `bg-success-fg` |
| Error | `--color-error` / `--color-error-fg` | `text-error`, `bg-error-fg` |
| Warning | `--color-warning` / `--color-warning-fg` | `text-warning`, `bg-warning-fg` |
| Info | `--color-info` / `--color-info-fg` | `text-info`, `bg-info-fg` |

- **Never use color as the only differentiator** — pair with icon, label, or pattern.
- Dark mode is handled via `.dark` class — tokens remap automatically, no manual overrides needed.
- Use `surface-card` and `surface-card-strong` utility classes for card containers.
- Shadows: `--shadow-soft` (cards) and `--shadow-strong` (elevated modals/dropdowns).

---

## 6. CTAs & Buttons

- **One primary CTA per view** — hierarchy: primary > secondary > ghost.
- Minimum touch target: **44×44px**.
- Always show hover, focus, active, and disabled states.
- Button labels must describe the action: "Save changes" not "Submit".
- Destructive actions (delete, remove) require confirmation.

---

## 7. Component & UI Standards

- **Server First**: Default to Server Components. `use client` only when needed.
- **Responsive / Mobile-First**: Design and verify on small screens first; fluid layouts, readable type, comfortable touch targets; no hardcoded px (use tokens).
- Breakpoints (defined in `globals.css`): `phone` (480px) → `phone-lg` (640px) → `tablet` (768px) → `tablet-lg` (1024px) → `laptop` (1280px) → `desktop` (1536px) → `desktop-lg` (1920px) → `ultrawide` (2560px). Use `min-width` media queries.
- No horizontal scroll on any breakpoint. Navigation must collapse gracefully on mobile.
- **Images**: Always `next/image`. Use `fill` + `sizes` + `relative` parent. Add `loading="lazy"`, specify `width` and `height`. Use WebP.
- **Performance**: No CLS (skeletons, explicit dims). Core Web Vitals: **LCP < 2.5s**, **CLS < 0.1**, **INP < 200ms**.
- **Structure**: Thin pages. Business logic outside UI components.

---

## 8. Server Actions — PRIORITY

**MUST use `useHandleAction` hook.** Do not manage `isPending`/`error` manually.

- **Hook**: `apps/web/src/modules/auth/hooks/useHandleAction.ts`
- **Return**: `ActionReturn<T, K>` (`@repo/common-lib/types/response`)

```ts
const { handleSubmit, isPending, errors } = useHandleAction({
  action: loginServerAction,
  afterAction: async (result) => { if (result.data) router.push('/dashboard'); },
});
```

---

## 9. Accessibility (a11y)

- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<article>`.
- All images need `alt` text (decorative: `alt=""`).
- Full **keyboard navigation** — Tab, Enter, Escape, arrow keys.
- Visible focus indicators on all interactive elements.
- Use ARIA roles/labels only when native HTML isn't sufficient.

---

## 10. Forms & Inputs

- Labels always **visible** — never use placeholder as a label.
- Show inline validation on blur, not on submit only.
- Correct `type` attributes: `email`, `tel`, `number`, `url`, `password`.
- Enable browser autocomplete (`autocomplete` attribute).
- Logical Tab order through all fields.
- Error messages must say **what went wrong and how to fix it**.

---

## 11. Navigation & Wayfinding

- User must always know where they are (breadcrumbs, active nav state, page title).
- Primary nav: **max 7 items**. Keep position consistent across pages.
- Include search for content-heavy sites (> 20 pages).
- URL structure should reflect content hierarchy.

---

## 12. Content & Microcopy

- Short paragraphs (3–5 lines max); use subheadings for long content.
- Plain language — 7th–8th grade reading level, no jargon.
- Every empty state needs a message and a next action.
- Loading states must communicate progress (spinner + label, skeleton screens, progress bar).
- Avoid "click here" — use descriptive link text.

---

## 13. Trust & Credibility

- HTTPS on all pages.
- Privacy policy and cookie notice clearly accessible.
- Show social proof near conversion points (reviews, testimonials, logos).
- Contact info reachable in ≤ 2 clicks.
- Consistent brand voice and visual identity.

---

## 14. SEO Foundations

- Unique `<title>` (50–60 chars) and `<meta name="description">` (150–160 chars) per page.
- One `<h1>` per page containing the primary keyword.
- JSON-LD structured data for rich snippets.
- Canonical URL on every page. Sitemap.xml and robots.txt present.

---

## 15. Clean Code

- **Naming**: Domain-based (e.g., `user.utils.ts` > `utils.ts`).
- **Boundaries**: NEVER import from `apps/api`.

---

## Quick Audit Checklist

```
[ ] Text readable at 16px+ with 4.5:1 contrast
[ ] One clear primary CTA above the fold
[ ] Page loads < 3s on mobile 4G
[ ] Works without a mouse (keyboard nav)
[ ] No content shifts during load (CLS)
[ ] Mobile layout has no horizontal scroll
[ ] Form labels always visible
[ ] Images have alt text
[ ] Nav shows active state
[ ] Error messages are helpful
[ ] useHandleAction used for all Server Actions
[ ] No hardcoded hex/px values — use design tokens from globals.css
[ ] Cards use `surface-card` or `surface-card-strong` utility classes
[ ] Border-radius uses `--radius-*` tokens
```

---

## Output Format

When generating UI code or design recommendations:

1. **Structure first** — layout and hierarchy.
2. **Apply tokens** — spacing, type scale, color system.
3. **Add states** — hover, focus, active, disabled, loading, empty, error.
4. **Test mentally** — keyboard-only, mobile, dark mode, slow network.
5. **Note tradeoffs** — if a decision sacrifices one principle for another, say so.
