# GAPS — recorded decisions, open questions, client steps

Everything where the brief was silent (decision recorded, not asked), anything that needs
client input before launch, and known limitations with their planned resolutions.

## A. Decisions made where the brief was silent (confirm or overrule)

1. **`receiptNo` is issued when the donation intent is created** (PENDING), not on
   completion. The receipt dialog needs the number immediately for the "reference number"
   instruction on manual channels. Unique + nullable in schema; nothing else writes it.
2. **Sandbox payment provider is an internal signed checkout page** (`/checkout/<code>`),
   not a real gateway. Signature contracts are pinned by tests: page grant =
   HMAC-SHA256(secret, trackingCode); callback = HMAC-SHA256(secret,
   `trackingCode|status|providerTxnId`). A real gateway adapter (bKash/Nagad merchant API,
   SSLCommerz…) slots in behind the same `PaymentTransaction` events — the office chooses
   the provider and creates the credentials (see HUMAN_STEPS).
3. **Donations have no `recurring` column** — the form's "monthly" flag is stored on the
   `initiated` PaymentTransaction rawPayload only. Recurring execution needs a scheduler +
   gateway support: scoped out this round. Recorded as a follow-up, not a silent drop.
4. **Donor portal is email/receipt-based, not account-based** (PLAN §6): receipts and
   status travel by email + receipt dialog; full donor accounts with history are in the
   account page only if the donor registers with the same email (donations are linked by
   email, not by login). The client doc's "Donor Dashboard" scope is next-round.
5. **Bangla PDF receipts**: emailed receipt is English (pdf shaping for Bangla is
   unreliable in pdf-lib); the Bangla receipt is the in-app dialog + print view. A true
   server-side Bangla PDF would need headless Chromium — noted as a production option.
6. **Redis/memcached skipped** — rate limiting and sessions are in-process (single
   instance). Horizontal scaling requires moving both; documented, not built.
7. **next-intl / NextAuth not used** — a ~100-line typed locale layer and a DB-session +
   scrypt + CSRF implementation give exact control with full test coverage (PLAN §6).
8. **Sandbox object storage is the local-disk driver** (no S3_* env → `storage-local/`).
   Production keeps the S3 driver via env only — zero code change. MinIO is in
   docker-compose behind the `s3` profile.
9. **Teacher photos are monogram avatars** (gold initials on emerald) until the office
   uploads real photos — no generated faces for real, named people.
10. **Media deletion**: albums/people keep `onDelete: SetNull`/`Cascade` per schema; the
    admin media library hides rows referenced by content rather than hard-deleting.

## B. Needs client input before launch

1. **Real domain** — `NEXT_PUBLIC_SITE_URL` is `http://localhost:3000` in the sandbox.
   Set the production origin (metadataBase, sitemap URLs, hreflang alternates, account
   links in emails all derive from it).
2. **Real YouTube video IDs** — all 6 seeded videos point to the institute's channel via
   placeholder IDs; replace from the admin (Videos module) or the seed.
3. **Payment channel numbers** — bKash/Nagad/Rocket/bank details are seeded from the
   client doc; confirm they are current (Site Settings → `site.payment`).
4. **Zakat nisab + rates** in the calculator: seeded values need scholarly confirmation
   (amount per gram/gold type) before public use.
5. **Fatwa Q&A vetting flow**: the seeded 8 entries are from the client doc; the office
   should review the live workflow (question → PENDING → answer → publish) and decide
   who besides FATWA_BOARD may publish (currently ADMIN, FATWA, EDITOR can manage;
   publish is in the fatwa workflow).
6. **Course descriptions/fee tables** — fees are zero/omitted where the documents did not
   state them; the office fills real fee schedules in the admin before opening admissions.
7. **Two-step compose first boot**: `docker compose up -d postgres` (wait healthy) then
   `docker compose up -d --build app`, because `next build` prerenders DB content and the
   runner image expects a migrated DB. If the client prefers one-step, wrap it in an
   entrypoint retry loop (small change, ask and we ship it).

## C. Known limitations / deferred work

1. **CI and Docker images are unexecuted in this sandbox** (no Docker daemon, no runner):
   every command in the workflow is locally green, but the first real CI run and the first
   image build happen on the client's infrastructure. Treated as Partial in PROGRESS.
2. **Donation ledger pagination** is page-based (current page size); deep pagination past
   ~300 rows and audit CSV range-aware paging remain from the round-1 backlog.
3. **Rate-limit 429 path and admin finance mutation routes are not directly integration-
   tested** (role gating is covered by the matrix; the 429 logic is unit-level simple).
4. **Note-only application events**: "add note" re-PATCHes the current status (enum
   constraint); a dedicated POST /events endpoint would remove the SUBMITTED/DRAFT
   limitation in the officer panel (button currently disabled with a hint).
5. **Campaign→donation linking** in the public form (donating *to* a specific campaign)
   is admin-side only this round; the public form donates to funds.
6. **Search is ILIKE-based** with ranking heuristics; Postgres full-text/tsvector with
   Bangla dictionaries is a drop-in upgrade path when content volume justifies it.
7. **Email driver is `log`** (outbox rows) in the sandbox; the smtp driver on top of
   `queueOutboxEmail` needs SMTP credentials (HUMAN_STEPS) and a small send loop.
8. **i18n of admin** is Bangla-only by design (office staff); no /en admin.

## D. Sandbox environment notes (not product gaps)

- Dev server is `bun run dev` (Next 16 + Turbopack) behind the sandbox Caddy on :3000;
  4 GB RAM occasionally OOMs `next dev` during heavy lint/typecheck runs — restart is
  one command; production (standalone build) does not have this profile.
- `agent-browser` quirk: occasional first-click no-op after a refresh — retries fire;
  never reproduced for real users.
