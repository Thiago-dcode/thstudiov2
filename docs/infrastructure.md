# Infrastructure, Networking & CI/CD

A complete walkthrough of the A11 Studio stack — from a `git push` to a browser
rendering the page. Concepts are named correctly and explained inline.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [DNS and the Cloudflare Edge](#2-dns-and-the-cloudflare-edge)
3. [TLS Termination](#3-tls-termination)
4. [The DigitalOcean Droplets](#4-the-digitalocean-droplets)
5. [Docker and Docker Compose](#5-docker-and-docker-compose)
6. [nginx — Reverse Proxy and Edge Security](#6-nginx--reverse-proxy-and-edge-security)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [The Deploy Script](#8-the-deploy-script)
9. [Secrets and Environment Variables](#9-secrets-and-environment-variables)
10. [SEO and Crawler Control](#10-seo-and-crawler-control)
11. [Launch Checklist](#11-launch-checklist)
12. [Key Commands](#12-key-commands)

---

## 1. Architecture Overview

```
Browser
  │ HTTPS
  ▼
Cloudflare  ──  anycast edge, CDN, WAF, DDoS mitigation
  │ HTTPS (Cloudflare Origin Certificate)
  ▼
DigitalOcean Droplet  (single VPS, public IP)
  │
  ▼
nginx container  ──  reverse proxy, TLS termination, rate limiting (ports 80/443)
  │ HTTP (internal Docker bridge network)
  ├──▶  web container    Next.js SSR  (port 3000, internal only)
  └──▶  api container    NestJS REST  (port 8080, internal only)
           │
           ├──▶  postgres container  (port 5432, loopback-only)
           └──▶  redis container     (port 6379, loopback-only)
```

Two identical environments — same topology, different branch and secrets:

| | Dev | Prod |
|---|---|---|
| Branch | `develop` | `main` |
| Droplet | `165.232.38.110` | `134.209.31.146` |
| Public domain | `dev.a11studio.com` | `www.a11studio.com` (apex 301s to www) |
| API domain | `apidev.a11studio.com` | `api.a11studio.com` |
| nginx source | `dev.nginx/` | `pro.nginx/` |
| Compose file | `compose.dev.yaml` | `compose.prod.yaml` |

---

## 2. DNS and the Cloudflare Edge

### How traffic reaches the server

DNS (Domain Name System) maps hostnames to IP addresses. When a browser looks up
`dev.a11studio.com`, Cloudflare's authoritative nameservers answer. Because the
DNS record is **proxied** (orange cloud), Cloudflare returns one of its own
**anycast** edge IPs — not the droplet's real IP. Every request passes through
Cloudflare's network before reaching the origin.

Benefits: DDoS absorption, a WAF (Web Application Firewall) that blocks known
attack patterns, CDN caching for static assets, and origin IP hiding.

### Blocking direct-to-origin requests

Because the droplet's IP is public, an attacker can bypass Cloudflare entirely by
connecting directly to `165.232.38.110`. This skips the WAF and DDoS protection.
nginx counters this with an IP allowlist:

```nginx
# dev.nginx/snippets/cloudflare.conf

geo $realip_remote_addr $is_cloudflare {
    default 0;
    173.245.48.0/20  1;  # Cloudflare published IP ranges
    103.21.244.0/22  1;
    # ... all Cloudflare ranges ...
    127.0.0.0/8      1;  # loopback (healthchecks)
    172.16.0.0/12    1;  # Docker bridge
}
```

Each server block rejects anything that did not arrive through Cloudflare:

```nginx
if ($is_cloudflare = 0) {
    return 444;   # TCP connection closed, no HTTP response
}
```

`444` is nginx's non-standard code for "close the connection silently" — the
client receives no response at all, which reveals nothing about what is running.

### Real IP extraction

Cloudflare's edge IPs are the actual TCP peer — without correction, nginx would
log and rate-limit against Cloudflare's IP rather than the visitor's. The
`ngx_http_realip_module` rewrites `$remote_addr` using the
`CF-Connecting-IP` header that Cloudflare injects:

```nginx
real_ip_header CF-Connecting-IP;
```

`X-Forwarded-For` is not used here because it is a client-supplied header — a
user can forge it before the request reaches Cloudflare's edge.
`CF-Connecting-IP` is set by Cloudflare and cannot be spoofed by the client.
The allowlist in `geo` is evaluated against `$realip_remote_addr` (the original
TCP peer, preserved after rewriting), not `$remote_addr` (already rewritten to
the visitor IP) — this ensures the Cloudflare IP check runs before the rewrite.

---

## 3. TLS Termination

### The two TLS hops

**TLS** (Transport Layer Security) provides encrypted, authenticated communication.
There are two separate TLS sessions in play:

```
Browser ──TLS──▶ Cloudflare edge ──TLS──▶ nginx origin
         (Cloudflare's         (Cloudflare Origin Cert,
          universal cert)       Full Strict mode)
```

In **Full (Strict)** mode Cloudflare validates the origin certificate. A
self-signed cert would be rejected. The project uses a **Cloudflare Origin
Certificate** — issued by Cloudflare's CA, trusted only by Cloudflare. The same
wildcard cert (`*.a11studio.com`) is bind-mounted read-only into nginx on both
droplets:

```yaml
volumes:
  - ./certs:/etc/nginx/certs:ro
```

**TLS termination** happens at nginx: nginx decrypts the TLS session and forwards
plain HTTP to the upstream containers over the Docker bridge network. There is no
need for TLS inside the host — the Docker bridge is not reachable from outside.

### TLS configuration

```nginx
# dev.nginx/snippets/tls.conf

ssl_protocols             TLSv1.2 TLSv1.3;
ssl_ciphers               ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:...;
ssl_prefer_server_ciphers off;
ssl_session_tickets       off;
```

- TLS 1.0/1.1 are disabled — deprecated and vulnerable.
- Only **ECDHE** (Elliptic Curve Diffie-Hellman Ephemeral) cipher suites are
  allowed. "Ephemeral" means a fresh key pair is generated per session, providing
  **forward secrecy**: if the server's private key is ever compromised, past
  sessions cannot be decrypted.
- `ssl_session_tickets off` — Session tickets cache the session state encrypted
  with a ticket key. Without regular key rotation they undermine forward secrecy,
  so tickets are disabled.

---

## 4. The DigitalOcean Droplets

A **droplet** is a VPS (Virtual Private Server) — a Linux VM on DigitalOcean
hardware. The droplet runs Docker and nothing else; it does not compile code.
Compilation happens in GitHub Actions CI; the droplet only pulls and runs
pre-built container images.

### Boot persistence

When a droplet reboots, all Docker containers must restart automatically. A
**systemd service unit** handles this:

```
scripts/a11studio-prod.service → /etc/systemd/system/a11studio.service
systemctl enable a11studio
```

systemd is the Linux init system — the first process started by the kernel. The
service unit runs `docker compose up -d` at boot, restoring all containers from
their last known configuration.

---

## 5. Docker and Docker Compose

### Images, containers, and the registry

A **Docker image** is an immutable, layered filesystem snapshot. It packages the
application binary, runtime (Node.js), and OS libraries. Running an image creates
a **container** — an isolated process with its own filesystem namespace, network
namespace, and PID namespace.

Images are stored in a **container registry**. The project uses **GHCR** (GitHub
Container Registry). CI builds images and pushes them to GHCR; the droplet pulls
and runs them. The droplet never compiles code.

```
ghcr.io/<owner>/a11studio-dev-api:develop      ← mutable "latest on branch" tag
ghcr.io/<owner>/a11studio-dev-api:sha-<commit> ← immutable per-commit tag
```

Both tags are pushed on every CI run. The SHA tag enables rollbacks — pin any
service to a specific commit's image.

### Docker Compose and service topology

`compose.dev.yaml` defines the full stack as a **declarative** YAML manifest.
Compose reconciles the running state to match the desired state on each `up`.

```
nginx    → ports 80/443 open to the host (the only public-facing container)
web      → expose 3000 (Docker network only)
api      → expose 8080 (Docker network only)
worker   → 127.0.0.1:8081 (loopback-only, not public)
postgres → 127.0.0.1:5432 (loopback-only)
redis    → 127.0.0.1:6379 (loopback-only)
```

`expose` makes a port reachable on the **Docker bridge network** (container-to-
container) but not on the host. `ports: "127.0.0.1:5432:5432"` binds to the
host's **loopback interface** — reachable via SSH tunnel but not from the
internet. `ports: "80:80"` (no IP prefix) binds to `0.0.0.0` — any interface,
publicly reachable. Only nginx needs that.

### Docker bridge networking and service discovery

All services join a named bridge network:

```yaml
networks:
  a11studio-dev:
    driver: bridge
```

Docker's embedded DNS resolver (`127.0.0.11`) registers each service name as a
DNS A record. When nginx resolves `web`, Docker DNS returns the IPs of all
healthy `web` replicas. This is how **service discovery** works inside the
compose stack — no hardcoded IPs.

### Horizontal scaling

```yaml
api:
  deploy:
    replicas: ${API_REPLICAS:-2}
```

Both `api` and `web` run as 2 replicas. Neither has a `container_name` so Compose
auto-assigns `a11studio-dev-api-1`, `-2`, etc. nginx resolves `api` on each
request and Docker DNS **round-robins** across replicas, acting as a simple
**load balancer**.

### Health checks and dependency ordering

```yaml
api:
  depends_on:
    postgres:
      condition: service_healthy
  healthcheck:
    test: ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:8080/')...\""]
    start_period: 45s
    interval: 30s
```

`depends_on` with `service_healthy` prevents a service from starting until its
dependency passes its health check. This implements a **readiness gate** — the
api container does not start until postgres is actually accepting connections, not
just running. Without this, the api would crash on startup because the database
is not yet ready.

### Bind mounts vs named volumes

```yaml
nginx:
  volumes:
    - ./nginx/conf.d:/etc/nginx/conf.d:ro   # bind mount — host path

postgres:
  volumes:
    - postgres_data:/var/lib/postgresql/data  # named volume — Docker-managed
```

A **bind mount** maps a specific host directory into the container. Changes to
the host directory are immediately visible inside the container (useful for nginx
config — reload picks up changes without rebuilding the image).

A **named volume** is managed by Docker's volume driver and persists independently
of the container lifecycle. Postgres data survives container recreation and image
updates.

The `:ro` flag makes the bind mount **read-only** from the container's perspective
— the nginx process cannot overwrite config files on the host.

### BuildKit secrets

```yaml
secrets:
  app_api_key:
    environment: APP_API_KEY

web:
  build:
    secrets:
      - app_api_key
```

A **BuildKit secret** is passed to the Dockerfile as an in-memory tmpfs mount
(`/run/secrets/<id>`) during a specific `RUN` step. After that step, the file is
gone. It is never written to a layer and never appears in the exported build
cache. This is in contrast to `--build-arg`, which is promoted to an `ENV` in
the builder stage and therefore embedded in **every layer** that comes after it —
visible via `docker inspect` and in any shared cache export.

---

## 6. nginx — Reverse Proxy and Edge Security

nginx acts as the stack's **reverse proxy** — it sits in front of the application
servers, terminates TLS, enforces rate limits, and adds security headers before
forwarding requests upstream.

### Config structure

```
dev.nginx/
├── conf.d/
│   └── default.conf          ← server blocks, routing, robots.txt override
└── snippets/
    ├── cloudflare.conf        ← real IP + $is_cloudflare allowlist
    ├── tls.conf               ← protocol and cipher policy
    ├── security-headers.conf  ← HTTP response security headers
    └── proxy.conf             ← shared proxy_pass settings
```

Shared settings are extracted into snippet files and `include`d into server blocks
to avoid duplication.

### `default_server` catch-all

```nginx
server {
    listen 80 default_server;
    server_name _;
    location = /healthz { return 200 "ok"; }
    location / { return 444; }
}

server {
    listen 443 ssl default_server;
    server_name _;
    ssl_reject_handshake on;
}
```

When a TCP connection arrives with an unknown or missing **SNI** (Server Name
Indication — the hostname the client announces during the TLS handshake), nginx
falls through to the `default_server`. Without these blocks, the request would
match the first configured server block and potentially expose the application.

`ssl_reject_handshake on` drops the TLS handshake before it completes — no
certificate is sent, no HTTP response is returned. Scanning tools learn nothing.

### Virtual hosts (server name routing)

```nginx
server {
    server_name dev.a11studio.com;
    location / { proxy_pass http://$web_upstream; }
}

server {
    server_name apidev.a11studio.com;
    location / { proxy_pass http://$api_upstream; }
}
```

nginx reads the HTTP `Host` header and routes each request to the matching
**virtual host** (server block). This is **host-based routing** — one IP address,
multiple domains, each proxied to a different upstream.

### Dynamic upstream resolution

```nginx
resolver 127.0.0.11 valid=10s ipv6=off;

set $web_upstream web:3000;
proxy_pass http://$web_upstream;
```

Using a variable forces nginx to resolve the upstream **per request** via Docker's
embedded DNS (`127.0.0.11`). Without the variable, nginx resolves `web` once at
startup — new replicas added by `docker compose up --scale` would not be seen.
With it, Docker DNS round-robins across all healthy replicas on each request.

### Rate limiting

```nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=auth:10m    rate=10r/m;
```

nginx's **leaky bucket** rate limiter uses shared memory zones (accessible across
all worker processes). The key `$binary_remote_addr` (4 bytes per IPv4 address)
means each IP is tracked independently. 10MB of shared memory holds ~2.5 million
distinct IPs.

```nginx
location / {
    limit_req zone=general burst=60 nodelay;
}

location ~ ^/api/v1/auth/ {
    limit_req zone=auth burst=10 nodelay;
}
```

`burst=60` allows brief traffic spikes above the steady rate. `nodelay` serves
burst requests immediately rather than queuing them — requests beyond the burst
are rejected with **HTTP 429 Too Many Requests**. Auth endpoints are throttled
separately (`10r/m`) as a second layer of brute-force protection, in addition to
the NestJS `ThrottlerGuard`.

### Security response headers

```nginx
# dev.nginx/snippets/security-headers.conf

add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Content-Type-Options    "nosniff" always;
add_header X-Frame-Options           "SAMEORIGIN" always;
add_header Referrer-Policy           "strict-origin-when-cross-origin" always;
add_header Permissions-Policy        "camera=(), microphone=(), geolocation=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header X-Robots-Tag              "noindex, nofollow, noarchive" always;  # pre-launch
```

| Header | What it does |
|--------|-------------|
| `Strict-Transport-Security` | **HSTS** — instructs browsers to always connect via HTTPS and reject HTTP. `preload` makes the domain eligible for the browser-vendor HSTS preload list, meaning the browser enforces HTTPS even before the first visit. |
| `X-Content-Type-Options: nosniff` | Prevents **MIME sniffing** — stops the browser from guessing a response's content type. Without it, a user-uploaded file served with the wrong `Content-Type` (e.g., an HTML file labelled as `image/png`) could be executed as HTML. |
| `X-Frame-Options: SAMEORIGIN` | Blocks the page from being embedded in a cross-origin `<iframe>`, preventing **clickjacking** attacks. |
| `Referrer-Policy` | Controls the `Referer` header sent to third parties. `strict-origin-when-cross-origin` sends only the origin (scheme + host) on cross-origin requests — not the full path, which may contain session IDs or search terms. |
| `Permissions-Policy` | Explicitly disables browser APIs the app does not use. Reduces **attack surface** — a compromised third-party script cannot request camera or geolocation access. |
| `Cross-Origin-Opener-Policy: same-origin` | Puts the page in its own **browsing context group**, preventing cross-origin windows from holding a JavaScript reference to this page. Blocks certain **Spectre-class** side-channel attacks. |
| `X-Robots-Tag: noindex` | Instructs search engine crawlers not to index any page. Applied at the HTTP layer so it covers all response types, not just HTML. See §10. |

The `always` flag applies headers to all response codes including 4xx and 5xx —
without it, error pages are served without security headers.

**nginx `add_header` inheritance**: `add_header` directives do not merge across
config levels. A `location` block that defines its own `add_header` silently drops
all headers from the parent `server` block. This is why security headers are set
at `server` level via a snippet and no `location` block calls `add_header`
independently.

---

## 7. CI/CD Pipeline

The workflow at `.github/workflows/ci-cd.yml` implements a **push-to-deploy**
pipeline. A commit to `develop` or `main` automatically runs tests, builds Docker
images, and deploys them to the corresponding droplet.

### Job graph

```
push / PR
  │
  ▼
test  ─────────────────────────────────────────────────────────
  │                                                            │
  │ (push to develop)                        (push to main)   │
  ▼                                                    ▼      │
build-and-push ──▶ deploy              build-and-push-prod ──▶ deploy-prod
```

### `test` job

```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm turbo run lint
- run: pnpm turbo run test
```

`--frozen-lockfile` enforces **lockfile integrity** — if the installed dependency
tree does not match `pnpm-lock.yaml` exactly, the install fails. This catches
"works on my machine" drifts caused by uncommitted lockfile changes.

**Turborepo** (`turbo run lint`) runs tasks across all packages in the monorepo
**in parallel**, respecting the dependency graph. A package is only linted after
the packages it depends on have been linted.

### Least-privilege permissions

```yaml
# File-level default — every job starts here
permissions:
  contents: read

# build-and-push elevates only what it needs
permissions:
  contents: read
  packages: write   # push images to GHCR
```

Without an explicit `permissions` block, older GitHub repositories inherit a
broad default `GITHUB_TOKEN` scope (read/write across contents, issues, PRs, etc).
Setting `contents: read` globally and elevating per-job enforces **least privilege**
— a compromised build step cannot create releases or modify source code.

### Concurrency and deploy safety

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

For **pull requests**, a newer push makes the in-flight run obsolete — it is
cancelled immediately. For **branch pushes** (deploys), cancellation is disabled.
Interrupting a deploy mid-run leaves the server in a partially-applied state
(some containers on the old image, some on the new). The second run queues behind
the first.

### Docker layer caching

```yaml
- uses: docker/setup-buildx-action@v3

- uses: docker/build-push-action@v6
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

Docker builds use a **content-addressable layer cache**. Each Dockerfile instruction
produces an immutable layer identified by a hash of its inputs. If inputs have not
changed, the cached layer is reused — a `pnpm install` layer is not re-executed
unless `package.json` or `pnpm-lock.yaml` changed.

`type=gha` stores the cache in the GitHub Actions **Actions Cache** (up to 10GB).
`mode=max` exports every intermediate build stage to the cache, not just the final
image — this maximizes reuse on subsequent builds.

### GitHub Environments and secret scoping

```yaml
build-and-push:
  environment: dev

deploy-prod:
  environment: prod
```

A **GitHub Environment** is a named secret store with optional protection rules.
Both environments use identical secret names (`SSH_HOST`, `NEXT_PUBLIC_APP_URL`,
etc.) but different values. Setting `environment: dev` causes
`${{ secrets.SSH_HOST }}` to resolve to `165.232.38.110`; `environment: prod`
resolves it to `134.209.31.146`. The workflow YAML is identical for both — only
the environment context changes.

Environments also support **deployment protection rules**: require a human to
approve prod deploys, restrict which branches can trigger deploys, etc.

### SHA-pinned third-party action

```yaml
uses: appleboy/ssh-action@029f5b4aeeeb58fdfe1410a5d17f967dacf36262 # v1.0.3
```

A mutable version tag (`v1.0.3`) can be retagged to point at a different commit.
If an attacker compromised the `appleboy/ssh-action` repository, a retagged
release could run malicious code with access to the droplet's root SSH private
key. Pinning to an immutable **commit SHA** eliminates this attack vector. The
comment records the intended version for human readers.

### Short-lived `GITHUB_TOKEN` vs a long-lived PAT

```yaml
GHCR_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

`GITHUB_TOKEN` is **minted per run** by GitHub and expires when the run ends.
The previous implementation used a shared PAT (Personal Access Token) with an
explicit expiry date. PATs fail silently at deploy time: running containers keep
serving, but the next deploy fails to pull new images — and the only symptom is
a `docker login` error in the CI log. A per-run `GITHUB_TOKEN` cannot expire
between runs and requires no manual rotation.

---

## 8. The Deploy Script

`scripts/deploy-dev.sh` runs on the droplet after GitHub Actions SSHs in. It
implements a **5-step rolling deploy**:

```
Step 1   git pull origin develop          ← update scripts and compose files
Step 1b  cp -r dev.nginx/. nginx/         ← sync nginx config from tracked source
Step 1c  chown -R 1000:1000 storage/logs  ← fix permissions for non-root containers
Step 2   docker compose pull api worker web  ← pull new images from GHCR
Step 3   docker compose up -d postgres redis + wait for pg_isready
Step 4   docker compose run --rm api migrate  ← run DB migrations
Step 5   docker compose up -d --remove-orphans
         docker compose up -d --force-recreate nginx
```

### `set -euo pipefail`

The shebang line of every deploy script:

- `-e` — **exit on error**: any command returning non-zero immediately aborts the
  script. Without this, a failing `docker compose pull` would silently continue
  and restart containers with stale images.
- `-u` — **unset variable check**: referencing an undeclared variable is a fatal
  error, not a silent empty string.
- `-o pipefail` — **pipeline failure propagation**: `cmd1 | cmd2` fails if _any_
  command in the pipeline fails, not just the last one.

### Why nginx is always force-recreated

```bash
docker compose up -d --force-recreate nginx
```

nginx config lives in a bind-mounted directory. `docker compose up -d` only
recreates containers whose **image or Compose configuration** changed — it does
not detect that files on the host filesystem were updated by Step 1b. Force-
recreating nginx guarantees that the new config is always picked up.

**The bind-mount inode trap**: never `rm -rf` a bind-mounted directory while its
container is running. A bind mount records the directory's **inode** (filesystem
node ID), not its path. If the directory is deleted and recreated, the container's
mount still points to the original (deleted) inode — a dangling reference. Always
copy files in-place, then recreate the container.

### Migrations run before app restart

```bash
# Step 4 — runs before Step 5 (app containers up)
docker compose run --rm api sh -c "cd packages/database && node dist/src/bin/cli.js migrate"
```

Migrations always run before the new application image goes live. This follows the
**expand-contract** pattern: migrations must be backward-compatible with the
currently-running code version (old app + new schema must work). The new code
version is deployed after the schema is ready.

---

## 9. Secrets and Environment Variables

Three distinct categories of secrets exist in this stack, each with different
handling requirements.

### Category 1 — Build-time public config (`--build-arg`)

`NEXT_PUBLIC_*` variables are **baked into the JavaScript bundle at build time**
by Next.js. They are readable by any user in the browser. They are stored as
GitHub secrets only to parameterize dev vs prod URLs and keep them out of source
code.

```yaml
build-args: |
  NEXT_PUBLIC_APP_URL=${{ secrets.NEXT_PUBLIC_APP_URL }}
```

**Critical**: changing these values in the droplet `.env` has no effect until
the image is rebuilt. The value is frozen into the image layer.

### Category 2 — Build-time real secrets (BuildKit secret mounts)

```yaml
# CI workflow
secrets: |
  app_api_key=${{ secrets.APP_API_KEY }}
  encryption_secret=${{ secrets.ENCRYPTION_SECRET }}
```

```dockerfile
# apps/web/Dockerfile
RUN --mount=type=secret,id=app_api_key \
    APP_API_KEY=$(cat /run/secrets/app_api_key) pnpm build
```

A **BuildKit secret mount** exposes the secret as a temporary in-memory file
(`/run/secrets/<id>`) during that single `RUN` step only. It is never written to
a layer. With `cache-to: mode=max`, all builder stage layers are exported to the
shared GitHub Actions cache — a build arg would persist in those layers, leaking
the secret into a cache readable by anyone with access to the repository.

### Category 3 — Runtime environment variables

```yaml
api:
  env_file:
    - ${A11STUDIO_ENV_FILE:-.env}
  environment:
    DB_HOST: postgres    # override: always use Docker DNS name, not .env value
    REDIS_URL: redis://redis:6379
```

`env_file` loads all key-value pairs from the droplet `.env`. The `environment`
block then **overrides specific keys** — `DB_HOST: postgres` ensures the api
always connects via Docker DNS regardless of what the `.env` file says. This
prevents a misconfigured `.env` (e.g., pointing at an external DB host) from
breaking inter-container communication.

### The `:?` error operator

```yaml
image: .../a11studio-dev-api:${DOCKER_IMAGE_OWNER:?Set DOCKER_IMAGE_OWNER in .env}
```

`:?` makes Compose **fail immediately with a descriptive error** if the variable
is unset or empty, rather than silently producing an invalid image reference like
`ghcr.io//a11studio-dev-api:develop`.

---

## 10. SEO and Crawler Control

### Two-layer crawler blocking

The dev server (and production during pre-launch) uses two complementary signals:

**`robots.txt`** — the standard **Robots Exclusion Protocol**. Well-behaved
crawlers (Googlebot, Bingbot) fetch this file before crawling.

```nginx
# dev.nginx/conf.d/default.conf
location = /robots.txt {
    default_type text/plain;
    return 200 "User-agent: *\nDisallow: /\n";
}
```

Limitation: `Disallow` prevents crawling but not indexing. Google can still index
a URL it discovers through an external backlink — it just won't crawl the content.

**`X-Robots-Tag`** — an HTTP response header equivalent to the HTML
`<meta name="robots">` tag. Applied by nginx to every response (HTML, JSON, images,
error pages):

```nginx
# dev.nginx/snippets/security-headers.conf
add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
```

`noindex` forbids indexing outright. Even if Google discovers the URL through an
external link, it will not add it to the index.

Together: `robots.txt` declares intent; `X-Robots-Tag` enforces it absolutely.

### Why nginx serves robots.txt instead of Next.js

The deployed server runs with `NODE_ENV=production` (set explicitly in
`compose.dev.yaml`). The Next.js `robots.ts` uses `NODE_ENV` to detect
environment:

```ts
const isProduction = process.env.NODE_ENV?.toLowerCase() === "production";
if (!isProduction) return { rules: { userAgent: "*", disallow: "/" } };
// production path: return allow: "/"  ← would expose the dev server
```

Serving `robots.txt` from an nginx `location` block intercepts the request before
it reaches Next.js. It also makes the flip at launch a **config change**, not a
code change requiring an image rebuild.

---

## 11. Launch Checklist

The pre-launch blocks in `pro.nginx/` must be removed in the correct order.

### Why order matters

If `X-Robots-Tag` is removed before `robots.txt` flips to `allow`, there is a
window where Google can find URLs through external links and index them with no
crawl-based content discovery. Remove `X-Robots-Tag` last to never have both
signals open simultaneously.

### Steps

```
1. [ ] pro.nginx/snippets/security-headers.conf
       → remove the X-Robots-Tag block (lines marked PRE-LAUNCH ONLY)

2. [ ] pro.nginx/conf.d/default.conf
       → remove the `location = /robots.txt` override block

3. [ ] Commit, push to main → CI deploys automatically

4. [ ] Verify no X-Robots-Tag header:
       curl -I https://www.a11studio.com/ | grep -i x-robots
       (should return nothing)

5. [ ] Verify robots.txt allows crawling:
       curl https://www.a11studio.com/robots.txt
       (should return Allow: / with sitemap URLs)

6. [ ] Submit sitemaps in Google Search Console:
       https://www.a11studio.com/sitemap/0.xml
       https://www.a11studio.com/sitemap/1.xml

7. [ ] Request indexing for the homepage in Search Console
```

The dev server keeps its pre-launch blocks permanently — `dev.a11studio.com` is
never meant to be publicly indexed.

---

## 12. Key Commands

### On the droplet (via `ssh a11studio-dev`)

```bash
# Full status of all containers
docker compose -f compose.dev.yaml ps

# Tail logs from a service
docker compose -f compose.dev.yaml logs -f api

# Scale api to 4 replicas (live, no downtime)
docker compose -f compose.dev.yaml up -d --scale api=4

# Run a one-off migration
docker compose -f compose.dev.yaml run --rm api \
  sh -c "cd packages/database && node dist/src/bin/cli.js migrate"

# Test nginx config without reloading
docker exec a11studio-dev-nginx nginx -t

# Reload nginx (apply config changes without downtime)
docker exec a11studio-dev-nginx nginx -s reload

# Verify crawler headers right now
curl -sI https://dev.a11studio.com/ | grep -i x-robots
curl -s https://dev.a11studio.com/robots.txt
```

### From your local machine

```bash
# SSH into the dev droplet
ssh a11studio-dev

# Copy an updated nginx config snippet to the droplet and reload
scp dev.nginx/snippets/security-headers.conf \
    a11studio-dev:/root/apps/a11studio/nginx/snippets/security-headers.conf
ssh a11studio-dev "docker exec a11studio-dev-nginx nginx -t && \
    docker exec a11studio-dev-nginx nginx -s reload"

# Check a recent CI/CD run
gh run list --branch develop --limit 5
gh run view <run-id>
```
