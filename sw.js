// Service Worker — 离线缓存，让学生在没网时也能看
const CACHE_NAME = 'zk-review-v37';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/math_basic.html',
    '/english_basic.html',
    '/chinese_basic.html',
    '/physics_basic.html',
    '/chemistry_basic.html',
    '/history_basic.html',
    '/politics_basic.html',
    '/mindmap-data.js',
    '/mindmap.js',
    '/questions.js',
    '/dark-mode.js',
    '/features.js',
    '/style.css',
    '/manifest.json',
    '/emergency.html',
    '/mistakes.html',
    '/feedback.html',
    '/checkin.html',
    '/checkin.js',
    '/math_paper.html',
    '/english_paper.html',
    '/chinese_paper.html',
    '/physics_paper.html',
    '/chemistry_paper.html',
    '/history_paper.html',
    '/politics_paper.html'
];

// 安装时预缓存静态资源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

// 激活时清理旧版本
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 网络请求：优先从网络获取，无网时降级到缓存
self.addEventListener('fetch', function(event) {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // 网络响应正常，更新缓存
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // 网络失败，从缓存读取
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          // 如果是 HTML 页面请求，返回 index.html（SPA fallback）
          if (event.request.headers.get('Accept') && 
              event.request.headers.get('Accept').indexOf('text/html') !== -1) {
            return caches.match('/');
          }
          return new Response('离线中，请稍后重试', {
            status: 503,
            statusText: '服务不可用',
            headers: new Headers({
              'Content-Type': 'text/plain; charset=utf-8'
            })
          });
        });
      })
  );
});
