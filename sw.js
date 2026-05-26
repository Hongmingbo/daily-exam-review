// Service Worker — 离线缓存，让学生在没网时也能看
const CACHE_NAME = 'zk-review-v29';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/dark-mode.js',
    '/features.js',
    '/questions.js',
    '/mindmap-data.js',
    '/mindmap.js',
    '/manifest.json',
    '/style.css',
    '/physics_basic.html',
    '/physics_paper.html',
    '/chinese_basic.html',
    '/chinese_paper.html',
    '/math_basic.html',
    '/math_paper.html',
    '/english_basic.html',
    '/english_paper.html',
    '/chemistry_basic.html',
    '/chemistry_paper.html',
    '/history_basic.html',
    '/history_paper.html',
    '/politics_basic.html',
    '/politics_paper.html',
    '/sitemap.xml',
    '/robots.txt',
    '/search-index.json'
  ];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - HTML: network-first (always fresh)
// - CSS/JS: stale-while-revalidate (fast from cache + silent background update)
// - Images: cache-first (large files, update on SW version bump)
self.addEventListener('fetch', (event) => {
  var url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.googleapis.com')) return;

  // HTML pages: network-first, fall back to cache
  if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // CSS and JS: stale-while-revalidate
  // Return cached version immediately (fast), then silently update from network in background.
  // Next visit gets the fresh version — no hard refresh needed!
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cached) => {
          // Background fetch to update cache for next visit
          var fetchPromise = fetch(event.request).then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => cached);

          // Return cached immediately if available, otherwise wait for network
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Images and other static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {});
    })
  );
});
