---
name: frontend
description: >-
  Frontend rules for TH Studio's Next.js app: design tokens, editorial-minimalist style,
  Server Actions with useHandleAction, components, forms and responsive layout. Use when
  working in apps/web, packages/ui or packages/frontend-lib, or when asked to build,
  design, review or restyle any page, component or UI.
---

# Frontend rules (Next.js + UX)

UX comes first: clear flows, obvious affordances, low friction. Immediate feedback (hover, active, skeletons, toasts) is mandatory; skeletons and optimistic UI beat raw speed. Error copy is human and says how to fix the problem.

Related skills: `accessibility` (WCAG, keyboard, ARIA), `marketing-seo-ux` (public pages, metadata, structured data), `logging` (server-side log lines). For layout, spacing and tone details read `references/design-language.md`.

## Style in one paragraph

Editorial minimalist, light-first with dark mode: pages **breathe**, chrome is quiet, uploaded art is the focus. **Zero border-radius** (no `rounded-*` except `rounded-full` on functionally circular controls). **Accent** (`#B20000`) is rationed to primary CTAs and deliberate emphasis, never fills, borders or links. One primary action and one focal point per view.

## Tokens

All colours come from `packages/ui/src/styles/globals.css`. **Never hardcode hex or px values**; use the variables or their Tailwind aliases. Dark mode remaps automatically via `.dark`.

| Purpose | Token | Tailwind |
|---|---|---|
| Page background | `--color-bg` | `bg-bg` |
| Card / raised surface | `--color-fg` | `bg-fg` |
| Chip / hover fill | `--color-fg-1` | `bg-fg-1` |
| Card border | `--color-fg-2` | `border-fg-2` |
| Primary / secondary text | `--color-text` / `--color-text-muted` | `text-text` / `text-text-muted` |
| Accent (rationed) | `--color-accent` | `bg-accent`, `text-accent` |
| Borders | `--color-border` / `--color-border-em` | `border-border` / `border-border-em` |
| Status | `--color-{success,error,warning,info}` and `-fg` | `text-success`, `bg-success-fg`, … |

Card containers use `surface-card` / `surface-card-strong`. Shadows: `--shadow-soft` (cards), `--shadow-strong` (modals, dropdowns). Never use colour as the only differentiator.

## Layout and components

- **Server Components by default**; `use client` only when needed. Pages stay thin, business logic outside UI components.
- **Mobile first**, `min-width` queries. Breakpoints in `globals.css`: `phone` 480, `phone-lg` 640, `tablet` 768, `tablet-lg` 1024, `laptop` 1280, `desktop` 1536, `desktop-lg` 1920, `ultrawide` 2560. No horizontal scroll at any breakpoint; nav collapses gracefully.
- Spacing on the Tailwind 4px scale, **defaulting upward** (`gap-6`, `gap-8`, `py-16`, `py-20`). Group related items tightly, separate unrelated ones generously.
- **Images**: always `next/image` (`fill` + `sizes` + `relative` parent, or explicit `width`/`height`), WebP, lazy by default.
- **Performance**: no CLS (skeletons, explicit dimensions). LCP < 2.5 s, CLS < 0.1, INP < 200 ms.
- **Buttons**: hierarchy primary > secondary > ghost; accent only on primary. Touch target ≥ 44×44 px. Show hover, focus, active, disabled. Label the action ("Save changes", not "Submit"). Destructive actions need confirmation.
- **Forms**: visible labels (a placeholder is not a label), inline validation on blur, correct `type` and `autocomplete`, errors that say what went wrong and how to fix it.
- **States**: every empty state has a message and a next action; loading states show progress.

## Server Actions (priority)

**Always use the `useHandleAction` hook**; never manage `isPending`/`error` by hand.

- Hook: `apps/web/src/modules/auth/hooks/useHandleAction.ts`; return type `ActionReturn<T, K>` (`@repo/common-lib/types/response`).
- Server actions may log via `@/lib/logging/logger`. `@repo/backend-lib` is server-only: never import it, or a module that does, from a `"use client"` file.

```ts
const { handleSubmit, isPending, errors } = useHandleAction({
  action: loginServerAction,
  afterAction: async (result) => { if (result.data) router.push('/dashboard'); },
});
```

## Code

Domain-based file names (`user.utils.ts`, not `utils.ts`). Never import from `apps/api`.

## Audit checklist

- [ ] Only design tokens, no hex/px literals; cards use `surface-card*`
- [ ] No `rounded-*` (except circular controls); accent only on CTAs and deliberate emphasis
- [ ] Layout breathes: generous section padding, constrained prose, no cramped grids; one focal point
- [ ] One clear primary CTA above the fold; text ≥ 16 px at ≥ 4.5:1 contrast
- [ ] Keyboard-usable, visible focus, alt text (see `accessibility`)
- [ ] No CLS, no horizontal scroll on mobile; nav shows active state
- [ ] Forms have visible labels and helpful errors
- [ ] Every Server Action goes through `useHandleAction`

When generating UI: structure first (does it breathe?), then tokens, then states (hover, focus, active, disabled, loading, empty, error), then check keyboard, mobile, dark mode and slow network. Say so if a decision trades one principle for another.
