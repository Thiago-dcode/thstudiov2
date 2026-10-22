#!/usr/bin/env bash
# =============================================================================
# dbcli-dev.sh — run @repo/database CLI inside the dev api container
#
# Usage (on the droplet, from repo root or anywhere):
#   ./scripts/dbcli-dev.sh              # interactive shell in api
#   ./scripts/dbcli-dev.sh migrate
#   ./scripts/dbcli-dev.sh rollback --all
#   ./scripts/dbcli-dev.sh db:seed
#   ./scripts/dbcli-dev.sh generate-user-thumbnails --user=123 --dry-run
#   ./scripts/dbcli-dev.sh generate-media-thumbnail --media-id=456 --dry-run
#   ./scripts/dbcli-dev.sh restore 2026-10-22   # pull a prod backup into dev (runs in the worker)
#   ./scripts/dbcli-dev.sh restore latest       # the most recent prod backup
#
# Requires: api service running (docker compose up -d); restore also needs the worker running
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/compose.dev.yaml"
COMPOSE=(docker compose -f "$COMPOSE_FILE")

run_dbcli() {
  # `restore` shells out to pg_restore, which only the worker image ships.
  local service=api
  [[ "${1:-}" == "restore" ]] && service=worker

  # -it is required for migrate:refresh / db:fresh / clean:* password + confirm prompts.
  # Skip -t when stdin is not a TTY (CI / pipes) so docker does not fail.
  TTY_FLAGS=()
  if [[ -t 0 ]]; then
    TTY_FLAGS+=(-it)
  fi

  "${COMPOSE[@]}" exec "${TTY_FLAGS[@]}" "$service" sh -c \
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
