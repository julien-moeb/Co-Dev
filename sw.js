/* Fonctionnement hors connexion. La page est cherchée d'abord sur le réseau (mises à jour immédiates), avec repli sur la copie locale ;
   les autres fichiers sont servis depuis la copie locale. Les requêtes partielles (lecture audio) ne sont pas interceptées. */
const CACHE = "codev-v5";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png",
  "./sounds/zen.wav", "./sounds/carillon.wav", "./sounds/clochette.wav", "./sounds/signal.wav"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || r.headers.has("range")) return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", cp)); } return res; })
      .catch(() => caches.match("./index.html").then(h => h || caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => {
    const net = fetch(r).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(r, res.clone())); return res; }).catch(() => hit);
    return hit || net;
  }));
});
