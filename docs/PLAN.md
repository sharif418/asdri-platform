# As-Sunnah Dawah & Research Institute — Platform Plan (Round 2)

**Repo:** https://github.com/sharif418/asdri-platform
**Baseline:** Round 1 prototype (commit `8c81ee2`) — bilingual Next.js 16 site, cookie-switched
language, SQLite, content in `src/content/*.ts`, emerald/gold identity **approved by the client**.
**Round 2 goal:** replace every prototype shortcut with production reality while keeping the
approved visual identity. Nothing in the identity gets quieter; everything under it gets real.

---

## 1. What I understood

The institute (educational arm of As-Sunnah Foundation, Satarkul Badda Dhaka) needs a platform the
office runs itself, not a demo a developer maintains:

1. **Content in the database.** Seven courses with full curricula (semesters, codes, credits,
   specialisations, computed totals), 33 teachers, leadership, vision & objectives, campus,
   alumni, admission process, scholarships, FAQs, notices, blog, gallery, videos, research,
   fatwa workflow, funds and campaigns — every visitor-facing field in Bangla **and** English,
   editable from a Bangla-first admin, with drafts, preview, publish, audit trail and
   role enforcement in the data layer.
2. **Two languages, two URLs.** Bangla default with no prefix; English under `/en`. Both SSR,
   both in the sitemap, `hreflang` cross-links, switcher keeps the visitor on the same page.
   Bengali numerals for human-facing numbers in Bangla; Latin digits for codes and phones;
   Arabic marked as Arabic (Amiri, `dir=rtl`).
3. **Admissions end to end.** Intakes per course with dates and seats; application form
   (personal, guardian, education rows, document uploads, declaration); applicant accounts
   tracking status; admissions-officer workflow (review → shortlist → written exam → viva →
   final) with CSV export.
4. **Donations real up to the provider.** Funds, campaigns with goal tracking, anonymous option
   (hidden publicly, intact in ledger + receipt), Zakat calculator that hands its result to the
   form, PDF receipt + email, finance ledger with filters/export/re-send. Payment gateway behind
   an adapter with a signed sandbox implementation (client hasn't chosen SSLCommerz/bKash/Nagad/
   aamarPay yet).
5. **Engineering bar.** PostgreSQL 16 with versioned migrations applied on boot; S3-compatible
   object storage with generated image sizes; Dockerfile (standalone) + compose for Coolify;
   GitHub Actions (lint, typecheck, tests, build); strict TS with **no** `any`/`@ts-ignore`/
   `eslint-disable`/`ignoreBuildErrors`; files doing one thing under ~500 lines; tests where a
   bug would hurt; OWASP headers; CSRF; rate limits; upload validation; signature-verified
   payment callbacks; refuses to boot in production without secrets.
6. **Performance & craft.** Lighthouse ≥ 90 across the four categories on every public page
   (mid-range Android profile); self-hosted subset fonts; `next/image` everywhere; no CLS;
   motion respects `prefers-reduced-motion`; empty states and low-data states designed; gold
   used as the accent that catches the eye, not as wallpaper.

## 2. Architecture

```
┌───────────────────────────── Coolify / docker-compose ─────────────────────────────┐
│  app (Next.js 16 standalone, node)  ── migrate deploy on boot (entrypoint)          │
│   ├── public site  /[lang]  (bn = URL-less default via proxy rewrite, en = /en)    │
│   ├── admin        /admin    (Bangla, session-auth, CSRF, role-gated)              │
│   ├── REST APIs    /api/...   (zod-validated, rate-limited, audited)               │
│   ├── storage adapter ── S3 driver (prod bucket) ─ local/S3 dev (MinIO)            │
│   ├── payment adapter ── sandbox provider (signed) ─ SSLCommerz/bKash/… (later)     │
│   └── mail adapter ── smtp (prod) ─ log/outbox (dev)                               │
│  postgres:16-alpine (healthcheck)          minio (S3, healthcheck)                 │
└────────────────────────────────────────────────────────────────────────────────────┘
```

- **Runtime:** Next.js 16 App Router, React 19, TypeScript strict. Server components for public
  pages (cacheable — the account chip in the header is a client island so pages stay static-
  friendly with `revalidate`); route handlers for all mutations (no server actions, per project
  rules).
- **Database:** PostgreSQL 16 + Prisma. Migrations committed (`prisma/migrations/*`), applied by
  `prisma migrate deploy` at container boot and by `db:migrate` scripts in dev. Indexes designed
  from the query paths (documented per model in the schema).
- **Object storage:** `src/lib/storage/` — `StorageDriver` interface (`put`, `get`, `delete`,
  `presign`?) with an S3 driver (`@aws-sdk/client-s3`) pointed at MinIO in dev and the client's
  bucket in prod, plus a local-disk driver as a zero-config dev fallback. Uploads validated by
  MIME sniffing + size caps; images processed with sharp into `thumb/400`, `md/800`, `lg/1200`
  variants stored beside the original; media served through `/api/media/[key]` (streamed, long
  cache, ETag) so a single origin serves everything behind the gateway.
- **Auth:** custom, dependency-light. scrypt password hashing (`node:crypto`), DB-backed
  sessions (hashed token in `Session`, httpOnly + SameSite=Lax + signed cookie value), CSRF via
  double-submit token bound to the session and Origin checks on every state-changing route.
  Roles: `ADMIN`, `EDITOR`, `ADMISSIONS`, `FINANCE`, `FATWA`, `APPLICANT` — enforced in the
  data layer (`requireRole` on every admin API + page) and unit-tested as a matrix.
- **i18n:** `src/app/[lang]/` (bn|en) with `generateStaticParams`; `src/proxy.ts` rewrites
  prefix-less paths to `/bn/*` internally (URL stays `/`), passes `/en/*` through, and skips
  `/api`, `/admin`, `/_next`, files. `alternates.languages` emits bn→canonical, en→`/en`,
  x-default→bn on every page. All Bangla copy is seeded from `upload/website-bn.txt` verbatim;
  English from `upload/navbar-contents.txt` + faithful translations of the Bangla body.
- **Payments:** `src/lib/payments/` — `PaymentProvider` interface; `sandbox` provider hosts a
  signed checkout page in-app (`/checkout/[code]`) that simulates success/failure and calls back
  with an HMAC signature, exercising exactly the same verification path a real gateway will.
  Provider chosen by `PAYMENT_PROVIDER` env. SSLCommerz/bKash/Nagad/aamarPay adapters are
  documented stubs for the client's developer (only the adapter changes).
- **Mail:** `src/lib/mail/` — `smtp` driver (nodemailer) and `log` driver writing a structured
  outbox to the DB (re-sendable from the admin, inspectable in dev). Sandbox uses `log`.
- **Search:** server-rendered `/search?q=` querying Postgres (`ILIKE` + trigram-lite ranking)
  across notices, posts, fatwa, courses, teachers — respecting feature flags.
- **Feature flags:** `FeatureFlag` table; cached reader; navigation, sitemap and search consult
  it, so a module the institute isn't ready for disappears everywhere at once.

## 3. Data model (Prisma → PostgreSQL)

Around 40 models in six clusters (full definitions in `prisma/schema.prisma`):

| Cluster | Models (bilingual fields as `*Bn/*En`) |
| --- | --- |
| Identity & config | `SiteSetting` (typed JSON), `MenuItem` (tree, locations), `HomeSection` (ordered, toggleable), `Stat`, `FeatureFlag`, `Team` |
| Academics | `Course`, `CourseSpecialization`, `Semester`, `Subject` (code, credits, marks, modules, nonCredit), `Person`, `AlumniBatch`, `SdpProgram`, `Facility`, `AdmissionStep`, `Scholarship` |
| Content | `Notice`, `PostCategory`, `Post` (+`PostView`), `Album` + `AlbumImage`, `Video`, `Publication`, `ResearchProject`, `Faq`, `DownloadResource`, `FatwaCategory`, `FatwaEntry`, `FatwaQuestion` |
| Media | `Media` (key, variants JSON, alt bn/en, dims, uploadedBy), referenced polymorphically |
| Admissions | `Intake`, `Application`, `ApplicationEducation`, `ApplicationDocument`, `ApplicationEvent` (timeline), `ApplicantAccount` (= User with role) |
| Donations & finance | `Fund`, `Campaign`, `Donation`, `PaymentTransaction`, `ManualLedgerEntry`, `OutboxEmail` |
| Ops | `User`, `Session`, `AuditLog`, `ContactMessage`, `NewsletterSubscriber` |

Conventions: cuid ids; `slug` unique; `status`/enum as Prisma enums where fixed; every hot query
path has an explicit `@@index`; every admin mutation writes `AuditLog(actor, action, entity,
entityId, before/after JSON)`.

## 4. Runs in the sandbox vs code-complete for the server

| Capability | Sandbox (verified) | Server (documented, Partial until client verifies) |
| --- | --- | --- |
| PostgreSQL 16 | ✅ portable 16.15 @ 127.0.0.1:5433 (`/home/z/infra/start.sh`) | compose `postgres:16-alpine` + healthcheck + `migrate deploy` on boot |
| S3 storage | ✅ MinIO @ 127.0.0.1:9100, bucket `asdri-uploads`, sharp variants | same driver against the VPS bucket / any S3 endpoint |
| Email | ✅ `log` driver → DB outbox, receipts re-sendable | `smtp` driver + real SMTP creds (HUMAN_STEPS) |
| Payments | ✅ sandbox provider w/ HMAC-verified callbacks end-to-end | provider adapter; SSLCommerz/bKash/Nagad/aamarPay stubs documented |
| CI | ✅ actions run in GitHub on every push | — |
| Docker | ❌ sandbox cannot run Docker | Dockerfile + compose are code-complete; verified instructions in HUMAN_STEPS |
| HTTPS/domain | ❌ not in sandbox | Coolify terminates TLS; `NEXT_PUBLIC_SITE_URL` env |
| Lighthouse | ✅ mid-range-Android profile via agent-browser on the sandbox URL | re-run on production origin |

## 5. Order of work (branches → PRs, no self-merge)

1. `feat/foundation` — strict TS, Postgres schema + migration, fonts self-hosted (subset woff2
   committed), storage adapter, auth/session/CSRF/rate-limit, `[lang]` routing + hreflang,
   security headers, app shell with the approved identity.
2. `feat/content-seed` — seed from the three client documents (Bangla copied verbatim), media
   import pipeline for existing placeholder images, admin users (env-seeded passwords, no
   hard-coded default).
3. `feat/public-site` — all public pages from DB, empty/low-data states, sitemap/robots/feed,
   search, preview routes for drafts.
4. `feat/admin-cms` — Bangla admin: media library, courses & curriculum editor, people, home
   sections & stats, notices, blog, gallery, videos, research, fatwa workflow, FAQs, downloads,
   settings, menus, feature flags, users & roles, audit log, dashboard.
5. `feat/admissions` — intakes, public application form w/ uploads, applicant portal, officer
   workflow, CSV export.
6. `feat/donations` — funds/campaigns, donation flow + anonymous, Zakat calculator, sandbox
   gateway, PDF receipt + email, finance ledger.
7. `feat/qa-ship` — tests (authz matrix, admission + donation flows, notice status, numerals,
   locale routing), CI, Docker/compose, HUMAN_STEPS/PROGRESS/GAPS, Lighthouse audit, agent-browser
   end-to-end pass at phone and desktop width in both languages.

Each branch ends in a PR with screenshots (phone + desktop, bn + en). Stacked branches build on
their predecessor; the sandbox working tree always reflects the newest branch.

## 6. Decisions where the brief is silent (recorded, not asked)

- **next-intl not used.** The routing need is one dynamic segment + a rewrite; a custom
  ~100-line locale layer with full tests is smaller, faster, and typed end-to-end. UI copy stays
  in typed TS dictionaries (compile-time exhaustive keys), content in Postgres.
- **NextAuth not used.** DB-backed sessions + scrypt + CSRF gives exact control the brief
  demands (role enforcement in the data layer, session audit) without an adapter layer; fully
  covered by tests.
- **Rich text: TipTap (WYSIWYG) with server-side sanitisation.** Office staff writing Bangla
  press notices need bold/heading/lists, not Markdown. HTML is sanitised (whitelist) on save.
- **PDF receipts: pdf-lib (English) + print-perfect Bangla HTML receipt.** Bangla shaping in
  pdf-lib is unreliable; the Bangla receipt is an A4 print view (browser → PDF), the emailed PDF
  is English. GAPS records the headless-Chromium option for true Bangla PDFs on the server.
- **Donor portal:** receipts and status are reachable via signed links + email; full donor
  accounts (client doc §Donor Dashboard) are scoped out and recorded in GAPS — admissions
  accounts are the mandatory flow this round.
- **Redis skipped.** Single-instance deployment; rate limiting is in-memory (per-process) and
  documented for horizontal scale in GAPS.
- **Font stack:** Tiro Bangla (bn headings) + Hind Siliguri (bn text) + Cormorant Garamond
  (en display) + Inter-like system stack for en text — wait, en text uses Hind Siliguri's Latin
  for visual kinship with the Bangla; Cormorant for headings. All woff2 subset files committed
  under `src/fonts/` via `next/font/local` (no network at build, true subsetting).
- **Teacher photos:** no generated faces for real named people — elegant monogram avatars
  (gold initials on emerald) until the office uploads real photos; every image is replaceable
  from the admin.

## 7. Honest status

`docs/PROGRESS.md` is the single source of truth: every Done row carries its proof (command
output, test run, screenshot). Anything not run is Partial. `docs/GAPS.md` collects every open
question and client-side step; `docs/HUMAN_STEPS.md` names every secret/account only the client
can create.

---

## 8. Round 4 — the people who will use this, and the face it shows them

Brief: `docs/PROMPT-round-4.md` (base `deploy/staging-r7` = round-7 tip + the office's brand
commit `4ef38ce`). Six workstreams, in the brief's own order, as a stack of branches —
each ends in a PR, none self-merged:

| # | Branch | Workstream |
|---|--------|------------|
| 1 | `fix/r4-admin-audit` | Monday-morning admin audit (lists, forms, destructive actions, empty/error states, phone width, Bangla, keyboard, screen reader) + fixes + the audit record in PROGRESS |
| 2 | `feat/r4-identity` | The brand carried the whole way through: clear-space + size rules in `src/lib/brand.ts`, the mark as watermark/ornament, OG image, print headers, email/receipt/exam-call letter, loading state, better brand files (monochrome + PNG email variant). The header designed as a whole (utility bar, 8 sections × 2 languages at every width, parent-click semantics, sticky/scrolled states, keyboard + SR). The inner-page band (`PageHero`) as the signature calligraphy surface of the site |
| 3 | `feat/r4-roles-portals` | Role & permission model for the institute: permission-based `roleCan` (role → permission set, enforced in the data layer), scoped relations (guardian↔student, teacher↔course), invitation/onboarding + password/verification story, portals per responsibility (student, guardian, teacher, finance, librarian, donor, alumni), audit, and the matrix tests (guardian cannot see another family's child; accountant cannot edit a curriculum) |
| 4 | `feat/r4-library` | The library as a real module: `LibraryItem` data model with bibliographic metadata (authors, publishers, categories, series/issues), librarian admin (catalogue, upload/replace PDFs, public/member visibility), public catalogue searchable/filterable in both languages, record page with citation, in-browser reader with page navigation + in-document search, journals organised by issue |
| 5 | `chore/r4-finish` | Open items from review: mobile perf levers, content revision history + preview, the last `dir="rtl"` on a Bangla field, `uuid` dependency, `.qa/` 48k-line Lighthouse JSON diet, `upload/` client docs; the finish-what-is-half-built walkthrough; docs close-out |

### Roles & portals — the model (decided where the brief is silent, recorded in GAPS)

- **Permissions, not role names, are the unit of access.** `UserRole` stays a single column
  (migration-free for existing rows) but `roleCan(role, permission)` consults a
  `ROLE_PERMISSIONS` map; portals are granted `permission[]`, so a new role is a data change.
  Roles added: `TEACHER`, `STUDENT`, `GUARDIAN`, `LIBRARIAN`, `DONOR`, `ALUMNI`
  (APPLICANT stays; FINANCE/FATWA/ADMISSIONS/EDITOR/ADMIN stay).
- **Scoping is a relation, not a role.** `GuardianLink (guardianId, studentUserId | applicationId,
  relation)`, `TeacherAssignment (teacherPersonId?, userId?, courseId?)` — the data-layer guard
  checks the relation before the row is read or written. `STUDENT`/`GUARDIAN`/`TEACHER`/`DONOR`/
  `ALUMNI` land in their own portal (`/portal`), staff land in `/admin` — one login door,
  routed by role.
- **Invitation, not self-signup, for office-controlled roles.** `Invitation` model (role, email,
  optional scope, single-use token, expiry); officers invite from the admin; the invitee sets a
  password at `/accept-invite`; public self-registration stays for applicants/donors.
- **Portals are Bangla-first products**: one job list per role on the portal home, nothing the
  role cannot touch, tested as an authorization matrix in the suite.

### Library — the model

`LibraryItem` (BOOK/JOURNAL_ISSUE/PAPER/DIGITAL_FILE), `LibraryCreator` (authors/editors),
`LibraryPublisher`, `LibraryCategory` (tree), `LibraryFile` (PDF media + page count), issue
metadata (volume/number/year) for journals, `LibraryCheckout` + `LibraryReading` for
borrow/read tracking, `visibility` PUBLIC/MEMBERS, flag-gated module, in-DB search
(tsvector, both languages) with filters (type/category/author/year), citation generator
reused from the journals page. The librarian admin is a full module under `/admin/library`.
