#!/usr/bin/env bash
# =============================================================================
# renew-certs.sh — issue or renew the Let's Encrypt certificate and reload nginx
#
# Usage (on the droplet, from the repo root):
#   ./scripts/renew-certs.sh          # prod: a11studio.com, www, api
#   ./scripts/renew-certs.sh dev      # dev:  dev.a11studio.com, apidev
#
# First issuance and renewal are the same command: the certbot service runs
# `certonly --keep-until-expiring`, which is a no-op until the certificate is
# within 30 days of expiry. Hostnames are fixed in the compose file's certbot
# entrypoint and must match the ssl_certificate paths in pro.nginx / dev.nginx.
#
# Requires LETSENCRYPT_EMAIL in .env. The HTTP-01 challenge is served by the
# port-80 vhosts from the certbot_www volume, so nginx must be running.
#
# Renewal cron (twice a day, as Let's Encrypt recommends), e.g. for prod:
#   17 3,15 * * * cd /root/apps/a11studio && ./scripts/renew-certs.sh >> storage/logs/certbot.log 2>&1
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[certs]${NC} $*"; }
success() { echo -e "${GREEN}[certs]${NC} $*"; }
error()   { echo -e "${RED}[certs]${NC} $*" >&2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

case "${1:-prod}" in
  prod) COMPOSE_FILE="$REPO_ROOT/compose.prod.yaml" ;;
  dev)  COMPOSE_FILE="$REPO_ROOT/compose.dev.yaml" ;;
  *)    error "Unknown environment: $1 (expected prod or dev)"; exit 1 ;;
esac
COMPOSE="docker compose -f $COMPOSE_FILE"
cd "$REPO_ROOT"

if ! grep -qE '^LETSENCRYPT_EMAIL=.+$' "$REPO_ROOT/.env"; then
  error "LETSENCRYPT_EMAIL is not set in .env — aborting."
  exit 1
fi

info "Requesting / renewing certificate ($(date -u +%FT%TZ)) …"
$COMPOSE --profile ssl run --rm certbot

# Only reload when nginx is up and the config with the (new) certificate parses;
# a failed `nginx -t` leaves the running proxy on its previous certificate.
if [[ -n "$($COMPOSE ps -q nginx 2>/dev/null)" ]]; then
  $COMPOSE exec -T nginx nginx -t
  $COMPOSE exec -T nginx nginx -s reload
  success "nginx reloaded."
else
  info "nginx is not running — nothing to reload."
fi
