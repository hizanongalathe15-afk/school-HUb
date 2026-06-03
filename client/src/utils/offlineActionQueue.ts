import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig, type Method } from 'axios';
import { toast } from 'react-hot-toast';
import { requestSync } from './swManager';

type SerializedBody =
  | { kind: 'empty' }
  | { kind: 'json'; value: unknown }
  | { kind: 'text'; value: string }
  | { kind: 'formData'; entries: SerializedFormEntry[] };

interface SerializedFormEntry {
  key: string;
  value:
    | { kind: 'text'; value: string }
    | { kind: 'file'; name: string; type: string; lastModified: number; blob: Blob };
}

export interface QueuedAction {
  id: string;
  method: Method;
  url: string;
  baseURL?: string;
  headers?: Record<string, string>;
  params?: unknown;
  body: SerializedBody;
  route: string;
  title: string;
  createdAt: number;
  lastAttemptAt?: number;
  attempts: number;
  lastError?: string;
}

const DB_NAME = 'SchoolHub_OfflineActions';
const STORE_NAME = 'actions';
const DB_VERSION = 1;
const MUTATION_METHODS = new Set(['post', 'put', 'patch', 'delete']);
const MAX_ATTEMPTS = 8;

let dbPromise: Promise<IDBDatabase> | null = null;
let syncInProgress: Promise<{ synced: string[]; failed: string[] }> | null = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('route', 'route', { unique: false });
      }
    };
  });

  return dbPromise;
}

async function withStore<T>(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T> | void) {
  const db = await openDb();

  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = callback(store);

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve(request ? (request.result as T) : (undefined as T));
  });
}

function normalizeHeaders(headers: unknown): Record<string, string> {
  const output: Record<string, string> = {};
  if (!headers || typeof headers !== 'object') return output;

  Object.entries(headers as Record<string, unknown>).forEach(([key, value]) => {
    if (typeof value === 'string' && key.toLowerCase() !== 'content-length') {
      output[key] = value;
    }
  });

  return output;
}

async function serializeBody(data: unknown): Promise<SerializedBody> {
  if (data == null) return { kind: 'empty' };
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const entries: SerializedFormEntry[] = [];
    data.forEach((value, key) => {
      if (value instanceof File) {
        entries.push({
          key,
          value: {
            kind: 'file',
            name: value.name,
            type: value.type,
            lastModified: value.lastModified,
            blob: value,
          },
        });
      } else {
        entries.push({ key, value: { kind: 'text', value: String(value) } });
      }
    });
    return { kind: 'formData', entries };
  }
  if (typeof data === 'string') {
    try {
      return { kind: 'json', value: JSON.parse(data) };
    } catch {
      return { kind: 'text', value: data };
    }
  }
  return { kind: 'json', value: data };
}

function deserializeBody(body: SerializedBody): BodyInit | undefined {
  if (body.kind === 'empty') return undefined;
  if (body.kind === 'text') return body.value;
  if (body.kind === 'json') return JSON.stringify(body.value);

  const formData = new FormData();
  body.entries.forEach((entry) => {
    if (entry.value.kind === 'file') {
      formData.append(
        entry.key,
        new File([entry.value.blob], entry.value.name, {
          type: entry.value.type,
          lastModified: entry.value.lastModified,
        })
      );
    } else {
      formData.append(entry.key, entry.value.value);
    }
  });
  return formData;
}

function isAuthRequest(url = '') {
  return /\/auth\/(login|register|refresh-token|logout|forgot-password|reset-password)/.test(url);
}

function shouldQueue(config?: AxiosRequestConfig) {
  const method = config?.method?.toLowerCase();
  if (!method || !MUTATION_METHODS.has(method)) return false;
  if (!config?.url || isAuthRequest(config.url)) return false;
  if (config.offlineQueue === false) return false;
  return true;
}

function isNetworkFailure(error: any) {
  return !error?.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error';
}

function createId(method: string, url: string) {
  return `action-${Date.now()}-${method}-${url.replace(/[^a-z0-9]+/gi, '-').slice(0, 48)}`;
}

function actionTitle(config: AxiosRequestConfig) {
  const method = (config.method || 'POST').toUpperCase();
  return `${method} ${config.url || 'request'}`;
}

export async function queueAxiosAction(config: AxiosRequestConfig): Promise<QueuedAction> {
  const method = (config.method || 'post') as Method;
  const body = await serializeBody(config.data);
  const idempotencyKey = createId(method, config.url || 'request');
  const headers = normalizeHeaders(config.headers);

  if (body.kind === 'json') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  } else if (body.kind === 'formData') {
    Object.keys(headers).forEach((key) => {
      if (key.toLowerCase() === 'content-type') delete headers[key];
    });
  }

  headers['X-Offline-Action-Id'] = idempotencyKey;

  const action: QueuedAction = {
    id: idempotencyKey,
    method,
    url: config.url || '',
    baseURL: config.baseURL,
    headers,
    params: config.params,
    body,
    route: `${window.location.pathname}${window.location.search}`,
    title: actionTitle(config),
    createdAt: Date.now(),
    attempts: 0,
  };

  await withStore('readwrite', (store) => store.put(action));
  window.dispatchEvent(new CustomEvent('offline-actions:changed'));
  await requestSync();
  return action;
}

export async function listQueuedActions(): Promise<QueuedAction[]> {
  const actions = await withStore<QueuedAction[]>('readonly', (store) => store.getAll());
  return actions.sort((a, b) => a.createdAt - b.createdAt);
}

async function deleteAction(id: string) {
  await withStore('readwrite', (store) => store.delete(id));
}

async function updateAction(action: QueuedAction) {
  await withStore('readwrite', (store) => store.put(action));
}

function buildUrl(action: QueuedAction) {
  const url = new URL(action.url, action.baseURL || window.location.origin);
  if (action.params && typeof action.params === 'object') {
    Object.entries(action.params as Record<string, unknown>).forEach(([key, value]) => {
      if (value != null) url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

export async function syncQueuedActions() {
  if (syncInProgress) return syncInProgress;

  syncInProgress = (async () => {
    const synced: string[] = [];
    const failed: string[] = [];
    const actions = await listQueuedActions();

    for (const action of actions) {
      if (action.attempts >= MAX_ATTEMPTS) {
        failed.push(action.id);
        continue;
      }

      try {
        const headers = { ...(action.headers || {}) };
        const body = deserializeBody(action.body);
        if (action.body.kind === 'formData') {
          Object.keys(headers).forEach((key) => {
            if (key.toLowerCase() === 'content-type') delete headers[key];
          });
        }

        const response = await fetch(buildUrl(action), {
          method: String(action.method).toUpperCase(),
          headers,
          body,
          credentials: 'include',
        });

        if (!response.ok) {
          const message = response.status >= 400 && response.status < 500
            ? `Server rejected queued action with ${response.status}`
            : `Server unavailable: ${response.status}`;
          throw new Error(message);
        }

        await deleteAction(action.id);
        synced.push(action.id);
      } catch (error) {
        const updated: QueuedAction = {
          ...action,
          attempts: action.attempts + 1,
          lastAttemptAt: Date.now(),
          lastError: error instanceof Error ? error.message : 'Sync failed',
        };
        await updateAction(updated);
        failed.push(action.id);

        if (!navigator.onLine) break;
      }
    }

    window.dispatchEvent(new CustomEvent('offline-actions:changed'));
    window.dispatchEvent(new CustomEvent('offline-actions:synced', { detail: { synced, failed } }));

    if (synced.length > 0) {
      toast.success(`${synced.length} saved action${synced.length === 1 ? '' : 's'} synced.`);
    }

    return { synced, failed };
  })().finally(() => {
    syncInProgress = null;
  });

  return syncInProgress;
}

export async function handleOfflineAxiosError(error: any): Promise<AxiosResponse | never> {
  const config = error?.config as AxiosRequestConfig | undefined;
  if (!shouldQueue(config) || !isNetworkFailure(error)) {
    throw error;
  }

  const action = await queueAxiosAction(config!);
  toast.success('Server is unreachable. Your action was saved and will sync automatically.');

  return {
    data: {
      success: true,
      offlineQueued: true,
      queuedActionId: action.id,
      message: 'Saved offline. This action will sync automatically when the server is reachable.',
    },
    status: 202,
    statusText: 'Accepted Offline',
    headers: {},
    config: config! as InternalAxiosRequestConfig,
  };
}

export async function queueActionIfOffline(config: AxiosRequestConfig): Promise<AxiosResponse | null> {
  if (navigator.onLine || !shouldQueue(config)) return null;

  const action = await queueAxiosAction(config);
  toast.success('You are offline. Your action was saved and will sync automatically.');

  return {
    data: {
      success: true,
      offlineQueued: true,
      queuedActionId: action.id,
      message: 'Saved offline. This action will sync automatically when you are online.',
    },
    status: 202,
    statusText: 'Accepted Offline',
    headers: {},
    config: config as InternalAxiosRequestConfig,
  };
}

export const offlineActionQueue = {
  list: listQueuedActions,
  sync: syncQueuedActions,
  queueAxiosAction,
};
