// Service worker with version checking for Phone Dialer PWA
const VERSION = '0.0.1'; // Increment this when you release a new version
const CACHE_NAME = `dialer-static-v${VERSION}`;
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  // Take control of all pages immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  
  // Use network-first strategy for HTML files to always check for updates
  if (request.url.endsWith('.html') || request.url === self.registration.scope) {
    event.respondWith(
      fetch(request)
        .then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }
  
  // Use cache-first strategy for other assets
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(resp => {
        const ct = resp.headers.get('content-type') || '';
        if (resp.ok && (ct.includes('text') || ct.includes('javascript') || ct.includes('json') || ct.includes('image'))) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return resp;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
