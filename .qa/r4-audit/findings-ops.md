# Round 4 Audit — Workstream 1: Operations Admin (admissions, fatwa, inbox, users, audit log, settings)

**Auditors:** a general-purpose agent (session `audit-ops`, intakes + applications routes, screenshots
`ops-intakes-*.png` / `ops-applications-*.png`, interrupted by the sandbox OOM kills and the
sub-agent turn limit) + the coordinator (main agent) completing the remaining routes live
(fatwa questions/entries, inbox messages/subscribers, users, audit, settings identity/menus/flags,
finance — the finance findings are in `findings-fin.md`). Method: logged in as
admin@assunnahinstitute.org, a11y snapshots (`snapshot -i`), phone-width sweep at 390×844 with
`document.documentElement.scrollWidth` measured per route, live interaction tests (status
transition + note on a real application), `errors`/`console` on every route.

**Totals (this file): 0 Critical · 2 High · 5 Medium · 3 Low.**

---

## HIGH

### O-H1. [live] Sticky table headers cover the top row's links after scroll — clicks land on the `<th>`
- **Evidence:** on /admin/admissions/applications after scrolling, both the applicant link and
  the "বিস্তারিত" action link of the top visible row are rejected by the browser's hit test:
  `Element is covered by <th.px-4.py-3 inside main#admin-main>`; measured: link top 339.7px vs
  sticky `th` top 342.3px — the row pokes under the sticky header and its interactive elements
  are unclickable until the user scrolls further. The earlier auditor screenshotted the same
  class on /admin/admissions/intakes (`ops-intakes-sticky-overlap.png`,
  `ops-intakes-edit-covered.png`).
- **Why it hurts:** an officer scanning a long list clicks the first visible row — nothing
  happens. It feels broken, and on touch it is worse.
- **Fix:** rows get `scroll-margin-top` equal to the sticky header height (restores
  scroll-into-view), and the row's primary link gets a larger hit area; consider making the
  whole row a single link target so the click lands somewhere useful. Verify with the same
  hit-test after the fix.

### O-H2. [live] /admin/settings/flags + /admin/settings/menus — switches use inverted "বন্ধ করুন" semantics
- **Evidence:** flags page: `switch "অনলাইন ভর্তি আবেদন বন্ধ করুন" [checked=true]` — the label
  says "close online admissions", checked — while admissions are actually **open** (the
  checked state means the feature is enabled). Every one of the 11 flags reads inverted.
  Menus editor: `switch "গবেষণা ও প্রকাশনা লুকান" [checked=true]` — same inversion ("hide",
  checked, while the item is visible). The CMS audit found the same class on the FAQ
  visibility switch ("…লুকান করুন" [checked=true] on a *visible* FAQ).
- **Why it hurts:** a screen reader announces "বন্ধ করুন — pressed/checked" for a module that
  is ON; a sighted officer skimming labels toggles the wrong way. For feature flags this is a
  site-breaking mistake (turning off donations by accident).
- **Fix:** switches must model the positive state: label "অনলাইন ভর্তি" + status word
  ("সক্রিয়"/"বন্ধ") that flips with the switch, `aria-checked` matching reality. Apply the
  same pattern to menus (visibility) and FAQs — one shared component if possible.

## MEDIUM

### O-M1. [live] /admin/users — mixed-script date "৭/১০/২০২৬, ২:৪২:৩৫ PM"
US month/day order + Bangla digits + English "PM", while the rest of the site writes
"৭ অক্টোবর ২০২৬". Use the site's Bangla date formatter everywhere (users last-login,
applications "জমা" column "৭/১০/২০২৬", intake filter option "ATT · 2026 " with a trailing space).

### O-M2. [live] /admin/audit — raw action codes, English entity names, bare cuids
Rows read "menu.update MenuItem · 7a26e9p7"; the entity filter lists English model names
(Application, Campaign, FatwaEntry…). Add a Bangla action-label map + Bangla entity labels;
demote the cuid to a tooltip/detail (it is noise for an officer, useful for a developer).

### O-M3. [live] /admin/fatwa/questions — question rows are accordion buttons whose accessible
name is the entire row's text ("FAT-2026-0001 আব্দুল্লাহ আল মামুন ইবাদত ৭ অক্টোবর ২০২৬ প্রকাশিত").
Restructure so the expand control has a short name ("বিস্তারিত: FAT-2026-0001") and the row's
data cells keep their own semantics.

### O-M4. [live] /admin/users — the create form gives no role explanations
Six roles appear as bare names; an officer cannot tell "সম্পাদক" from "ভর্তি কর্মকর্তা"
responsibilities. Add a one-line description under the select (round 4's roles workstream
extends this — record as input to that work).

### O-M5. [code] Dashboard "সাম্প্রতিক কার্যক্রম" shows the same raw audit codes as O-M2
(duplicate of the CMS audit's H3 — fix together with the shared action-label map).

## LOW

### O-L1. [live] Applications intake filter option text has a trailing space ("ATT · 2026 ")
— trim the label source.
### O-L2. [live] /admin/inbox/messages "সব পঠিত করুন" disabled with no explanation when
everything is already read — add a hint or hide when N/A.
### O-L3. [live] /admin/fatwa/entries + inbox render cleanly with zero console errors —
no findings beyond the shared shell issues (mobile nav = CMS C1, toast = CMS M11).

## Verified working end-to-end (evidence)
- Application detail: status transition প্রাথমিক বাছাই → পরীক্ষার তারিখ নির্ধারিত with an
  officer note persisted; timeline shows the new event + actor; officer-note field is clearly
  marked "আবেদনকারী দেখবেন না"; both action buttons behave ("শুধু মন্তব্য যোগ" present).
- Fatwa questions: search + status + category filters render with Bangla options.
- Users: create form explains the password story ("পাসওয়ার্ড স্বয়ংক্রিয়ভাবে তৈরি হয় ও একবারই
  দেখানো হবে"); self-protection ("নিজের অ্যাকাউন্ট নিষ্ক্রিয় বা মুছে ফেলা যায় না") works.
- Audit log: filters + CSV export present; rows show actor + IP.
- Phone-width sweep: **no horizontal overflow on any ops/finance/settings route** (all
  measured exactly 390 at 390×844).
- Zero console/page errors on every route visited in this pass.
