/**
 * Offline-first utilities for handling various form inputs
 * Saves any form data to IndexedDB for recovery if needed
 */

import { draftStore } from './draftStore';

export interface FormData {
  [key: string]: any;
}

/**
 * Auto-save form data to IndexedDB
 */
export async function saveFormData(
  formId: string,
  data: FormData,
  formType = 'form'
) {
  try {
    await draftStore.save({
      id: `form-${formId}-${Date.now()}`,
      type: formType,
      content: JSON.stringify(data),
      title: `Auto-saved form: ${formId}`,
      metadata: { formId, savedFields: Object.keys(data) },
    });
  } catch (error) {
    console.error('[Offline] Failed to save form data:', error);
  }
}

/**
 * Retrieve saved form data
 */
export async function getFormData(formId: string) {
  try {
    const drafts = await draftStore.getByType('form');
    const relevant = drafts.filter(
      (d) => d.metadata?.formId === formId && !d.synced
    );

    if (relevant.length === 0) {
      return null;
    }

    // Return most recent
    const latest = relevant[0];
    return JSON.parse(latest.content);
  } catch (error) {
    console.error('[Offline] Failed to retrieve form data:', error);
    return null;
  }
}

/**
 * Clear saved form data
 */
export async function clearFormData(formId: string) {
  try {
    const drafts = await draftStore.getByType('form');
    const toDelete = drafts.filter((d) => d.metadata?.formId === formId);

    for (const draft of toDelete) {
      await draftStore.delete(draft.id);
    }
  } catch (error) {
    console.error('[Offline] Failed to clear form data:', error);
  }
}

/**
 * Listen for page visibility changes and save before page closes
 */
export function listenForPageClose(callback: () => Promise<void>) {
  const handleBeforeUnload = async () => {
    try {
      await callback();
    } catch (error) {
      console.error('[Offline] Error in beforeunload:', error);
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      handleBeforeUnload();
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
