/*
 * Offline support for weak village networks.
 * - Pages: network first, fall back to the last copy we saw (so saved schemes open offline).
 * - Build assets and fonts: cache first (their URLs change when content changes).
 * - API calls and RSC requests always go to the network.
 */
const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES).then((c) => c.addAll(["/hi", "/en"]).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![PAGES, ASSETS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (req.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/_next/image") || /\.(woff2?|svg|png|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  const wantsHtml = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (!wantsHtml) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(PAGES);
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        const hit = (await cache.match(req, { ignoreSearch: false })) || (await cache.match(url.pathname));
        if (hit) return hit;
        const lang = url.pathname.startsWith("/en") ? "/en" : "/hi";
        return (await cache.match(lang)) || new Response("Offline", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
      }
    })(),
  );
});
