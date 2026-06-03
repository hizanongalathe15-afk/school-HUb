import { useCallback, useEffect } from 'react';
import { draftStore } from '../utils/draftStore';
import { useOnConnectionChange } from './useConnectionStatus';
import { onSyncMessage } from '../utils/swManager';

/**
 * Hook to handle background sync of drafts when connection restored
 */
export function useDraftSync() {
  const handleConnectionChange = useCallback((online: boolean) => {
    if (online) {
      syncDrafts().catch(() => undefined);
    }
  }, []);

  const isOnline = useOnConnectionChange(handleConnectionChange);

  useEffect(() => {
    // Listen for sync messages from service worker
    const unsubscribe = onSyncMessage(async (data) => {
      if (data?.tag && data.tag !== 'sync-drafts') return;
      await syncDrafts();
    });

    return unsubscribe;
  }, []);

  return { isOnline };
}

/**
 * Sync all unsync drafts to the server
 */
export async function syncDrafts() {
  try {
    const unsynced = (await draftStore.getUnsynced()).filter((draft) => draft.type !== 'form');

    if (unsynced.length === 0) {
      return { synced: [], failed: [] };
    }

    const synced = [];
    const failed = [];

    for (const draft of unsynced) {
      try {
        // Call appropriate sync endpoint based on draft type
        const response = await syncDraftToServer(draft);

        if (response.ok) {
          await draftStore.markSynced(draft.id);
          synced.push(draft.id);
        } else {
          await draftStore.incrementSyncAttempts(
            draft.id,
            `Server error: ${response.status}`
          );
          failed.push(draft.id);
        }
      } catch (error) {
        await draftStore.incrementSyncAttempts(
          draft.id,
          error instanceof Error ? error.message : 'Unknown error'
        );
        failed.push(draft.id);
      }
    }

    window.dispatchEvent(
      new CustomEvent('drafts:synced', {
        detail: { synced, failed },
      })
    );

    return { synced, failed };
  } catch (error) {
    throw error;
  }
}

/**
 * Send a draft to the server (customize based on your API)
 */
async function syncDraftToServer(draft: any) {
  // Map draft types to appropriate API endpoints
  const endpointMap: Record<string, string> = {
    message: '/messages',
    homework: '/homework',
    announcement: '/announcements',
    assignment: '/assignments',
    report: '/reports',
  };

  const endpoint = endpointMap[draft.type] || '/drafts';

  // Add draft content and metadata
  const payload = {
    ...draft.metadata,
    content: draft.content,
    title: draft.title,
    isDraft: false,
    syncedAt: Date.now(),
  };

  const response = await fetch(`/api${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
    },
    body: JSON.stringify(payload),
  });

  return response;
}
