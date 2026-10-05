# Review of round 2 — what holds, what breaks, what the next round must do

Reviewed on 2026-10-05 against the tip of the stack (`feat/qa-round20-fixes`, commit `ecc78d4`). This was not a reading of the pull-request descriptions. The branch was checked out, PostgreSQL 16 and an S3-compatible store were started, the migrations and the seed were run, the test suite was executed, the site and the admin were exercised at phone and desktop width in both languages, the public APIs were probed as an attacker would, an admin edit was pushed through the API and traced to the public pages, a production build was made and served, and Lighthouse was run against it. A second, independent reviewer read the authorisation, CSRF, payment, upload and data-layer code file by file.

## What you did well, and it is a lot

In roughly twenty hours of autonomous work the prototype became a platform. Judged against the brief:

- **The foundation is real.** PostgreSQL 16, forty-six models, five committed migrations applied by `prisma migrate deploy` in the container entrypoint. The portable PostgreSQL and MinIO in the sandbox worked exactly as asked. `ignoreBuildErrors` is gone, strict mode is on, there is not a single `any`, `@ts-ignore` or `eslint-disable` in `src/`.
- **The office can run it.** Seven courses with ninety-one subjects, thirty-five people, notices, blog, gallery, videos, research, fatwa, funds, campaigns, menus, home sections, settings and eleven feature flags all live in the database and are editable in a Bangla admin with roles and an audit log. An admin edit through the API appeared in the public API and the notice board on the next request and left an audit row. The course and curriculum editor is a real content tool, not a form.
- **Two URLs per page, correctly.** Bangla at the bare path, English under `/en`, canonical and `hreflang` (bn, en, x-default) on every page, 116 URLs in the sitemap, the switcher staying on the same page.
- **Security that mostly holds under probing.** Unauthenticated admin APIs return 401, admin pages redirect, a PATCH without the CSRF header is refused, a public form with a foreign `Origin` is refused, the newsletter endpoint rate-limits after three posts, path traversal in the media route is rejected, OWASP headers are present, a forged payment callback is rejected.
- **A test suite that runs.** 151 tests across 12 files pass against an isolated `asdri_test` database that the preload provisions itself. CI runs lint, typecheck, tests, seed and build against a Postgres service. There is a multi-stage Dockerfile and a compose file.
- **Docs that are mostly honest.** `PROGRESS.md` marks CI and Docker as Partial where they were. `GAPS.md` and `HUMAN_STEPS.md` exist and are useful.

## What breaks, in order of severity

### Critical

**1. The production build cannot serve a single Bangla page.** `bun run build` succeeds and the standalone server starts, but `GET /`, `/about`, `/notices`, `/bn`, `/bn/about` all return **431 Request Header Fields Too Large**, because `src/proxy.ts` rewrites `/` to `/bn`, the rewritten request re-enters the proxy in production, and is rewritten again: the log shows `/bn/bn/bn/bn/...` until the header overflows. Only `/en/*`, the APIs and the sitemap work. The default language, the one the client reads, is dead on the server the client will deploy to. The proxy handles `/en` at line 77 and never recognises an already-prefixed `/bn`. Dev mode hides this, and CI only builds, it never starts what it built. The Dockerfile's `HEALTHCHECK` on `/` would have failed on the first deploy. Fix the proxy, and add to CI a step that starts the production build and curls `/`, `/en`, `/notices` and `/admin` expecting 200/200/200/307.

**2. Anyone can mark a donation as paid.** The sandbox checkout page (`src/app/[lang]/(site)/checkout/[code]/page.tsx:131-134`) computes the valid COMPLETED callback signature on the server and hands it to the browser, and it is not gated on `PAYMENT_PROVIDER === "sandbox"`; `PAYMENT_PROVIDER` defaults to `sandbox` in `src/lib/env.ts:74` and in `docker-compose.yml:45`. In the shipped configuration a visitor creates an intent, opens the checkout URL, posts the signature, and the donation counts in public campaign totals and emails a receipt with no money moved. The sandbox provider must refuse to exist in production (boot failure if `NODE_ENV=production` and provider is `sandbox`), the signature must never leave the server, and the callback should carry a timestamp or nonce.

### High

**3. Donation history leaks through registration.** `account/page.tsx:89` lists donations by `donorEmail` equality and `api/auth/register` performs no email verification, so registering with a donor's email address shows that donor's amounts, funds and receipt numbers. Either verify email on registration or link donations to accounts explicitly.

**4. The applicant's own routes skip the protections everything else has.** `api/admissions/applications` POST and `api/admissions/documents` POST check only `getSession()`: no CSRF header, no origin check, no rate limit, and `documents` accepts any logged-in role. `applications/route.ts:135` stores `photoMediaId` without checking the media belongs to the applicant. These are the routes that carry national ID scans.

**5. "Refuses to start without secrets" is not true yet.** `src/lib/env.ts` validates lazily through getters, so the server boots and fails on the first request that touches a secret; there is no `instrumentation.ts`. In production with no S3 credentials, storage silently falls back to local disk (`env.ts:53`, `storage/index.ts:147`), which on a container means uploads vanish on redeploy. The deploy compose defaults `POSTGRES_PASSWORD` to `asdri` and publishes 5432 to the host.

### Medium

**6. Feature flags are half-wired.** With `gallery` off, the sitemap and search drop it (good) but the public header still links to `/media/gallery` (`site-header.tsx:46-52` is a static list), `/search` has no flag check, and the public GET APIs and `feed.xml` keep serving the module. The brief said navigation, sitemap and search.

**7. Applicant identity documents are public by URL.** `api/media/[...key]` serves any key unauthenticated with `immutable` caching. Keys are random, but an NID scan should require the applicant's or an officer's session.

**8. Counters render as zero on the server.** The home statistics are server-rendered as `০` and count up on the client, so a crawler, a reader with JavaScript blocked or a slow phone sees six zeros. Render the final value and animate only on the client when motion is allowed.

**9. Phone numbers in Bengali digits.** The utility bar shows `+৮৮০ ১৮০৫-৪৩৭৯১০`; the brief and the client's own conventions keep phone numbers and codes in Latin digits.

**10. Admin upload buffers the whole body before checking size** (`admin/media/route.ts:89`). `isSameOrigin` returns true when `Origin` is absent, so public-form protection is SameSite-only. Newsletter has no double opt-in.

### Low, but part of "done"

- Four files over 500 lines: `course-editor.tsx` 832, `ui/sidebar.tsx` 726, `scripts/seed-data/content.ts` 542, `donation-form.tsx` 522. Six `as never` casts stand in for proper types.
- Fourteen unused dependencies still installed: `@dnd-kit/*`, `@hookform/resolvers`, `@mdxeditor/editor`, `@reactuses/core`, `@tanstack/react-query`, `@tanstack/react-table`, `date-fns`, `next-auth`, `next-intl`, `react-syntax-highlighter`, `uuid`, `zustand`. `package.json` is still named `nextjs_tailwind_shadcn_ts`. `db:push` script retained.
- Repository litter: `worklog.md` (keep if it is your memory, but move it under `docs/agent/`), `download/` with 11 MB of QA PNGs, `upload/` with mojibake file names, `scripts/qa-helpers.md`.
- Receipt numbers from `count()+1` are not monotonic after deletions. CSP still allows `'unsafe-inline'` scripts. `GAPS.md` C.6 says search is ILIKE; it is tsvector now.
- Lighthouse was only meaningful once the production build served pages, and the production build serves no Bangla page, so the ≥ 90 claim is **unverified**. Measure it on the production build after fix 1, on `/`, `/academics/courses`, `/notices` and one course page, mobile profile, and put the four numbers per page in `PROGRESS.md`.

## Process

Two rules from the brief were broken: pull request #1 was merged by you with the owner's token, and twenty-one commits went straight to `main`. The stacked branches still exist and are fine, but from now on `main` receives only merges performed by the reviewer. Keep pushing branches and opening pull requests; stop merging them.

## What the next round is

Fix 1 and 2 before anything else, with a test for each: a test that starts the production server and requests `/`, and a test that proves the sandbox provider cannot be selected in production and that a callback with a client-known signature cannot complete a donation. Then 3, 4 and 5, each with the test that would have caught it. Then 6 to 10. Then the Low list. Measure Lighthouse on the production build and record it. Update `PROGRESS.md` so every row that says Done points at the proof, and mark anything you did not run as Partial.

Everything above was observed, not inferred. The branch is close to being the platform the brief described; the distance left is the difference between "works on my machine in dev mode" and "works on the client's server on the first deploy".
