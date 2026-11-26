#!/usr/bin/env bash
# =============================================================================
# check-turnstile-env.sh — read-only check of the Turnstile keys in a server .env
#
# Usage:
#   bash infrastructure/scripts/check-turnstile-env.sh [path-to-.env]
#   (default: the repo root .env next to this script)
#
# Prints PASS/ABORT per key, never a value. Exit 0 when both keys are usable, 1 otherwise.
# The api refuses to boot in production with a blank or Cloudflare test key, and recreating the
# api with one takes the whole site down (web waits on a healthy api), so run this on the server
# before a deploy that needs the keys.
#
# deploy-app.sh sources this file for the same check (only the functions; nothing runs on source),
# so the parsing lives in one place.
# =============================================================================

# The value Docker Compose passes from `env_file` for KEY (and that common-lib config `.trim()`s):
#   - the LAST line `[spaces][export ]KEY[spaces]=` wins (compose uses the last duplicate);
#   - CR and leading whitespace are stripped;
#   - a value opening with a quote that is closed later is only the text inside the quotes
#     (anything after the closing quote, e.g. ` # comment`, is ignored);
#   - an unquoted value starting with `#` is empty, otherwise ` # comment` / `<tab># comment` is dropped;
#   - the result is trimmed.
# Usage: turnstile_env_value <env-file> <key>
turnstile_env_value() {
  local line value q rest
  line="$(grep -E "^[[:space:]]*(export[[:space:]]+)?$2[[:space:]]*=" "$1" | tail -n1 || true)"
  value="${line#*=}"
  value="${value//$'\r'/}"
  value="${value#"${value%%[![:space:]]*}"}"
  q="${value:0:1}"
  if [[ "$q" == '"' || "$q" == "'" ]]; then
    rest="${value:1}"
    [[ "$rest" == *"$q"* ]] && value="${rest%%"$q"*}"
  elif [[ "$q" == '#' ]]; then
    value=''
  else
    value="${value%%[[:space:]]#*}"
  fi
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

# Every Cloudflare test site key and secret (`TURNSTILE_TEST_KEYS` in common-lib) has this shape.
TURNSTILE_TEST_KEY_RE='^[123]x0{20,}[A-F]{2}$'

# Prints one `KEY: PASS` / `KEY: ABORT (reason)` line per key, never a value. Returns 0 when both
# TURNSTILE_SECRET_KEY and TURNSTILE_SITE_KEY are usable, 1 otherwise.
# Usage: turnstile_env_check <env-file>
turnstile_env_check() {
  local env_file="$1" key value status=0
  if [[ ! -r "$env_file" ]]; then
    echo "ABORT: cannot read $env_file"
    return 1
  fi
  for key in TURNSTILE_SECRET_KEY TURNSTILE_SITE_KEY; do
    value="$(turnstile_env_value "$env_file" "$key")"
    if [[ -z "$value" ]]; then
      echo "$key: ABORT (not set or blank)"
      status=1
    elif [[ "$value" == *'$'* ]]; then
      # Compose interpolates `${VAR}` in env_file values; a real key never contains `$`, so refuse
      # what this check can't resolve (an unset reference would reach the api as blank).
      echo "$key: ABORT (contains \$, variable interpolation)"
      status=1
    elif [[ "$value" =~ $TURNSTILE_TEST_KEY_RE ]]; then
      echo "$key: ABORT (Cloudflare test key)"
      status=1
    else
      echo "$key: PASS"
    fi
  done
  return "$status"
}

# Run only when executed (also `… | bash -s -- <path>`), not when sourced by deploy-app.sh.
if [[ "${BASH_SOURCE[0]:-$0}" == "$0" ]]; then
  set -euo pipefail
  env_path="${1:-$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/../.." && pwd)/.env}"
  if turnstile_env_check "$env_path"; then
    exit 0
  fi
  exit 1
fi
