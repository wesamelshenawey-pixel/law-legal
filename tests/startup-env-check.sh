#!/usr/bin/env bash
# Verifies the container startup behaviour of docker/startup.sh:
#   - the script exists and is executable,
#   - missing required variables abort with a clear message and exit 1,
#   - present required variables let the app command run,
#   - missing recommended variables only warn,
#   - Compose runs the entrypoint as root.
# Usage: bash tests/startup-env-check.sh
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$ROOT/docker/startup.sh"
COMPOSE="$ROOT/docker-compose.base44.yml"
FAILURES=0

pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; FAILURES=$((FAILURES + 1)); }

# --- 1. executable bit -------------------------------------------------------
if [ -f "$SCRIPT" ] && [ -x "$SCRIPT" ]; then
  pass "docker/startup.sh exists and is executable"
else
  fail "docker/startup.sh is missing or not executable (chmod +x docker/startup.sh)"
fi

# --- 2. missing required variable aborts ------------------------------------
out="$(REQUIRED_VARS=GEMINI_API_KEY GEMINI_API_KEY= RECOMMENDED_VARS= "$SCRIPT" echo STARTED 2>&1)"
code=$?
if [ "$code" -eq 1 ] && printf '%s' "$out" | grep -q "STARTUP ABORTED" \
   && printf '%s' "$out" | grep -q "GEMINI_API_KEY" \
   && ! printf '%s' "$out" | grep -q "STARTED"; then
  pass "missing required variable aborts with exit 1 and names the variable"
else
  fail "missing required variable should abort with exit 1 (got exit $code): $out"
fi

# --- 3. present required variable starts the command ------------------------
out="$(REQUIRED_VARS=GEMINI_API_KEY GEMINI_API_KEY=test-key RECOMMENDED_VARS= "$SCRIPT" echo STARTED 2>&1)"
code=$?
if [ "$code" -eq 0 ] && printf '%s' "$out" | grep -q "STARTED"; then
  pass "present required variables let the app command run"
else
  fail "present required variables should start the command (exit $code): $out"
fi

# --- 4. missing recommended variable warns but continues --------------------
out="$(REQUIRED_VARS= RECOMMENDED_VARS=GEMINI_API_KEY GEMINI_API_KEY= "$SCRIPT" echo STARTED 2>&1)"
code=$?
if [ "$code" -eq 0 ] && printf '%s' "$out" | grep -q "WARNING" \
   && printf '%s' "$out" | grep -q "STARTED"; then
  pass "missing recommended variable warns and still starts the app"
else
  fail "missing recommended variable should warn but continue (exit $code): $out"
fi

# --- 5. Compose runs the entrypoint as root ---------------------------------
if grep -q 'user: root' "$COMPOSE" && grep -q '/app/docker/startup.sh' "$COMPOSE"; then
  pass "Compose runs docker/startup.sh as root before the app"
else
  fail "Compose must set 'user: root' and use /app/docker/startup.sh"
fi

printf '\n%s\n' "----------------------------------------"
if [ "$FAILURES" -eq 0 ]; then
  printf 'All startup checks passed.\n'
  exit 0
fi
printf '%d startup check(s) failed.\n' "$FAILURES"
exit 1
