# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# ASDRI platform — multi-stage build (bun) → runner with migrate-on-boot.
#
# BUILD-TIME REQUIREMENTS
#   • DATABASE_URL must point at a reachable, MIGRATED database: the public
#     pages prerender their DB content during `next build` (Next 16
#     standalone). In docker-compose, start postgres first, then build the
#     app (see the header comment in docker-compose.yml).
#   • NEXT_PUBLIC_SITE_URL is inlined into client bundles — pass the real
#     public origin as a build arg.
#   • SESSION_SECRET / PAYMENT_CALLBACK_SECRET only need real FORMAT at
#     build (dummy hex values work); production values are runtime env and
#     must NOT be baked into layers.
#
# RUNTIME
#   • Entrypoint applies prisma migrations, then boots the standalone
#     Next server on :3000 (HOSTNAME=0.0.0.0).
#   • env.ts refuses to start in production without real secrets — provide
#     SESSION_SECRET / PAYMENT_CALLBACK_SECRET / DATABASE_URL via env.
#   • Storage falls back to local disk (/app/storage-local) unless S3_* env
#     is set — mount a volume if you use the local driver.
# ─────────────────────────────────────────────────────────────────────────────

ARG BUN_IMAGE=oven/bun:1

# ——— stage 1: dependency install (cached layer) ————————————————————————————
FROM ${BUN_IMAGE} AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ——— stage 2: build ————————————————————————————————————————————————————————
FROM ${BUN_IMAGE} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate

ARG DATABASE_URL
ARG SESSION_SECRET=0000000000000000000000000000000000000000000000000000000000000000
ARG PAYMENT_CALLBACK_SECRET=1111111111111111111111111111111111111111111111111111111111111111
ARG NEXT_PUBLIC_SITE_URL=https://assunnahinstitute.org
ENV DATABASE_URL=${DATABASE_URL} \
    SESSION_SECRET=${SESSION_SECRET} \
    PAYMENT_CALLBACK_SECRET=${PAYMENT_CALLBACK_SECRET} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

# package.json "build" = next build + copy .next/static and public INTO
# .next/standalone, so the standalone folder is complete afterwards.
RUN bun run build

# ——— stage 3: runner ————————————————————————————————————————————————————————
FROM ${BUN_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# Non-root runtime user.
RUN useradd --system --create-home --uid 1001 nextjs

# Standalone server (with static assets + public already assembled by the
# build script).
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./.next/standalone
# Full node_modules: only needed so the entrypoint can run `bunx prisma
# migrate deploy` (the server itself uses the traced node_modules inside
# .next/standalone). Heavier than strictly necessary — see worklog.
COPY --from=build --chown=nextjs:nextjs /app/node_modules ./node_modules
# Migrations + schema for the boot-time deploy step.
COPY --from=build --chown=nextjs:nextjs /app/prisma ./prisma
COPY --chown=nextjs:nextjs docker/entrypoint.sh ./docker-entrypoint.sh

# Writable local-disk storage fallback (no-op when S3_* env is set).
RUN mkdir -p /app/storage-local && chown -R nextjs:nextjs /app/storage-local /app/docker-entrypoint.sh \
    && chmod +x /app/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
