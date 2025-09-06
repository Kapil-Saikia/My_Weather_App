const VERSION = 'nimbus-sw-v2';
const CORE_ASSETS = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // Never intercept API calls; let network handle errors directly
  if (url.pathname.startsWith('/api/')) {
    return; // do not call respondWith -> browser performs default fetch
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((networkRes) => {
        caches.open(VERSION).then((cache) => cache.put(req, networkRes.clone())).catch(() => {});
        return networkRes;
      }).catch(() => cached || Response.error());
      return cached || fetchPromise;
    })
  );
});
