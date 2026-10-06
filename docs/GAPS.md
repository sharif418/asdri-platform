# GAPS — recorded decisions, open questions, client steps

Everything where the brief was silent (decision recorded, not asked), anything that needs
client input before launch, and known limitations with their planned resolutions.
Round-3 corrections applied: items made stale by PRs #16–#19 are updated in place.

## A. Decisions made where the brief was silent (confirm or overrule)

1. **`receiptNo` is issued when the donation intent is created** (PENDING), not on
   completion. The receipt dialog needs the number immediately for the "reference number"
   instruction on manual channels. Unique + nullable in schema; nothing else writes it.
2. **Payment signing (updated round 3)**: the callback signature contract is
   HMAC-SHA256(secret, `trackingCode|status|providerTxnId|timestamp`) with a ±15-minute
   freshness window; the checkout page grant is HMAC(secret, `code|expiry`) with a 24-hour
   TTL. The signature never leaves the server — the browser POSTs only the tracking code
   to `/api/donations/sandbox-complete`, which is itself 404 unless the provider is
   `sandbox`, and `sandbox` cannot boot outside development. A real gateway adapter
   (bKash/Nagad merchant API, SSLCommerz…) slots in behind the same
   `PaymentTransaction` events.
3. **Donations have no `recurring` column** — the form's "monthly" flag is stored on the
   `initiated` PaymentTransaction rawPayload only. Recurring execution needs a scheduler +
   gateway support: scoped out. Recorded as a follow-up, not a silent drop.
3b. **Public self-service lookups pair a code with a second factor (round 5)**:
   `/admissions/status` (tracking number + the application's mobile) and
   `/support/receipt-lookup` (tracking/receipt code + the donation form's phone or
   email). Donation codes are sequential and application numbers live in a ~900k space,
   so the code alone is never accepted — the pair is what authorises the view, every
   failed combination returns one indistinguishable 404, and both routes rate-limit
   8 requests / 15 min / IP. A donation stored with neither phone nor email cannot be
   verified publicly (office ledger only). Confirm the office is comfortable with
   applicants seeing their own status track (no officer notes) and donors reprinting
   their own receipt.
4. **Donor history is email-linked and verification-gated (updated round 3)**: receipts
   travel by email; the account page shows donation history only when the signed-in
   user's email is verified via the round-3 token flow — registering someone else's
   email no longer exposes their trail (a Bangla banner explains the gate).
5. **Bangla PDF receipts**: emailed receipt is English (pdf shaping for Bangla is
   unreliable in pdf-lib); the Bangla receipt is the in-app dialog + print view. A true
   server-side Bangla PDF would need headless Chromium — noted as a production option.
6. **Redis/memcached skipped** — rate limiting and sessions are in-process (single
   instance). Horizontal scaling requires moving both; documented, not built.
7. **next-intl / NextAuth not used — and now not shipped either (updated round 3)**: a
   ~100-line typed locale layer and a DB-session + scrypt + CSRF implementation give exact
   control with full test coverage. Round 3 removed both packages (and 33 more unused
   ones) from package.json, so the decision is now also true of the dependency tree.
8. **Object storage (updated round 3)**: sandbox/dev runs the local-disk driver (no S3_*
   env → `storage-local/`). Production **requires** S3_* (boot refuses without it unless
   `STORAGE_LOCAL_OK=1` explicitly accepts container disk with a mounted volume) — no
   silent fallback. MinIO is in docker-compose under the `s3` profile.
9. **Teacher photos are monogram avatars** (gold initials on emerald) until the office
   uploads real photos — no generated faces for real, named people.
10. **Media deletion**: albums/people keep `onDelete: SetNull`/`Cascade` per schema; the
    admin confirm dialogs warn; nothing is hard-deleted outside those paths.
11. **Clarification topic article counts are DB-derived**: the badge on
    /research/clarifications counts published articles per `clar-*` category. Six seeded
    articles make each badge read ১ today; counts rise as the office publishes. If the
    advertised numbers must be verbatim, that is a content decision, not a code one.
12. **Outbox resend vs retry semantics**: `retry` = deliver NOW through the configured
    driver and increments `attempts`; `resend` = re-queue only. Both audited. Confirm the
    office wants both buttons under the log driver.
13. **Admin directionality (corrected round 3)**: Bangla admin UI is LTR (Bangla is
    written left-to-right); `dir="rtl"`/`lang="ar"` appears only on actual Arabic text,
    with Amiri loaded for it. Confirm the Bangla-first, no-English-admin stance.
14. **Fonts (right-sized round 3)**: the four self-hosted families ship only the
    variants the UI uses (10 woff2 files ≈ 734 KB/page, down from 18 files ≈ 1.1 MB which
    included three Amiri italics nothing used). If the office later wants italic display
    typography, the removed variants are in git history.

## B. Needs client input before launch

1. **Real domain** — `NEXT_PUBLIC_SITE_URL` is `http://localhost:3000` in the sandbox.
   Set the production origin (metadataBase, sitemap URLs, hreflang alternates, account
   links in emails all derive from it).
2. **Real YouTube video IDs** — all 6 seeded videos point to the institute's channel via
   placeholder IDs; replace from the admin (Videos module) or the seed.
3. **Payment channel numbers** — bKash/Nagad/Rocket/bank details are seeded from the
   client doc; confirm they are current (Site Settings → `site.payment`).
4. **Zakat nisab + rates** in the calculator: seeded values need scholarly confirmation
   before public use.
5. **Fatwa Q&A vetting flow**: review the live workflow (question → PENDING → answer →
   publish) and decide who besides FATWA_BOARD may publish.
6. **Course descriptions/fee tables** — fees are zero/omitted where the documents did not
   state them; the office fills real fee schedules before opening admissions.
7. ~~Two-step compose first boot~~ **(resolved on `deploy/staging`, round 3 verified)**:
   the build no longer needs a database (sitemap/robots render on request; content pages
   are dynamic), and the entrypoint migrates + seeds on boot — `docker compose up -d`
   is one step. Compose defaults `PAYMENT_PROVIDER=manual`.

## C. Known limitations / deferred work

1. **CI runner + Docker builds**: every workflow command (lint, typecheck, 205 tests,
   build, and the new production-server smoke step) is locally green; the first GitHub
   runner execution and the next image build happen on the client's infrastructure. The
   client's Coolify already builds and runs `deploy/staging` (live URL), so the image
   itself is proven on their side.
2. **Donation ledger pagination** is page-based; deep pagination past ~300 rows and
   audit CSV range-aware paging remain from the round-1 backlog.
3. **Rate-limit 429 path and most admin finance mutation routes are not directly
   integration-tested** (role gating is covered by the matrix). Round-20 exception: the
   outbox retry/resend route has a 7-test suite through the real handler. Round-3
   additions through real handlers: payments-security, email-verification,
   media-privacy, admissions-guards, admin-settings.
4. **Note-only application events**: "add note" re-PATCHes the current status (enum
   constraint); a dedicated POST /events endpoint would remove the SUBMITTED/DRAFT
   limitation (button disabled with a hint).
5. **Campaign→donation linking** in the public form is admin-side only; the public form
   donates to funds.
6. ~~Search is ILIKE-based~~ **(stale since round 18, corrected round 3)**: search is a
   ranked `tsvector` engine (`websearch_to_tsquery` + fallback tokenization, title-rank
   boost, numbered admin pager) since PR #11. Remaining known limitation: Bangla
   dictionary stemming is approximated by prefix matching, not a true Bangla stemmer.
7. **Email driver is `log`** in the sandbox; the smtp driver needs SMTP credentials
   (HUMAN_STEPS). A scheduled background worker for queued rows is still absent; staff
   retry manually or a cron curls the admin API.
8. **i18n of admin** is Bangla-only by design (office staff); no /en admin.
9. **Mobile performance (Lighthouse, production build)**: (a)+(b)+(c) of the old
   follow-up list are DONE (PR #20 responsive hero; PR #21 server-island home). The
   home is now fully server-rendered behind Suspense: framer-motion is gone from the
   client (−138 KB raw JS site-wide), the notices/support/fatwa sections ship in the
   HTML (SEO, no skeleton flash, no post-hydrate API fetches), and notice category
   tabs switch instantly client-side. HONEST TRADE: converting those sections from
   client islands to server components moved their content into the inline RSC flight
   payload (inherent — flight carries the tree for hydration): home document
   268 → 408 KB raw / 60 → 97 KB gz, while JS dropped ~40 KB gz and 3 runtime
   fetches disappeared; Lighthouse perf stayed in its noise band (home 53–62 across
   three runs vs 57 before; reports in `.qa/lighthouse/r4-final/`). PR #22 then
   rebuilt font delivery outright (per-script unicode-range faces + lang-critical
   preloads; see PROGRESS §4c): per-page font bytes 760 → 350 KB (bn) / 269 KB (en),
   shaping parity proven via uharfbuzz, and course-list/detail scored +8/+16 above
   their old bands — but home stays 53–63 on this shared CPU (LCP is hero-image +
   CPU bound here; the byte cut should show on real hardware). Remaining levers in
   value order: PPR/ISR for the home shell once Next 16 stabilizes it, and Bangla
   text compression is already good (UTF-8 3 bytes/char compresses ~5:1). Accessibility
   95+ on all four audited pages; Best-Practices and SEO 100.
10. **Lighthouse variance**: this sandbox's shared CPU makes single-run performance
    scores swing ±5–13 points (course-detail measured 56–69 across four runs). The
    committed reports are the final clean run; treat single-digit deltas as noise.

## D. Sandbox environment notes (not product gaps)

- Dev server is `bun run dev` (Next 16 + Turbopack) on :3000 behind the sandbox Caddy;
  production smoke runs `bunx next start -p 3100` (STORAGE_LOCAL_OK=1, manual provider,
  64-hex secrets — the same rules CI now enforces).
- PostgreSQL 16.2 runs user-space (pgserver pip package) on 127.0.0.1:5433; DBs
  `asdri_dev` (seeded) + `asdri_test` (tests, recreated per run by `tests/preload.ts`).
- `agent-browser` quirk: occasional first-click no-op after a refresh — retries fire;
  never reproduced for real users.
