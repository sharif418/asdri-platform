# HUMAN_STEPS — secrets & accounts only the client can create

The platform refuses weak defaults in production (`src/lib/env.ts` throws on boot when a
secret is missing or a `dev-only` placeholder). Everything below is a deliberate
**client-only** step — nothing here is (or should be) automated by the agent.

## 1. Secrets to generate & set (production environment)

| Variable | How | Notes |
|----------|-----|-------|
| `SESSION_SECRET` | `openssl rand -hex 32` | Session cookie signing. Rotate = all sessions invalidated. |
| `PAYMENT_CALLBACK_SECRET` | `openssl rand -hex 32` | Signs sandbox/real gateway callbacks + checkout page grants. |
| `DATABASE_URL` | from your Postgres host | `postgresql://user:pass@host:5432/asdri?schema=public`. Migrations run automatically on boot (Dockerfile entrypoint). |
| `SMTP_URL` | `smtps://user:pass@smtp.host:465` | Only when `MAIL_DRIVER=smtp`. Deliver-then-record over the outbox: delivered rows get `sentAt`+`providerMessageId`; failures stay retryable with the error on the row. |
| `MAIL_FROM` | verified sender at your provider, e.g. `As-Sunnah Institute <no-reply@assunnahinstitute.org>` | Envelope From for every outbound mail (smtp driver). Optional — falls back to a no-reply default. |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_BUCKET` / `S3_ENDPOINT` | from your object storage | Optional: without them the app uses the local-disk driver. Set for S3/MinIO (compose profile `s3` provisions MinIO). |
| `NEXT_PUBLIC_SITE_URL` | your real origin, e.g. `https://assunnahinstitute.org` | Drives metadataBase, sitemap, hreflang, email links. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | one-time bootstrap values | Used **only** by `bun scripts/seed.ts` to create the first admin; change the password on first login and unset the env after. |

## 2. Accounts to create / actions to take on external services

1. **Merge the PR stack** (#1 → #9 in order — they are stacked; merge bottom-up, or merge
   all via GitHub's UI which handles stacked order when merged sequentially). Review
   screenshots are in each PR description; nothing was self-merged.
2. **Payment gateway merchant account** (bKash merchant / Nagad / SSLCommerz — office's
   choice): create the account, obtain API keys + callback credentials, then decide the
   adapter integration round. The sandbox provider stays functional until then
   (`PAYMENT_PROVIDER=sandbox`).
3. **YouTube channel ownership**: replace the 6 placeholder video IDs from the admin
   (মিডিয়া → ভিডিও) with real video links/IDs.
4. **Email mailbox** for `info@assunnah-institute.org` (or a dedicated noreply address)
   with SMTP credentials — powers receipts, exam-call letters, newsletter confirmations.
5. **DNS + TLS**: point the domain at the deployment (Coolify/compose per PLAN §4) —
   the app itself is origin-agnostic; TLS terminates at the proxy.
6. **First login hardening**: sign in with the seeded admin, change the password
   (admin → ইউজার ও রোল), then create the real staff accounts with proper roles
   (EDITOR / ADMISSIONS / FINANCE / FATWA) — role meaning is documented in the admin UI.
7. **Content review pass** (office staff, in Bangla, via the admin): payment channel
   numbers, zakat nisab figures, fee schedules per course, teacher photos (upload real
   photos — monograms are placeholders), and the 8 seeded fatwa entries.
8. **Backups**: enable Postgres volume backups + object-storage bucket versioning in
   your infrastructure (outside app scope).

## 3. After first deploy (recommended order)

1. `docker compose up -d postgres` → wait healthy → `docker compose up -d --build app`
   (or the one-step variant if requested — GAPS §B.7).
2. Verify `/` (Bangla) and `/en` render; `sitemap.xml` lists your domain.
3. Run one full flow as a smoke test: register → apply → donate (sandbox) → confirm in
   the admin ledgers.
4. Switch `PAYMENT_PROVIDER` off `sandbox` only after the real gateway adapter lands.
