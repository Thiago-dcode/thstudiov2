---
name: frontend
description: Frontend rules for Next.js, UI components, Server Actions, and styling. Use when working with apps/web, packages/ui, packages/frontend-lib, or when building React components, pages, or styling.
---

# Frontend Rules (Next.js)

## Design Reference: Co-Star & Editorial Journal Aesthetic

Web UI style should follow a blend of [Co-Star Astrology](https://www.costarastrology.com/) (minimalist, dark-first) and modern **Editorial/Journal** design (asymmetric, typography-focused, clean hierarchy).

- **Color Palette**: Black-and-white with grey tones. No saturated accents unless minimal. Prefer dark backgrounds (`oklch(5% 0 0)`–`oklch(15% 0 0)`), off-white text (`oklch(95% 0 0)`), muted greys for secondary content.
- **Editorial Typography**: 
    - **Serif for Body/Long-form**: Use clean, authoritative serifs (e.g., Playfair Display, Lora, or system equivalents) for long-form content to boost perceived credibility.
    - **Sans/Mono for UI/Meta**: Use monospace or clean sans-serif for labels, metadata, and interactive elements.
    - **Typography Scale**: Maintain a 1.25–1.5 ratio for clear hierarchy. Let copy breathe with 1.5–1.75 line height.
- **Journal Layouts**: 
    - **Bento Grids**: Use asymmetric, card-based "Bento" layouts for feature showcases and dashboards.
    - **Asymmetry**: Avoid rigid center-alignment for everything. Use purposeful asymmetry to guide the eye.
    - **Negative Space**: Ample whitespace is a functional requirement, not a decoration.
- **Editorial Elements**:
    - **Pull Quotes**: Use styled pull quotes for key insights.
    - **Drop Caps**: Use sparingly for starting major sections.
    - **Minimalist Restraint**: Less is more. Avoid decorative flourishes and visual noise.
- **Tone**: Spare, stylish, serious, slightly mystical. Poetic simplicity over verbose UI copy.
- **Avoid**: Bright accent colors, gradients, playful illustrations, "tech startup" aesthetic, notification overload.

## Component & UI Standards

- **Server vs Client**: Always prioritize server components over client components. Use `"use client"` only when necessary (interactivity, hooks, browser APIs).
- **Responsiveness**: Responsive design is important. Ensure layouts, typography, and spacing work well across viewport sizes.
- **Global Styles**: Check `packages/ui/src/styles/globals.css` before adding new tokens.
- **No Hardcoded Values**: Use design tokens for colors, spacing, radius. No random Tailwind values.
- **Layout Stability**: Minimize UI shifting (Cumulative Layout Shift) by using skeletons for loading states, providing explicit dimensions for images, and using `next/image` to prevent reflow.
- **Component Design**: Composable, accessible (ARIA), dark-mode ready. Avoid inline styles.
- **Logic Separation**: Keep pages thin. Separate layout from business logic. Business logic inside UI components is forbidden.
- **Images**: Always use `next/image` `Image` component instead of `<img>`. Use `fill` with a `relative` parent for responsive layouts; add `sizes` when using `fill` for better performance.

## Server Actions (PRIORITY)

- **Always use `useHandleAction` hook** (`apps/web/src/modules/auth/hooks/useHandleAction.ts`) when calling server actions from client components.
- **Don't manually manage** `isPending`/`error` state.
- **Return Type**: Use `ActionReturn<T, K>` from `@repo/common-lib/types/response`.

### Example Usage

```ts
const { handleSubmit, isPending, errors } = useHandleAction({
  action: loginServerAction,                                                                                                                                                                                                                    
  afterAction: async (result) => { if (result.data) router.push('/dashboard'); },
});
```

## Clean Code

- **Naming**: Clear domain-based naming. No generic `utils.ts`.
- **No Cross-App Imports**: Never import from `apps/api`.
