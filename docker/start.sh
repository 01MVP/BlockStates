#!/bin/bash
set -euo pipefail

SERVER_DIR="/app/server"
CLIENT_DIR="/app/client"
SERVER_PORT="${SERVER_PORT:-3001}"
CLIENT_URL_VALUE="${CLIENT_URL:-*}"

if [[ "${RUN_DB_MIGRATIONS:-true}" == "true" && -n "${DATABASE_URL:-}" ]]; then
  pushd "${SERVER_DIR}" >/dev/null
  npx prisma migrate deploy
  npx prisma generate
  popd >/dev/null
fi

pushd "${SERVER_DIR}" >/dev/null
PORT="${SERVER_PORT}" CLIENT_URL="${CLIENT_URL_VALUE}" node dist/src/server.js &
SERVER_PID=$!
popd >/dev/null

pushd "${CLIENT_DIR}" >/dev/null
node server.js &
CLIENT_PID=$!
popd >/dev/null

terminate() {
  kill -TERM "${SERVER_PID}" 2>/dev/null || true
  kill -TERM "${CLIENT_PID}" 2>/dev/null || true
  wait "${SERVER_PID}" 2>/dev/null || true
  wait "${CLIENT_PID}" 2>/dev/null || true
}

trap terminate TERM INT

wait -n "${SERVER_PID}" "${CLIENT_PID}"
EXIT_CODE=$?

terminate

exit "${EXIT_CODE}"
