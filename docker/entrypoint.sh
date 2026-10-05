#!/bin/sh
# ASDRI container entrypoint: apply the committed Prisma migrations, then
# start the standalone Next server. Fail fast — a half-migrated database
# must never serve traffic.
set -e

echo "[entrypoint] applying database migrations…"
bunx prisma migrate deploy

echo "[entrypoint] starting ASDRI on :${PORT:-3000}"
exec bun .next/standalone/server.js
