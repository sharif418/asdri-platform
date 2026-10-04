/*
 * As-Sunnah Dawah & Research Institute — offline service worker.
 * Vanilla JS (served statically from /sw.js, no dependencies).
 *
 * Strategies:
 *  - install:   precache the offline shell + core brand assets
 *  - activate:  delete caches from previous versions, take control
 *  - navigate:  network-first → cached page → cached /offline fallback
 *  - assets:    stale-while-revalidate (style, script, font, image)
 *  - other:     straight to network (never cached)
 *
 * Bypassed entirely (always network, never cached):
 *  /admin, /account, /login, /register and /api/*.
 *
 * Bump CACHE_VERSION (asr-v1 → asr-v2 …) to invalidate every cache
 * on the next activate — the old caches are then deleted.
 */
const CACHE_VERSION = "asr-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = "/offline";

/** App-shell + brand assets cached once at install time. */
const PRECACHE_URLS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

/** Routes that must never be served from or written to a cache. */
const BYPASS_PATHS = [/^\/admin(\/|$)/, /^\/account(\/|$)/, /^\/login(\/|$)/, /^\/register(\/|$)/, /^\/api\//];

/** Static sub-resources handled with stale-while-revalidate. */
const ASSET_DESTINATIONS = new Set(["style", "script", "font", "image"]);

/* ————— install: precache the offline shell ————— */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Precache each URL independently (cache: "reload" bypasses the HTTP
      // cache) so one failed asset can never break the whole install.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

/* ————— activate: purge caches from older versions ————— */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

/* ————— fetch: route by request shape ————— */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cross-origin requests and non-GET methods: network only.
  if (url.origin !== self.location.origin || request.method !== "GET") return;

  // Admin / auth / API routes: bypass the worker completely.
  if (BYPASS_PATHS.some((pattern) => pattern.test(url.pathname))) return;

  // Same-origin static sub-resources: stale-while-revalidate.
  if (ASSET_DESTINATIONS.has(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Same-origin page navigations: network-first with cache fallback.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
  }
  // Anything else falls through to the default network behaviour.
});

/** Serve from cache instantly, then refresh the cache from the network. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached || (await network) || Response.error();
}

/** Try the network first; when offline, fall back to the cached page
 *  and finally to the precached /offline shell. */
async function networkFirstNavigation(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (networkError) {
    const cachedPage = (await cache.match(request)) || (await caches.match(request));
    if (cachedPage) return cachedPage;
    const offlinePage = await caches.match(OFFLINE_URL, { ignoreSearch: true });
    return offlinePage || Response.error();
  }
}
