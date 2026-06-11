const CACHE_NAME = "chartscan-ai-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/icon.svg",
  "/manifest.json"
];

// Install Service Worker and cache essential static assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch((err) => {
      console.warn("Service Worker pre-caching failed:", err);
    })
  );
});

// Activate Service Worker and clean stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event listener supporting offline/cached fallback with dynamic network bypass
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Bypass service worker for API paths to prevent proxying dynamic backend endpoints
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // Cache successful GET responses for assets
        if (req.method === "GET" && networkResponse.status === 200 && (url.protocol === "http:" || url.protocol === "https:")) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to static cache if network request fails
        return caches.match(req).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If accessing root/index, always return index.html cached if offline
          if (req.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Ağ hatası: Çevrimdışı durumdasınız ve bu kaynak önbellekte bulunmuyor.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ "Content-Type": "text/plain; charset=utf-8" })
          });
        });
      })
  );
});
