#!/bin/sh
# ASDRI container entrypoint: apply the committed Prisma migrations, make sure the object
# storage bucket exists, optionally seed once, then start the standalone Next server.
# Fail fast on migrations — a half-migrated database must never serve traffic.
set -e

echo "[entrypoint] applying database migrations…"
bunx prisma migrate deploy

if [ -n "$S3_ENDPOINT" ]; then
  echo "[entrypoint] ensuring bucket ${S3_BUCKET}…"
  bun scripts/ensure-bucket.mjs || echo "[entrypoint] bucket bootstrap skipped"
fi

if [ "$SEED_ON_BOOT" = "1" ]; then
  echo "[entrypoint] SEED_ON_BOOT=1 — running the idempotent seed…"
  bun scripts/seed.ts || echo "[entrypoint] seed failed; continuing to start the server"
fi

echo "[entrypoint] starting ASDRI on :${PORT:-3000}"
exec bun .next/standalone/server.js
