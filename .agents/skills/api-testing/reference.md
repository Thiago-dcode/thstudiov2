# API Testing Reference

## curl templates (PowerShell — use `curl.exe`)

### Health check

```powershell
curl.exe -s http://localhost:8080/
```

### Login

```powershell
curl.exe -s -X POST "http://localhost:8080/api/v1/auth/login" `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"contact.thiago.ferreira@gmail.com\",\"password\":\"thiago.1234\"}"
```

### Login + save token

```powershell
$resp = curl.exe -s -X POST "http://localhost:8080/api/v1/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"contact.thiago.ferreira@gmail.com","password":"thiago.1234"}' | ConvertFrom-Json
if ($resp.error) { $resp.error | ConvertTo-Json; exit 1 }
$token = $resp.data.token
if (-not $token) { Write-Host "2FA required or missing token"; $resp.data | ConvertTo-Json; exit 1 }
```

### Authenticated GET

```powershell
curl.exe -s "http://localhost:8080/api/v1/auth/refresh-token" `
  -H "Authorization: Bearer $token" `
  -X POST
```

### Authenticated POST with body file

Save body as `body.json`, then:

```powershell
curl.exe -s -X POST "http://localhost:8080/api/v1/<controller>/<action>" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "@body.json"
```

### Query string (extended parser)

Bracket arrays work with the extended query parser:

```
GET /api/v1/categories?categories[]=1&categories[]=2
```

```powershell
curl.exe -s "http://localhost:8080/api/v1/categories?categories[]=1&categories[]=2" `
  -H "Authorization: Bearer $token"
```

## curl templates (bash)

```bash
BASE=http://localhost:8080/api/v1

# Login
curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"contact.thiago.ferreira@gmail.com","password":"thiago.1234"}' | jq .

# Token
export TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"contact.thiago.ferreira@gmail.com","password":"thiago.1234"}' \
  | jq -r '.data.token')

# Authenticated
curl -s "$BASE/<path>" -H "Authorization: Bearer $TOKEN" | jq .
```

## Auth types (`packages/common-lib/src/types/auth.ts`)

| Type | When | `token` |
|------|------|---------|
| `UserAuth` | Login success, no 2FA | JWT string |
| `UserTwofa` | Login requires 2FA | `null` |
| `UserPayload` | Inside JWT (server) | N/A |

JWT payload fields used by `AuthGuard`: `id`, `email`, `user_auth_device_id`, `role.id`.

## MCP Postgres

**Server**: `user-postgres`  
**Tool**: `query` — parameter `{ "sql": "<SELECT ...>" }`

**Schema resource** (optional): `postgres://admin@localhost:5432/migrations/schema` via `FetchMcpResource`.

### Example verification queries

User by email:

```sql
SELECT id, public_id, email, username, is_active, role_id, twofa_enabled
FROM users
WHERE email = 'contact.thiago.ferreira@gmail.com';
```

Latest sessions for user:

```sql
SELECT us.id, us.token IS NOT NULL AS has_token, us.expires_at, us.created_at
FROM user_sessions us
JOIN users u ON u.id = us.user_id
WHERE u.email = 'contact.thiago.ferreira@gmail.com'
ORDER BY us.created_at DESC
LIMIT 3;
```

After `POST .../auth/logout`, re-query sessions — expect invalid/expired or removed session depending on implementation.

## Error response shape

```json
{
  "error": {
    "status_code": 401,
    "message": "...",
    "errors": ["..."],
    "path": "/api/v1/..."
  },
  "data": null,
  "audit": { }
}
```

Validation errors often use `status_code` 400 with multiple `errors[]` strings.

## Finding controllers quickly

```bash
# From repo root
rg "@(Get|Post|Put|Patch|Delete)\(" apps/api/src/v1/modules -g "*.controller.ts"
rg "@Controller\(" apps/api/src/v1/modules -g "*.controller.ts"
```

Admin controllers: under `apps/api/src/v1/modules/admin/`, mounted at `/api/v1/admin/...`, typically require admin guard in addition to Bearer.

## Related code

| Concern | Location |
|---------|----------|
| Global prefix | `apps/api/src/app.module.ts` (`api/v1`) |
| Response wrap | `apps/api/src/common/intecerceptors/response.interceptor.ts` |
| Bearer guard | `apps/api/src/common/guards/auth.guard.ts` |
| Public routes | `@Public()` in `apps/api/src/common/decorators/public.decorator.ts` |
| Login DTO | `apps/api/src/v1/modules/auth/requests/login.request.ts` |
