/**
 * 정적 아이콘만 캐시. index.html / 해시 JS를 캐시하면 배포 후 예전 청크 404가 난다.
 */
const CACHE_NAME = 'moa-static-v3';
const STATIC_ASSETS = [
  '/manifest.json',
  '/pwa-icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const SUPABASE_API_PATHS = ['/auth/v1/', '/rest/v1/', '/functions/v1/', '/realtime/v1/', '/storage/v1/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
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

function isDocumentNavigation(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

/** SPA 셸·OAuth 콜백 쿼리 — HTML로 취급하고 캐시하지 않음 */
function isSpaShellRequest(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  const path = url.pathname;
  if (path === '/' || path === '/index.html') return true;
  return !path.includes('.') && !path.startsWith('/assets/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin === self.location.origin && requestUrl.pathname === '/sw.js') {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (isBusinessApiRequest(request)) {
    event.respondWith(fetch(request));
    return;
  }

  if (isDocumentNavigation(request) || isSpaShellRequest(request)) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(
        () =>
          new Response('오프라인입니다. 연결 후 다시 시도해 주세요.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
      )
    );
    return;
  }

  if (!isSameOriginStaticAsset(request)) {
    event.respondWith(
      fetch(request).catch(
        () => new Response('', { status: 504, statusText: 'Gateway Timeout' })
      )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const cacheCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cacheCopy);
          });
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || new Response('', { status: 504 })))
  );
});
