#!/bin/sh
# Environment pre-flight check for the container entrypoint.
# Invoked from docker-compose.base44.yml as root, before the app starts.
set -eu

# Variables the app cannot start without (space separated).
# Empty today: server.ts falls back to safe defaults for every variable it reads.
REQUIRED_VARS="${REQUIRED_VARS:-}"

# Variables needed for full functionality. Missing ones print a warning only,
# because the app boots without them and degrades gracefully.
RECOMMENDED_VARS="${RECOMMENDED_VARS:-GEMINI_API_KEY}"

is_set() {
  eval "value=\${$1:-}"
  [ -n "$value" ]
}

missing_required=""
for name in $REQUIRED_VARS; do
  is_set "$name" || missing_required="$missing_required $name"
done

if [ -n "$missing_required" ]; then
  printf '\n============================================================\n'
  printf ' STARTUP ABORTED: missing required environment variables\n'
  printf '============================================================\n'
  printf ' Missing:%s\n' "$missing_required"
  printf ' Provide them as app secrets (delivered via /run/base44/app.env)\n'
  printf ' or in the container environment, then restart the container.\n\n'
  exit 1
fi

missing_recommended=""
for name in $RECOMMENDED_VARS; do
  is_set "$name" || missing_recommended="$missing_recommended $name"
done

if [ -n "$missing_recommended" ]; then
  printf '[env-check] WARNING: missing recommended variables:%s\n' "$missing_recommended"
  printf '[env-check] The app will start, but AI chat, OCR and drafting stay disabled until they are set.\n'
else
  printf '[env-check] All required environment variables are present.\n'
fi

exec "$@"
