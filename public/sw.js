const CACHE_NAME = 'schoolhub-v1';
const APP_SHELL_CACHE = 'schoolhub-shell-v1';
const SYNC_TAG = 'sync-drafts';

// Assets to cache on install (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    Promise.all([
      caches.open(APP_SHELL_CACHE).then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL).catch(() => {
          console.log('[SW] Some app shell resources failed to cache (may be offline)');
        });
      }),
      caches.open(CACHE_NAME).then((cache) => cache),
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== APP_SHELL_CACHE && name !== CACHE_NAME)
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  if (isViteDevelopmentRequest(url)) {
    return;
  }

  // API requests - Network First, with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets - Cache First
  if (
    url.pathname.match(/\.(js|css|woff2|woff|ttf|eot|svg|png|jpg|jpeg|gif|webp)$/i) ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML and documents - Stale While Revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default - Network First
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

// Background Sync event - sync queued drafts when online
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    console.log('[SW] Syncing drafts...');
    event.waitUntil(syncDrafts());
  }
});

// Cache-first strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log(`[SW] Fetch failed for ${request.url}:`, error);
    return new Response('Offline - resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log(`[SW] Network failed, trying cache for ${request.url}:`, error);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }

    return new Response('Network error', { status: 503 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.log(`[SW] Stale-while-revalidate fetch failed: ${request.url}`, error);
      return cached || new Response('Offline', { status: 503 });
    });

  return cached || fetchPromise;
}

// Sync drafts when connection is restored
async function syncDrafts() {
  try {
    // Query the client for unsync drafts
    const clients = await self.clients.matchAll();
    if (clients.length === 0) {
      console.log('[SW] No clients available to sync drafts');
      return;
    }

    // Send message to client to sync
    clients[0].postMessage({
      type: 'SYNC_DRAFTS',
      timestamp: Date.now(),
    });

    console.log('[SW] Sent sync request to client');
  } catch (error) {
    console.error('[SW] Error syncing drafts:', error);
    throw error;
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service worker loaded');
