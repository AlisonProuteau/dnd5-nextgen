#!/usr/bin/env bash
set -euo pipefail

emulator_host() { echo "127.0.0.1:$(jq ".emulators.$1.port" firebase.json)"; }

export SERVICE_ACCOUNT="$(cat ./serviceAccount.json)"
export FIREBASE_AUTH_EMULATOR_HOST="$(emulator_host auth)"
export FIRESTORE_EMULATOR_HOST="$(emulator_host firestore)"
export FIREBASE_STORAGE_EMULATOR_HOST="$(emulator_host storage)"

yarn build

yarn firebase:emulate --log-verbosity SILENT 2>/dev/null &
EMULATOR_PID=$!
trap '
  pkill -KILL -f "Cypress.app" 2>/dev/null || true
  kill "$EMULATOR_PID" 2>/dev/null || true
  wait "$EMULATOR_PID" 2>/dev/null || true
' EXIT

until nc -z 127.0.0.1 3000 2>/dev/null; do sleep 0.5; done

if [[ "${1:-}" == "local" ]]; then
  SPEC="${2:-}"
  if [[ -n "$SPEC" ]]; then
    cypress run --browser chrome --spec "cypress/e2e/**/*${SPEC}*" || true
  else
    cypress run --browser chrome || true
  fi
else
  cypress open --e2e --browser chrome || true
fi
