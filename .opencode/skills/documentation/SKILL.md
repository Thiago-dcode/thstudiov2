---
name: documentation
description: Daily documentation rule. Use when the user asks to document what was done today or update the daily log.
---

# Daily Documentation Guide

Daily logs live in `docs/daily/`.

## File naming

`docs/daily/YYYY-MM-DD.md`

## Format

Keep it **short and scannable** — one bullet per task, one line each.
Use this template:

```md
# Daily Log — DD Mon YYYY

## ✅ Done

- **Feature / fix name** — what was done and where (files / layers affected).
- **Feature / fix name** — what was done and where.
```

## Rules

- No long paragraphs. A reader must understand what was done in 10 seconds.
- Group related sub-tasks under a single bullet when possible.
- Mention the package/layer affected (`apps/api`, `apps/web`, `packages/ui`, etc.).
- If something was refactored to fix a structural problem (e.g. circular dependency), say so briefly.
- Do **not** document operational steps (searches, lint fixes, etc.) — only user-facing or architecture-level changes.
