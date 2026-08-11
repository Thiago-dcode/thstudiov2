#!/usr/bin/env bash
# =============================================================================
# dbcli-prod.sh — run the @repo/database CLI against the PRODUCTION database
#
# Usage (on the prod droplet):
#   ./scripts/dbcli-prod.sh migrate
#   ./scripts/dbcli-prod.sh rollback --all
#   ./scripts/dbcli-prod.sh db:seed
#   ./scripts/dbcli-prod.sh shell        # interactive shell in a running api container
#
# Differs from dbcli-dev.sh in three ways that matter on prod:
#   1. compose.prod.yaml, not compose.dev.yaml.
#   2. `run --rm` rather than `exec`, mirroring the migration step in deploy-prod.sh.
#      The api service is scaled (api-1, api-2), so `exec api` is ambiguous, and a
#      one-shot container needs no running instance to attach to.
#   3. DB_HOST/DB_PORT are pinned to the compose network the same way deploy-prod.sh
#      pins them — the .env values are written for host-side tooling.
#
# Destructive subcommands prompt before running. Set DBCLI_YES=1 to skip the prompt
# in automation.
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[dbcli]${NC} $*"; }
warn()  { echo -e "${YELLOW}[dbcli]${NC} $*"; }
error() { echo -e "${RED}[dbcli]${NC} $*" >&2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/compose.prod.yaml"
COMPOSE=(docker compose -f "$COMPOSE_FILE")

if [[ ! -f "$REPO_ROOT/.env" ]]; then
  error ".env not found at $REPO_ROOT/.env — aborting."
  exit 1
fi

cd "$REPO_ROOT"

# ── Interactive shell ────────────────────────────────────────────────────────
if [[ $# -eq 0 || "${1:-}" == "shell" ]]; then
  [[ $# -gt 0 ]] && shift
  # --index 1 is required: the api service runs more than one replica.
  exec "${COMPOSE[@]}" exec --index 1 -it -w /workspace api sh "$@"
fi

# ── Confirmation for destructive subcommands ─────────────────────────────────
# `db:seed` is included deliberately: the seeds create the ADMIN and SUPPORT
# accounts from ADMIN_* / SUPPORT_* in .env, and running it against a database
# that already has them is rarely what you meant.
case "${1:-}" in
  rollback | db:seed | db:wipe | migrate:fresh | migrate:reset)
    if [[ "${DBCLI_YES:-0}" != "1" ]]; then
      warn "About to run '$*' against PRODUCTION ($(grep '^DB_NAME=' .env | cut -d= -f2))."
      read -r -p "Type 'yes' to continue: " reply
      [[ "$reply" == "yes" ]] || { error "Aborted."; exit 1; }
    fi
    ;;
esac

# -it is required for migrate:refresh / db:fresh / clean:* password + confirm prompts.
# Skip -t when stdin is not a TTY (CI / pipes) so docker does not fail.
TTY_FLAGS=()
if [[ -t 0 ]]; then
  TTY_FLAGS+=(-it)
fi

info "Running: $*"
"${COMPOSE[@]}" run --rm "${TTY_FLAGS[@]}" \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  api sh -c 'cd /workspace/packages/database && node dist/src/bin/cli.js "$@"' _ "$@"
