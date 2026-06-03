const CACHE_NAME = 'school-hub-runtime-v2';
const SHELL_CACHE = 'school-hub-shell-v2';
const SYNC_TAGS = new Set(['sync-drafts', 'sync-form-submissions', 'sync-offline-actions']);
const SHELL_ASSETS = ['/', '/index.html', '/offline.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => ![CACHE_NAME, SHELL_CACHE].includes(key)).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (isViteDevelopmentRequest(url)) {
    return;
  }

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request, '/index.html'));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin === self.location.origin && /\.(js|css|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|avif|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

function isViteDevelopmentRequest(url) {
  if (url.origin !== self.location.origin) return false;
  return (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('/__vite') ||
    /\.(tsx?|jsx?)$/i.test(url.pathname)
  );
}

self.addEventListener('sync', (event) => {
  if (SYNC_TAGS.has(event.tag)) {
    const messageType = event.tag === 'sync-drafts' ? 'SYNC_DRAFTS' : 'SYNC_OFFLINE_ACTIONS';
    event.waitUntil(notifyClients(messageType, { tag: event.tag }));
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'REQUEST_SYNC') {
    const tag = event.data.tag || 'sync-offline-actions';
    const messageType = tag === 'sync-drafts' ? 'SYNC_DRAFTS' : 'SYNC_OFFLINE_ACTIONS';
    event.waitUntil(notifyClients(messageType, { tag }));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.destination === 'video') {
      return new Response(null, { status: 204 });
    }
    return new Response(JSON.stringify({ offline: true, message: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request, fallbackUrl) {
  const runtime = await caches.open(CACHE_NAME);
  const shell = await caches.open(SHELL_CACHE);
  const cached = await runtime.match(request);
  const fallback = fallbackUrl ? await shell.match(fallbackUrl) : undefined;

  const fresh = fetch(request)
    .then((response) => {
      if (response.ok) runtime.put(request, response.clone());
      return response;
    })
    .catch(() => cached || fallback || new Response('Offline', { status: 503 }));

  return cached || fresh;
}

async function notifyClients(type, payload = {}) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach((client) => {
    client.postMessage({ type, timestamp: Date.now(), ...payload });
  });
}
