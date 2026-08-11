#!/usr/bin/env bash
# =============================================================================
# deploy-prod.sh — TH Studio prod-server deployment script
#
# Usage:
#   ./scripts/deploy-prod.sh [--skip-pull] [--skip-migrate]
#
# Options:
#   --skip-pull     Skip pulling prebuilt images from GHCR (use local images)
#   --skip-migrate  Skip DB migrations
#
# Images are built in GitHub Actions and published to GHCR. This script pulls
# them on the droplet instead of compiling locally (see docs/deploy-ghcr.md).
# This script is meant to run ON the production droplet.
# Boot persistence handled by systemd (a11studio.service).
# =============================================================================

set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[deploy]${NC} $*"; }
success() { echo -e "${GREEN}[deploy]${NC} $*"; }
warn()    { echo -e "${YELLOW}[deploy]${NC} $*"; }
error()   { echo -e "${RED}[deploy]${NC} $*" >&2; }

# ── Resolve script / repo root ────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/compose.prod.yaml"
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

info "Repo root : $REPO_ROOT"
info "Compose   : $COMPOSE_FILE"
info "Images    : ghcr.io/<DOCKER_IMAGE_OWNER>/a11studio-prod-*:${DOCKER_IMAGE_TAG:-main} (from .env)"
echo ""

# ── Step 1: Git pull ──────────────────────────────────────────────────────────
info "Step 1/6 — Pulling latest code from origin/main …"
cd "$REPO_ROOT"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  warn "Current branch is '$CURRENT_BRANCH', not 'main'. Checking out main …"
  git checkout main
fi

git fetch origin
BEFORE=$(git rev-parse HEAD)
git pull origin main
AFTER=$(git rev-parse HEAD)

if [[ "$BEFORE" == "$AFTER" ]]; then
  info "Already up to date ($(git rev-parse --short HEAD))."
else
  info "Updated $(git rev-parse --short "$BEFORE")..$(git rev-parse --short "$AFTER")"
  git log --oneline "$BEFORE..$AFTER"
fi
echo ""

# ── Step 1b: Sync nginx config from the tracked source ────────────────────────
# `compose.prod.yaml` mounts ./nginx, but the reviewed config lives in ./pro.nginx.
# These used to be kept in sync by hand, so security changes to pro.nginx/ could sit
# in git without ever reaching the running proxy. Copy on every deploy instead.
info "Step 1b/6 — Syncing nginx config (pro.nginx → nginx) …"
if [[ -d pro.nginx ]]; then
  mkdir -p nginx
  cp -r pro.nginx/. nginx/
  success "nginx config synced."
else
  warn "pro.nginx/ not found — leaving nginx/ untouched."
fi
echo ""

# ── Step 1c: Ownership for bind-mounted writable paths ────────────────────────
# The api/worker containers run as uid 1000 (`node`), not root. The log directory is
# a host bind mount, so it must be writable by that uid or file logging silently fails.
info "Step 1c/6 — Ensuring storage/logs is writable by the container user …"
mkdir -p storage/logs
chown -R 1000:1000 storage/logs || warn "Could not chown storage/logs — check file logging after deploy."
echo ""

# ── Step 2: Pull prebuilt images ──────────────────────────────────────────────
if [[ "$SKIP_PULL" == false ]]; then
  info "Step 2/6 — Pulling prebuilt images from GHCR (api, worker, web) …"
  if ! $COMPOSE pull api worker web; then
    error "Failed to pull images from GHCR."
    error "Ensure docker is logged in: docs/deploy-ghcr.md (Step 4)"
    exit 1
  fi
  success "Images pulled."
else
  warn "Step 2/6 — Image pull skipped (--skip-pull)."
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
