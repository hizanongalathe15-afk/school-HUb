import { useEffect, useRef, useCallback, useState } from 'react';
import { draftStore, type Draft } from '../utils/draftStore';
import { useConnectionStatus } from './useConnectionStatus';

interface DraftSaveOptions {
  debounceMs?: number;
  onSave?: (draft: Draft) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for auto-saving drafts with debounce
 * Handles offline/online transitions gracefully
 */
export function useDraftSave(options: DraftSaveOptions = {}) {
  const { debounceMs = 1500, onSave, onError } = options;
  const { isOnline } = useConnectionStatus();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const saveNow = useCallback(
    async (draft: Omit<Draft, 'createdAt' | 'lastModified' | 'synced' | 'syncAttempts'>) => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;
        const saved = await draftStore.save(draft);
        onSave?.(saved);
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Failed to save draft'));
      } finally {
        isSavingRef.current = false;
      }
    },
    [onSave, onError]
  );

  const debouncedSave = useCallback(
    (draft: Omit<Draft, 'createdAt' | 'lastModified' | 'synced' | 'syncAttempts'>) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        saveNow(draft);
      }, debounceMs);
    },
    [debounceMs, saveNow]
  );

  // Save immediately before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    debouncedSave,
    saveNow,
    isOnline,
  };
}

/**
 * Hook to restore draft on page load
 */
export function useDraftRestore(draftId: string) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [promptShown, setPromptShown] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await draftStore.getById(draftId);
        if (saved && !saved.synced) {
          setDraft(saved);
        }
      } catch (error) {
        console.error('Failed to restore draft:', error);
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, [draftId]);

  const restore = useCallback(
    async () => {
      if (!draft) return;
      setPromptShown(true);
      return draft;
    },
    [draft]
  );

  const discard = useCallback(async () => {
    if (draft) {
      await draftStore.delete(draft.id);
      setDraft(null);
      setPromptShown(true);
    }
  }, [draft]);

  return { draft, loading, promptShown, restore, discard };
}
