# Round 4 Audit — Workstream 1: Content/CMS Admin (Bangla)

**Auditor scope:** /admin dashboard, notices (list/new/[slug]), blog (list/new/[slug]), media, gallery (list/new/[slug]), videos (list/new/[id]), people (list/new/[slug]), courses (list + full editor), page-content (home/faqs/admission), research (projects/publications/downloads).
**Method:** agent-browser session `audit-cms`, logged in as admin@assunnahinstitute.org. Every route visited **live at 1440×900 and 390×844**: a11y snapshots (`snapshot -i`), form submits (valid + invalid + absurd), a destructive create→delete cycle on a dummy record, keyboard Tab passes, `errors`/`console` capture on every route, `document.documentElement.scrollWidth` measured at 390 on every page, plus repo code reading to confirm root causes (file:line cited).
**Environment note (important):** the dev server was **OOM-killed 5×** during this workstream (`dmesg`: `Out of memory: Killed process … (next-server … anon-rss ≈ 2.1–2.4 GB)`; first kill ~13:16 interrupted the earlier pass of this audit mid-route). The sandbox reaps background processes, so the server was restarted inside per-batch commands (`.qa/r4-audit/batch1–4.sh`, logs `dev-batch*.log`); it is **not running at audit end** — the next auditor must restart it the same way (`cd /home/z/asdri-platform && DATABASE_URL=… node node_modules/.bin/next dev -p 3000`). One console `prisma:error … Can't reach database server at 127.0.0.1:5433` appeared once during the stricken window (see M18); every route re-verified clean afterwards.

**Totals: 2 Critical · 5 High · 18 Medium · 9 Low = 34 findings.**

---

## CRITICAL

### C1. [live+code] All admin routes (< 1024px) — there is NO navigation on phones
- **What I did:** viewport 390×844 on /admin, /admin/notices, /admin/media; a11y snapshot + DOM probe.
- **Evidence:** a11y tree at 390 contains **zero navigation** — only `link "মূল কনটেন্টে যান"` and `button "লগআউট"`. `AdminSidebar` (`src/components/admin/admin-sidebar.tsx:188`) is `hidden … lg:flex`; the mobile header (`src/app/admin/layout.tsx:54-65`) holds only logo, user name, লগআউট. `document.querySelectorAll('header button, header a')` → only `লগআউট, লগআউট`. No hamburger, no Sheet/drawer anywhere in the admin tree (`Sheet` is used only by the public site header).
- **Why it hurts:** staff work daily on mid-range Android phones. On any page other than the dashboard they are **trapped** — no way to reach notices/blog/media without typing URLs. Every other phone finding below compounds this.
- **Fix:** add a drawer trigger to the mobile header in `layout.tsx` that reuses the `NAV` list in a Radix `Sheet` (same pattern as the public `site-header`), closing on route change; keep the desktop collapse toggle as-is.

### C2. [live] All create forms — Bangla-only titles collide on a constant fallback slug; only ONE Bangla-only record of each type can ever exist (plus a second slug trap)
- **What I did:** (a) previous pass created a Bangla-only notice “অডিট টেস্ট নোটিশ (ড্রাফট)” → succeeded, slug `notice`. (b) This pass created a second Bangla-only notice “দ্বিতীয় বাংলা নোটিশ পরীক্ষা”. (c) Also attempted “QA রাউন্ড ৪ অডিট ড্রাফট নোটিশ” (mixed BN/EN).
- **Evidence:** (b) → `POST /api/admin/notices` **409** `{"error":"এই স্লাগ ইতিমধ্যেই ব্যবহৃত — অন্য একটি দিন।"}` (network log; page stays on /new). (c) → **400** `“ফর্মের তথ্য যাচাই করুন।”` — `slugifyTitle("QA রাউন্ড ৪ …")` strips Bangla leaving `"qa"` (2 chars) which fails `slug.min(3)` (`validators/admin.ts`). Root cause: `slugifyTitle` (`src/lib/slug.ts:4-11`) keeps only `[a-z0-9]`, so Bangla-only titles slugify to `""` and every form falls back to a **constant** — `|| "notice"` (`notice-form.tsx:43`), `|| "post"` (`post-form.tsx:80`), `|| "album"`, `|| "person"`, `|| "publication"`, `|| "research-project"`. The slug is display-only (`স্লাগ: notice`) — there is no slug input, so “choose another” is unactionable.
- **Why it hurts:** Bangla-only titles are the norm (the field hint even says “ইংরেজি খালি রাখলে বাংলাটিই দুই ভাষায় দেখানো হবে”). After the first record of each type, every subsequent Bangla-only create fails; mixed titles with <3 ASCII chars fail with an even more generic error. Core content entry is blocked.
- **Fix:** in each POST route reuse the existing `buildUniqueSlug`/`-2, -3` suffix logic (`slug.ts:17+`, already used for fatwa) when the client-sent slug collides; client-side, when the computed slug is the constant fallback, send nothing and let the server generate (`n-${Date.now()}` fallback exists but never runs because the client always sends the constant); optionally expose an editable slug field.

---

## HIGH

### H1. [live] /admin/videos — page overflows to 3,430px on phones and 3,342px on desktop detail (unwrapped YouTube search URLs)
- **What I did/measured:** `scrollWidth` at 390×844: **list 3,430**, **detail 3,070**; at 1440×900: **detail 3,342** (list is fine at ≥lg). Screenshot `cms-videos-overflow-phone.png` / `cms-videos-overflow-desktop.png`.
- **Evidence:** every video row renders its 300+ percent-encoded YouTube **search** URL as text. DOM probe at 390: `A w=2676`, `P w=2527` (the URL line). List cause: the card `<Link>` is a grid item without `min-w-0` (`admin/videos/page.tsx:83-103`, grid `gap-2 lg:grid-cols-2` — implicit `auto` column below `lg` adopts the nowrap URL min-content; `lg:grid-cols-2` uses minmax(0,1fr), which is why desktop list is fine). Detail cause: `admin/videos/[id]/page.tsx` renders `ভিডিও আইডি <code>{video.youtubeId}</code>` — an inline `<code>` that never wraps.
- **Why it hurts:** the videos module is ~9× the phone viewport sideways; the desktop detail page also scrolls sideways past the sidebar. Any officer editing a video gets a broken-feeling page.
- **Fix:** add `min-w-0` to the video card Link (grid item) and `break-all`/`truncate` on the URL `<p>`; on the detail page wrap the `<code>` (`max-w-full overflow-hidden text-ellipsis whitespace-nowrap` or `break-all`). Root data fix in M10 removes the 300-char URLs entirely.

### H2. [live, 5 forms] Validation failures show only a generic toast — the API's per-field Bangla errors are thrown away; no native validation either
- **What I did:** clicked the primary submit with everything empty on /admin/notices/new, /admin/blog/new, /admin/gallery/new, /admin/people/new, /admin/videos/new (invalid URL).
- **Evidence:** every one → toast **“ফর্মের তথ্য যাচাই করুন।”** and nothing else (e.g. notices: `POST /api/admin/notices 400`, toast snapshot; gallery: `POST /api/admin/albums 400`, same toast; people: `POST /api/admin/people 400`). There is **no `<form>` element** (`document.querySelectorAll('form').length === 0`) so the `required` attribute on title inputs is dead code — no browser bubble ever fires. The API **does** return field-level Bangla messages (`fields: { titleBn: "বাংলা শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে" }`, `validators/admin.ts:13`) but every client drops `json.fields` (`notice-form.tsx:71-74`, post-form, album-form, person-form, video-form). Only `publication-form.tsx` partially surfaces `Object.values(json.fields ?? {})[0]`, and the videos API returns a specific message (“ইউটিউব লিংক বা আইডি পড়া যায়নি — সরাসরি লিংক (watch / youtu.be / shorts) বা ১১ অক্ষরের আইডি দিন।”) — proving the better pattern already exists in this codebase.
- **Why it hurts:** an officer facing a long bilingual form + rich-text editor gets “validate the form data” with no pointer to the offending field; combined with C2 (slug errors) saves dead-end repeatedly. Focus stays on the clicked button; nothing scrolls to the problem.
- **Fix:** render `fields` as inline Bangla errors under each input (`aria-invalid`, red border, `aria-describedby`), focus/scroll to the first invalid field, keep the toast as a summary. The zod messages are already Bangla — just surface them (copy the videos/publication approach everywhere).

### H3. [live] /admin — “সাম্প্রতিক কার্যক্রম” shows raw English audit action codes
- **Evidence:** dashboard activity rows read `notice.create`, `fatwaQuestion.publish`, `fatwaEntry.create`, `media.delete`, `application.status` (`admin/page.tsx:203` prints `log.action` verbatim; snapshot confirms).
- **Why it hurts:** the dashboard's only "what happened lately" widget is meaningless to Bangla non-developers — English dot-codes look like errors.
- **Fix:** render-time map `action` → Bangla sentence (e.g. `notice.delete` → “নোটিশ মুছে ফেলা হয়েছে”); share the map with /admin/audit.

### H4. [live] /admin @390px — the dashboard itself overflows horizontally (scrollWidth 520 vs 390)
- **Evidence:** `document.documentElement.scrollWidth` = **520** at 390. Overflow chain (DOM probe): `SECTION.rounded-2xl` (সাম্প্রতিক নোটিশ) renders **504px** inside a **358px** grid; grid items lack `min-w-0`, so the nowrap `truncate` link (`A.block.truncate` w=414) sets the column's min-content. Same class of bug R3 fixed for tables.
- **Why it hurts:** the first screen a phone officer sees side-scrolls 130px; with C1 (no nav) the phone experience of the admin's front door feels broken.
- **Fix:** add `min-w-0` (or `overflow-hidden`) to the two grid `<section>`s in `admin/page.tsx:146,183`.

### H5. [code+live] /admin/courses/[slug] — destructive row actions delete instantly with NO confirmation; save then destroys data permanently
- **Evidence:** `curriculum-section.tsx` `removeSemester`/`removeSubject` and `list-sections.tsx` (তাখাসসুস + SDP row deletes) remove rows on a single click of small 🗑 icons — no `adminConfirm` anywhere in `course-editor/` (grep: zero matches). The buttons are live on the page (`button "সেমিস্টার মুছুন"`, `button "বিষয় মুছুন"` in the a11y tree). “কারিকুলাম সংরক্ষণ” then `PUT`s the whole tree, which the API persists via `semester.deleteMany` + recreate inside a transaction (`api/admin/courses/[id]/curriculum/route.ts`) — an accidental tap followed by save **permanently erases** a semester's subjects with no undo.
- **Why it hurts:** a semester carries 6–10 carefully-typed subjects; inconsistent with the designed ConfirmDialog every other module uses for record deletes.
- **Fix:** route these through the existing `adminConfirm()` (“‘সেমিস্টার ৩’ ও তার ৮টি বিষয় মুছে ফেলা হবে। নিশ্চিত?”), disable while `saving`.

---

## MEDIUM

### M1. [live+code] /admin — “সাম্প্রতিক নোটিশ” mixes drafts in with published, with no draft badge
- **Evidence:** the draft “অডিট টেস্ট নোটিশ (ড্রাফট)” appeared **top** of the widget with a gold “নতুন” badge (a11y snapshot). Query has no `isPublished` filter and the badge maps only NEW/ACTIVE/CLOSED (`admin/page.tsx:106,168-177`).
- **Why it hurts:** an officer glancing at the dashboard believes the draft is live/new; the list page's প্রকাশ column (ড্রাফট/প্রকাশিত) is the correct model.
- **Fix:** filter `isPublished: true` in the dashboard query, or add a grey ড্রাফট badge mirroring the list.

### M2. [code] Rich text editor — link insertion uses native `window.prompt`; links can't be removed
- `rich-text-editor.tsx:86` calls `window.prompt("লিংক URL দিন (https://…)")`. R3 replaced every `window.confirm`, but this prompt survived: jarring on Android, untranslatable buttons, and clicking লিংক again only sets another link — no unset.
- **Fix:** small Popover with URL input + প্রয়োগ / লিংক খুলুন buttons (show খুলুন when `editor.isActive("link")`).

### M3. [code+live] Rich text editor — placeholder never renders; the editor body is an unnamed textbox
- The Bangla placeholder is written to `data-placeholder` (`rich-text-editor.tsx:34`) but **no CSS consumes it** (repo-wide grep for `is-editor-empty`/`editor-empty`: zero matches) — “বিস্তারিত বিজ্ঞপ্তি…” never shows. The contenteditable also has no aria-label: every form's a11y tree shows `textbox [ref=…]` with **no name** right after a fully-labeled toolbar (confirmed in notice/blog/people snapshots).
- **Fix:** add Tiptap placeholder CSS (`.ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder) … }`); pass `aria-label` via `editorProps.attributes`.

### M4. [code+live] Form sidebar controls — labels not programmatically associated (unnamed comboboxes/spinbuttons)
- `<label>` + sibling input without `htmlFor`/`id`: notice category/status (`notice-form.tsx:184-210`), post ধরন/ক্যাটাগরি/লেখক/প্রকাশের সময়, album/person/video ক্রম, publication fields. Live a11y evidence: `combobox [ref=e1020]: সাধারণ` (value shown, no name) and `spinbutton [ref=e1858]: 0` (ক্রম) on gallery/new — same unnamed spinbutton on person & video forms.
- **Why it hurts:** screen-reader/voice users get “combo box”/“spinbutton” with no context; labels aren't clickable.
- **Fix:** `id` + `htmlFor` (or wrap the control in the label). Main BilingualField inputs are fine (placeholder-named).

### M5. [code] /admin/courses/[slug] — existing cover image is never shown (`current={null}`)
- `meta-section.tsx` renders `<MediaPicker label="কভার ছবি" current={null} …>`; the picker only previews when `current` is set, so a course with a cover looks identical to one without.
- **Fix:** pass the resolved `coverMediaId` row like person-form passes `values.photo`.

### M6. [code+live] /admin/notices on phones — প্রকাশিত/ড্রাফট invisible (প্রকাশ column is `hidden lg:table-cell`)
- `admin/notices/page.tsx:126,157` — at 390 the row shows only title+date+সম্পাদনা (measured table 521px in its scroll wrapper; category/status also hidden at sm/md). A phone officer can't tell draft from published at a glance (and per C1 they're on a phone).
- **Fix:** inline ড্রাফট badge next to the title when `!isPublished`, or a meta line under the title.

### M7. [code+live] /admin/blog and /admin/research/publications — no pagination, silent `take: 200`
- `admin/blog/page.tsx` takes 200 posts, no pager (notices uses `AdminPager` — inconsistent). At 201+ posts the oldest silently vanish, unfindable/uneditable. Publications likewise (`take: 200`).
- **Fix:** reuse `AdminPager` + count/skip as in notices.

### M8. [live] /admin/notices + /admin/blog — no-match search empty state claims "there are no notices yet"
- Searched `zzzzqqqq` → “**এখনো কোনো নোটিশ নেই — প্রথম নোটিশটি তৈরি করুন — এটি সাথে সাথেই ওয়েবসাইটে দেখা যাবে।**” while 8 notices exist. Media/people/gallery/videos correctly say “অনুসন্ধানের সাথে মিলে এমন কোনো ছবি নেই” — copy that pattern.
- **Fix:** when `q`/filter set → “কোনো ফলাফল পাওয়া যায়নি” + “ফিল্টার খুলে ফেলুন” link.

### M9. [live+DB] /admin/blog — 11 of 15 post bodies are literal Markdown ("## শিরোনাম") shown as raw text
- **Evidence:** DB query: `count(*) FILTER (bodyBn LIKE '##%') = 11 of 15`. The a11y tree of the editor for “আল্লাহর অস্তিত্ব…” reads `## বিষয়টি কী ও কেন তাৎক্ষণিক …` — the WYSIWYG stores/renders HTML, nothing converts markdown, so officers see (and the public site renders) literal `##` prefixes.
- **Why it hurts:** the flagship articles look broken; editing them mixes real headings with `##` noise.
- **Fix:** one-off migration to convert `## X` → `<h2>X</h2>` (or render markdown), then the RTE keeps everything HTML.

### M10. [live] /admin/videos — every record holds a YouTube **search** URL (placeholder seed); editing any of them fails until the URL is replaced
- **Evidence:** all 6 videos' URL fields contain `https://www.youtube.com/results?search_query=%E0%A6%86…` (300+ chars; seed stores non-watch URLs as-is: `scripts/seed-data/content.ts` “search-link fallback”). Opened “সায়েন্টিজম বনাম বিজ্ঞান”, clicked পরিবর্তন সংরক্ষণ unchanged → `PATCH 400` + “ইউটিউব লিংক বা আইডি পড়া যায়নি — সরাসরি লিংক (watch / youtu.be / shorts) বা ১১ অক্ষরের আইডি দিন।” The detail page also mislabels it “ভিডিও আইডি”. Public site: `toYoutubeUrl` (`lib/content/media.ts`) links every “video” to a search page.
- **Why it hurts:** the whole module is placeholder data; a title/playlist fix is blocked by an error the officer may not connect to the URL field; public “videos” open searches.
- **Fix:** seed real watch URLs (or `youtu.be/…` IDs); in the list show a 🎬/⚠️ “প্লেসহোল্ডার লিংক” badge when `youtubeId` isn't a watch/ID form.

### M11. [live+code] All admin toasts — close button is unlabeled and invisible until hover (broken on touch)
- **Evidence:** toast snapshot shows `button [ref=e1059]` with **no accessible name**; `ui/toast.tsx` ToastClose is `opacity-0 … group-hover:opacity-100 focus:opacity-100` — on a phone there is no hover, so the X is unseen (and untargetable by voice control).
- **Fix:** `aria-label="বন্ধ করুন"` + `opacity-60` default on coarse pointers (`@media (pointer: coarse)`).

### M12. [live] Touch targets below the 44px Android minimum across forms
- **Measured at 390 on /admin/notices/new:** 23 buttons under 44px — bilingual tabs **21px**, RTE toolbar (বোল্ড/ইটালিক/…) **28px**, লগআআউট 32px; album image reorder chevrons ≈20px (`album-images-manager.tsx`, `p-0.5`+`h-4 w-4`).
- **Fix:** `min-h-11 min-w-11` (44px) hit areas (padding, not bigger glyphs) for toolbar/tabs/row-icon buttons.

### M13. [live+code] /admin/content/faqs — publish-switch accessibility semantics inverted; delete confirm doesn't name the object
- **Evidence:** published FAQ → `switch "… প্রশ্ন? লুকান করুন" [checked=true]` — the label is the *action* (“hide”) while `checked` means *published*; a screen reader announces “hide X, checked” → sounds hidden when it's visible (`faqs-manager.tsx` aria-label logic). The delete ConfirmDialog title is generic — “প্রশ্নোত্তরটি মুছে ফেলবেন?” — unlike notices/media which name the record.
- **Fix:** label the state, not the action: `aria-label="… প্রকাশিত"`/`aria-label="… লুকানো"` (or `aria-label` = question + “প্রকাশ অবস্থা”); include `row.questionBn` in the confirm title.

### M14. [live] /admin/blog/new — author dropdown lists all 35 people, with duplicate names
- **Evidence:** combobox options include two “শায়খ আহমাদুল্লাহ”, two “খালেদ মুহাম্মাদ সাইফুল্লাহ”, two “সালাহুদ্দীন তারেক” (separate Person records, e.g. chairman vs উস্তাজ) and non-author staff. Source: `db.person.findMany()` with no filter (`admin/blog/new/page.tsx`).
- **Fix:** restrict to people with an author-ish role/team or add `(চেয়ারম্যান)`-style disambiguation in the option label.

### M15. [live] /admin/research/publications — year rendered with a thousands separator; sample ISSN placeholder
- **Evidence:** সাল column shows **“২,০২৫”** (`formatNumber(publication.year, "bn")` — locale grouping on a year); first row shows “ISSN 2789-XXXX (sample)”.
- **Fix:** render years with `toBnDigits(year)` (no grouping); replace the sample ISSN or hide the column when it matches the placeholder.

### M16. [live] /admin/research/downloads — all 8 published download items have no file attached
- **Evidence:** every card reads “ফাইল সংযুক্ত নেই” + badge “ফাইল নেই” (8/8). Good that the admin says so — but these are published, so the public download section is empty shells.
- **Fix:** gate `isPublished` on having a file, or show a dashboard-style warning; seed real PDFs.

### M17. [live+code] Dialog/date widget English leftovers in the Bangla admin
- **Evidence:** the “নতুন কোর্স তৈরি” dialog's close button announces **“Close”** (`ui/dialog.tsx`: `<span className="sr-only">Close</span>` — live: `button "Close"` in the a11y tree). Blog's “প্রকাশের সময়” is a native `datetime-local` and research project deadline a native `type="date"` — their spinbuttons/pickers announce “Month/Day/Year/AM/PM” in English (live a11y tree on /admin/blog/new).
- **Fix:** sr-only label → “বন্ধ করুন”; for dates consider a Bangla-labeled text input pattern or accept native widgets but add a Bangla hint + `aria-label` on the input.

### M18. [live, once] /admin — fatwa count runs unconditionally in the top-level Promise.all (dashboard-wide fragility)
- **Evidence:** during the OOM-stricken window the console logged `prisma:error … fatwaQuestion.count() … Can't reach database server at 127.0.0.1:5433` while `admin/page.tsx:95` counts pending fatwa questions for **every** staff role even when the card is hidden (`show: roleCan(role,"fatwa") && pendingFatwa > 0`). A fatwa-DB hiccup can 500 the entire dashboard; noise hides real regressions.
- **Fix:** `Promise.allSettled`/try-catch per optional stat (default 0), or skip the query when the role can't see it.

---

## LOW

### L1. [code] Admin tables — `thead` not sticky; long lists lose column headers while scrolling
- notices/blog/publications tables use plain `<thead>` (`bg-secondary/30`, no `sticky top-0`). With M7's 200-row lists this bites. **Fix:** `sticky top-0 z-10 bg-secondary` inside the existing `overflow-x-auto` cards (careful: sticky needs the vertical scroll container).

### L2. [code] RTE toolbar — শিরোনাম ২/৩ buttons reuse the Bold icon
- `rich-text-editor.tsx:58-59` — four adjacent buttons look identical (aria-labels are correct). Use lucide `Heading2`/`Heading3`.

### L3. [code] Dead queries on hot pages
- `admin/page.tsx:89,107` fetches the completed-donation aggregate **twice** (`donationCompleted`, `raisedTotal`) and discards one (`void raisedTotal`); `admin/videos/page.tsx:29-30` computes `ungroupedCount` then `void`s it. Wasted DB round-trips on every dashboard render.

### L4. [code] Course meta publish caption is developer-speak
- `meta-section.tsx`: “বন্ধ থাকলে পেজ ৪০৪ দেখাবে” — officers read “৪০৪” as an error they caused. Use the other forms' wording: “বন্ধ থাকলে ওয়েবসাইটে কোর্সটি দেখা যাবে না”。

### L5. [live+code] Notice form — double submit buttons are ambiguous
- With প্রকাশিত ON (default), “নোটিশ তৈরি করুন” already publishes and “প্রকাশ করুন” does the same; with the switch OFF the second silently flips publish-on-save (`notice-form.tsx:242-249`). **Fix:** one save button + the switch, or label the second dynamically (“ড্রাফট হিসেবে সংরক্ষণ”/“প্রকাশ করুন”).

### L6. [live] /login renders inside the full public site chrome
- Admin login sits under the public header/nav/footer (verified en route; authenticated /login redirects to /account). Phone officers scroll past a whole website to log in. Belongs to the auth workstream — noted.

### L7. [live] Blog lacks the in-admin preview notices have
- Notice form has “প্রিভিউ দেখুন” + “ওয়েবসাইটে দেখুন ↗”; blog has only the external link. Inconsistent for the largest body content. (Verified live: the preview links work — see “Refuted” below.)

### L8. [live] Minor data hygiene
- All 3 gallery albums show “ক্রম ০” (sortOrder not differentiated → ordering arbitrary); a previous round's draft “অডিট টেস্ট নোটিশ (ড্রাফট)” (slug `notice`) sat on every officer's dashboard — **deleted during this audit** via the normal UI flow.

### L9. [live] Refuted prior-pass claim (recorded so round 5 doesn't re-chase it)
- The earlier interrupted pass flagged “‘ওয়েবসাইটে দেখুন ↗’ links 404 (missing /[lang])”. **Live-verified false:** `/notices?notice=…`, `/media/blog/…`, `/media/gallery`, `/media/videos`, `/about/leadership`, `/research/publications`, `/research/projects`, `/academics/courses/…` all return **200** — `src/proxy.ts` rewrites every non-`/en` path to `/bn/…` internally (Bangla is the default, URL-less language). Preview links are fine.

---

## What is already good (don't churn this)
- **Designed ConfirmDialog** (Radix AlertDialog): red destructive button, Bangla labels, focus-trapped, Escape-safe; delete confirms **name the item** (“'X' নোটিশটি স্থায়ীভাবে মুছে ফেলা হবে। নিশ্চিত?”; media: “'file.png' স্থায়ীভাবে মুছে ফেলা হবে (স্টোরেজসহ)”). FAQ confirm exists but see M13.
- **BilingualField** (বাংলা/English tabs) + `LanguageStatus` indicators; genuinely helpful Bangla hints (“ইংরেজি খালি রাখলে বাংলাটিই দুই ভাষায় দেখানো হবে”).
- **RTE renders and works**: toolbar fully aria-labeled in Bangla (`বোল্ড`…`রিডু`, verified in tree), Bangla is LTR, content survives create→redirect→edit round-trip.
- **Lists**: designed empty states with CTA everywhere; **media/people/gallery/videos differentiate “no results” vs “nothing yet”** (M8 is only notices/blog); tables sit in `overflow-x-auto` wrappers (R3 fix holds — notices 521px & blog 412px tables scroll inside 390px); long titles truncate.
- **AdminPager** (notices): Bangla numerals, `aria-current`, filter-preserving — the pager to copy for blog/publications.
- **Media library**: bilingual alt text with dirty-state save buttons, per-file labeled delete (`file.png মুছে ফেলুন`), upload constraints in Bangla (১০MB/২০MB), image dimensions/size shown, correct no-match state.
- **Dashboard figures are real and links correct**: ৮ প্রকাশিত নোটিশ / ৭ কোর্স / ৩৫ প্রোফাইল / ১৫ পোস্ট match the lists; stat cards deep-link to the right modules; zero-count cards hide; **no “coming soon”/TODO anywhere**.
- **Draft/publish visible at a glance on desktop lists** (ড্রাফট/প্রকাশিত columns + badges in notices, blog, videos, people, gallery); ওয়েবসাইটে দেখুন preview links work (L9).
- **Bangla digits/dates everywhere**; `<html lang="bn">` for the admin tree; skip-link মূল কনটেন্টে যান; focus outline visible (2px solid, verified during Tab pass).
- **Course editor is genuinely powerful**: meta + bilingual + Arabic name, curriculum tree with reorder per semester/subject, per-row credits/marks/নন-ক্রেডিট, তাখাসসুস + SDP sections, full-replace save inside a transaction.
- **New-course dialog** disables submit until code+Bangla name; FAQ dialog traps focus, Escape closes, সংরক্ষণ disabled until filled (all verified live).
- **No uncaught page errors on any audited route** (fresh reloads; the only console noise was M18's transient Prisma error during the OOM window).

## Flows that worked end-to-end (screenshots in .qa/r4-audit/)
1. **Login → dashboard** at both widths; stats, recent notices, activity all render (cms-dashboard-desktop/phone.png).
2. **Create → verify → destroy a draft notice**: bilingual title/excerpt/RTE body, প্রকাশিত switch off → toast “নোটিশ তৈরি হয়েছে” → auto-redirect to edit page (values preserved) → “মুছে ফেলুন” → confirm dialog naming the notice (focus trapped, Tab cycles বাতিল/নিশ্চিত করুন, Escape cancels) → “নিশ্চিত করুন” → redirect to list + toast “নোটিশ মুছে ফেলা হয়েছে” → record gone (searched). Also used the same flow to clean the prior round's leftover test notice (batch4).
3. **Notices/blog filter round-trips** (q retained); media search no-match state correct.
4. **Course editor load**: PYS with 3 semesters/14 subjects fully editable, reorder buttons disabled at boundaries.
5. **Keyboard passes**: 20×Tab on notices and 25×Tab on dashboard reach all controls sequentially with a visible 2px focus outline; dialogs trap focus and close on Escape.
6. **Phone widths**: every audited page measured `scrollWidth === 390` **except** the dashboard (520 → H4) and both videos pages (3,430 / 3,070 → H1) — the R3 table-scroll fix holds everywhere else.

## Route coverage (all live, both widths, unless noted)
| Route | 1440×900 | 390×844 |
|---|---|---|
| /admin | snapshot + stats/links verified | scrollWidth 520 (H4), snapshot |
| /admin/notices | list+filter+empty state+pager code | scrollWidth 390, table wrapper scroll |
| /admin/notices/new | empty-submit (toast), valid draft create, RTE | scrollWidth 390, touch targets measured |
| /admin/notices/[slug] | edit page + delete-confirm dialog (full destructive flow) | scrollWidth 390 (test record) |
| /admin/blog | list, author/category columns | scrollWidth 390 |
| /admin/blog/new | empty-submit (toast), EN tab, datetime widget | scrollWidth 390 |
| /admin/blog/[slug] | edit page (markdown body evidence) | scrollWidth 390 |
| /admin/media | cards, alt-text, search no-match, PDF empty state | scrollWidth 390 |
| /admin/gallery | list cards | scrollWidth 390 |
| /admin/gallery/new | empty-submit (toast) | scrollWidth 390 |
| /admin/gallery/[slug] | album edit + image manager (reorder/captions) | scrollWidth 390 |
| /admin/videos | list (URL overflow measured) | **scrollWidth 3,430 (H1)** |
| /admin/videos/new | empty + invalid-URL submit (specific error) | scrollWidth 390 |
| /admin/videos/[id] | save-blocked-on-placeholder-URL (400), **scrollWidth 3,342 (H1)** | scrollWidth 3,070 |
| /admin/people | teams manager + grouped cards | scrollWidth 390 |
| /admin/people/new | empty-submit (toast) | scrollWidth 390 |
| /admin/people/[slug] | edit page | scrollWidth 390 |
| /admin/courses | list cards + নতুন কোর্স dialog (Close label evidence) | scrollWidth 390 |
| /admin/courses/[slug] | full editor: meta/curriculum/তাখাসসুস/SDP | scrollWidth 390, curriculum table 814px in scroll wrapper |
| /admin/content/home | sections/stats/hero managers, disabled-until-dirty save | scrollWidth 390 |
| /admin/content/faqs | groups, switches, dialog (focus trap + Escape) | scrollWidth 390 |
| /admin/content/admission | declaration/intro editors | scrollWidth 390 |
| /admin/research/projects | cards, progress bars (role=progressbar), pager | scrollWidth 390 |
| /admin/research/publications | table, year/ISSN evidence | scrollWidth 390 |
| /admin/research/downloads | grouped list, no-file evidence | scrollWidth 390 |

**Environment note repeated for round 5:** the dev server (`next dev -p 3000`) is OOM-fragile under 4 parallel auditor sessions (5 kills logged in dmesg; ~2.1–2.4 GB RSS each) and is **not running at the end of this audit** — restart it with the command in the header before continuing.
