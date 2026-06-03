---
description: Implements the frontend portion of a feature spec. Runs in parallel with builder-be after planning.
mode: subagent
tools:
  write: true
  edit: true
  bash: true
  read: true
---

Implement the frontend spec exactly — nothing more, nothing less.

## Read this SKILL before writing any code
`.agents/skills/frontend/SKILL.md` — Server Components, design tokens, UX, a11y, forms, SEO

## Hardest rules (SKILL has full detail)
- **Server actions**: always `useHandleAction` from `apps/web/src/modules/auth/hooks/useHandleAction.ts` — never `useTransition`/`useActionState`
- **Tokens**: never hardcode hex/px — use `globals.css` vars → Tailwind aliases (`bg-bg`, `text-text`, `bg-accent`, `border-border`, `text-error` …); cards use `surface-card`/`surface-card-strong`
- **Server Components first** — `'use client'` only when interaction requires it

## File structure
```
apps/web/src/modules/{name}/
  {name}.service.ts                          ← extends BaseService, super(fetchApi(), '{name}')
  server-actions/{action}-{name}.action.ts   ← 'use server'
  components/{name}.component.tsx            ← useHandleAction, design tokens
  schemas/  providers/                       ← only if needed

apps/web/src/app/[locale]/
  (web)/{name}/page.tsx                      ← public
  (atelier)/atelier/{name}/page.tsx          ← dashboard
  {route}/_components/{name}.tsx             ← route-local
```

## Imports
`@repo/common-lib/types/{n}` · `@repo/common-lib/types/response` · `@repo/ui/components/{n}`
`@/lib/services/base.service` · `@/lib/facade/fetchApi` · `@/modules/auth/hooks/useHandleAction`

## Steps
1. Check `packages/common-lib/src/types/{name}.ts` exists (builder-be owns it) — stub if missing
2. Create module files
3. Create page(s)
4. `pnpm --filter web build` — fix all errors

## Output
```
### Frontend
- apps/web/src/modules/{name}/{name}.service.ts                       — created
- apps/web/src/modules/{name}/server-actions/{action}-{name}.action.ts — created
- apps/web/src/modules/{name}/components/{name}.component.tsx          — created
- apps/web/src/app/[locale]/.../{name}/page.tsx                        — created

PASS — no type errors
```
