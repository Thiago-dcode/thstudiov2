---
name: accessibility
description: >-
  Audit and improve web accessibility to WCAG 2.2 AA in apps/web and packages/ui. Use when
  asked to improve accessibility, run an a11y audit, check WCAG compliance, support screen
  readers or keyboard navigation, or when building interactive components (dialogs, menus,
  forms, custom controls).
---

# Accessibility (WCAG 2.2 AA)

Target **AA** on every public and signed-in page. Prefer native HTML over ARIA; add ARIA only when no native element does the job.

Read on demand:
- A worked code example for a criterion (alt text, contrast, focus, target size, forms, ARIA, live regions) → `references/CRITERIA-EXAMPLES.md`
- Copy-paste patterns (modal focus trap, tabs, menus, screen-reader commands) → `references/A11Y-PATTERNS.md`
- Criterion-by-criterion lookup by level → `references/WCAG.md`

## Rules that matter most

- **Semantics**: one `<h1>`, no skipped heading levels; landmarks (`header`, `nav`, `main`, `footer`); `<html lang>` set (this app is multi-locale, keep it in sync with the locale); buttons for actions, links for navigation.
- **Images**: meaningful `alt`; decorative `alt=""`. Icon-only controls get an `aria-label`.
- **Contrast**: text ≥ 4.5:1 (large ≥ 3:1), UI components and focus rings ≥ 3:1. Never use colour alone to convey state. Use the design tokens, which are tuned for this in light and dark.
- **Keyboard**: everything reachable and operable with Tab, Shift+Tab, Enter, Space, Escape and arrows where expected; logical order matching the visual one; no traps; **visible focus** that is not hidden behind sticky headers (2.4.11). Add a skip link to `main`.
- **Target size**: ≥ 24×24 px (2.5.8); this project's buttons use 44×44 px.
- **Forms**: visible `<label>` bound to each control, `autocomplete` on identity fields, errors tied to fields (`aria-describedby`, `aria-invalid`) and announced; don't force re-entering data already given (3.3.7); no cognitive tests in authentication (3.3.8; allow paste and password managers).
- **Dynamic content**: status and errors in `role="status"` / `aria-live="polite"` (`role="alert"` only for urgent); move focus into dialogs and back on close; Escape closes.
- **Motion and media**: respect `prefers-reduced-motion`; no auto-playing audio or video; captions for video; give a pause control for anything that moves for over 5 s.
- **Dragging** (2.5.7): offer a non-drag alternative (buttons, inputs) for any drag interaction, e.g. reordering portfolio items.

## Testing

Automated (catches roughly a third of issues): `npx lighthouse <url> --only-categories=accessibility` or `@axe-core/cli`.

Manual, always:
- [ ] Tab through the whole page; Enter/Space activate; focus always visible and in a sensible order
- [ ] Screen reader pass (VoiceOver, NVDA or TalkBack) on any new flow
- [ ] 200% zoom and 320 px width without loss or horizontal scroll
- [ ] `prefers-reduced-motion: reduce` and Windows High Contrast
- [ ] Dark mode contrast

## Triage by impact

- **Critical**: missing form labels or alt text, low contrast, keyboard traps, no focus indicator
- **Serious**: missing page language or heading structure, vague link text ("click here"), auto-play, no skip link
- **Moderate**: unlabeled icons, inconsistent navigation, unidentified errors, timeouts without controls, missing landmarks

## Links

[WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/) · [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) · [axe rules](https://dequeuniversity.com/rules/axe/)
