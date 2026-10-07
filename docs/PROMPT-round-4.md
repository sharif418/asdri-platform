# Round 4 — the people who will use this, and the face it shows them

Round 3 was the round where you stopped describing and started proving: the production server boots in CI, the sandbox payment hole is closed, the two hidden modules exist, Bangla runs from the left, two hundred and ninety-one tests pass, and `PROGRESS.md` says Partial where it is partial. The platform is live at `https://asdri-platform.ailearnersbd.com` on the branch `deploy/staging-r7`, which is your round-7 tip plus one commit of ours. Base this round on that branch. Read that commit first, because it changes what the site looks like and it tells you something about how you work.

## The institute's real face

The Foundation has handed over the official logo: Arabic calligraphy, the English wordmark, and the mark of the arch, the open book, the pen and the sun. We put it in. It lives in one place, `src/lib/brand.ts` with the files under `public/brand/`, and every surface that shows the brand reads from there: the header, the footer, the drawer, the admin bar, the 404 and offline pages, the favicon, the Apple icon, the PWA icons. The drawn crescent emblem and the three lines of text beside it are gone, and so are the generated SVG icons. The office gave us a white version for dark grounds; it is the one the footer uses.

What we did is correct and minimal. It is not yet what a brand designer would do with a mark this good. Look at how the best institutions carry their identity through a site: the clear-space rules around the mark, the sizes at which the calligraphy stops being legible and the mark alone should take over, the way the mark reappears as a quiet watermark or a section ornament, the Open Graph image that travels with every shared link, the print header on a notice, the loading state, the email template, the receipt and the exam-call letter that leave the building with this mark on them. Take the brand the whole way through the platform, and if the files we made can be made better — sharper subsetting, an SVG traced from the master, a monochrome variant — make them, in that one place.

## The header, and what it taught us

Our commit also fixed two header faults you will want to understand. In English the labels are a third longer than in Bangla, and the header's flex row let the browser squeeze the logo to make room; a logo must never be the thing that gives way. The dropdowns opened under the first menu item whatever you hovered, because the navigation primitive renders every panel into one shared viewport at the start of the list; each panel now opens under its own trigger. We also discovered that at 1024 to 1279 pixels the eight English items cannot sit beside the full logo at all, so the drawer serves that range.

Those were patches. The header deserves a design. It is the one element on every page of the site, it carries the client's identity, and today it still reads like a template's header with a better logo in it. Reconsider it as a whole for this institute and these two languages: what the top bar is for, how eight sections and their children are best presented to a reader on a phone, a laptop and a wide screen, how search, language, login and the donate action earn their place without crowding the mark, how the sticky state behaves, what the scrolled state condenses to, and how the whole thing works with a keyboard and a screen reader. Measure it in both languages at every width and make sure nothing ever shrinks, clips or wraps.

One behaviour in it confuses people today: hovering a section opens its children, but clicking the section's own name goes nowhere obvious. Decide what a click on a parent means, make it consistent everywhere including on touch screens where hover does not exist, and make the affordance visible.

## The band at the top of every page

Every inner page opens with a dark green band carrying the title, a breadcrumb and a verse. The Foundation has asked, specifically, that this band be made beautiful with Islamic calligraphy. Today the lattice is faint and the verse floats. Treat this band as the signature of the inner pages: the right calligraphic piece per section, drawn or typeset with care, set against a ground that reads as craft rather than wallpaper, legible on a phone, respectful of the text it carries, and cheap to load. Study how the finest Islamic institutions and museums present calligraphy on screen before you draw anything, then make it this institute's own.

## The admin, before anything new goes in

Before you build the next thing, go through the entire admin the way an officer would on a Monday morning: every list, every form, every destructive action, every empty state, every error, on a laptop and on a phone, in Bangla, with the keyboard only, once with a screen reader. Several things are still not at the level of the public site; we will not list them because you are better placed to find all of them than we are to find some. Fix what you find, and record what you found in `PROGRESS.md` so we can see the audit happened.

## Roles and portals

The Foundation has said what we expected: one admin and a few staff roles are not how an institute runs. There are students and their guardians, teachers, admissions officers, the finance office, donors, alumni, librarians, the fatwa board, and whoever else an institution of this kind employs or serves. Each needs their own door into this platform, showing exactly what their responsibility covers and nothing else, in Bangla, usable by people who do not use computers all day.

We will not hand you a list of roles and screens. You know what a dawah institute with residential students, a Zakat-funded scholarship, an admissions cycle, a research arm, a fatwa service and a donor base needs, and you know how the best school-management and institutional platforms organise access by responsibility. Design the role and permission model and the portals on top of it, with the data model, the access rules enforced where the data is read and written, the audit, the invitation and onboarding flow, the password and verification story, and the tests that prove a guardian cannot see another family's child and an accountant cannot edit a curriculum. Build it to the quality of everything else you have built in rounds 2 and 3: the office must be able to run it on day one without a developer.

## What else is still open

From the previous reviews, these remain: mobile performance sits at 53 to 76 against a target of 90; content has no revision history or preview before publish; one Bangla field still carries `dir="rtl"`; `uuid` is installed and unused; forty-eight thousand lines of Lighthouse JSON are committed under `.qa/`; the client's documents still sit in `upload/`. Close them in this round or say in `PROGRESS.md` why they wait.

## How we work

Base on `deploy/staging-r7`. Branches and pull requests, never merged by you. Every Done row in `PROGRESS.md` points at its proof; what you did not run is Partial. Screenshots of what changed at phone and desktop width in both languages. Decisions where the brief is silent go in `GAPS.md` with the reasoning.

You have the client's identity in hand now, their approval of the direction, and no ceiling. Make this the version the institute puts its name on.
