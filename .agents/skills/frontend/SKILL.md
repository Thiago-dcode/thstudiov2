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

## 2. Design Language — Co-Star & Editorial Journal

**Style**: Dark-first minimalist + asymmetric editorial.

- **Colors**: Dark backgrounds (`oklch(5–15% 0 0)`), off-white text. No saturated accents.
- **Typography**:
  - **Body**: Clean serifs (Playfair, Lora) for credibility.
  - **UI**: Sans/Mono for labels and interactive elements.
  - **Scale**: 1.25–1.5 ratio. Line height 1.5–1.75.
- **Layout**: Asymmetric Bento grids. Ample negative space.
- **Tone**: Sparse, serious, mystical. No "tech startup" vibes.

---

## 3. Visual Hierarchy & Layout

- Use an **8px spacing grid** (8, 16, 24, 32, 48, 64px).
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

---

## 5. Color

- Palette: 1 primary, 1 secondary, neutrals, semantic (success / warning / error / info).
- **Never use color as the only differentiator** — pair with icon, label, or pattern.
- Test contrast in both light and dark mode.
- Semantic colors: green = success, red = error, amber = warning, blue = info.

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
- Breakpoints: 320px (mobile) → 768px (tablet) → 1280px (desktop). Use `min-width` media queries.
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
[ ] No hardcoded px values — tokens only
```

---

## Output Format

When generating UI code or design recommendations:

1. **Structure first** — layout and hierarchy.
2. **Apply tokens** — spacing, type scale, color system.
3. **Add states** — hover, focus, active, disabled, loading, empty, error.
4. **Test mentally** — keyboard-only, mobile, dark mode, slow network.
5. **Note tradeoffs** — if a decision sacrifices one principle for another, say so.
