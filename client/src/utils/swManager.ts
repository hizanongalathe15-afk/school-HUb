/**
 * Service Worker registration and initialization
 */

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  if (import.meta.env.DEV) {
    await unregisterServiceWorker();
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent('sw:update-available'));
        }
      });
    });

    return registration;
  } catch (error) {
    return null;
  }
}

export function registerServiceWorkerWhenIdle() {
  if (typeof window === 'undefined') return;

  const run = () => {
    registerServiceWorker().catch(() => undefined);
  };

  const scheduleIdle = (window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  }).requestIdleCallback;

  if (scheduleIdle) {
    scheduleIdle(run, { timeout: 3000 });
    return;
  }

  window.setTimeout(run, 1200);
}

/**
 * Unregister service worker (for development)
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
  }
}

/**
 * Request sync from service worker
 */
export async function requestSync(tag = 'sync-offline-actions') {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const syncRegistration = registration as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    };

    if (!syncRegistration.sync) {
      return false;
    }
    await syncRegistration.sync.register(tag);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Listen for sync messages from service worker
 */
export function onSyncMessage(callback: (data: any) => void) {
  if (!('serviceWorker' in navigator)) {
    return () => {};
  }

  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'SYNC_DRAFTS') {
      callback(event.data);
    }
  };

  navigator.serviceWorker.addEventListener('message', handleMessage as any);

  return () => {
    navigator.serviceWorker.removeEventListener('message', handleMessage as any);
  };
}
