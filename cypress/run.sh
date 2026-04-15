#!/usr/bin/env bash
set -euo pipefail

emulator_host() { echo "127.0.0.1:$(jq ".emulators.$1.port" firebase.json)"; }

export SERVICE_ACCOUNT="$(cat ./serviceAccount.json)"
export FIREBASE_AUTH_EMULATOR_HOST="$(emulator_host auth)"
export FIRESTORE_EMULATOR_HOST="$(emulator_host firestore)"
export FIREBASE_STORAGE_EMULATOR_HOST="$(emulator_host storage)"

yarn build

EMULATOR_LOG=$(mktemp)
yarn firebase:emulate --log-verbosity SILENT >"$EMULATOR_LOG" 2>&1 &
EMULATOR_PID=$!
trap '
  pkill -KILL -f "Cypress.app" 2>/dev/null || true
  kill "$EMULATOR_PID" 2>/dev/null || true
  wait "$EMULATOR_PID" 2>/dev/null || true
  rm -f "$EMULATOR_LOG"
' EXIT

WAIT_TIMEOUT=120
DEADLINE=$(( $(date +%s) + WAIT_TIMEOUT ))
until nc -z 127.0.0.1 3000 2>/dev/null; do
  if ! kill -0 "$EMULATOR_PID" 2>/dev/null; then
    echo "ERROR: Firebase emulator exited early. Logs:" >&2
    cat "$EMULATOR_LOG" >&2
    exit 1
  fi
  if (( $(date +%s) >= DEADLINE )); then
    echo "ERROR: Timed out after ${WAIT_TIMEOUT}s waiting for port 3000. Emulator logs:" >&2
    cat "$EMULATOR_LOG" >&2
    exit 1
  fi
  sleep 0.5
done

CYPRESS_STATUS=0
if [[ "${1:-}" == "local" ]]; then
  SPEC="${2:-}"
  if [[ -n "$SPEC" ]]; then
    cypress run --browser chrome --spec "cypress/e2e/**/*${SPEC}*" || CYPRESS_STATUS=$?
  else
    cypress run --browser chrome || CYPRESS_STATUS=$?
  fi
else
  cypress open --e2e --browser chrome || CYPRESS_STATUS=$?
fi

exit $CYPRESS_STATUS
