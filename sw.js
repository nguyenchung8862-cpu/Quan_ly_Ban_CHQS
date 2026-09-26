"use strict";
const CACHE = "bchqs-chihuy-v0.7-github-only-r1";
const RELATIVE_ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=070",
  "./app.js?v=070",
  "./manifest.webmanifest?v=070",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
const scopedUrl = path => new URL(path, self.registration.scope).href;
const ASSETS = RELATIVE_ASSETS.map(scopedUrl);
const INDEX = scopedUrl("./index.html");
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch", event => {
  if(event.request.method!=="GET")return;
  const u=new URL(event.request.url); if(u.origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(r=>{
    if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}
    return r;
  }).catch(()=>caches.match(event.request).then(hit=>hit||(event.request.mode==="navigate"?caches.match(INDEX):Response.error()))));
});
