# PROGRESS — honest status, round 3 (the round that closed the gap between sandbox and institute)

Single source of truth. **Done** = feature works AND was verified **this round** with a named
command, test, or browser action. **Partial** = built but not verified end-to-end or knowingly
incomplete. **Not started** = nothing to show.

Round 3's brief was a list of *kinds* of failure — never ran production; convenience that
becomes a hole; claiming instead of building; a language decision copied without checking.
Each section below states which failures it closed, with evidence.

## Proof environment (re-established this round)

The round started from a rebuilt sandbox: PostgreSQL 16.2 @ 127.0.0.1:5433 (user-space
pgserver package; DBs `asdri_dev` seeded + `asdri_test` for tests), bun 1.3.14,
Next.js 16.1.3, branch `fix/r3-i18n-adminux` + this PR. Every claim below was re-run there
after the rebuild — nothing is inherited from a previous session's word.

Gates on the final branch state (with this PR applied):

- `bun test` → **205 pass / 0 fail / 682 expect() / 17 files** (asdri_test DB, provisioned
  and migrated by `tests/preload.ts` before any test imports `@/lib/db`).
- `bunx tsc --noEmit` → clean. `bun run lint` (eslint 9 + next config) → clean.
- `bunx next build` → completes (NODE_ENV=production).
- Production server boot + route smoke (the exact command sequence of the new CI step,
  run locally): `bunx next start -p 3100` with production env rules
  (PAYMENT_PROVIDER=manual, 64-hex secrets, STORAGE_LOCAL_OK=1) →
  `/` `/en` `/notices` `/academics/courses` → 200, `/admin` (login redirect followed) → 200,
  `/sitemap.xml` `/robots.txt` → 200.

## PR stack (all open — never self-merged; main moves only by client review)

| PR | Branch → base | Scope |
|----|---------------|-------|
| #16 | `fix/r3-money-identity` → `deploy/staging` | Money & identity: sandbox payment hole, email verification, admissions CSRF, private identity docs |
| #17 | `feat/r3-site-admin` → `fix/r3-money-identity` | Page content + Site settings admin modules; DB-driven menus; flag-gated public APIs |
| #18 | `fix/r3-i18n-adminux` → `feat/r3-site-admin` | Bangla is LTR; digits per script; admin as a product (dialogs, tables, SSR figures) |
| #19 | `chore/r3-finish` → `fix/r3-i18n-adminux` | This PR: CI production smoke, hygiene, fonts/mobile perf, Lighthouse, this rewrite |
| #20 | `perf/r3-responsive-media` → `chore/r3-finish` | Responsive hero via sized webp variants (`/api/media?width=`), in-dialog video embed |
| #21 | `perf/r4-home-payload-diet` → `perf/r3-responsive-media` | Home as server islands — framer-motion removed, sections SSR + streamed, instant tabs |
| #22 | `perf/r4-font-delivery` → `perf/r4-home-payload-diet` | Font delivery rebuilt — per-script unicode-range faces, lang-critical preloads, print fixes |
| #23 | `feat/r5-status-portal` → `perf/r4-font-delivery` | This PR: public self-service portal — application status + donation receipt lookups |

The round-1/2 stack (PRs #1–#15 off `main`) is unchanged and still open. The client's
staging deployment runs `deploy/staging` (commit 406edcf) at
https://asdri-platform.ailearnersbd.com — that base branch's fixes (431 rewrite loop,
database-free build, self-hosted fonts, Coolify compose, seed-on-boot) were executed **on
the client's infrastructure**, which is what surfaced them in the first place.

## 1. PR #16 — money & identity hardening — DONE

- **Sandbox payment hole closed**: the completion signature is computed and consumed
  server-side only (`POST /api/donations/sandbox-complete`); the browser sends only the
  tracking code. The callback contract is `code|status|txn|ts` (±15 min freshness) and the
  page grant is `code|exp` (24 h TTL). `PAYMENT_PROVIDER=sandbox` refuses to boot outside
  development (`src/lib/env.ts` + `src/instrumentation.ts` eager validation); the compose
  default is `manual`. Evidence: `tests/integration/payments-security.test.ts` +
  `tests/unit/payments-contract.test.ts` inside the 205-test suite (contract vectors
  recomputed); local boot with `PAYMENT_PROVIDER=sandbox` NODE_ENV=production is refused
  (env problems logged, exit non-zero).
- **Email verification on registration**: `EmailVerification` model + token email queued at
  registration; `/verify-email` page; donation history on `/account` renders only when the
  signed-in user's email is verified (Bangla banner otherwise). Evidence:
  `tests/integration/email-verification.test.ts`; `/verify-email` renders 200 locally.
- **Admissions routes guarded**: same-origin + CSRF + per-user rate limit on
  `POST /api/admissions/documents` and `/applications`; `photoMediaId` ownership checked.
  Evidence: `tests/integration/admissions-guards.test.ts`.
- **Identity documents private**: `Media.visibility` (PUBLIC/PRIVATE); `/api/media/[...key]`
  answers PRIVATE keys only to the uploader or staff (401 anonymous, 403 stranger,
  no-store). Evidence: `tests/integration/media-privacy.test.ts`.

## 2. PR #17 — the two modules that were hidden instead of built — DONE

- `/admin/content`: overview, home sections + order + stats + hero image, FAQs, admission
  copy editor. `/admin/settings`: institute identity/contact/social, payment channels,
  zakat copy, navigation menus (2-level tree, reorder), feature flags.
- Public site wired to the DB: header mega-menu + mobile drawer + footer columns read
  flag-filtered `MenuItem`s (static fallback if none); hero image and apply-page
  declaration read from settings; donate CTA and the notices/fatwa/campaigns/newsletter
  public APIs are flag-gated (404 when a module is off, and off the nav).
- Every mutation audited + CSRF-guarded; settings cache invalidated on write.
  Evidence: `tests/integration/admin-settings.test.ts` in the 205-test suite; round-3
  browser session verified all eight admin pages + the flag toggle end-to-end (nav and
  sitemap drop a module when its flag is off, restore when on) — screenshots
  `.qa/r3-*.png` (committed).

## 3. PR #18 — language decisions made per-script, admin as a product — DONE

- Bangla is LTR: `dir="rtl"` removed from 61 Bangla-field sites + 8 conditional arms +
  the rich-text editor; `dir`/`lang` kept **only** on Arabic (8 public + 2 admin inputs),
  Amiri loaded in the admin layout for them.
- Digits per script: 15 English-mode Bengali-digit leaks fixed; utility-bar phone from the
  DB in Latin digits; admin numeric fields accept Bengali-typed digits
  (`normalizeDigitsInput`).
- Admin product pass: all 20 `window.confirm` calls replaced by the designed
  `ConfirmDialog` (imperative bridge in the admin layout); 16 tables scroll horizontally
  instead of clipping (`overflow-x-auto`, sticky thead preserved); `StatCounter` SSRs the
  real figure (was zeros + client count-up); section roots redirect; notice-dialog class
  conflict fixed.
  Evidence: browser session at 1920px + 390px (no clipped columns, designed delete
  dialogs, SSR HTML contains ৪২০/১২৮); part of the 205-test suite.

## 4. PR #19 — finishing, hygiene, and the anti-431 CI step — DONE (this PR)

- **CI production smoke (the 431 class)**: `.github/workflows/ci.yml` now boots the real
  production server after the build (`bunx next start -p 3100`, PAYMENT_PROVIDER=manual —
  production refuses sandbox) and requests `/`, `/en`, `/notices`, `/academics/courses`,
  `/admin` (redirect followed), `/sitemap.xml`, `/robots.txt`, failing the pipeline on any
  non-200. The whole step's script was executed locally against the production build:
  all routes 200 (see Proof environment). The step also fixed a latent bug: the workflow's
  `PAYMENT_CALLBACK_SECRET` was 59 hex chars — too short for the boot-time validation PR
  #16 added, so the smoke server would have refused to start in CI.
- **Dependencies**: 35 packages removed (the 13 named in the brief — dnd-kit ×3,
  hookform/resolvers, mdxeditor, reactuses/core, tanstack query+table, date-fns,
  next-auth, next-intl, react-syntax-highlighter, zustand — plus tailwindcss-animate and
  the radix/driver packages of the deleted UI files, e.g. react-hook-form after
  `ui/form.tsx` went). `bun install` reports "Removed: 35"; typecheck/tests/build green
  after. `db:push` script deleted from package.json.
- **Dead UI files**: 25 unused shadcn components deleted (sidebar.tsx 726 lines, card,
  carousel, chart, drawer, form, …) — each verified zero-import before deletion.
- **File size splits** (behaviour-identical; typecheck + 205 tests + seed re-run after):
  - `course-editor.tsx` 823 → 5 files: `index.tsx` 123 (state + saves),
    `meta-section.tsx` 230, `curriculum-section.tsx` 293, `list-sections.tsx` 167,
    `types.ts` 80.
  - `donation-form.tsx` 522 → 3 files: `index.tsx` 252 (state + submit),
    `form-fields.tsx` 287, `summary-panel.tsx` 157.
  - `scripts/seed-data/content.ts` 542 → `content.ts` 258 (logic) +
    `content-data.ts` 289 (payloads); seed re-run prints the identical count table.
- **Repo hygiene**: 15 QA screenshots moved `download/` (12 MB) →
  `docs/agent/screenshots/`; `worklog.md` → `docs/agent/worklog.md`; the two
  mojibake-named client documents in `upload/` renamed to readable ASCII names
  (`website-doc-bn.pdf`, `website-doc-bn (1).docx`); stale `download` line dropped from
  `.dockerignore`; `qa-helpers.md` path updated.
- **Fonts — self-hosted, and now actually right-sized** (a copied-decision instance):
  the four families shipped **every** variant (18 files, ~1.1 MB preloaded on **every**
  page — including 3 Amiri italic faces nothing on the site uses). Weight/style usage was
  audited per component (`font-heading`/`font-arabic` + weight classes); Amiri italics ×3,
  Cormorant 500 + italics ×5, Hind 300 removed → 10 files ≈ 734 KB per page.
- **Mobile LCP (works-in-sandbox class)**: the hero headline animated in via
  framer-motion `opacity: 0` — it appeared only **after** JS hydration, so on a throttled
  phone the hero sat empty for ~9 s while FCP was 1.4 s. Entrances converted to CSS
  keyframes (`.hero-rise`/`.hero-fade`, identical timing, `prefers-reduced-motion` guard —
  which framer-motion did not respect), and the hero backdrop image is now preloaded
  (`<link rel="preload" as="image" fetchPriority="high">`) since CSS backgrounds are
  discovered late.
- **A11y found by the audit, fixed**: campaign `<Progress>` bars had no accessible name
  (now `"<title> — <percent>%"`); the fatwa category `Select` had an unassociated label
  (`htmlFor`/`id` added); the hero video button's aria-label didn't contain its visible
  text (label removed — content is the name). Home accessibility 89 → **97**.
- **Lighthouse (production build, mobile profile)** — see §5.

## 4b. PR #21 — home as server islands: payload diet, zero-framer, instant tabs — DONE (this PR)

The §C.9(b)+(c) follow-ups (GAPS) plus the "add features / styling details" mandate, on
`perf/r4-home-payload-diet` stacked on PR #20.

- **framer-motion removed from the client entirely** (dep deleted): `Reveal`/`Stagger`/
  `RevealItem` were client components wrapping content at 53 call sites — the wrapped
  server content serialized into the RSC flight payload, and stayed `opacity:0` forever
  for no-JS readers (inline framer initial styles). They are now **pure CSS
  scroll-driven reveals** (`animation-timeline: view()`, `@supports`-gated so Firefox /
  reduced-motion / no-JS simply see content) — same component API, all 53 call sites
  unchanged. `StatCounter`'s in-view trigger is a plain `IntersectionObserver` now.
  Client JS: 1049 → 911 KB raw (−138 KB), 16 script chunks (was 18).
- **Home sections are server components that stream**: notices / support / fatwa were
  client islands fetching `/api/notices`, `/api/campaigns`, `/api/fatwa` after hydration
  (skeleton flash, empty HTML for crawlers, extra round-trips). They now read the DB
  through shared libs (`src/lib/content/{notices,campaigns,fatwa}.ts`, also used by the
  refactored API routes) and ship as HTML behind `<Suspense>` — the hero + stats flush
  first, sections stream in (works mid-scroll; no skeletons anywhere).
- **Instant notice tabs (feature)**: one server-rendered list (12 cards, each with
  `data-category` + ranks — no per-category panel duplication); a tiny tabs island
  flips `hidden`. Tab switches cost zero network. Tabs show per-category **count
  badges** (Bengali digits in bn). Without JS the curated "all" view renders.
- **Fatwa gateway split**: the quick-ask form is the only stateful island; the bank is
  server-rendered with a search island that filters via `data-search` attributes (no
  serialized data). Shared constants live in `src/content/home-islands.ts` — plain
  values must not cross a client boundary in either direction (found the hard way:
  `feedTabs.map is not a function` in dev).
- **Honest trade**: server components' content is inherently serialized into the inline
  flight payload, so the home document grew 268 → 408 KB raw / 60 → 97 KB gz while JS
  dropped ~40 KB gz and 3 runtime fetches disappeared. Perf score stayed inside its
  noise band (home 53–62 over three runs vs 57 at PR #20). The wins are correctness
  wins: SEO-visible content, no skeleton flash, no-fetch tab switching, no-JS-visible
  content everywhere, and the progressive-enhancement bug (framer `opacity:0` without
  JS) is gone. `content-visibility: auto` was tried and REJECTED — it left below-fold
  sections unrendered in print and full-page captures.
- **Campaign progress bars**: Radix client `Progress` → plain server `<div
  role="progressbar">` with identical visuals (support section now costs zero JS).
- **Tests**: 214 → **220 pass / 725 expects** (new `tests/integration/home-content.test.ts`
  pinning the three shared libs: flag-gating, pinned-first curation, COMPLETED-only
  campaign totals, plain-text fatwa answers). tsc clean, eslint clean, production build
  + boot + route smoke all-200 (`/`, `/en`, `/notices`, `/admin` 307).
- **Browser QA** (agent-browser, prod server :3100 + dev :3000): tab clicks switch
  panels instantly (all/admission/academic/recruitment counts verified), fatwa search
  filters 4→1→0→4 with empty state, hero video dialog opens, no console/page errors on
  `/`, `/en`, `/notices`, `/about`, `/academics/courses`, `/support`, `/research`,
  `/admissions`, `/contact`; 390px no horizontal overflow; section-by-section viewport
  screenshots VLM-verified (`.qa/r4-*-viewport.png`, `.qa/r4-mobile-final.png`).

## 4c. PR #22 — font delivery rebuilt: per-script faces, lang-critical preloads — DONE (this PR)

`perf/r4-font-delivery` stacked on PR #21.

- **Root cause found & fixed**: `next/font/local` eager-preloads EVERY src file via RSC
  `:HL` hints — every page downloaded all **760 KB** of fonts (both Amiri weights + all
  Cormorant weights even where zero elements used them; FontFaceSet confirmed `unloaded`).
  Replaced with manual `@font-face` + `unicode-range` per-script faces
  (`scripts/subset-fonts.py` → `public/fonts/` ×15 content-hashed faces, deterministic;
  Hind/Tiro hinting stripped — Halves their bytes; Amiri Latin dropped).
- **Shaping parity proven offline**: uharfbuzz shapes heavy conjunct Bengali + diacritic
  Arabic samples to IDENTICAL glyph sequences on original vs subset (all 5 pairs).
- **Lang-critical preloads** (`src/lib/fonts.ts` + `ReactDOM.preload` in the layout):
  bn → hind-bn 400/500/600 + tiro-bn 400 + hind-lat 400; en → hind-lat 400/500/600 +
  cormorant-lat 600. Immutable `Cache-Control` on `/fonts/*` (next.config headers).
- **Measured (production build, resource-timing)**: BN home 760 → **350 KB** (−54%),
  EN home 760 → **269 KB** (−65%); Cormorant + Amiri-700 now zero bytes where unused.
- **Support page campaigns band** converted client-fetch → server component (page's
  existing `Promise.all`, zero extra latency; shared server `ProgressBar` component;
  `/api/campaigns` fetch + skeleton gone from the network trace).
- **Two latent print bugs fixed** (new print-additions block in globals.css): scroll-
  driven reveals printed below-fold sections at opacity 0 (fill-mode `both`, no scroll in
  print) and `.text-gold-gradient` printed invisible (background-clip:text + printers skip
  backgrounds). Verified via PDF text extraction + VLM on rendered pages (stats/courses
  now print; gradient headings get ink).
- Gates: 226 tests / 809 expects (new `font-delivery` suite pins the contract), tsc +
  eslint clean, prod build + boot + 7-route smoke all-200, fresh-session browser QA zero
  console errors, Lighthouse re-recorded (`.qa/lighthouse/r4g-fonts/`): home 53–63
  (noise band), **course-list 80** (was 69–72), **course-detail 74** (was 58–64),
  notices 71 (was 69–70).

## 4d. PR #23 — public self-service portal: application status + receipt lookup — DONE (this PR)

`feat/r5-status-portal` stacked on PR #22.

Applicants (notably office-created ones with no online account) and donors previously
had NO way to check progress without contacting the office. Two public lookups close that:

- **`/admissions/status`** — tracking number (`ASDRI-2026-XXXXXX`) + the mobile number on
  the application returns the status track (same `StatusTrack` component the account
  page uses — extracted to `status-track.tsx`, account card refactored onto it, so the
  two can never drift), stage-change history (status + date only — officer notes stay
  server-side, pinned by test), and per-status next-step guidance (`STATUS_GUIDANCE`).
- **`/support/receipt-lookup`** — tracking code (`DN-…`) or receipt number (`ASDRI-R-…`)
  + the phone OR email from the donation form. PENDING → the manual channels and
  reference instruction are repeated (a donor who lost the dialog/email can still pay);
  COMPLETED → receipt number, paid date, and a print button (`printing-receipt` body
  class + `.print-zone`, gold-bordered pad, verified via DOM + class state).
- **Security shape** (the reason codes alone never suffice — they are sequential):
  second factor enforced in `src/lib/self-service.ts` (`phonesMatch` folds +880/0/8800
  prefixes, Bengali digits accepted; `emailsMatch` case-insensitive); anti-enumeration —
  unknown number / wrong factor / unsubmitted draft / unverifiable record all return the
  identical 404; same-origin + 8-per-15-min rate limit per IP on both routes; a
  mid-review bug (mismatch message returned in the wrong language) was caught by
  browser QA and pinned by a new test.
- **Discovery wiring**: admissions CTA row, login page ("track it without logging in"),
  support page strip, receipt dialog now shows the DN- tracking code with copy + a
  "check the status anytime" link; sitemap includes both routes (flag-gated with their
  modules).
- Styling polish: footer link/contact contrast bumped (/75→/80, /60→/70), print CSS
  extended, `CopyButton` extracted to a shared component.
- Gates: 241 tests / 867 expects (new `self-service` suite: 15 tests through the real
  handlers — happy paths, prefix/digit tolerance, indistinguishable 404s, drafts,
  no-second-factor, rate limit 429, cross-origin 403), tsc + eslint clean, prod build +
  11-route smoke all-200 (incl. both new pages + lookup APIs verified on the prod
  server), fresh-session browser QA zero console errors, 390px no overflow (VLM-checked
  both langs), Lighthouse mobile: status **74**/100/100/100, receipt **76**/100/100/100
  (`.qa/lighthouse/r9/`) — above the site band for lightweight utility pages.

## 5. Lighthouse — production build, mobile profile, four pages

Numbers below are PR #19's close-out run; PR #20 re-measured (home 57/97/100/100) and
PR #21 re-measured again after the server-island refactor (`.qa/lighthouse/r4-final/`:
home 53–62 across three runs, course-list 69, course-detail 58, notices 69 — all within
the ±5–13 sandbox variance band; see §4b). Run-to-run performance variance in this sandbox
is ±5–13 points (course-detail scored 56, 62, 65 and 69 across four runs); treat
single-digit deltas as noise:

| Page | Performance | Accessibility | Best-Practices | SEO |
|------|------------|----------------|----------------|-----|
| `/` (home) | **56** (LCP 9.2 s, TBT 600 ms, 1.4 MB) | **97** (was 89 pre-fix) | **100** | **100** |
| `/academics/courses` | **70** (LCP 7.2 s, TBT 280 ms, 1.1 MB) | **98** | **100** | **100** |
| `/academics/courses/preparatory-year-for-specialization` | **69** (LCP 7.2 s, TBT 330 ms, 1.1 MB) | **95** | **100** | **100** |
| `/notices` | **69** (LCP 7.6 s, TBT 320 ms, 1.2 MB) | **96** | **100** | **100** |

Reading it honestly: best-practices and SEO are clean; accessibility is 95+; performance
on simulated slow-4G is dominated by LCP 7–9 s, which is font + page-weight arrival
(734 KB fonts, 225 KB hero JPEG through `/api/media`, ~268 KB HTML document, client JS).
The named follow-ups are in GAPS §C — sized/responsive hero variants, an HTML/RSC payload
diet, and JS code-splitting are real work, not this PR's.

## 6. Claims that stay PARTIAL (and why)

1. **The GitHub Actions pipeline's first run** happens on the client's runner when the
   branches are pushed/merged. Every command in the workflow is locally green (including
   the new smoke step, executed verbatim), but the runner execution itself is the client's.
2. **Docker image build** — no Docker daemon in this sandbox. The image **does** build and
   run on the client's Coolify (that is how `deploy/staging` serves the live URL), which
   is client-infrastructure proof, not sandbox proof.
3. **The live staging URL** (https://asdri-platform.ailearnersbd.com) is client-attested;
   this sandbox cannot reach it. Its state tracks `deploy/staging`, not this PR stack.
4. **Mobile performance 53–72** — the three named §C.9 follow-ups are DONE (PR #20
   responsive hero; PR #21 server-island home), but the perf SCORE remains in its
   sandbox noise band because LCP is font-arrival-bound (734 KB Bengali faces). The
   next real lever is font subsetting (see GAPS §C.9); score movement on this shared-CPU
   sandbox should not be claimed either way.

## Known test/demo data in the sandbox DB

Seeded content only (7 courses, 8 notices, 2 campaigns, …) plus whatever the 205-test
suite provisions into `asdri_test`; `asdri_dev` carries the seed plus this round's browser
QA artifacts. A pristine DB is `prisma migrate reset` + `bun scripts/seed.ts`.
