# PROGRESS — honest status of the round-2 platform

Single source of truth. **Done** = feature works AND was verified (command, test, or browser
evidence attached). **Partial** = built but not verified end-to-end or knowingly incomplete.
**Not started** = nothing to show. Evidence commands were run in the round-2 sandbox
(PostgreSQL 16.4 @ 127.0.0.1:5433, seeded DB, `bun run dev` on :3000) unless stated otherwise.

PR stack (all **open**, awaiting client review — never self-merged):

| PR | Branch | Scope |
|----|--------|-------|
| #1 | `feat/foundation` → `main` | Postgres schema + migrations, storage adapter, session auth + CSRF, /en bilingual URLs |
| #2 | `feat/content-seed` → `feat/foundation` | Client documents → PostgreSQL (7 courses, 91 subjects, 35 people, media import) |
| #3 | `feat/public-site` → `feat/content-seed` | Every public page DB-driven, hreflang, sitemap/robots/feed, flag-aware |
| #4 | `feat/admin-cms` → `feat/public-site` | Bangla admin: roles, media library, courses & curriculum, notices, fatwa workflow, research, inbox, users, audit |
| #5 | `feat/admissions` → `feat/admin-cms` | Online application form + uploads, applicant status tracking, officer APIs + CSV |
| #6 | `feat/public-apis` → `feat/admissions` | notices / fatwa / campaigns / contact / newsletter / donation APIs + signed sandbox callback |
| #7 | `feat/admissions-documents` → `feat/public-apis` | Application document attachment + exam-call letter |
| #8 | `feat/finance` → `feat/admissions-documents` | Admin finance module + sandbox checkout (the money loop) |
| #9 | `feat/qa-ship` → `feat/finance` | 121-test suite, CI, Docker + compose, this document set |

---

## 1. Foundation — DONE

- PostgreSQL 16 schema (32 models, 9 enums) with **committed versioned migrations**
  (`prisma/migrations/20261004173155_init_platform_schema`, `..._fatwa_question_note`).
  Evidence: `bunx prisma migrate deploy` → "All migrations successfully applied" (fresh DB, twice).
- Object-storage abstraction (S3 driver + local-disk fallback, magic-byte + size validation,
  sharp image variants). Evidence: 16 media records imported by seed into `storage-local/`
  (sandbox runs without MinIO by design — see GAPS); `/api/media/<key>` streams with
  immutable cache headers (200 on all media URLs in browser tests).
- Session auth: DB sessions + scrypt + httpOnly signed cookie, CSRF double-submit + origin
  checks, sliding-window rate limiter. Evidence: integration tests
  `tests/integration/authz.test.ts` (session lifecycle + scrypt round-trip, 17 tests).
- i18n: `[lang]` routing with internal rewrite — Bangla at `/`, English at `/en/*`, URL never
  changes for Bangla. hreflang on every page. Evidence: 30-route curl sweep all 200;
  `tests/unit/locale.test.ts` (16 tests) incl. the proxy's reserved-path logic.
- Security headers (CSP, HSTS at proxy, frame nosniff) — see `src/proxy.ts`.

## 2. Content seed — DONE

- Bangla copied verbatim from the client documents; bilingual fields everywhere.
  Seed stats: 7 courses, 11 semesters, 91 subjects, 5 teams, 35 people, 8 notices, 9 posts,
  3 albums, 6 videos, 8 fatwa entries + categories, 11 FAQs, 4 funds, 2 campaigns (+1 test),
  6 stats, 47 menu items, 17 settings, 11 feature flags, 16 media.
  Evidence: `bun scripts/seed.ts` → "✅ Seed complete" + the count table (idempotent re-runs).
- Admin bootstrap from env (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`) — no hard-coded
  password in the repo. Evidence: seed refusal path + created admin logs in successfully.

## 3. Public site — DONE

- All 30 routes DB-driven (about, academics + 7 course pages, admissions, research + fatwa,
  media hub, blog + 5 articles, notices, support + zakat calculator, contact, search, account,
  login/register, sitemap.xml, robots.txt, feed.xml). Empty-data states designed.
  Evidence: route sweep (all 200, `/account` 307 unauthenticated), agent-browser with zero
  console errors on home/academics/notices/fatwa/support/contact/search in both languages.
- Client components fetch the six public APIs (all rebuilt in PR #6): notices feed (pinned
  first), fatwa bank (search + deep links + ask), campaign progress bars, contact form,
  footer newsletter, donation form. Evidence: E2E in §6.

## 4. Admin CMS — DONE

- Bangla-first admin at `/admin` (own layout, `robots: noindex`), role-gated per module
  (ADMIN/EDITOR/ADMISSIONS/FINANCE/FATWA via `MODULE_ROLES`).
  Modules: media library, courses + curriculum editor (semesters/subjects/SDP/specializations
  with auto totals), people & teams, notices (pin/unpin), blog posts + categories, gallery
  albums, videos, fatwa categories/entries/questions workflow, research (publications +
  projects), download resources, inbox (messages + subscribers), users + reset-password,
  feature flags, audit log + CSV, dashboard with live counts.
- **Numbered deep pagination everywhere** (PR #11 + round 19): the shared AdminPager
  (windowed 1 … p-1 p p+1 … last, Bengali numerals, filter-preserving hrefs) serves all
  eight long lists — donations, ledger, applications, subscribers, messages (PR #11) and
  fatwa/questions (15/page), notices (20/page), research/projects (12/page) (round 19).
  Every `take:100` cap is gone. E2E: 23/16/13 seeded-then-deleted TMP rows paged 20+3 /
  15+1 / 12+1 with filter preservation (`?status=PENDING&page=`) — `qa-r19-notices-pager.png`.
- **Sticky table headers** (round 19): `#admin-main` thead pins at 3.5rem under the h-14
  topbar (both shells); wrappers `overflow-hidden` → `overflow-clip` so sticky isn't
  neutralised by a non-scrolling scrollport. Geometry-verified (thead_top = 56px at
  scrollY 404) — `qa-r19-sticky-thead.png`; officer confirm dialogs re-verified live.
- Every mutation audited (`AuditLog`) and CSRF-guarded. Evidence: E2E from the admin-cms
  phase (worklog Task IDs 6–15) + the qa-ship integration matrix.

## 5. Admissions — DONE

- Intakes (course, year, session, seats, opens/closes/exam dates, status) drive the public
  `/admissions/apply` form: personal + guardian + education rows + photo & document uploads
  (magic-byte validated, per-file Bangla type select) + declaration → tracking number.
  One active application per intake per user; feature-flag kill switch.
- Applicant portal: `/account` shows live status timeline (ApplicationEvent history) +
  exam banner. Officer workflow: list with filters/search, detail with documents, 8-status
  machine (UNDER_REVIEW → … → ADMITTED/REJECTED) + notes + exam/viva scores + CSV export.
  EXAM_SCHEDULED queues a Bangla exam-call letter to the outbox.
  Evidence: full E2E — register → apply (photo + transcript + certificate) →
  `ASDRI-2026-686652` with 2 ApplicationDocument rows → officer transitions → `/account`
  reflects status + exam date → CSV downloads (worklog Task 7 + coordinator records).

## 6. Donations & finance — DONE

- Public flow: fund cards + campaign progress (raised = Σ COMPLETED) → donation form
  (Bengali-digit amounts, anonymous option, sponsor student ref) → intent with
  `DN-2026-000NNN` tracking + `ASDRI-R-000NNN` receipt → manual payment channels from
  settings → **sandbox checkout** `/checkout/<code>?sig=…` (HMAC page grant, gateway UI,
  confirm → callback → COMPLETED + English receipt email to outbox).
- Admin finance (`/admin/finance`, ADMIN+FINANCE): KPI home, donations ledger (status
  transitions, resend receipt, CSV, anonymous donors staff-visible with গোপন badge),
  campaigns manager, funds manager (isEnabled drives public cards), manual INCOME/EXPENSE
  ledger with per-fund balances + CSV, outbox viewer (render + requeue).
  Evidence: coordinator E2E — donate ৳১,৫০০ → ASDRI-R-000005 → signed checkout → confirm →
  ledger ৳৮,৮০০ + outbox row; ledger entry + CSV export; bad-signature error state;
  mobile 390px (worklog Task 6-b). Round-19 regression after the mail refactor: second
  full loop DN-2026-000002 → COMPLETED → receipt ASDRI-R-000002 in the outbox.
- **SMTP delivery driver** (round 19, env-gated): `MAIL_DRIVER=smtp` + `SMTP_URL` delivers
  via a lazily-imported nodemailer transporter **first**, then records the same outbox row
  with `sentAt` + `providerMessageId`; failures stay soft (error on the row, retryable —
  the money path can never break on a mail outage). Migration `20261005070000` adds the
  column; `MAIL_FROM` env with a no-reply default; unit-tested both drivers (144 suite).

## 7. QA / ship — DONE (with the two sandbox-unverifiable items marked PARTIAL below)

- **Tests: DONE.** 144 tests / 541 assertions, 11 files, all green in ~2s on this branch
  (`bun run test`; main is at 121/464/8 — PR #11 adds the search/pager suite +21, round 19
  adds the mail-driver pair +2). Unit: Bengali numerals/taka/dates, locale + proxy logic, zod
  validators, receipt email, both HMAC contracts, db-search tokens/fallback, pager window
  algorithm. Integration (against a dedicated
  `asdri_test` database, dev DB verified untouched): full role matrix, session lifecycle,
  admissions status machine **through the real route handlers**, donation money loop
  through the real handlers.
  Bug found & fixed by the suite: English pages rendered Bengali month names
  (`15 জানুয়ারি 2025`) — `EN_MONTHS` added; live-verified on `/en/notices`.
- **GitHub Actions CI: PARTIAL.** `.github/workflows/ci.yml` (lint → typecheck → test →
  prisma generate → seed → next build, postgres:16-alpine service) — every step's command
  is proven green locally; the pipeline itself cannot run until the branches are pushed
  (first run = client's merge review). No Docker daemon / GitHub runner exists in this
  sandbox, so the workflow's first execution is unverified.
- **Docker: PARTIAL.** Multi-stage `Dockerfile` (oven/bun, non-root, migrate-on-boot
  entrypoint, healthcheck) + `docker-compose.yml` (postgres + optional MinIO under the
  `s3` profile) + `.dockerignore`. Syntax and paths cross-checked against the proven
  `bun run build` script, but the image was never built or run (no Docker in sandbox).
  Compose first boot is two-step (pg healthy → `up -d --build app`); see GAPS.

## Known test/demo data in the sandbox DB

Intake "PYS 2026" (OPEN), applications `ASDRI-2026-493796` + `ASDRI-2026-686652` (with
uploads), 4 completed + several pending donations, 3 manual-ledger entries, outbox rows.
Kept deliberately as demo data — a pristine DB is one `prisma migrate reset` +
`bun scripts/seed.ts` away.
