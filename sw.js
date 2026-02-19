/* ===============================
   BeatFlow Music Player
   Service Worker
   =============================== */

const CACHE_NAME = "beatflow-v2.1"; // ⬅️ bump version to force update

const FILES_TO_CACHE = [
  "./",                       // root
  "./index.html",
  "./manifest.json",

  // JS - ALL MODULES
  "./js/player.js",
  "./js/storage.js",
  "./js/control.js",
  "./js/time.js",
  "./js/queue.js",
  "./js/queue-ui.js",
  "./js/now-playing.js",
  "./js/playlist-ui.js",
  "./js/playlist-storage.js",
  "./js/playlist-song-panel.js",
  "./js/back-handler.js",
  "./js/resume.js",
  "./js/install.js",

  // CSS
  "./style.css",

  // Images
  "./assets/images/default.png",

  // Icons (PWA)
  "./icons/app.png"
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
