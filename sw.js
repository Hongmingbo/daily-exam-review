// Service Worker — 离线缓存，让学生在没网时也能看
const CACHE_NAME = 'zk-review-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dark-mode.js',
  '/features.js',
  '/mindmap-data.js',
  '/mindmap.js',
  '/manifest.json',
  '/style.css',
  // Each subject page
  '/physics_basic.html', '/physics.html', '/physics_paper.html',
  '/chinese_basic.html', '/chinese.html', '/chinese_paper.html',
  '/math_basic.html', '/math.html', '/math_paper.html',
  '/english_basic.html', '/english.html', '/english_paper.html',
  '/chemistry_basic.html', '/chemistry.html', '/chemistry_paper.html',
  '/history_basic.html', '/history.html', '/history_paper.html',
  '/politics_basic.html', '/politics.html', '/politics_paper.html',
  // SEO + utility
  '/sitemap.xml', '/robots.txt', '/search-index.json',
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

// Fetch: network-first for HTML (fresh content), cache-first for static assets
self.addEventListener('fetch', (event) => {
  var url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests (e.g. Google Fonts)
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.googleapis.com')) return;

  // For HTML pages: network-first, fall back to cache
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

  // For static assets (CSS, JS, images): cache-first
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
