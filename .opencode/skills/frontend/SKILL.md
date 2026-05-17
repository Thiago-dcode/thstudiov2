---
name: frontend
description: Frontend rules for Next.js, UI components, Server Actions, and styling. Use when working with apps/web, packages/ui, packages/frontend-lib, or when building React components, pages, or styling.
---

# Frontend Rules (Next.js)

## Psychology & UX (PRIORITY #1)

**UX > Code/Perf/Aesthetics.** **Users first**: prioritize intuition—clear flows, obvious affordances, low friction.

- **Cognitive Load**: Minimize mental effort (Gestalt). Don't make users think.
- **Hick's Law**: Simplify choices. Break down complex tasks.
- **Fitts's Law**: Large, distinct, easy-to-hit CTAs.
- **Feedback**: Immediate response (hover, active, skeletons, toasts) is mandatory.
- **Perceived Perf**: Skeletons & optimistic UI > actual speed.
- **Emotion**: Delight with micro-interactions. Human, empathetic copy (esp. errors).

## Design: Co-Star & Editorial Journal

**Style**: Dark-first minimalist + asymmetric editorial.

- **Colors**: Dark backgrounds (`oklch(5-15% 0 0)`), off-white text. No saturated accents.
- **Typography**:
    - **Body**: Clean serifs (Playfair, Lora) for credibility.
    - **UI**: Sans/Mono for labels.
    - **Scale**: 1.25–1.5 ratio. 1.5–1.75 line height.
- **Layout**: Asymmetric Bento grids. Ample negative space.
- **Tone**: Sparse, serious, mystical. No "tech startup" vibes.

## Component & UI Standards

- **Server First**: Default to Server Components. `use client` only when needed.
- **Responsive**: **Mobile-first**—design and verify on small screens first; fluid layouts, readable type, comfortable touch targets; no hardcoded px (use tokens).
- **Images**: Always `next/image`. Use `fill` + `sizes` + `relative` parent.
- **Performance**: No CLS (skeletons, explicit dims).
- **Structure**: Thin pages. Business logic outside UI components.

## Server Actions (PRIORITY)

**MUST use `useHandleAction` hook.** Do not manage `isPending`/`error` manually.

- **Hook**: `apps/web/src/modules/auth/hooks/useHandleAction.ts`
- **Return**: `ActionReturn<T, K>` (`@repo/common-lib/types/response`)

```ts
const { handleSubmit, isPending, errors } = useHandleAction({
  action: loginServerAction,
  afterAction: async (result) => { if (result.data) router.push('/dashboard'); },
});
```

## Clean Code

- **Naming**: Domain-based (e.g., `user.utils.ts` > `utils.ts`).
- **Boundaries**: NEVER import from `apps/api`.
