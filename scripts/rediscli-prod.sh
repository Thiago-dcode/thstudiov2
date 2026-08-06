#!/usr/bin/env bash
# =============================================================================
# rediscli-prod.sh — talk to the PRODUCTION redis container
#
# Usage (on the prod droplet):
#   ./scripts/rediscli-prod.sh                    # interactive redis-cli
#   ./scripts/rediscli-prod.sh dbsize             # any redis command, passed through
#   ./scripts/rediscli-prod.sh keys 'bull:*'
#   ./scripts/rediscli-prod.sh queues             # summarise BullMQ queue keys
#   ./scripts/rediscli-prod.sh flush-queues       # delete bull:* only  (destructive)
#   ./scripts/rediscli-prod.sh flush              # FLUSHALL            (destructive)
#
# Destructive subcommands print what will be lost and require typing 'yes'.
# Set REDISCLI_YES=1 to skip the prompt in automation.
#
# Note: redis runs with `--appendonly yes`, so a flush is written straight through
# to the AOF. There is no undo and no snapshot to roll back to.
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[redis]${NC} $*"; }
success() { echo -e "${GREEN}[redis]${NC} $*"; }
warn()    { echo -e "${YELLOW}[redis]${NC} $*"; }
error()   { echo -e "${RED}[redis]${NC} $*" >&2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# A11STUDIO_DIR lets a copy installed outside the repo (e.g. /usr/local/bin) find
# the deployment; from inside scripts/ the parent directory is already correct.
REPO_ROOT="${A11STUDIO_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
COMPOSE_FILE="$REPO_ROOT/compose.prod.yaml"
COMPOSE=(docker compose -f "$COMPOSE_FILE")

[[ -f "$COMPOSE_FILE" ]] || { error "compose file not found: $COMPOSE_FILE"; exit 1; }
cd "$REPO_ROOT"

if ! "${COMPOSE[@]}" ps --status running --services 2>/dev/null | grep -qx redis; then
  error "The redis service is not running. Start it with: docker compose -f compose.prod.yaml up -d redis"
  exit 1
fi

# Non-interactive redis-cli invocation.
rcli() { "${COMPOSE[@]}" exec -T redis redis-cli "$@"; }

confirm() {
  [[ "${REDISCLI_YES:-0}" == "1" ]] && return 0
  read -r -p "Type 'yes' to continue: " reply
  [[ "$reply" == "yes" ]] || { error "Aborted."; exit 1; }
}

# Counts keys matching a pattern using SCAN — KEYS blocks the server, and this
# runs against production.
count_keys() { rcli --scan --pattern "$1" 2>/dev/null | grep -c . || true; }

case "${1:-}" in
  # ── Interactive shell ─────────────────────────────────────────────────────
  '')
    exec "${COMPOSE[@]}" exec redis redis-cli
    ;;

  # ── Read-only summary of the BullMQ queues ────────────────────────────────
  queues)
    info "BullMQ keys by queue:"
    for q in user-metrics stripe-webhooks ai storage-requests user-contacts \
             location mail log plan-subscriptions; do
      printf '  %-20s %s\n' "$q" "$(count_keys "bull:${q}:*")"
    done
    printf '  %-20s %s\n' "TOTAL bull:*" "$(count_keys 'bull:*')"
    printf '  %-20s %s\n' "dbsize" "$(rcli dbsize | tr -d '\r')"
    ;;

  # ── Delete only the BullMQ keys ───────────────────────────────────────────
  flush-queues)
    n=$(count_keys 'bull:*')
    if [[ "$n" -eq 0 ]]; then success "No bull:* keys to delete."; exit 0; fi
    warn "About to delete $n bull:* key(s) from PRODUCTION redis."
    warn "Pending and delayed jobs (mail, log, stripe-webhooks, …) will be lost."
    confirm
    # SCAN + batched DEL rather than `KEYS ... | xargs`, so the server is never
    # blocked enumerating a large keyspace.
    rcli --scan --pattern 'bull:*' | tr -d '\r' | xargs -r -n 200 \
      "${COMPOSE[@]}" exec -T redis redis-cli del >/dev/null
    success "Deleted. Remaining bull:* keys: $(count_keys 'bull:*')"
    ;;

  # ── Full flush ────────────────────────────────────────────────────────────
  flush|flushall)
    warn "About to FLUSHALL on PRODUCTION redis."
    warn "  dbsize      : $(rcli dbsize | tr -d '\r')"
    warn "  bull:* keys : $(count_keys 'bull:*')"
    warn "This drops every queued job and every cached value. appendonly is on, so"
    warn "it is written straight to the AOF — there is no rollback."
    confirm
    rcli flushall
    success "FLUSHALL done. dbsize is now $(rcli dbsize | tr -d '\r')."
    ;;

  # ── Anything else: pass straight through to redis-cli ─────────────────────
  *)
    rcli "$@"
    ;;
esac
