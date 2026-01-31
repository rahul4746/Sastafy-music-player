/* ===============================
   Sastafy Music Player
   Service Worker
   =============================== */

const CACHE_NAME = "sastafy-v8";

const FILES_TO_CACHE = [
  "./",                // root
  "./index.html",
  "./js/style.css",
  "./js/player.js",
  "./storage.js",
  "./sw.js",
  "./manifest.json",

  // optional but recommended
  "./assets/images/default.jpg"
];

/* ---------- INSTALL ---------- */
self.addEventListener("install", event => {
  self.skipWaiting(); // activate immediately

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

/* ---------- ACTIVATE ---------- */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // remove old cache
          }
        })
      );
    })
  );

  self.clients.claim(); // take control instantly
});

/* ---------- FETCH ---------- */
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(networkResponse => {
        // Cache only same-origin GET requests
        if (
          event.request.method === "GET" &&
          event.request.url.startsWith(self.location.origin)
        ) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }

        return networkResponse;
      });
    })
  );
});






