import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { draftStore, type StoredDraftFile } from '../utils/draftStore';
import { offlineActionQueue } from '../utils/offlineActionQueue';
import { useDraftSync } from '../hooks/useDraftSync';

interface FormDraftPayload {
  path: string;
  values: Record<string, string | boolean | string[]>;
  files: StoredDraftFile[];
  savedAt: number;
}

const FORM_DEBOUNCE_MS = 1200;

function formKey(form: HTMLFormElement, index: number) {
  const explicit = form.getAttribute('data-draft-id') || form.id || form.getAttribute('name');
  const path = `${window.location.pathname}${window.location.search}`;
  if (explicit) return `form:${path}:${explicit}`;

  const names = Array.from(form.elements)
    .map((element) => (element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).name)
    .filter(Boolean)
    .slice(0, 8)
    .join('|');

  return `form:${path}:${index}:${names || 'anonymous'}`;
}

function getElementValue(element: Element) {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
    return undefined;
  }

  if (!element.name || element.disabled) return undefined;
  if (element instanceof HTMLInputElement && element.type === 'password') return undefined;
  if (element instanceof HTMLInputElement && element.type === 'file') return undefined;
  if (element instanceof HTMLInputElement && element.type === 'checkbox') return element.checked;
  if (element instanceof HTMLInputElement && element.type === 'radio') return element.checked ? element.value : undefined;
  if (element instanceof HTMLSelectElement && element.multiple) {
    return Array.from(element.selectedOptions).map((option) => option.value);
  }
  return element.value;
}

async function readFormDraft(form: HTMLFormElement): Promise<FormDraftPayload | null> {
  const values: FormDraftPayload['values'] = {};
  const files: StoredDraftFile[] = [];

  Array.from(form.elements).forEach((element) => {
    const value = getElementValue(element);
    if (value !== undefined) {
      values[(element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).name] = value;
    }

    if (element instanceof HTMLInputElement && element.type === 'file' && element.name && element.files) {
      Array.from(element.files).forEach((file) => {
        files.push({
          fieldName: element.name,
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          blob: file,
        });
      });
    }
  });

  if (Object.keys(values).length === 0 && files.length === 0) return null;

  return {
    path: `${window.location.pathname}${window.location.search}`,
    values,
    files,
    savedAt: Date.now(),
  };
}

function hasMeaningfulDraft(payload: FormDraftPayload) {
  return Object.values(payload.values).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    return value.trim().length > 0;
  }) || payload.files.length > 0;
}

async function saveFormDraft(form: HTMLFormElement) {
  const forms = Array.from(document.querySelectorAll('form'));
  const payload = await readFormDraft(form);
  if (!payload || !hasMeaningfulDraft(payload)) return;

  await draftStore.save({
    id: formKey(form, forms.indexOf(form)),
    type: 'form',
    title: document.title || 'Saved form draft',
    content: JSON.stringify(payload),
    files: payload.files,
    metadata: {
      path: payload.path,
      route: window.location.pathname,
      formIndex: forms.indexOf(form),
      fieldCount: Object.keys(payload.values).length,
      fileCount: payload.files.length,
    },
  });

  window.dispatchEvent(new CustomEvent('drafts:changed'));
}

function restoreFormValues(form: HTMLFormElement, payload: FormDraftPayload) {
  Object.entries(payload.values).forEach(([name, value]) => {
    const fields = Array.from(form.elements).filter((element) => {
      return (element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).name === name;
    });

    fields.forEach((field) => {
      if (field instanceof HTMLInputElement && field.type === 'checkbox') {
        field.checked = Boolean(value);
      } else if (field instanceof HTMLInputElement && field.type === 'radio') {
        field.checked = field.value === value;
      } else if (field instanceof HTMLSelectElement && field.multiple && Array.isArray(value)) {
        Array.from(field.options).forEach((option) => {
          option.selected = value.includes(option.value);
        });
      } else if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement ||
        field instanceof HTMLSelectElement
      ) {
        field.value = Array.isArray(value) ? value[0] || '' : String(value);
      }

      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}

function useGlobalFormDrafts() {
  const location = useLocation();

  useEffect(() => {
    const timers = new WeakMap<HTMLFormElement, number>();

    const scheduleSave = (target: EventTarget | null) => {
      const element = target instanceof Element ? target : null;
      const form = element?.closest('form');
      if (!form || form.hasAttribute('data-no-draft')) return;

      const existing = timers.get(form);
      if (existing) window.clearTimeout(existing);

      const timer = window.setTimeout(() => {
        saveFormDraft(form).catch((error) => console.error('[Drafts] Failed to save form draft:', error));
      }, FORM_DEBOUNCE_MS);
      timers.set(form, timer);
    };

    const saveImmediately = (target: EventTarget | null) => {
      const element = target instanceof Element ? target : null;
      const form = element?.closest('form');
      if (!form || form.hasAttribute('data-no-draft')) return;
      saveFormDraft(form).catch((error) => console.error('[Drafts] Failed to save final form draft:', error));
    };

    const handleInput = (event: Event) => scheduleSave(event.target);
    const handleChange = (event: Event) => scheduleSave(event.target);
    const handleFocusOut = (event: Event) => saveImmediately(event.target);

    const handleSubmit = (event: Event) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) return;
      const forms = Array.from(document.querySelectorAll('form'));
      draftStore.delete(formKey(form, forms.indexOf(form))).catch(() => undefined);
    };

    const handleVisibility = () => {
      if (document.visibilityState !== 'hidden') return;
      document.querySelectorAll('form').forEach((form) => {
        if (!form.hasAttribute('data-no-draft')) {
          saveFormDraft(form).catch(() => undefined);
        }
      });
    };

    document.addEventListener('input', handleInput, true);
    document.addEventListener('change', handleChange, true);
    document.addEventListener('focusout', handleFocusOut, true);
    document.addEventListener('submit', handleSubmit, true);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleVisibility);

    return () => {
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('change', handleChange, true);
      document.removeEventListener('focusout', handleFocusOut, true);
      document.removeEventListener('submit', handleSubmit, true);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleVisibility);
    };
  }, []);

  useEffect(() => {
    const restoreTimer = window.setTimeout(async () => {
      const forms = Array.from(document.querySelectorAll('form')).filter((form) => !form.hasAttribute('data-no-draft'));
      if (forms.length === 0) return;

      for (const [index, form] of forms.entries()) {
        const draft = await draftStore.getById(formKey(form, index));
        if (!draft || draft.synced) continue;

        try {
          const payload = JSON.parse(draft.content) as FormDraftPayload;
          if (payload.path !== `${location.pathname}${location.search}`) continue;

          toast(
            (toastInstance) => (
              <div className="offline-restore-toast">
                <strong>Restore saved work?</strong>
                <span>Unsaved changes from your last session were found.</span>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      restoreFormValues(form, payload);
                      toast.dismiss(toastInstance.id);
                      toast.success('Draft restored.');
                    }}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      draftStore.delete(draft.id).catch(() => undefined);
                      toast.dismiss(toastInstance.id);
                    }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            ),
            { duration: 12000 }
          );
        } catch (error) {
          console.error('[Drafts] Failed to restore form draft:', error);
        }
      }
    }, 350);

    return () => window.clearTimeout(restoreTimer);
  }, [location.pathname, location.search]);
}

export default function OfflineResilience() {
  useDraftSync();
  useGlobalFormDrafts();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_OFFLINE_ACTIONS') {
        offlineActionQueue.sync().catch(() => undefined);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);

  return null;
}
