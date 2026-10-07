# PROGRESS — honest status, round 4 (the people who will use it, and the face it shows)

Single source of truth. **Done** = feature works AND was verified **this round** with a named
command, test, or browser action. **Partial** = built but not verified end-to-end or knowingly
incomplete. Round-3 sections live below under "Round 3 archive".

Proof environment (rebuilt this round, same as round 3): PostgreSQL 16.2 @ 127.0.0.1:5433
(asdri_dev seeded + asdri_test), bun 1.3.14, Next.js 16.1.3. Baseline re-verified before any
work: `bun test` → 291 pass / 0 fail; `bun run build` → success; production server boot +
route smoke (/, /en, /notices, /academics/courses 200, /admin 307, sitemap/robots 200);
site opened in both languages at 1920px and 390px with zero console errors.




## Workstream 4 — the library as a real module (PR: feat/r4-library → feat/r4-roles-portals)

**Data model** (migration `20261008120000`, hand-written in house style): `LibraryItem`
(BOOK / JOURNAL_ISSUE / PAPER / DIGITAL_FILE with full bibliographic metadata — creators
with roles, publisher, year/place, ISBN/ISSN/DOI, volume/issue/journal grouping for
periodicals, PDF + cover media, PUBLIC/MEMBERS visibility), `LibraryCategory` (two-level
tree), `LibraryCreator`, `LibraryPublisher`, `LibraryCheckout` (borrow + return),
`LibraryReading` (read counter). 11 indexes, 9 FKs.

**The librarian's module** (the office runs it without a developer): `/admin/library`
(stats strip — মোট আইটেম / বই / জার্নল সংখ্যা / পড়া হয়েছে / বর্তমানে ধার — type tabs, search,
table with designed delete confirms naming the item, a full create/edit dialog: bilingual
fields, rich text, creators repeater, identifiers, journal fields with live journalKey
preview, MediaPicker for PDF + cover, state-labelled publish switch), `/admin/library/categories`
(tree + reorder), `/admin/library/checkouts` (open/returned tabs, ধার নিন, ফেরত দিন). The
LIBRARIAN role's door: verified live that their admin sidebar shows exactly ড্যাশবোর্ড +
লাইব্রেরি + মিডিয়া লাইব্রেরি. APIs follow the requireModule/zod/audit pattern; 8 new
library.* audit codes carry Bangla labels.

**The public face**: the catalogue rebuilt (`/research/library`) — no-JS GET search +
type/category/year/language filters as removable chips, journals organised by issue
(journalKey groups → `?journal=` views), server pagination, designed empty states. Record
page per item: the citation generator extended (APA/Chicago/MLA with publisher/place/
edition/journal), identifiers table, actions card, related items, JSON-LD + OG. **The
in-browser reader** (`[slug]/read`): pdfjs-dist 4.10 (worker self-hosted from our origin)
as a client island that loads ONLY on the reader route (verified — zero pdf resources on
catalogue/record), DPR-aware canvas, page/jump/keyboard navigation, zoom, in-document text
search with a match list, branded loading/error states, print CSS, and a readings counter
API (30/min/IP). **MEMBERS visibility proven both ways live**: anonymous visitors get the
inline login notice (browser + curl), a registered account unlocks the file; the gate is
page-level, catalogue inclusion is by design and pinned by test.

**Tests**: 11 new in `library-public` (search by Bangla prefix + English, facets, gating,
readings, unpublished exclusion, journal grouping) + 9 in `library-admin` (LIBRARIAN
create/update, EDITOR 403, slug -2 suffixing, category-delete guard, checkout flow).
**337 pass / 0 fail / 2251 expects**; tsc + lint clean. Evidence: `.qa/r4-audit/lib1-*.png`
(16) + `lib2-*.png` (21) — admin + public at 1440/390 in both languages, reader interactions,
MEMBERS gate, print artifact.

Honest notes: clipboard-write could not be verified in headless Chromium (the error-toast
path was shown; the success path is the site-wide CopyButton pattern); the reader's text
search is a match-list (no canvas overlay highlight — recorded as an option); pdfjs base-14
fonts ship from our origin.

## Workstream 3 — roles, portals & invitations (PR: feat/r4-roles-portals → feat/r4-identity)

**The model** (decided where the brief was silent; recorded in GAPS): permissions, not role
names, decide access — 12 roles (+TEACHER/STUDENT/GUARDIAN/LIBRARIAN/DONOR/ALUMNI) each map
to a permission set (`src/lib/permissions.ts`); `roleCan` asks a permission;
`canAccessModule` maps admin modules to permissions once, unknown modules fail closed.
Data scoping is a RELATION, not a role: `GuardianLink` + `TeacherAssignment` are the
authorisation; portal queries go through `src/lib/portals/access.ts` and cannot express
another family's child. Staff (now incl. LIBRARIAN) land in /admin; applicants keep
/account; everyone else has /portal — one door per responsibility, Bangla-first.

**Portals (live-verified end-to-end)**: guardian portal shows exactly the linked child
(student, relation, tracking no, course, status) — verified as the demo guardian; teacher
portal shows exactly the assigned course (PYS, ৩ সেমিস্টার · ১৪ বিষয়) — verified as the demo
teacher; student portal with application tracking + empty states; donor portal
(verification-gated history + totals); alumni home (honest v1: notices/publications/library
+ recorded follow-ups). Login routes by role; the proxy reserves /portal and /accept-invite.

**Invitations (live-verified end-to-end)**: admin creates (users page — আমন্ত্রণ ব্যবস্থাপনা:
create with role hints, revoke, copy-link) → e-mail queued (branded template, log driver) →
invitee opens /accept-invite (branded page naming the role) → sets password → account created
with the invited role, e-mail counted as verified, teacher scope assignment created → lands
in their portal. Tokens: 32 random bytes, only SHA-256 in the DB, single-use, 7-day expiry,
revocable, every refusal indistinguishable, same-origin + 8/15-min rate limit (a first-pass
rate-limit bug — the result object is not a boolean — was caught by this very QA and fixed).

**Tests (the brief's named proofs, all green)**: guardian A cannot see guardian B's child
(relation-scoped reads asserted both ways); a FINANCE account cannot edit a curriculum —
through the real `PUT /api/admin/courses/[id]/curriculum` handler: **403**; teacher sees only
their assigned courses; invitation single-use, expiry-refused (indistinguishable from
unknown), role applied, teacher scope assignment created. The authz matrix test was rewritten
for the permission model (full role × permission + module mapping + fail-closed fallback).
Gates: tsc clean · lint clean · **317 pass / 0 fail / 2120 expects** (319→317: the rewritten
authz suite consolidated ~40 matrix assertions into behavioral ones and added the portals
suite; net +6 behavioral proofs). Evidence: `.qa/r4-audit/rp-*.png`.

Known-honest notes: LIBRARIAN sees only the media library in the admin until the library
module lands in the immediately-following stacked PR; alumni portal is v1 (batch directory +
contact updates recorded as follow-ups in GAPS).

## Workstream 2 — the identity carried the whole way through (PR: feat/r4-identity → fix/r4-admin-audit)

**The brand system** (`src/lib/brand.ts`, still the single source): true one-colour marks
(alpha-masked solid ink — gold / ivory / emerald) for print, watermarks and ornaments; the
light lockup on white for e-mail clients; the 1200×630 Open Graph card (emerald ground,
double gold hairline frame with corner emphasis, the official lockup — composed in sharp,
VLM-reviewed); size rules declared once (`lockupMinHeightPx: 44`, `clearSpaceRatio: 0.25`)
and followed by every surface. Generated by `scripts/generate-brand-assets.ts`, deterministic
from the masters. GAPS records the SVG-trace option (no potrace in sandbox).

**The header, designed as one piece** (`site-header.tsx` + `header/nav-disclosure.tsx`,
`header/account-chip.tsx`, `header/nav-drawer.tsx`):
- Parent-click semantics decided and shipped: **clicking a section's name navigates to its
  landing page** on desktop, touch and drawer alike; a **visible chevron button** opens the
  children (hover/focus for pointers, click for everyone, Esc closes, aria-expanded carries
  state). Verified live: hover opens, chevron opens + announces, Esc closes, parent click
  navigated to /en/academics.
- Panels open under their own trigger with an "In this section" list + "view the full
  section" footer.
- Utility bar scrolls away; only the main bar sticks and condenses on scroll (h-16→h-14 +
  shadow). Brand follows the size rules: full calligraphic lockup at 2xl+, mark + typeset
  name (LogoTextLockup) below.
- **Measured in both languages at 390 / 768 / 1024 / 1200 / 1280 / 1366 / 1440 / 1536 / 1920:
  zero horizontal overflow anywhere** (the 1280 EN overflow found mid-build was fixed by the
  condensed-xl rule + 2xl lockup gating). Account chip island (login ↔ signed-in chip, staff
  routed to /admin); skip-to-content link; drawer with full lockup, chevron expanders, 44px
  targets.

**The inner-page band** (`page-hero.tsx`): per-section calligraphic word in Amiri
(الدعوة / العلم / البداية / البحث / البلاغ / الإعلان / الإحسان / التواصل) — large, gold at
13%, cropped at the folio's edge; recedes behind text on phones. Ground rebuilt as layered
light + an inset gold hairline frame with corner emphasis (the illuminated-manuscript border,
CSS only, zero bytes). Verse typeset with paired gold diamonds. Section derived from the
breadcrumb, so all 38 inner pages carry the system with no call-site changes. VLM-reviewed
at 1920 + 390 ("reads as crafted, not wallpaper").

**Carried through**: e-mail template with the branded header (images-off fallback);
receipt + notice print mastheads carry the mono-emerald mark (shared `print-masthead`);
**the exam-call letter (নতুন)** — `/admin/admissions/applications/[id]/exam-letter` A4 pad
(branded masthead, roll, intake, photo box, instructions, signature) with a Bangla
date/time/venue dialog, `printing-exam-letter` print CSS, live-verified; branded `[lang]`
loading state; empty states carry the mark as a quiet watermark; OG card + twitter image on
every page (verified in rendered meta tags); 404/offline surfaces sanity-passed at 390+1920
in both languages.

Gates: tsc clean · lint clean · **319 tests / 1897 expects green** · production build + boot
smoke all-200 · **Lighthouse mobile (prod :3100): home 72 perf / 97 a11y — LCP 5.7 s (was
9.2 s at round-3 close), TBT 120 ms (was 600 ms), CLS 0** (`.qa/lighthouse/r4-identity/`).
Evidence: `.qa/r4-audit/id-*.png`, `id2b-*.png` (band/header/drawer/scrolled/exam-letter at
phone + desktop width in both languages).

## Workstream 1 — the Monday-morning admin audit (PR: fix/r4-admin-audit → deploy/staging-r7)

The brief ordered a full officer's pass before anything new went in. Three audit passes
covered every admin route at 1440×900 and 390×844 (a11y snapshots = the screen-reader view,
form submits valid + invalid, destructive create→delete cycles, keyboard Tab passes, console
errors, scrollWidth measurements), plus code reading with file:line root causes:

- `.qa/r4-audit/findings-cms.md` — dashboard, notices, blog, media, gallery, videos, people,
  courses + editor, page-content, research: **2 Critical · 5 High · 18 Medium · 9 Low**
- `.qa/r4-audit/findings-ops.md` — admissions (intakes/applications/detail + live status
  transition), fatwa, inbox, users, audit log, settings: **2 High · 5 Medium · 3 Low**
- `.qa/r4-audit/findings-fin.md` — funds, campaigns, donations, ledger, outbox:
  **1 High · 4 Medium · 2 Low**

**Every Critical and High finding is fixed and browser-verified** (evidence screenshots
`.qa/r4-audit/fix-1a-*.png`, `fix-1b-*.png`, 30+ files; each fix verified live at 390 and/or
1440 in a fresh browser session):

- **C1 phones had no admin navigation** → mobile drawer (`admin-mobile-nav.tsx`, Sheet +
  the same `ADMIN_NAV` tree, role/flag filtered, closes on navigate). Verified: drawer →
  notices navigates and closes at 390.
- **C2 Bangla-only titles could never create a second record** (constant fallback slugs
  collided) → generic server-side `buildUniqueSlug` on every create route + forms stop
  sending constant fallbacks + `tests/unit/slug-generation.test.ts`. Verified: two
  Bangla-only notices created back-to-back (n-muya6c80/n-muya6fkz), then cleaned up.
- **H1 videos module 3,430px sideways** → min-w-0/break-all + seed now stores real watch
  URLs + `scripts/fixtures/fix-video-urls.ts` (run; idempotent) + placeholder badge.
  Verified: scrollWidth exactly 390.
- **H2 API field errors were thrown away** → shared `useFieldErrors` + inline `role="alert"`
  Bangla errors under fields on all five forms + focus-first-invalid. Verified live.
- **H3/O-M2 raw English audit codes** → `src/lib/audit-labels.ts` (complete action + entity
  maps, +tests) used by dashboard + audit page + entity filter. Verified: dashboard reads
  "নোটিশ তৈরি / নোটিশ মুছে ফেলা".
- **H4 dashboard 520px wide at 390** → grid sections min-w-0. Verified: 390 exact.
- **H5 course editor destroyed semesters on a stray tap** → `adminConfirm` on
  semester/subject/specialization/SDP row deletes, disabled while saving.
- **O-H1 sticky theads covered the top row's links** → scroll-margin + solid backgrounds;
  the first fix attempt's `top: 3.5rem` re-broke hit-testing and was caught + reverted by
  the second verification pass (documented in R4-1b worklog) — sticky stays `top: 0`.
- **O-H2/F-H1 inverted switch semantics** (flags/menus/faqs read "বন্ধ করুন [checked]" for
  enabled modules) → state-based labels ("…— বর্তমান অবস্থা: চালু") + visible status words.
  Verified in the a11y tree on all three surfaces.
- **O-M1 mixed-script dates** ("৭/১০/২০২৬, ২:৪২:৩৫ PM") → `formatDateTimeBn` (Bangla
  periods রাত/ভোর/সকাল/দুপুর/বিকাল/সন্ধ্যা) + consistent `formatDate` in lists.

Medium/Low batch (all fixed + verified, same evidence folder): RTE link popover replaces
`window.prompt` + placeholder CSS + named editor + Heading2/3 icons + 44px toolbar targets
(M2/M3/L2); label associations on every unlinked form control (M4); author dropdown
disambiguation (M14); year without thousands grouping (M15); dialog close "বন্ধ করুন" (M17);
course cover finally shows in the editor (M5); publish caption de-jargoned (L4);
blog/publications pagination + no-match empty states + draft chips + sticky theads + dead
queries (M7/M8/M6/M1/L1/L3); campaigns start→end dates with arrow (F-M1); funds state chip +
action button (F-M2); donations `aria-current` tabs + right-aligned amounts (F-L1/F-L2);
fatwa row short a11y name (O-M3); users role hints (O-M4); inbox disabled-state hint (O-L2);
downloads fileless warning (M16); **11 seeded blog bodies converted from literal Markdown to
HTML** (seed converter + `scripts/fixtures/convert-post-markdown.ts` run; DB verified;
`tests/unit/markdown-seed.test.ts`).

Gates on the branch: `bunx tsc --noEmit` clean · `bun run lint` clean · `bun test`
**319 pass / 0 fail / 1897 expects** (291 → 319: +slug-generation, +audit-labels,
+markdown-seed suites).

Known-honest notes: O-H1's fix is a mitigation — a row half-scrolled under any sticky header
is inherently partially covered; programmatic scroll targeting and hit-testing are fixed and
verified. M16 is a warning, not publish-gating (data decision recorded in GAPS). Native
date inputs keep their English spinners (M17 remainder) — a Bangla date picker is a component
build recorded as follow-up. The dev DB's QA artifacts (test campaigns, extra users) were
cleaned during the audit.


# Round 3 archive — PROGRESS, round 3 (the round that closed the gap between sandbox and institute)

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
| #23 | `feat/r5-status-portal` → `perf/r4-font-delivery` | Public self-service portal — application status + donation receipt lookups |
| #24 | `feat/r6-notice-pages` → `feat/r5-status-portal` | This PR: notice permalinks (/notices/[slug], OG + JSON-LD + print pad), Amiri ayah micro-face (106→37 KB/page) |

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

## 4e. PR #24 — notice permalinks + Amiri ayah micro-face — DONE (this PR)

`feat/r6-notice-pages` stacked on PR #23.

Notices lived only behind a dialog (`?notice=slug` param) — no URL a crawler could
index, no WhatsApp/Facebook link preview, no print source for a pinned circular.

- **`/notices/[slug]`** — server-rendered permalink per notice: gold-edged official
  pad (same visual language as the board dialog) with the stored rich HTML rendered
  through the strict re-sanitise-on-read path (`prose-islamic`), attachment download,
  the shared `ArticleShare` toolbar, and the print flow (`printing-notice` body class
  + `.print-zone` + print-only masthead/ref footer). OG article card (title,
  description, published/modified time, section) + twitter summary + canonical +
  hreflang alternates + NewsArticle JSON-LD. Prev/next chronological neighbours,
  back-to-board, and the board keeps its quick-view dialog — card titles are now real
  links (crawlable, middle-click), the dialog links out ("সম্পূর্ণ পাতা খুলুন"),
  and shares use the permalink. Sitemap rows upgraded from `?notice=` params to
  permalinks (both languages). Unpublished/future-dated/unknown slug → the same 404.
- **Amiri ayah micro-face** — the hero bismillah pulled the full 106 KB Arabic face
  on every page; the site's own Arabic markup is a FIXED set of 46 codepoints (scan
  in `subset-fonts.py`). `amiri-ayah-400` (~37 KB) claims exactly those (declared
  after the broad faces — CSS font matching, later rule wins — pinned by test);
  any other Arabic (DB quotes, admin-pasted text) still falls through to the broad
  faces. Shaping parity re-proven with uharfbuzz: 30/30 source Arabic strings shape
  identically (glyph ids + advances + offsets). Browser-verified: home now fetches
  only the 37 KB face.
- **Label helpers server-safe**: `categoryLabel`/`statusLabel`/`statusBadgeClass`
  moved from the `"use client"` dialog module to `src/lib/notice-labels.ts` (server
  pages can call them; dialog re-exports for existing importers).
- **FAQ**: two self-service entries seeded (tracking number → `/admissions/status`,
  lost receipt → `/support/receipt-lookup`) so the lookup pages are discoverable
  from the FAQ the office already maintains.
- Also: parallel-safe test fix (`media-variants` installed its own `next/headers`
  mock — it had passed only via accidental cross-file mock leakage; bun's file
  workers exposed it), shared `PrintButton` extracted.
- Gates: 250 tests / 916 expects (new `notice-detail` suite: 7 tests pinning
  publication/flag gating, field serialisation, attachment URL, neighbour chain,
  hidden/future exclusion; font-delivery suite extended to 8 with the ayah
  contract), tsc + eslint clean, fresh-session browser QA zero errors.

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
