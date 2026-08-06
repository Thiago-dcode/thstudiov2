---
name: api-testing
description: >-
  Autonomously test TH Studio NestJS API endpoints with curl and verify results
  in Postgres via MCP. Use when testing APIs, debugging endpoints, validating
  auth flows, checking DB side effects, or when the user asks to hit localhost:8080.
---

# API Endpoint Testing (Autonomous)

Test the running API without the browser. Use **Shell + curl**, then **confirm in Postgres** with the `user-postgres` MCP server.

## Prerequisites

1. API running locally (default port **8080**): `pnpm --filter api dev` or equivalent.
2. Confirm reachability: `curl.exe -s http://localhost:8080/` → `{"status":"ok"}`.
3. Before calling MCP `query`, read the tool schema at `mcps/user-postgres/tools/query.json` (read-only SQL).

## Base URL & routing

| Scope | Prefix |
|-------|--------|
| Public/user API | `http://localhost:8080/api/v1` |
| Admin API | `http://localhost:8080/api/v1/admin` |

Controller paths append to the prefix (e.g. `@Controller('auth')` → `/api/v1/auth/...`).

## Response envelope (always unwrap `data`)

Successful JSON is wrapped by `ResponseInterceptor`:

```json
{
  "error": null,
  "data": { },
  "pagination": { },
  "count": 0,
  "audit": { "ip": "...", "user_agent": "...", "request_time": 0.01 }
}
```

Errors use `error` (non-null) and `data: null`. Read `status_code`, `message`, `errors[]`, `path` from `error`.

Types: `packages/common-lib/src/types/response.ts`.

## Auth workflow

### 1. Login (public)

`POST /api/v1/auth/login`

```json
{
  "email": "$ADMIN_EMAIL",
  "password": "$ADMIN_PASSWORD"
}
```

**Expected success shape** (`data` = `UserAuth` from `packages/common-lib/src/types/auth.ts`):

- `need_twofa` is `false` or omitted
- `token` is a non-empty JWT string
- User fields from `BaseUser` (e.g. `id`, `email`, `username`, `role`, …)

**2FA branch**: if `data.need_twofa === true`, `data.token` is `null`. Call `POST /api/v1/auth/verify-2fa` with the 2FA payload before using Bearer auth.

### 2. Authenticated requests

Protected routes require:

```http
Authorization: Bearer <token>
```

`AuthGuard` validates JWT + active row in `user_sessions` (not expired).

### 3. Public routes

Endpoints with `@Public()` skip Bearer (login, register, password recovery, etc.). Check the controller for `@Public()` before omitting the header.

### 4. Token reuse in shell

On Windows PowerShell, use **`curl.exe`** (not the `curl` alias). Save the token once:

```powershell
$login = curl.exe -s -X POST "http://localhost:8080/api/v1/auth/login" `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"$env:ADMIN_EMAIL\",\"password\":\"$env:ADMIN_PASSWORD\"}"
$token = ($login | ConvertFrom-Json).data.token
```

Bash:

```bash
TOKEN=$(curl -s -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | jq -r '.data.token')
```

## Autonomous test loop

Copy and track progress:

```
API test progress:
- [ ] API up (GET /)
- [ ] Discover route (controller / OpenAPI / grep)
- [ ] Classify public vs protected
- [ ] Login if protected; handle 2FA if needed
- [ ] Call endpoint with curl (correct method, body, query)
- [ ] Assert HTTP status + envelope (error vs data)
- [ ] Verify DB state via MCP postgres (read-only)
- [ ] Summarize: request, response snippet, DB evidence, pass/fail
```

### Discover endpoints

1. Grep `apps/api/src/v1/modules/**/**.controller.ts` for `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete` and `@Controller('segment')`.
2. Full path = `{base}/{segment}/{method-path}`.
3. Request DTOs live in sibling `requests/*.request.ts` — mirror field names and types in JSON bodies.

### Call endpoints

Default headers:

- `Content-Type: application/json` for JSON bodies
- `Authorization: Bearer $token` when not `@Public()`

Example protected GET:

```powershell
curl.exe -s "http://localhost:8080/api/v1/<segment>/<path>" `
  -H "Authorization: Bearer $token"
```

Pretty-print when helpful: pipe to `jq` (bash) or `ConvertFrom-Json | ConvertTo-Json -Depth 10` (PowerShell).

### Throttling

`AuthController` uses `@Throttle({ medium: { limit: 5, ttl: 10000 } })`. Space login attempts; on 429, wait and retry.

## Postgres verification (MCP)

Use **`CallMcpTool`** with `server: "user-postgres"`, `toolName: "query"`, `arguments: { "sql": "..." }`.

Rules:

- **Read-only** SELECT only (tool enforces read-only).
- Tie queries to the test user: `WHERE email = '$ADMIN_EMAIL'` or `WHERE user_id = <id from login data>`.
- Schema resource: fetch `postgres://admin@localhost:5432/migrations/schema` if column names are unclear.

Common checks after login:

```sql
SELECT id, email, is_active, twofa_enabled FROM users WHERE email = '$ADMIN_EMAIL';

SELECT id, user_id, expires_at, created_at
FROM user_sessions
WHERE user_id = (SELECT id FROM users WHERE email = '$ADMIN_EMAIL')
ORDER BY created_at DESC
LIMIT 5;
```

After mutating endpoints, SELECT the affected table rows and compare to the API `data` payload.

## Reporting

End each test run with:

1. **Endpoint**: method + full URL
2. **Auth**: public / Bearer / admin guard
3. **HTTP status** and whether `error` or `data` was returned
4. **Key fields** from `data` (not the full audit block unless relevant)
5. **DB check**: one-line SQL + whether it matches the API outcome
6. **Verdict**: pass / fail + next step if fail

## Security notes

- Credentials come from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in your local `.env` — they are
  **never hardcoded here**. `packages/database/src/seeds/admin-user.ts` throws if they are
  unset, so there is no default to fall back to. Never paste real values into PRs/logs.
- Do not run destructive SQL via MCP; the query tool is read-only.
- Do not expose production URLs or secrets in skill edits.

## More examples

See [reference.md](reference.md) for curl templates (POST/PATCH/query params), 2FA, logout, and admin prefix examples.
