#!/usr/bin/env bash
# =============================================================================
# dbcli-dev.sh — Run database CLI on the dev droplet (same as local pnpm dbcli)
#
# Usage (on the server, from repo root):
#   ./scripts/dbcli-dev.sh migrate
#   ./scripts/dbcli-dev.sh db:seed
#   ./scripts/dbcli-dev.sh rollback --steps 1
#
# Runs inside a one-off api container (needs GHCR api image with database/dist).
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/compose.dev.yaml"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <dbcli-command> [args...]" >&2
  echo "Examples:" >&2
  echo "  $0 migrate" >&2
  echo "  $0 db:seed" >&2
  echo "  $0 rollback --steps 1" >&2
  exit 1
fi

cd "$REPO_ROOT"

if [[ ! -f "$REPO_ROOT/.env" ]]; then
  echo "Error: .env not found at $REPO_ROOT/.env" >&2
  exit 1
fi

# Postgres must be reachable on the compose network.
docker compose -f "$COMPOSE_FILE" up -d postgres >/dev/null

# Quote each argument for safe passing into sh -c
quoted_args=""
for arg in "$@"; do
  quoted_args+=" $(printf '%q' "$arg")"
done

docker compose -f "$COMPOSE_FILE" run --rm \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  api sh -c "cd packages/database && node dist/src/bin/cli.js${quoted_args}"
