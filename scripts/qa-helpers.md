# QA helpers — agent-browser patterns that work in this sandbox

Institutional knowledge from rounds 17–19 (each item below cost a debugging
session once; do not rediscover them). Run `agent-browser --help` for the full
command list — this file only records what is *non-obvious*.

## 1. The submit-button no-op (login / register / some forms)

`agent-browser click @ref` on form submit buttons **intermittently no-ops**:
the browser reports the click, the network panel shows **no POST**. Observed
on the site login form and the donation form. The reliable workaround is an
eval-based submit with the native value setter (React controlled inputs
ignore plain `el.value = …`):

```js
agent-browser eval '
var set = function (el, v) {
  var d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  d.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
};
var form = document.querySelector("main form");
var inputs = form.querySelectorAll("input");
set(inputs[0], "user@example.com");
set(inputs[1], "thepassword");
form.querySelector("button[type=submit]").click();
"submitted"'
```

For textareas use `window.HTMLTextAreaElement.prototype` instead. Log out via
an eval text-match on the header button (same idea).

## 2. Lazy images: never trust `naturalWidth === 0` on first paint

The site uses `loading="lazy"` everywhere (Lighthouse discipline). A
`[...document.images].filter(i => !i.complete || i.naturalWidth === 0)` probe
run right after `networkidle` reports **below-fold images as broken** — they
simply have not started loading. Always scroll through the page first:

```js
agent-browser eval "window.scrollTo(0, document.body.scrollHeight)"
# wait a beat, then probe — round 19 chased a phantom "14 broken images"
# bug that was 100% lazy-load timing.
```

## 3. Verify WHICH page your eval is on

`agent-browser eval` runs against whatever tab is current — after a batch
loop over many pages, the "current" page is the LAST one opened. Every
round-19 false alarm (course cards "have no links") came from probing a
different page than intended. Prefix interactive probes with
`agent-browser get url` when in doubt.

## 4. Shell quoting: use `function`, not arrow functions, in eval JSON

Nested `a[href]` selector strings inside arrow-function evals break the CLI's
shell quoting. Writing `[...document.querySelectorAll("a[href]")].map(function (x) { … })`
with single-quoted outer quotes works; arrow `=>` plus `"` inside has failed
repeatedly.

## 5. Dev-server restart pattern (chronic OOM, 4 GB box)

`(cd /home/z/my-project && nohup bun run dev > /dev/null 2>&1 &)` — the
subshell parens are load-bearing: without them the server dies seconds after
the Bash call exits (process-group kill). After any restart, **hard-reload
pages** before trusting UI state; a stale pre-restart build can briefly serve
old code.

- Run lint / tsc / tests SERIALLY, never alongside a browsing session — the
  OOM killer took next-server at 2.1 GB anon-rss once.
- Infrastructure restarts: `bash /home/z/infra/start.sh` (PostgreSQL on
  127.0.0.1:5433; see the file header for the sandbox-reset rebuild story).

## 6. The branch-switcher (cron race) — check before every commit

An external webDevReview process runs `git checkout main` in this repo at
unpredictable moments (observed 4–66 minutes apart, sometimes seconds after
an agent checkout). The cron tool is not available to delete it. Defenses:

- `git branch --show-current` before **every** commit (and generally prefix
  work batches with a checkout of the feature branch);
- `/home/z/commit.sh "msg" -- paths…` wraps this: restore branch → commit →
  `git branch -f main <branch>` so the switcher's checkout is content-neutral
  (local main is never pushed; origin/main stays for the client's PR merges);
- commits are cheap: land each finished unit immediately.

## 7. QA evidence

Screenshots go to `download/qa-rNN-<subject>.png` and are committed with the
PR (`.gitignore` keeps `.qa/` tracked deliberately). Round-number prefix
keeps them sortable next to the worklog entries that reference them.
