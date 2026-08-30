---
name: api-join-queries
description: >-
  Apply TH Studio join-query rules when a select joins tables. Use when writing
  joined repository queries, aliased columns, or formatters that aggregate rows
  from multiple tables. Always load collision-prevention first.
---

# API Recipe: Join Queries

Use whenever a select joins tables. Read `.agents/skills/collision-prevention/SKILL.md` first.

- Main table columns keep original names.
- Prefix only colliding columns from joined tables.
- Avoid schema intersections (`&`) when collisions exist.
- Select only needed columns; keep formatter output aligned.

## Related skills

- `.agents/skills/collision-prevention/SKILL.md` — full aliasing rules and examples
- `.agents/skills/api-repository/SKILL.md` — where join queries live
- `.agents/skills/api-schema-types/SKILL.md` — joined schema types
- `.agents/skills/full-api-module/SKILL.md` — composing this recipe with others
