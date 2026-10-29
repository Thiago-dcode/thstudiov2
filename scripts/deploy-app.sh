#!/usr/bin/env bash
# =============================================================================
# deploy-app.sh — TH Studio deployment script for the dev and prod servers
#
# Usage:
#   ./scripts/deploy-app.sh <dev|prod> [--skip-pull] [--skip-migrate]
#
# Environment:
#   GHCR_USER, GHCR_TOKEN   Required unless --skip-pull. The server's docker logs in to
#                           ghcr.io with them before pulling. The CI deploy action passes
#                           them in the environment, never on the command line.
#
# Options:
#   --skip-pull     Skip the GHCR login and the pull; use images already on the host
#   --skip-migrate  Skip DB migrations
#
# Images are built in GitHub Actions and published to GHCR (see docs/deploy-ghcr.md).
# Boot persistence is handled by systemd (a11studio-<env>.service).
# =============================================================================

set -euo pipefail

# The whole script is one { … } block so bash parses it fully before running it. Step 1
# `git pull`s this very file; without the block bash keeps reading the rewritten file
# at its old byte offset, which once skipped the certificate pre-flight in step 1b.
{

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[deploy]${NC} $*"; }
success() { echo -e "${GREEN}[deploy]${NC} $*"; }
warn()    { echo -e "${YELLOW}[deploy]${NC} $*"; }
error()   { echo -e "${RED}[deploy]${NC} $*" >&2; }

# ── Resolve target environment ────────────────────────────────────────────────
TARGET="${1:-}"
case "$TARGET" in
  dev|prod) shift ;;
  *)
    error "Usage: $0 <dev|prod> [--skip-pull] [--skip-migrate]"
    exit 1
    ;;
esac

case "$TARGET" in
  dev)
    BRANCH=develop
    COMPOSE_FILE_NAME=compose.dev.yaml
    NGINX_SRC=dev.nginx
    IMAGE_TAG_DEFAULT=develop
    RENEW_CERTS_CMD="./scripts/renew-certs.sh dev"
    ;;
  prod)
    BRANCH=main
    COMPOSE_FILE_NAME=compose.prod.yaml
    NGINX_SRC=pro.nginx
    IMAGE_TAG_DEFAULT=main
    RENEW_CERTS_CMD="./scripts/renew-certs.sh"
    ;;
esac

# ── Resolve script / repo root ────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/$COMPOSE_FILE_NAME"
COMPOSE="docker compose -f $COMPOSE_FILE"

# ── Parse flags ───────────────────────────────────────────────────────────────
SKIP_PULL=false
SKIP_MIGRATE=false

for arg in "$@"; do
  case $arg in
    --skip-pull|--skip-build) SKIP_PULL=true ;;
    --skip-migrate)           SKIP_MIGRATE=true ;;
    --skip-assets)
      warn "--skip-assets is deprecated (api static assets removed); ignoring."
      ;;
    --no-cache)
      warn "--no-cache is ignored: images are pulled from GHCR, not built on this host."
      ;;
    *)
      error "Unknown argument: $arg"
      exit 1
      ;;
  esac
done

# ── Ensure runtime directories exist ─────────────────────────────────────────
mkdir -p "$REPO_ROOT/logs"

# ── Sanity checks ─────────────────────────────────────────────────────────────
if [[ ! -f "$REPO_ROOT/.env" ]]; then
  error ".env not found at $REPO_ROOT/.env — aborting."
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  error "compose file not found: $COMPOSE_FILE — aborting."
  exit 1
fi

if ! grep -qE '^DOCKER_IMAGE_OWNER=.+$' "$REPO_ROOT/.env"; then
  error "DOCKER_IMAGE_OWNER is not set in .env — see docs/deploy-ghcr.md"
  exit 1
fi

info "Target    : $TARGET (branch $BRANCH)"
info "Repo root : $REPO_ROOT"
info "Compose   : $COMPOSE_FILE"
info "Images    : ghcr.io/<DOCKER_IMAGE_OWNER>/a11studio-$TARGET-*:${DOCKER_IMAGE_TAG:-$IMAGE_TAG_DEFAULT} (from .env)"
echo ""

# ── Step 1: Git pull ──────────────────────────────────────────────────────────
info "Step 1/6 — Pulling latest code from origin/$BRANCH …"
cd "$REPO_ROOT"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  warn "Current branch is '$CURRENT_BRANCH', not '$BRANCH'. Checking out $BRANCH …"
  git checkout "$BRANCH"
fi

git fetch origin
BEFORE=$(git rev-parse HEAD)
git pull origin "$BRANCH"
AFTER=$(git rev-parse HEAD)

if [[ "$BEFORE" == "$AFTER" ]]; then
  info "Already up to date ($(git rev-parse --short HEAD))."
else
  info "Updated $(git rev-parse --short "$BEFORE")..$(git rev-parse --short "$AFTER")"
  git log --oneline "$BEFORE..$AFTER"
fi
echo ""

# ── Step 1b: Sync nginx config from the tracked source ────────────────────────
# The compose file mounts ./nginx, but the reviewed config lives in ./$NGINX_SRC.
# Copy on every deploy so security changes can't sit in git while the running proxy
# keeps an older hand-copied config.
info "Step 1b/6 — Syncing nginx config ($NGINX_SRC → nginx) …"
if [[ -d "$NGINX_SRC" ]]; then
  # nginx refuses to start when an ssl_certificate file is missing, and the container is
  # force-recreated below — so syncing a config that points at a certificate not issued
  # yet would take the site down. Check every referenced cert first and abort before
  # touching ./nginx.
  for cert in $(grep -hoE '/etc/letsencrypt/live/[^;[:space:]]+' "$NGINX_SRC"/conf.d/*.conf | sort -u); do
    if ! $COMPOSE run --rm --no-deps --entrypoint test nginx -s "$cert"; then
      error "Certificate $cert referenced by $NGINX_SRC is not in the certbot_certs volume."
      error "Issue it first: $RENEW_CERTS_CMD — aborting before nginx is changed."
      exit 1
    fi
  done
  mkdir -p nginx
  cp -r "$NGINX_SRC"/. nginx/
  success "nginx config synced."
else
  warn "$NGINX_SRC/ not found — leaving nginx/ untouched."
fi
echo ""

# ── Step 1c: Ownership for bind-mounted writable paths ────────────────────────
# The api/worker containers run as uid 1000 (`node`), not root. The log directory is
# a host bind mount, so it must be writable by that uid or file logging silently fails.
info "Step 1c/6 — Ensuring storage/logs is writable by the container user …"
mkdir -p storage/logs
chown -R 1000:1000 storage/logs || warn "Could not chown storage/logs — check file logging after deploy."
echo ""

# ── Step 2: Log in to GHCR and pull prebuilt images ───────────────────────────
if [[ "$SKIP_PULL" == false ]]; then
  : "${GHCR_USER:?GHCR_USER is not set — the deploy action must pass it (see docs/deploy-ghcr.md).}"
  : "${GHCR_TOKEN:?GHCR_TOKEN is not set — the deploy action must pass it (see docs/deploy-ghcr.md).}"
  info "Step 2/6 — Logging in to GHCR and pulling prebuilt images (api, worker, web) …"
  # Piped, never passed as an argument, so the token stays out of the process list.
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
  if ! $COMPOSE pull api worker web; then
    error "Failed to pull images from GHCR."
    error "Check the GHCR token and package access: docs/deploy-ghcr.md"
    exit 1
  fi
  success "Images pulled."
else
  warn "Step 2/6 — GHCR login and image pull skipped (--skip-pull)."
fi
echo ""

# ── Step 3: Start infrastructure (postgres + redis) ───────────────────────────
info "Step 3/6 — Ensuring postgres and redis are up …"
$COMPOSE up -d postgres redis

info "Waiting for postgres to be healthy …"
RETRIES=20
until $COMPOSE exec -T postgres pg_isready -U "${DB_USERNAME:-admin}" -d "${DB_NAME:-a11studiodb}" >/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [[ $RETRIES -le 0 ]]; then
    error "Postgres did not become healthy in time — aborting."
    exit 1
  fi
  sleep 3
done
success "Postgres healthy."
echo ""

# ── Step 4: Migrations ────────────────────────────────────────────────────────
if [[ "$SKIP_MIGRATE" == false ]]; then
  info "Step 4/6 — Running DB migrations …"
  $COMPOSE run --rm \
    -e DB_HOST=postgres \
    -e DB_PORT=5432 \
    api sh -c "cd packages/database && node dist/src/bin/cli.js migrate"
  success "Migrations complete."
else
  warn "Step 4/6 — Migrations skipped (--skip-migrate)."
fi
echo ""

# ── Step 5: Rolling restart of application services ──────────────────────────
info "Step 5/6 — Starting / restarting application services …"

# Bring everything up; compose will recreate only changed containers.
$COMPOSE up -d --remove-orphans

# nginx config and TLS certs are bind-mounted from the host (NOT baked into the
# image). `docker compose up -d` only recreates containers whose image/config
# changed, so edits under nginx/conf.d, nginx/snippets, or certs/ do NOT take
# effect until the container is recreated.
#
# IMPORTANT bind-mount pitfall: never `rm -rf`/recreate a bind-mounted host dir
# (nginx/, certs/) while its container is running — the mount then points at the
# old (deleted) inode. Edit files in place, then force-recreate.
info "Force-recreating nginx so bind-mounted config/certs are current …"
$COMPOSE up -d --force-recreate nginx

# Give nginx and app containers a moment to settle, then show status.
sleep 5
echo ""

# ── Step 6: Invalidate cached asset URLs ─────────────────────────────────────
# `HelpersService.getAsset` memoises path→url in Redis for the lifetime of the
# signed URL. A release that changes how those URLs are built — or one deployed
# while the cache still holds presigned S3 links instead of stable CloudFront
# ones — keeps serving the old value until it expires, which breaks `og:image`
# and JSON-LD `contentUrl` for crawlers that cache the first card they fetch.
# Runs *after* the new containers are live so the repopulated values come from
# the new code. Never fatal: a cold cache costs one signing round-trip, so a
# flush failure must not fail an otherwise good deploy.
info "Step 6/6 — Flushing cached user asset URLs (users/*) …"
# `</dev/null` on every exec: `compose exec -T` inherits stdin, and this script runs over
# SSH from CI — an exec that reads stdin can swallow whatever the session sends next.
if CACHED=$($COMPOSE exec -T redis sh -c 'redis-cli --scan --pattern "users/*" | wc -l' </dev/null 2>/dev/null); then
  CACHED=$(echo "$CACHED" | tr -cd '0-9')
  if [[ "${CACHED:-0}" -gt 0 ]]; then
    $COMPOSE exec -T redis sh -c 'redis-cli --scan --pattern "users/*" | xargs -r redis-cli del' </dev/null >/dev/null
    success "Flushed ${CACHED} cached asset URL(s)."
  else
    info "No cached asset URLs to flush."
  fi
else
  warn "Could not reach redis to flush users/* — verify og:image / JSON-LD contentUrl manually."
fi
echo ""
info "Container status:"
$COMPOSE ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
echo ""

# ── Health smoke-test ─────────────────────────────────────────────────────────
info "Smoke testing …"
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/ || true)
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/api/v1/categories || true)

if [[ "$WEB_STATUS" == "200" ]]; then
  success "Web  → HTTP $WEB_STATUS"
else
  warn    "Web  → HTTP $WEB_STATUS (expected 200)"
fi

if [[ "$API_STATUS" == "200" ]]; then
  success "API  → HTTP $API_STATUS"
else
  warn    "API  → HTTP $API_STATUS (expected 200)"
fi

# ── Cleanup ──────────────────────────────────────────────────────────────────
info "Cleaning up unused images …"
docker image prune -f >/dev/null
success "Cleanup done."

echo ""
success "Deploy complete."

exit 0
}
