#!/bin/sh
set -eu

# Shipzy Koyeb manual migration helper (Option 1)
# Usage:
#   ./scripts/release-koyeb.sh
#   ./scripts/release-koyeb.sh .env.prod
#   ./scripts/release-koyeb.sh path/to/envfile --skip-install

ENV_FILE=".env.prod"
SKIP_INSTALL="false"
DRY_RUN="false"

for arg in "$@"; do
  if [ "$arg" = "--skip-install" ]; then
    SKIP_INSTALL="true"
  elif [ "$arg" = "--dry-run" ]; then
    DRY_RUN="true"
  else
    ENV_FILE="$arg"
  fi
done

if [ ! -f "$ENV_FILE" ]; then
  echo "[ERROR] Env file not found: $ENV_FILE"
  echo "Create it with DATABASE_URL and NODE_ENV=production"
  exit 1
fi

ENV_FILE="$(cd "$(dirname "$ENV_FILE")" && pwd)/$(basename "$ENV_FILE")"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[INFO] Using env file: $ENV_FILE"

autoload_corepack() {
  if command -v corepack >/dev/null 2>&1; then
    corepack enable >/dev/null 2>&1 || true
  fi
}

load_env_file() {
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      "" | \#*)
        continue
        ;;
    esac

    case "$line" in
      *=*)
        key=${line%%=*}
        value=${line#*=}

        key=$(printf '%s' "$key" | sed 's/^[[:space:]]*export[[:space:]]*//; s/[[:space:]]*$//')
        value=$(printf '%s' "$value" | sed 's/^[[:space:]]*//')

        case "$value" in
          \"*\")
            value=${value#\"}
            value=${value%\"}
            ;;
          \'*\')
            value=${value#\'}
            value=${value%\'}
            ;;
        esac

        export "$key=$value"
        ;;
    esac
  done < "$ENV_FILE"
}

load_env_file

if [ -z "${DATABASE_URL:-}" ] && [ -z "${DB_PASSWORD:-}" ]; then
  echo "[ERROR] Missing DATABASE_URL (or DB_PASSWORD fallback) in $ENV_FILE"
  exit 1
fi

if [ "${DRY_RUN}" = "true" ]; then
  echo "[INFO] Dry run successful. Environment variables loaded correctly."
  echo "[NEXT] Re-run without --dry-run to execute db:deploy."
  exit 0
fi

if [ "${SKIP_INSTALL}" != "true" ]; then
  autoload_corepack
  echo "[INFO] Installing dependencies..."
  pnpm install --frozen-lockfile
fi

echo "[INFO] Running database deployment..."
pnpm run db:deploy

echo "[SUCCESS] Migration complete."
echo "[NEXT] Trigger Koyeb backend-api deploy now."
