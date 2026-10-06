Home payload measurements (production build, http://127.0.0.1:3100/) — round 4

                                  BASELINE   FINAL
HTML document (raw)                 267.7 KB  408.0 KB
  inline RSC flight                  117.3 KB  207.2 KB
HTML document (gzip)                   60 KB    97 KB
Script chunks                          18       16
Client JS (raw, non-polyfill)       1049 KB   911 KB   (-138 KB: framer-motion + islands)
Runtime JSON fetches after hydrate     3        0   (/api/notices, /api/campaigns, /api/fatwa)

Why the document grew: the notices/support/fatwa sections moved from client islands
(fetched JSON after hydration) to server components — server content is inherently
serialized into the inline flight payload (hydration tree). The offsetting wins:
framer-motion is gone from the client site-wide, the three post-hydrate fetches are
gone, content is crawlable HTML with no skeleton flash, and tab switching is instant.
Lighthouse perf stayed within its sandbox noise band (see .qa/lighthouse/r4-final/).

Baseline captured at perf/r3-responsive-media@ddc576c (PR #20 tip) before the change;
raw HTML files not committed (size) — re-measure with:
  curl -s http://127.0.0.1:3100/ | wc -c
  curl -s http://127.0.0.1:3100/ | grep -c 'self.__next_f'
