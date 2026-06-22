#!/usr/bin/env bash
# =============================================================================
# deploy.sh — TH Studio prod-server deployment script
#
# Usage:
#   ./scripts/deploy-prod.sh [--skip-build] [--skip-migrate] [--no-cache]
#
# Options:
#   --skip-build    Skip docker image rebuild (use existing images)
#   --skip-migrate  Skip DB migrations
#   --no-cache      Force a full image rebuild without Docker layer cache
#
# This script is meant to run ON the production droplet.
# Boot persistence handled by systemd (a11studio-prod.service).
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
SKIP_BUILD=false
SKIP_MIGRATE=false
NO_CACHE=false

for arg in "$@"; do
  case $arg in
    --skip-build)   SKIP_BUILD=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
    --skip-assets)
      warn "--skip-assets is deprecated (api static assets removed); ignoring."
      ;;
    --no-cache)     NO_CACHE=true ;;
    *)              error "Unknown argument: $arg"; exit 1 ;;
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

info "Repo root : $REPO_ROOT"
info "Compose   : $COMPOSE_FILE"
echo ""

# ── Step 1: Git pull ──────────────────────────────────────────────────────────
info "Step 1/5 — Pulling latest code from origin/main …"
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

# ── Step 2: Build images ──────────────────────────────────────────────────────
if [[ "$SKIP_BUILD" == false ]]; then
  BUILD_FLAGS=""
  if [[ "$NO_CACHE" == true ]]; then
    warn "Step 2/5 — Building Docker images WITHOUT cache (--no-cache) …"
    BUILD_FLAGS="--no-cache"
  else
    info "Step 2/5 — Building Docker images (api, web, worker) …"
  fi
  # Build one image at a time: the droplet has 1 vCPU / 1GB RAM and parallel
  # builds cause swapping/OOM. api goes first so worker/web reuse its shared
  # base + dependency layers from cache.
  $COMPOSE build $BUILD_FLAGS api
  $COMPOSE build $BUILD_FLAGS worker
  $COMPOSE build $BUILD_FLAGS web
  success "Images built."
else
  warn "Step 2/5 — Image build skipped (--skip-build)."
fi
echo ""

# ── Step 3: Start infrastructure (postgres + redis) ───────────────────────────
info "Step 3/5 — Ensuring postgres and redis are up …"
$COMPOSE up -d postgres redis

info "Waiting for postgres to be healthy …"
RETRIES=20
until $COMPOSE exec -T postgres pg_isready -U "${DB_USERNAME:-admin}" -d "${DB_NAME:-thstudiodb}" >/dev/null 2>&1; do
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
  info "Step 4/5 — Running DB migrations …"
  $COMPOSE run --rm \
    -e DB_HOST=postgres \
    -e DB_PORT=5432 \
    api sh -c "cd packages/database && node dist/src/bin/cli.js migrate"
  success "Migrations complete."
else
  warn "Step 4/5 — Migrations skipped (--skip-migrate)."
fi
echo ""

# ── Step 5: Rolling restart of application services ──────────────────────────
info "Step 5/5 — Starting / restarting application services …"

# Bring everything up; compose will recreate only changed containers.
$COMPOSE up -d --remove-orphans

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
# Reclaim disk: drop dangling images from previous builds and cap the BuildKit
# cache (keep enough to preserve layer-cache benefits between deploys).
info "Cleaning up old images and excess build cache …"
docker image prune -f >/dev/null
docker builder prune -f --keep-storage 4GB >/dev/null
success "Cleanup done."

echo ""
success "Deploy complete."
