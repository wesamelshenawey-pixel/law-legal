// Service Worker for Office Legal Management PWA & Offline-First Caching
const CACHE_NAME = "wesam-law-office-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/index.css"
];

// Install Service Worker and cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell and offline assets");
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("[Service Worker] Pre-caching non-blocking warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Service Worker and clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network-first with cache fallback
self.addEventListener("fetch", (event) => {
  // Ignore non-GET and firestore/googleapis network calls from service worker cache
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("firestore.googleapis.com") ||
    event.request.url.includes("identitytoolkit.googleapis.com") ||
    event.request.url.includes("firebaseio.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback to cache when offline
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // If navigating to a page offline, return index.html
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }
        return new Response("Offline Content Unavailable", {
          status: 503,
          statusText: "Service Unavailable Offline"
        });
      })
  );
});
