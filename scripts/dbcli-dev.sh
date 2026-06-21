#!/usr/bin/env bash
# =============================================================================
# dbcli-dev.sh — run @repo/database CLI inside the dev api container
#
# Usage (on the droplet, from repo root or anywhere):
#   ./scripts/dbcli-dev.sh              # interactive shell in api
#   ./scripts/dbcli-dev.sh migrate
#   ./scripts/dbcli-dev.sh rollback --all
#   ./scripts/dbcli-dev.sh db:seed
#
# Requires: api service running (docker compose up -d)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/compose.dev.yaml"
COMPOSE=(docker compose -f "$COMPOSE_FILE")

run_dbcli() {
  "${COMPOSE[@]}" exec api sh -c \
    'cd /workspace/packages/database && node dist/src/bin/cli.js "$@"' \
    _ "$@"
}

if [[ $# -eq 0 ]]; then
  exec "${COMPOSE[@]}" exec -it -w /workspace api sh
fi

if [[ "${1:-}" == "shell" ]]; then
  shift
  exec "${COMPOSE[@]}" exec -it -w /workspace api sh "$@"
fi

run_dbcli "$@"
