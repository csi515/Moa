const CACHE_NAME = 'moa-static-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const SUPABASE_API_PATHS = ['/auth/v1/', '/rest/v1/', '/functions/v1/', '/realtime/v1/', '/storage/v1/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

function isSupabaseHost(hostname) {
  return hostname.endsWith('.supabase.co') || hostname.endsWith('.supabase.in');
}

/** Auth/REST/RPC/Functions 및 외부 API — SW 캐시 금지 */
function isBusinessApiRequest(request) {
  const url = new URL(request.url);
  if (isSupabaseHost(url.hostname)) return true;
  if (SUPABASE_API_PATHS.some((path) => url.pathname.includes(path))) return true;
  if (url.origin !== self.location.origin) return true;
  return false;
}

function isSameOriginStaticAsset(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return /\.(?:js|css|mjs|map|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|json|webmanifest)$/i.test(
    url.pathname
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (isBusinessApiRequest(request)) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', copy);
            });
          }
          return response;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/')))
    );
    return;
  }

  if (!isSameOriginStaticAsset(request)) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networked = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cacheCopy);
            });
          }
          return response;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});
