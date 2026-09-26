"use strict";
const CACHE = "bchqs-chihuy-v0.5.2-viewport-fix-r2";
const RELATIVE_ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=052",
  "./app.js?v=052",
  "./manifest.webmanifest?v=052",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
const scopedUrl = path => new URL(path, self.registration.scope).href;
const ASSETS = RELATIVE_ASSETS.map(scopedUrl);
const INDEX = scopedUrl("./index.html");

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(hit => {
      if (hit) return hit;
      return fetch(event.request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") return caches.match(INDEX);
          return Response.error();
        });
    })
  );
});
