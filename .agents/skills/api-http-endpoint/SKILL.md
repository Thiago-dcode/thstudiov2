---
name: api-http-endpoint
description: >-
  Add a thin NestJS HTTP endpoint with a request DTO. Use when exposing a route,
  adding a controller method, request validation, or guards in apps/api — not for
  business logic or SQL.
---

# API Recipe: HTTP Endpoint (Controller + Request DTO)

Use when exposing a route. Pair with a service method. Add a repository method only if persistence is needed and missing.

- Request DTO in `requests/` for that method only.
- Controller: route + guards + DTO validation. No business logic, no DB.

Never generate full CRUD by default. If methods were not listed, ask: `Which methods should I implement now (example: create, findAll, findOne, updateStatus, delete)?`

If the module or service is missing, add only what this endpoint needs (see related skills).

## After implementing

If this is a middle change (not a typo fix), follow `.agents/skills/api-verification/SKILL.md`.

## Related skills

- `.agents/skills/api-service/SKILL.md` — orchestration behind the route
- `.agents/skills/api-nest-module/SKILL.md` — register the controller
- `.agents/skills/api-repository/SKILL.md` — persistence if missing
- `.agents/skills/full-api-module/SKILL.md` — composing this recipe with others
