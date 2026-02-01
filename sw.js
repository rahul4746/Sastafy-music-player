/* ===============================
   Sastafy Music Player
   Service Worker
   =============================== */

const CACHE_NAME = "sastafy-v2.0"; // ⬅️ bump version to force update

const FILES_TO_CACHE = [
  "/",                       // root
  "/index.html",
  "/manifest.json",

  // JS
  "/js/player.js",
  "/js/storage.js",

  // CSS
  "/js/style.css",

  // Images (IMPORTANT)
  "/assets/images/default.png",

  // Icons (PWA)
  "/assets/icons/app.png"
];

/* ---------- INSTALL ---------- */
self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

/* ---------- ACTIVATE ---------- */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // remove old broken caches
          }
        })
      )
    )
  );

  self.clients.claim();
});

/* ---------- FETCH ---------- */
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (
            response &&
            response.status === 200 &&
            event.request.url.startsWith(self.location.origin)
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // fallback for missing images
          if (event.request.destination === "image") {
            return caches.match("/assets/images/default.png");
          }
        });
    })
  );
});




