/**
 * IndexedDB-backed draft store for reliable offline-first draft saving
 */

export interface Draft {
  id: string;
  type: string; // e.g., 'message', 'homework', 'announcement', 'form'
  entityId?: string; // The entity being drafted (e.g., student ID, class ID)
  title?: string;
  content: string;
  files?: StoredDraftFile[];
  metadata?: Record<string, any>;
  createdAt: number;
  lastModified: number;
  synced: boolean; // Whether this draft has been sent to the server
  syncAttempts: number;
  lastSyncError?: string;
}

export interface StoredDraftFile {
  fieldName: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  blob: Blob;
}

class DraftStoreImpl {
  private dbName = 'SchoolHub_Drafts';
  private storeName = 'drafts';
  private dbVersion = 2;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('lastModified', 'lastModified', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  async save(draft: Omit<Draft, 'createdAt' | 'lastModified' | 'synced' | 'syncAttempts'>): Promise<Draft> {
    if (!this.db) {
      await this.init();
    }

    const now = Date.now();
    const existingDraft = await this.getById(draft.id);

    const draftToSave: Draft = {
      ...draft,
      createdAt: existingDraft?.createdAt ?? now,
      lastModified: now,
      synced: false,
      syncAttempts: existingDraft?.syncAttempts ?? 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(draftToSave);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(draftToSave);
    });
  }

  async getById(id: string): Promise<Draft | undefined> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getByType(type: string): Promise<Draft[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('type');
      const request = index.getAll(type);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result as Draft[];
        resolve(results.sort((a, b) => b.lastModified - a.lastModified));
      };
    });
  }

  async list(): Promise<Draft[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result as Draft[];
        resolve(results.sort((a, b) => b.lastModified - a.lastModified));
      };
    });
  }

  async delete(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getUnsynced(): Promise<Draft[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as Draft[]);
    });
  }

  async markSynced(id: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    const draft = await this.getById(id);
    if (!draft) return;

    const updated: Draft = {
      ...draft,
      synced: true,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(updated);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async incrementSyncAttempts(id: string, error?: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    const draft = await this.getById(id);
    if (!draft) return;

    const updated: Draft = {
      ...draft,
      syncAttempts: draft.syncAttempts + 1,
      lastSyncError: error,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(updated);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const draftStore = new DraftStoreImpl();
