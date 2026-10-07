# Round 4 Audit — Workstream 1: Finance Admin + money presentation

**Auditor:** coordinator (main agent), live pass at 1440×900 and 390×844 over
/admin/finance/{funds,campaigns,donations,ledger,outbox}; a11y snapshots, phone-width
measurements, `errors`/`console` per route. (The shell-level findings — mobile nav, toasts,
touch targets — are in `findings-cms.md` and apply here too.)

**Totals (this file): 0 Critical · 1 High · 4 Medium · 2 Low.**

---

## HIGH

### F-H1. [live] Switch-semantics inversion on money-adjacent pages (shared with O-H2)
The feature-flags page (which can switch off the entire donations module) reads
`switch "অনুদান মডিউল বন্ধ করুন" [checked=true]` while donations are enabled. An officer
"fixing" what looks wrong would take the institute's donations offline. Same inversion on
menus/FAQ switches. Fix: positive-state switches with a status word (see O-H2).

## MEDIUM

### F-M1. [live] /admin/finance/campaigns — the time-span cell renders two dates with no
separator ("৩১ ডিসেম্বর ২০২৬১ জানুয়ারি ২০২৬" — end date + start date concatenated) and in
end→start order. Render "১ জানুয়ারি → ৩১ ডিসেম্বর ২০২৬" (or an arrow) with a line break.

### F-M2. [live] /admin/finance/funds — the status action button is labelled "নিষ্ক্রিয়"
(the action, not the state) with no current-state indication beside it. Show state + action
("সক্রিয় · নিষ্ক্রিয় করুন") so the officer knows what the button will do.

### F-M3. [live] /admin/finance/outbox — subject lines are English ("Donation Receipt
ASDRI-R-000001 — As-Sunnah Institute → email"). The emails themselves are English by design
(pdf-lib receipts), but the admin could prefix the Bangla type it already shows ("ধরন:
অনুদান রিসিপ্ট") into the subject cell so the row is self-explanatory in Bangla.

### F-M4. [code] Anonymous-donation rendering is verified by tests but not by this live pass
(the dev DB currently has no anonymous donation after earlier audits cleaned the ledger).
Before the round closes: seed/insert one anonymous donation and verify the admin row shows
the identity while the public campaign totals/API never do (there are existing tests for the
public side; the admin-side rendering needs one look).

## LOW

### F-L1. [live] /admin/finance/donations — status tabs are links with counts (good), but the
active tab is not announced (`aria-current` missing).
### F-L2. [live] Money alignment: amounts render in Bangla numerals with the ৳ symbol
consistently (good); tables would read faster with `text-right` on numeric columns.

## Verified working end-to-end (evidence)
- Donations: status tab counts (সব ২ / অপেক্ষমাণ ১ / সম্পন্ন ১ / ব্যর্থ ০ / ফেরত ০), search
  box + status filter; CSV export button present.
- Ledger: fund + income/expense filters, CSV export, "নতুন এন্ট্রি" dialog.
- Outbox: view/retry/resend actions per row; attempts column; Bangla status ("কিউতে").
- Funds: ৳১,০০০ collected with donation + entry counts per fund.
- Phone-width sweep: funds/campaigns/donations/ledger/outbox all exactly 390px at 390×844 —
  **no horizontal overflow anywhere in the finance module**.
- Zero console/page errors on all five finance routes.
