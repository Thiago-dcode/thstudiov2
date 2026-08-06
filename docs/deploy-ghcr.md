# GHCR deploy setup (dev + prod droplets)

Images for `api`, `worker`, and `web` are **built in GitHub Actions** and **pulled on the DigitalOcean droplets**. Neither droplet compiles the monorepo.

Dev and prod are the same pipeline with different branches, image names, and GitHub Environments:

| | dev | prod |
|---|---|---|
| Branch | `develop` | `main` |
| GitHub Environment | `dev` | `prod` |
| Images | `a11studio-dev-*:develop` | `a11studio-prod-*:main` |
| Compose file | `compose.dev.yaml` | `compose.prod.yaml` |
| Deploy script | `scripts/deploy-dev.sh` | `scripts/deploy-prod.sh` |
| Droplet | `165.232.38.110` | `134.209.31.146` |
| Deploy dir | `/root/apps/a11studio` | `/root/apps/a11studio` |
| Domain | `dev.a11studio.com` | `a11studio.com` + `api.a11studio.com` |
| nginx source | `dev.nginx/` | `pro.nginx/` |

## Flow

1. Push to `develop` (or `main` for prod)
2. GitHub Actions: test → build images → push to GHCR
3. GitHub Actions: SSH to droplet → `docker login` → `./scripts/deploy-dev.sh` (or `deploy-prod.sh`)
4. Droplet: `docker compose pull` → migrations → `docker compose up -d`

Both droplets use a **single `.env`** file. Compose only interpolates `${DOCKER_IMAGE_OWNER}`
and friends from `.env` in the project directory — never from an `env_file:` entry — so the
registry settings must live there regardless of what `env_file:` points at.

---

## Step 1 — GitHub repo secrets

Open **GitHub → your repo → Settings → Secrets and variables → Actions → New repository secret**.

### Already required (SSH deploy)

| Secret | Example | Notes |
|--------|---------|-------|
| `SSH_HOST` | `165.232.38.110` | Droplet IP |
| `SSH_USER` | `root` or `a11studio-dev` | SSH user |
| `SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Full private key |
| `SSH_PORT` | `22` | SSH port |
| `SSH_DEPLOY_DIR` | `/home/a11studio-dev/thstudiov2` | Path to repo on droplet |

### New — GHCR pull on droplet

| Secret | Example | Notes |
|--------|---------|-------|
| `GHCR_USERNAME` | `your-github-username` | **Lowercase** GitHub username |
| `GHCR_READ_TOKEN` | `ghp_...` or `github_pat_...` | PAT with **`read:packages`** only |

Create the PAT: **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained** (or classic).

- Resource owner: your user (or org)
- Repository access: this repo
- Permissions: **Packages → Read** (and **Metadata → Read**)

### New — web image build args (same values as droplet `.env`)

These are baked into the Next.js image at build time in CI:

| Secret | Must match droplet `.env` |
|--------|---------------------------|
| `NEXT_PUBLIC_APP_URL` | yes |
| `NEXT_PUBLIC_API_URL` | yes |
| `NEXT_PUBLIC_GEOAPIFY_URL` | yes |
| `NEXT_PUBLIC_GEOAPIFY_KEY` | yes |
| `APP_URL` | yes |
| `APP_API_KEY` | yes |
| `APP_TOKEN` | yes |
| `API_V1_URL` | yes |
| `GEOAPIFY_URL` | yes |
| `GEOAPIFY_KEY` | yes |
| `ENCRYPTION_SECRET` | yes |
| `SUPPORT_EMAIL` | yes |
| `SUPPORT_USERNAME` | yes |
| `REGISTRATION_IS_CLOSED` | yes |

Copy each value from your droplet `.env` into GitHub secrets with the **same name**.

---

## Step 2 — Droplet `.env` (registry settings)

Add these lines to the droplet `.env` (same file used by compose):

```bash
# GHCR image pull settings (lowercase GitHub username or org)
DOCKER_REGISTRY=ghcr.io
DOCKER_IMAGE_OWNER=your-github-username
DOCKER_IMAGE_TAG=develop
```

`DOCKER_IMAGE_OWNER` must be **lowercase** and match the GitHub account that owns the packages.

---

## Step 3 — First push (creates GHCR packages)

1. Commit and push these changes to `develop`.
2. Open **Actions** tab and watch the **CI / CD** workflow.
3. The **build-and-push** job must succeed before deploy can pull images.

After the first successful run, packages appear under **GitHub → your profile/org → Packages**:

- `a11studio-dev-api`
- `a11studio-dev-worker`
- `a11studio-dev-web`

### Link packages to the repo (recommended)

For each package: **Package settings → Manage Actions access → link this repository**.

This lets the workflow push using `GITHUB_TOKEN` without extra config.

### Package visibility

- **Private repo** → packages are private by default (droplet needs `GHCR_READ_TOKEN`).
- To verify pulls work, you can temporarily make a package public under **Package settings → Change visibility** (optional).

---

## Step 4 — Droplet one-time setup

SSH into the droplet:

```bash
cd /path/to/thstudiov2   # same as SSH_DEPLOY_DIR

# Pull latest deploy script + compose changes
git pull origin develop

# Ensure .env has DOCKER_IMAGE_OWNER (Step 2)

# Optional: test GHCR login manually (CI also logs in on each deploy)
echo "YOUR_GHCR_READ_TOKEN" | docker login ghcr.io -u your-github-username --password-stdin

# Test pull
docker compose -f compose.dev.yaml pull api worker web

# Full deploy
bash ./scripts/deploy-dev.sh
```

If your droplet uses a runtime copy of the deploy script:

```bash
cp scripts/deploy-dev.sh scripts/deploy.sh
```

CI now calls `deploy-dev.sh` directly, so this copy is only needed if you run `deploy.sh` by hand.

---

## Step 5 — Verify

After deploy:

```bash
docker compose -f compose.dev.yaml ps
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/api/v1/categories
```

Both should return `200`.

Check pulled image tags:

```bash
docker images | grep a11studio-dev
```

You should see tags like `ghcr.io/your-user/a11studio-dev-api:develop`.

---

## Local development (your PC)

Compose still has `build:` blocks. You can build locally when needed:

```bash
docker compose -f compose.dev.yaml build api worker web
docker compose -f compose.dev.yaml up -d
```

Or ignore GHCR and use local tags by setting in `.env`:

```bash
DOCKER_IMAGE_OWNER=local
```

…after building with `docker compose build` (only works if you tag images to match).

---

## Troubleshooting

### `Set DOCKER_IMAGE_OWNER in .env`

Add `DOCKER_IMAGE_OWNER=your-github-username` to droplet `.env`.

### `Failed to pull images from GHCR` / `unauthorized`

- Check `GHCR_READ_TOKEN` and `GHCR_USERNAME` GitHub secrets.
- PAT must have `read:packages`.
- Username must be lowercase.

### `manifest unknown` on first deploy

The **build-and-push** job has not finished yet. Wait for it to complete, then re-run deploy or push again.

### Web env mismatch

If the site loads but API calls fail, GitHub secrets for `NEXT_PUBLIC_*` / `APP_*` likely differ from droplet `.env`. Update secrets and push to `develop` to rebuild the web image.

### Migrations fail with `pnpm: not found`

The api image includes pnpm for migrations. If you see this, an old local image may be in use — run `docker compose pull api` and redeploy.

---

## Cost

- **GHCR**: free for typical dev usage
- **GitHub Actions**: free tier minutes (build runs on `ubuntu-latest`, not the droplet)
- **Droplet**: stays on the $6 plan — it only pulls and runs containers now

---

# Prod droplet

Same pipeline as dev, driven by the `main` branch and the **`prod` GitHub Environment**.
Secret *names* are identical to dev — only the values differ — so the workflow needs no
renaming: setting `environment: prod` on the job resolves `${{ secrets.* }}` from the prod
environment automatically.

## Flow

1. Push (or merge) to `main`
2. `build-and-push-prod` → `ghcr.io/thiago-dcode/a11studio-prod-{api,worker,web}:main` (+ `:sha-<commit>`)
3. `deploy-prod` → SSH to `134.209.31.146` → `docker login` → `./scripts/deploy-prod.sh`
4. Droplet: `docker compose -f compose.prod.yaml pull` → migrations → `up -d`

## Prod environment secrets

All 23 live in **Settings → Environments → prod**. Same names as dev:

| Secret | Prod value |
|---|---|
| `SSH_HOST` | `134.209.31.146` |
| `SSH_USER` | `root` |
| `SSH_PORT` | `22` |
| `SSH_DEPLOY_DIR` | `/root/apps/a11studio` |
| `SSH_PRIVATE_KEY` | contents of `~/.ssh/a11studio_pro` |
| `GHCR_USERNAME` / `GHCR_READ_TOKEN` | same as dev (same GHCR account) |
| `NEXT_PUBLIC_*`, `APP_*`, `API_V1_URL`, `GEOAPIFY_*`, `ENCRYPTION_SECRET`, `SUPPORT_*`, `CDN_URL`, `REGISTRATION_IS_CLOSED`, `ASSETS_URL` | prod values — must match the droplet `.env` |

The `NEXT_PUBLIC_*` / `APP_*` group is **baked into the web image at build time**. If they
drift from the droplet `.env`, the site renders but API calls fail — fix the secret and push
to `main` to rebuild.

## Droplet `.env` (registry settings)

Beyond the app values, the prod `.env` needs:

```bash
DOCKER_REGISTRY=ghcr.io
DOCKER_IMAGE_OWNER=thiago-dcode
DOCKER_IMAGE_TAG=main
DOMAIN=a11studio.com
LETSENCRYPT_EMAIL=hello@a11studio.com
```

## nginx runtime copy

`/nginx/` is **gitignored** — it is a runtime copy so `git pull` never conflicts during a
deploy. The tracked source is `pro.nginx/`:

```bash
cp -r pro.nginx/. nginx/
```

Re-run this after changing anything in `pro.nginx/`; `deploy-prod.sh` force-recreates the
nginx container each deploy so bind-mounted config and certs are picked up.

## TLS

`certs/cloudflare-origin.pem` + `.key`, bind-mounted read-only into nginx. The Cloudflare
origin cert covers `*.a11studio.com`, `*.dev.a11studio.com`, and `a11studio.com`, so the same
cert serves both droplets. Cloudflare SSL mode must be **Full (Strict)**.

## DNS (Cloudflare)

The `a11studio.com` zone is on Cloudflare (`coen`/`ligia.ns.cloudflare.com`). Prod needs
these records — none of them existed when the pipeline was wired up:

| Name | Type | Value | Proxy |
|---|---|---|---|
| `a11studio.com` | A | `134.209.31.146` | proxied |
| `api.a11studio.com` | A | `134.209.31.146` | proxied |
| `cdn.a11studio.com` | CNAME | the CloudFront distribution host | see below |

`CDN_URL` is **baked into the web image at build time** — `apps/web/next.config.ts` derives
`images.remotePatterns` from it, and a value that fails `new URL()` is swallowed by a `catch`
that returns `[]`, silently dropping the pattern so every CDN image 404s with no error.
So `CDN_URL` must (a) include the scheme and (b) point at a host that resolves, **before**
`build-and-push-prod` runs. Changing it on the droplet afterwards does nothing without a rebuild.

For a CloudFront origin, set the `cdn` record to **DNS-only** (grey cloud) unless the
distribution is configured to accept Cloudflare in front of it.

## Boot persistence

`scripts/a11studio-prod.service` installed as `/etc/systemd/system/a11studio.service`,
`systemctl enable a11studio`.

## Verify

```bash
docker compose -f compose.prod.yaml ps
docker images | grep a11studio-prod
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/api/v1/categories
```
