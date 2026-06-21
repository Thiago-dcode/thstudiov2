#!/usr/bin/env bash
# =============================================================================
# deploy-dev.sh — TH Studio dev-server deployment script
#
# Usage:
#   ./scripts/deploy-dev.sh [--skip-pull] [--skip-migrate] [--skip-assets]
#
# Options:
#   --skip-pull     Skip pulling prebuilt images from GHCR (use local images)
#   --skip-migrate  Skip DB migrations
#   --skip-assets   Skip the assets directory check/warning
#
# Images are built in GitHub Actions and published to GHCR. This script pulls
# them on the droplet instead of compiling locally (see docs/deploy-ghcr.md).
# Boot persistence handled by systemd (a11studio-dev.service).
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
COMPOSE_FILE="$REPO_ROOT/compose.dev.yaml"
COMPOSE="docker compose -f $COMPOSE_FILE"

# ── Parse flags ───────────────────────────────────────────────────────────────
SKIP_PULL=false
SKIP_MIGRATE=false
SKIP_ASSETS=false

for arg in "$@"; do
  case $arg in
    --skip-pull|--skip-build) SKIP_PULL=true ;;
    --skip-migrate)           SKIP_MIGRATE=true ;;
    --skip-assets)            SKIP_ASSETS=true ;;
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
info "Images    : ghcr.io/<DOCKER_IMAGE_OWNER>/a11studio-dev-*:${DOCKER_IMAGE_TAG:-develop} (from .env)"
echo ""

# ── Step 1: Git pull ──────────────────────────────────────────────────────────
info "Step 1/6 — Pulling latest code from origin/develop …"
cd "$REPO_ROOT"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "develop" ]]; then
  warn "Current branch is '$CURRENT_BRANCH', not 'develop'. Checking out develop …"
  git checkout develop
fi

git fetch origin
BEFORE=$(git rev-parse HEAD)
git pull origin develop
AFTER=$(git rev-parse HEAD)

if [[ "$BEFORE" == "$AFTER" ]]; then
  info "Already up to date ($(git rev-parse --short HEAD))."
else
  info "Updated $(git rev-parse --short "$BEFORE")..$(git rev-parse --short "$AFTER")"
  git log --oneline "$BEFORE..$AFTER"
fi
echo ""

# ── Step 2: Assets check ──────────────────────────────────────────────────────
ASSETS_DIR="$REPO_ROOT/apps/api/assets"

if [[ "$SKIP_ASSETS" == false ]]; then
  info "Step 2/6 — Checking api assets …"
  if [[ ! -d "$ASSETS_DIR" ]]; then
    error "Assets directory not found: $ASSETS_DIR"
    error "Run from your local machine:"
    error "  scp -r apps/api/assets/ <user>@<host>:$ASSETS_DIR"
    exit 1
  fi

  ASSET_COUNT=$(find "$ASSETS_DIR" -type f | wc -l)
  info "Found $ASSET_COUNT asset file(s) in $ASSETS_DIR"
else
  warn "Step 2/6 — Assets check skipped."
fi
echo ""

# ── Step 3: Pull prebuilt images ──────────────────────────────────────────────
if [[ "$SKIP_PULL" == false ]]; then
  info "Step 3/6 — Pulling prebuilt images from GHCR (api, worker, web) …"
  if ! $COMPOSE pull api worker web; then
    error "Failed to pull images from GHCR."
    error "Ensure docker is logged in: docs/deploy-ghcr.md (Step 4)"
    exit 1
  fi
  success "Images pulled."
else
  warn "Step 3/6 — Image pull skipped (--skip-pull)."
fi
echo ""

# ── Step 4: Start infrastructure (postgres + redis) ───────────────────────────
info "Step 4/6 — Ensuring postgres and redis are up …"
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

# ── Step 5: Migrations ────────────────────────────────────────────────────────
if [[ "$SKIP_MIGRATE" == false ]]; then
  info "Step 5/6 — Running DB migrations …"
  $COMPOSE run --rm \
    -e DB_HOST=postgres \
    -e DB_PORT=5432 \
    api sh -c "pnpm --filter @repo/database dbcli migrate"
  success "Migrations complete."
else
  warn "Step 5/6 — Migrations skipped (--skip-migrate)."
fi
echo ""

# ── Step 6: Rolling restart of application services ──────────────────────────
info "Step 6/6 — Starting / restarting application services …"

# Bring everything up; compose will recreate only changed containers.
$COMPOSE up -d --remove-orphans

# nginx config, the TLS certs, and the api `assets` directory are bind-mounted
# from the host (NOT baked into the image). `docker compose up -d` only recreates
# containers whose image/config changed, so edits under nginx/conf.d, nginx/snippets,
# certs/, or apps/api/assets do NOT take effect until the container is recreated.
#
# IMPORTANT bind-mount pitfall: never `rm -rf`/recreate a bind-mounted host dir
# (nginx/, certs/, apps/api/assets/) while its container is running — the mount
# then points at the old (deleted) inode and the container sees an EMPTY dir.
# Edit files in place, then force-recreate. We always force-recreate nginx here
# so config/cert changes apply and any stale bind mount is refreshed.
info "Force-recreating nginx so bind-mounted config/certs are current …"
$COMPOSE up -d --force-recreate nginx

# Give nginx and app containers a moment to settle, then show status.
sleep 5
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
