# nginx and Reverse Proxies

> Nine jobs your config actually performs, each with a name an interviewer may ask about.
> Related: [`scaling-and-replicas.md`](./scaling-and-replicas.md) · [`security.md`](./security.md) · [`devops-and-cicd.md`](./devops-and-cicd.md)

---

## 1. Forward vs reverse proxy

🔵 A **forward proxy** sits in front of *clients* and makes requests on their behalf — a corporate web filter, a VPN. A **reverse proxy** sits in front of *servers* and receives requests on their behalf.

The client thinks it's talking to the application. It's talking to nginx, which decides what to do and who should handle it.

🟢 Config lives in `pro.nginx/` (production) and `dev.nginx/` (development), both version-controlled, so the two environments are configured from the same tracked source.

---

## Job 1 — TLS termination

🟢 Traffic is encrypted twice, in two separate hops:

```
Browser ──TLS #1──▶ Cloudflare ──TLS #2──▶ nginx ──plain HTTP──▶ web / api
        (Cloudflare's         (Cloudflare Origin
         public cert)          Certificate)
```

nginx holds the private key, decrypts, and forwards **plain HTTP** over the internal Docker bridge network. That decryption point is **TLS termination**.

The app containers never deal with certificates — one place to configure TLS, one place to rotate a cert, and Node never spends CPU on crypto.

🟢 `snippets/tls.conf`:

```nginx
ssl_protocols       TLSv1.2 TLSv1.3;
ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:...;
ssl_session_tickets off;
```

🔵 **What to know:**

- TLS 1.0/1.1 disabled — deprecated and broken.
- **ECDHE** = Elliptic Curve Diffie–Hellman **Ephemeral**. "Ephemeral" means a throwaway key pair per session, giving **forward secrecy**: stealing the server's private key later does not decrypt traffic recorded earlier.
- **Session tickets off** because without regular key rotation they undermine that forward secrecy — the ticket key becomes a long-lived secret that decrypts past sessions.
- **AEAD ciphers** (GCM) authenticate as well as encrypt, preventing tampering.

🟢 Cloudflare runs in **Full (Strict)** mode — it validates your origin certificate rather than accepting anything. A self-signed cert would be rejected.

🔵 **The TLS handshake**, briefly, because it gets asked: client hello (with **SNI** — the hostname, sent in the clear) → server hello + certificate → key exchange → both derive a session key → symmetric encryption from there. Asymmetric crypto establishes the key; symmetric crypto does the bulk work, because it's orders of magnitude faster.

---

## Job 2 — Load balancing and service discovery

🟢 The least obvious config in the repo:

```nginx
resolver 127.0.0.11 valid=10s ipv6=off;
set $api_upstream api:8080;
proxy_pass http://$api_upstream;
```

Three separate things stacked in three lines.

### `api` and `web` are not nginx concepts

They're **Docker Compose service names**. When Compose creates the `a11studio-prod` bridge network it registers each service name as a DNS hostname, so from inside any container `api` resolves to the api containers' IPs.

`8080` and `3000` are **container-internal ports** — the values in your `expose:` blocks, never published to the host. That's exactly the difference between `expose` (reachable on the Docker network) and `ports` (reachable from outside the host).

So `api:8080` is nothing more exotic than `hostname:port`.

### `set` creates a runtime variable

`set $name value;` is from nginx's rewrite module, evaluated **per request**. `$api_upstream` is a name you chose — no special meaning.

Which raises the real question: **why use a variable instead of `proxy_pass http://api:8080;`?**

### The answer: the variable changes *when* DNS is resolved

| Form | When `api` is resolved | Consequence |
|---|---|---|
| `proxy_pass http://api:8080;` | **Once, at startup.** Cached for the worker's lifetime. | nginx refuses to start if the name doesn't resolve; never sees new or moved containers. |
| `set $api_upstream api:8080;`<br>`proxy_pass http://$api_upstream;` | **At request time**, via `resolver`, cached per `valid=`. | Picks up new IPs and replicas automatically. |

nginx cannot know a variable's value while parsing config, so **the mere presence of a variable in `proxy_pass` flips it into runtime-resolution mode. The variable is a marker, not a container for anything useful.**

### Why it matters here — and the reason isn't scaling

1. ⚠️ **Deploys change container IPs.** Every `docker compose up -d` recreates api and web containers with **new IPs**. With a literal hostname, nginx would serve stale IPs and **502 on every request until reloaded** — a broken deploy, every single time. *This is the real reason.*
2. **Scaling without config changes.** `--scale api=4` and nginx picks them up within the cache window.

### The `resolver` line, field by field

- **`127.0.0.11`** — Docker's embedded DNS, injected into every container's `/etc/resolv.conf` on a user-defined bridge network.
- **`valid=10s`** — cache answers for 10s, overriding the record's TTL. Resolution is **not literally per request**.
- **`ipv6=off`** — don't request AAAA records. Without it, every AAAA lookup fails on a v4-only network and adds latency.

**The `resolver` and the variable are a pair.** Omit the resolver and the variable form fails with `no resolver defined to resolve api`.

Docker DNS returns multi-container records in rotating order, so you get **DNS-based load balancing** with **service discovery** from Docker. ⚠️ Note the implication: nginx balances across addresses it was handed, with no knowledge of what's behind them — the root of the health-check gap in [`scaling-and-replicas.md`](./scaling-and-replicas.md#3-the-health-check-gap-).

### Two footguns

**A trailing slash changes semantics.** `proxy_pass http://$var;` forwards the original URI untouched; `proxy_pass http://$var/;` replaces the matched location prefix with `/`. Yours has no trailing slash, correct for a bare `location /`.

**The "clean" alternative is a commercial feature:**

```nginx
upstream api_backend {
    server api:8080 resolve;   # ← nginx Plus only
}
```

Open-source nginx cannot re-resolve hostnames inside `upstream {}`. The `set` + variable idiom is *the* standard OSS workaround — and it's why you forfeit `max_fails`, `fail_timeout` and `ip_hash`.

### `set` vs `map`

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

`map` declares a **derived** variable — "compute this from that" — evaluated lazily, only if read. `set` assigns unconditionally. `map` is a lookup table.

`$http_upgrade` is a **built-in**: nginx exposes any request header as `$http_<lowercased_name_with_underscores>`. Same family as `$host`, `$remote_addr`, `$scheme`, `$request_uri`, `$binary_remote_addr`.

> **Say this:** "The upstream goes through a variable on purpose. A literal hostname in `proxy_pass` resolves once at startup and caches forever, so every deploy — which gives containers new IPs — would 502 until nginx reloaded. Routing through a variable defers resolution to request time via Docker DNS. The clean `upstream … resolve` form is nginx Plus only, and the cost of the OSS workaround is losing upstream health checks and sticky sessions."

---

## Job 3 — Host-based routing (virtual hosts)

🟢 One IP, one nginx, three hostnames:

```nginx
server { server_name a11studio.com;     … proxy_pass → web:3000 }
server { server_name api.a11studio.com; … proxy_pass → api:8080 }
server { server_name www.a11studio.com; … return 301 → apex     }
```

nginx reads the HTTP `Host` header and matches `server_name`. Each block is a **virtual host** (**vhost**).

🟢 Your comments record *why* www is a 301 rather than a second copy: two hostnames serving identical content splits crawl budget and cookies and leaves Google guessing the canonical. See [`seo-and-performance.md`](./seo-and-performance.md).

---

## Job 4 — Rate limiting

🟢 ```nginx
limit_req_zone  $binary_remote_addr zone=general:10m rate=30r/s;
limit_req_zone  $binary_remote_addr zone=auth:10m    rate=10r/m;
limit_conn_zone $binary_remote_addr zone=conn_per_ip:10m;
```

🔵 The algorithm is a **leaky bucket**. Requests drain at a fixed rate; `burst=60` allows a short queue; `nodelay` serves the burst immediately rather than pacing it; anything beyond gets **HTTP 429**.

- **`$binary_remote_addr`** is the packed client IP (4 bytes for IPv4), so a 10 MB **shared memory zone** tracks ~2.5 million distinct IPs. "Shared" = across nginx worker processes — the counters must be global or each worker enforces its own limit.
- **`limit_req` caps request rate; `limit_conn` caps simultaneous connections** (50/IP). Different attacks: request floods vs connection exhaustion (**Slowloris**).
- **Auth endpoints get a far tighter zone** — 10/minute — because that's where credential stuffing, reset spraying and 2FA brute force land.

🔵 **Leaky bucket vs token bucket:** leaky bucket enforces a *smooth* output rate; token bucket accumulates credit and allows a *burst* after idle. nginx's `burst` parameter makes its leaky bucket behave somewhat like a token bucket.

🟢 Your comment states the right principle: nginx rate limiting is a **first layer**, not a replacement for the NestJS `ThrottlerGuard`. That's **defense in depth** — the proxy limit is cheap and stops floods before Node; the app limit understands users and routes. See [`security.md`](./security.md).

---

## Job 5 — Real client IP resolution

🟢 **The subtlest thing in the config, and the source of a real bug you fixed.**

By the time a request reaches nginx it has passed through Cloudflare, so the TCP peer *is* Cloudflare. Without correction, every log line and rate-limit bucket keys to Cloudflare's edge IP — **all visitors collapsing into one bucket.**

🟢 `snippets/cloudflare.conf`:

```nginx
real_ip_header CF-Connecting-IP;
```

⚠️ **Note which header.** `X-Forwarded-For` is **client-supplied** — anyone can forge it before reaching the edge. `CF-Connecting-IP` is written by Cloudflare and cannot be spoofed by the client. Trusting the wrong one poisons every IP-based control you have.

🟢 `proxy.conf` carries the reasoning further:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;   # not $proxy_add_x_forwarded_for
```

The usual idiom **appends** to whatever the client sent. You **overwrite** — because appending preserves attacker-controlled entries, and with exactly one trusted hop in front, a single honest value is the correct representation.

🔵 This is the **trusted proxy problem**, and getting it wrong is how IP allowlists and audit logs get forged. The general rule: **count the trusted hops and take the value that many positions from the right; never trust the leftmost entry, which is fully attacker-controlled.**

---

## Job 6 — Origin lockdown

🟢 Your droplet has a public IP, so an attacker can skip Cloudflare and hit it directly, bypassing the WAF and DDoS protection. Two defenses:

```nginx
if ($is_cloudflare = 0) { return 444; }
```

`geo` builds an allowlist of Cloudflare's published ranges; anything else gets **444** — an nginx-specific code meaning *close the TCP connection with no response at all*. A scanner learns nothing, not even that something is listening.

```nginx
server {
    listen 443 ssl default_server;
    server_name _;
    ssl_reject_handshake on;
}
```

🔵 The **`default_server`** catch-all handles requests with unknown or missing **SNI** (Server Name Indication — the hostname sent during the TLS handshake). Without it, a connection straight to the droplet IP falls through to the *first* 443 block and gets served the production app. `ssl_reject_handshake` drops the handshake before a certificate is offered.

⚠️ **Operational note:** Cloudflare's IP ranges change. A stale allowlist means legitimate traffic gets 444'd. This list needs periodic refresh — worth knowing as the maintenance cost of the approach.

---

## Job 7 — Security response headers

🟢 `snippets/security-headers.conf`, applied at `server` level with `always` so they cover 4xx/5xx too:

| Header | Prevents |
|---|---|
| `Strict-Transport-Security` | **HSTS** — browser refuses plain HTTP; `preload` extends to the first visit |
| `X-Content-Type-Options: nosniff` | **MIME sniffing** — stops an uploaded file being reinterpreted as HTML |
| `X-Frame-Options: SAMEORIGIN` | **Clickjacking** via cross-origin iframes |
| `Referrer-Policy` | Leaking full URLs (with tokens) to third parties |
| `Permissions-Policy` | Reduces attack surface — camera/mic/geolocation denied |
| `Cross-Origin-Opener-Policy` | Cross-origin windows holding a JS reference (**Spectre-class** side channels) |

⚠️ **The nginx gotcha worth knowing because it bites people: `add_header` does not merge across levels.** If any `location` block declares its own `add_header`, it silently discards *every* header inherited from `server`. That's why these live in one snippet at server level and no location adds its own.

⚠️ **Missing: `Content-Security-Policy`** — the strongest header of the set, and the hardest to deploy without breaking a Next.js app (inline scripts need nonces or hashes). Absent here. Know that it's absent and why it's hard, rather than being surprised by the question.

---

## Job 8 — WebSocket protocol handling

🟢 ```nginx
map $http_upgrade $connection_upgrade { default upgrade; '' close; }

proxy_http_version 1.1;
proxy_set_header Upgrade    $http_upgrade;
proxy_set_header Connection $connection_upgrade;
```

🔵 A WebSocket begins as an HTTP request carrying `Upgrade: websocket`. A proxy that doesn't explicitly forward `Upgrade` and `Connection` — and doesn't use HTTP/1.1 — silently breaks the upgrade and the connection falls back to polling forever.

🟢 **You configured this correctly**, which is worth knowing: the bug in [`realtime-websockets.md`](./realtime-websockets.md) is a replica-topology problem, *not* a proxy misconfiguration. Being able to say "I checked the proxy first and it was fine" is part of the debugging story.

---

## Job 9 — Buffering and streaming

🟢 ```nginx
proxy_buffering off;
```

🔵 By default nginx buffers the entire upstream response before forwarding — usually good, because it frees the backend worker sooner.

But Next.js **streams** RSC payloads progressively, and buffering would hold the whole page until complete, destroying **time to first byte** and streaming SSR. Turning it off is a deliberate trade: slightly longer-held upstream connections in exchange for progressive rendering.

---

## Why have nginx at all when Cloudflare is in front?

🟢 A fair interview question with a real answer:

- Cloudflare can be **bypassed** — the origin IP is reachable. nginx enforces that it wasn't (Job 6).
- Cloudflare doesn't know your internal topology: two api replicas, two web replicas, Docker DNS names. **Load balancing and service discovery are origin-side concerns** (Job 2).
- Origin rate limiting still applies to anything that reaches it, and is free.
- Host routing, TLS policy and security headers stay in **version-controlled config you own** rather than a vendor dashboard — and they're identical in dev and prod because both read from tracked sources.

> **Say this:** "Cloudflare is the edge — CDN, WAF, DDoS. nginx is the origin's front door: it terminates TLS, load-balances across replicas via Docker DNS, does host-based routing, enforces rate limits keyed on the real visitor IP from `CF-Connecting-IP`, adds security headers, and refuses any connection that didn't come through Cloudflare. Different jobs, and the origin one can't be delegated because the origin IP is reachable regardless."

---

## Interview drills

**"What does a reverse proxy do?"**
Don't recite a definition — list the nine jobs and pick two to go deep on. TLS termination and load balancing are the safe picks; the `CF-Connecting-IP` story (Job 5) is the memorable one.

**"Why is there a variable in your `proxy_pass`?"**
Job 2. This is a *great* question to get because almost nobody can answer it — the deploy-IP-churn reason is the one that shows you hit the problem rather than copied the config.

**"How would you add a health check?"**
Honest answer: you can't, with the variable form — that's the trade. You'd move to a static `upstream {}` block with `max_fails`/`fail_timeout` and give up dynamic resolution, or put a real load balancer in front. Know both sides.

**"What's the difference between 444 and 404?"**
404 is a valid HTTP response saying "not here." 444 is nginx-specific: close the connection, send nothing. One tells a scanner something is listening; the other doesn't.
