# Security

> Authentication, authorisation, rate limiting, and the trusted-proxy bug that's your second-best story.
> Related: [`nginx.md`](./nginx.md) · [`devops-and-cicd.md`](./devops-and-cicd.md) · [`observability.md`](./observability.md)

---

## 1. Authentication vs authorisation 🔵

- **Authentication (authn)** — *who are you?* Login, tokens, 2FA.
- **Authorisation (authz)** — *what may you do?* Roles, ownership checks, plan limits.

Two words that get used interchangeably and shouldn't be. 🟢 Your guard stack separates them cleanly: `AuthGuard` does authn; `AdminGuard`, `UserStrikesGuard`, `AiConsumptionGuard` do authz.

---

## 2. Your auth stack

🟢 `apps/api/src/v1/modules/auth/` — custom JWT/session implementation with email-based 2FA (`requests/verify-2fa.request.ts`), device tracking (`user-auth-devices`), session tracking (`user-sessions`), and password-recovery attempt limiting (`password-recovery-attempts/`).

⚠️ **`better-auth` is in `apps/web/package.json` with zero imports anywhere in `apps/web/src`.** Never list it. The custom implementation is the stronger claim anyway — and an unused dependency is worth removing so it can't mislead a reader of your `package.json`.

### JWT — know the trade-offs 🔵

A JWT is three base64url parts: `header.payload.signature`. The signature proves the payload wasn't altered.

⚠️ **A JWT is signed, not encrypted.** Anyone holding it can read the payload. Never put anything secret in it.

| Benefit | Cost |
|---|---|
| **Stateless** — any replica verifies with the shared secret | **Can't be revoked** before expiry |
| No session lookup per request | Payload is readable by the holder |
| Enables [horizontal scaling](./scaling-and-replicas.md#5-statelessness--the-rule-that-makes-it-work) | Longer expiry = longer exposure window |

**The standard mitigation:** short-lived access tokens plus a long-lived refresh token, so revocation has a bounded window; or a denylist of revoked token IDs in Redis — which reintroduces the state JWTs existed to avoid, and that irony is worth naming.

🟢 **The trade-off is real in your system**, and it's why the WebSocket expiry gap in [`realtime-websockets.md`](./realtime-websockets.md#why-authenticate-at-the-handshake-) exists: a connection authenticated once at handshake outlives the token.

🔵 **The `alg: none` attack** — early JWT libraries accepted a token declaring no algorithm. Always pin the expected algorithm server-side rather than trusting the header.

### Password storage 🔵

Passwords must be stored with a **slow, salted hash** — bcrypt, scrypt, or Argon2id (current recommendation). Never MD5, SHA-1, or plain SHA-256: they're *fast*, which is exactly wrong. **Salt** defeats rainbow tables; **work factor** keeps the hash expensive as hardware improves.

### 2FA 🟢

Email-based second factor. 🔵 Worth knowing the hierarchy: **SMS < email < TOTP < hardware key (WebAuthn/FIDO2)**. Email 2FA stops credential stuffing but not an attacker who controls the mailbox. TOTP is the usual next step.

---

## 3. Rate limiting and the trusted-proxy bug 🟢

**This is your second-best interview story.** Two layers:

1. **nginx** — 30 r/s general, 10 r/m on auth ([`nginx.md`](./nginx.md#job-4--rate-limiting))
2. **`AppThrottlerGuard`** — application-aware, in `apps/api/src/common/guards/`

### The bug

SSR traffic arrives at the API **from the Next.js server**, not from the browser. Using the socket peer address as the rate-limit key meant **every visitor collapsed into a single bucket** — so ordinary traffic tripped the limit and produced **site-wide 429s**.

🟢 **The fix:** `AppThrottlerGuard` resolves the real end-user IP through `RequestService`, which carries per-request context in `AsyncLocalStorage`.

🟢 **It was made worse by the replica count** — your own healthcheck comment records it:

> *"every probe rendered the whole landing page — four API calls each, x2 replicas, every 30s, and every 3s during start_period. That alone was a large share of the 429s."*

**Two independent causes for one symptom**, which is what made it hard.

> **Say this:** "I had site-wide 429s. Two causes. The rate limiter keyed on the socket peer, but with SSR the peer is my own Next.js server — so every visitor shared one bucket. And the container healthcheck was rendering the full landing page, four API calls each, on two replicas, every 30 seconds. I fixed the keying by resolving the real client IP from request context held in AsyncLocalStorage, and made the healthcheck hit a cheap endpoint. The general name is the trusted-proxy problem — and the security half is that you have to take the IP from a header your edge writes, not one the client can forge."

🔵 **The general lesson:** any middlebox — load balancer, CDN, SSR layer — breaks IP-based logic unless you explicitly resolve the real client. Same root cause as `CF-Connecting-IP` vs `X-Forwarded-For` ([`nginx.md`](./nginx.md#job-5--real-client-ip-resolution)).

---

## 4. Defense in depth 🟢

| Layer | Control |
|---|---|
| Cloudflare | WAF, DDoS absorption, bot management |
| nginx | Origin lockdown (444 for non-Cloudflare), TLS policy, rate limits, security headers |
| NestJS guards | Authn, authz, per-user throttling, strikes, media-type validation |
| Application | Zod/class-validator input validation, parameterised queries |
| Data | Soft deletes, secret redaction in logs |
| Build | BuildKit secret mounts, SHA-pinned actions, least-privilege tokens |

🔵 The principle: **no single control is trusted to be sufficient.** Cloudflare can be bypassed, so nginx checks. nginx rate-limits coarsely, so the app limits per-user.

---

## 5. OWASP Top 10, mapped 🔵

Worth being able to walk this list against your own system:

| Risk | Your position |
|---|---|
| **Broken access control** | 🟢 Guards per route; ownership checks in services. ⚠️ No systematic IDOR test suite. |
| **Cryptographic failures** | 🟢 TLS 1.2/1.3 only, ECDHE forward secrecy, secrets never in image layers |
| **Injection** | 🟢 Parameterised queries throughout the builder; class-validator DTOs; Zod on the web side |
| **Insecure design** | 🟢 Fail-closed indexability; allow-list over deny-list for notification statuses |
| **Security misconfiguration** | 🟢 Security headers, origin lockdown. ⚠️ **No CSP.** |
| **Vulnerable components** | ⚠️ **No dependency scanning in CI.** Real gap. |
| **Auth failures** | 🟢 2FA, session/device tracking, recovery-attempt limits, tight auth rate limit |
| **Data integrity failures** | 🟢 SHA-pinned actions, lockfile with `--frozen-lockfile` |
| **Logging failures** | 🟢 Structured logs, correlation IDs, secret redaction. ⚠️ No alerting. |
| **SSRF** | ⚠️ You fetch remote image URLs for LLM vision — worth thinking about. |

⚠️ **Two honest gaps to volunteer:** no CSP, and no dependency scanning. Both are cheap to add and naming them beats being asked.

---

## 6. Input validation 🟢

**Validate at the boundary, trust inside.**

- API: `class-validator` DTOs in `requests/` sub-directories, enforced by Nest's global `ValidationPipe`
- Web: **Zod 4** schemas on server actions
- Uploads: `MediaTypeGuard` validates media types before processing

🔵 **Allow-list over deny-list**, always. A deny-list of dangerous file types misses the one you didn't think of; an allow-list of permitted types fails safe. 🟢 You apply this reasoning explicitly in `constants/user-notification.ts`, where the comment explains that a future transient status would leak through a deny-list.

⚠️ **Uploads are the highest-risk surface in this app.** Users upload arbitrary binaries that get processed by Sharp and stored on S3. Mitigations present: type allow-listing, size caps (300 MB), `X-Content-Type-Options: nosniff`, CloudFront serving rather than the origin. Worth knowing that image-parsing libraries have a real CVE history — keeping Sharp current matters more than most dependencies.

---

## 7. Secret management 🟢

| Where | How |
|---|---|
| CI → build | **BuildKit secret mounts** — never in a layer or the shared cache |
| CI → deploy | Per-run `GITHUB_TOKEN`, not a long-lived PAT |
| Runtime | `.env` on the droplet, read by Compose |
| Logs | 🟢 `packages/backend-lib/src/services/log-service/redact.ts` — with tests |

🟢 **Log redaction is a genuinely good detail.** Secrets reach logs constantly — a logged request body containing a password, an error object carrying a connection string. Redacting *before write*, with depth and breadth caps to bound the cost, is a thing most codebases don't have.

⚠️ **Gaps:** no secret rotation policy, no vault (Doppler/Vault/AWS Secrets Manager), `.env` sits on the droplet. All defensible at this scale — just don't claim more.

---

## 8. Content moderation as security 🟢

Vision-based moderation → severity score → three-strike ban (`UserStrikesGuard`, `media-moderation` module).

**This is user-generated-content security**, and it's a real product-safety control rather than a nice-to-have: without it, one user can host arbitrary imagery on your domain. Details in [`llm-engineering.md`](./llm-engineering.md).

⚠️ **Know the failure mode:** the moderation path **fails open** — if LLM parsing fails, content is allowed. That's a deliberate availability-over-safety choice, and the opposite of the fail-*closed* choice you made for SEO indexability. **Being able to name two places where you chose opposite defaults, and why, is a strong answer.**

---

## Interview drills

**"How do you handle authentication?"**
Custom JWT with email 2FA, device and session tracking. Then immediately the trade-off: stateless and horizontally scalable, but revocation is bounded by expiry — and the WebSocket handshake makes that concrete.

**"Tell me about a security bug you fixed."**
The trusted-proxy rate-limit bug, §3. It has two independent causes, a real symptom, and a general lesson.

**"How do you keep secrets out of your images?"**
BuildKit secret mounts, and *why* build-args fail: they become ENV in the builder stage and `cache-to: mode=max` exports that stage to a shared cache.

**"What's your biggest security gap?"**
No CSP and no dependency scanning. Volunteer them with the reason CSP is hard on a Next.js app (inline scripts need nonces). Naming your own gaps reads as competence.

**"Someone uploads a malicious file. What happens?"**
Walk the chain: type allow-list → size cap → Sharp processing in an isolated worker → S3 not the origin → `nosniff` → CloudFront. Then the honest bit: Sharp has a CVE history and the real control is keeping it current.
