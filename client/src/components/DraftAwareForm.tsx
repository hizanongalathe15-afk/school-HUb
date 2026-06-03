/**
 * Example implementation of draft saving in a messaging/form component
 * This is a template that can be adapted for different form types
 */

import React, { useState, useEffect } from 'react';
import { useDraftSave, useDraftRestore } from '../hooks/useDraftSave';
import { useDraftSync } from '../hooks/useDraftSync';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import DraftStatus from './ui/DraftStatus';
import DraftRestorePrompt from './ui/DraftRestorePrompt';
import { draftStore } from '../utils/draftStore';
import toast from 'react-hot-toast';

interface DraftAwareFormProps {
  draftId: string;
  draftType: string;
  title?: string;
  onSubmit?: (content: string) => Promise<void>;
  initialContent?: string;
}

export default function DraftAwareForm({
  draftId,
  draftType,
  title,
  onSubmit,
  initialContent = '',
}: DraftAwareFormProps) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error' | 'offline' | 'synced'
  >('idle');
  const [lastSaved, setLastSaved] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isOnline } = useConnectionStatus();
  const { debouncedSave, saveNow } = useDraftSave({
    onSave: () => {
      setSaveStatus(isOnline ? 'saved' : 'offline');
      setLastSaved(Date.now());
    },
    onError: () => {
      setSaveStatus('error');
    },
  });

  const { draft: savedDraft, promptShown, restore, discard } = useDraftRestore(draftId);
  useDraftSync(); // Initialize background sync

  // Handle draft restoration
  useEffect(() => {
    if (savedDraft && !promptShown) {
      // Prompt will be shown by the component
    }
  }, [savedDraft, promptShown]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setSaveStatus('saving');

    // Auto-save with debounce
    debouncedSave({
      id: draftId,
      type: draftType,
      content: newContent,
      title,
      metadata: { entityId: draftId },
    });
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save final version before submitting
      await saveNow({
        id: draftId,
        type: draftType,
        content,
        title,
        metadata: { entityId: draftId },
      });

      if (onSubmit) {
        await onSubmit(content);
      }

      // Mark as synced and clear draft
      await draftStore.delete(draftId);
      setContent('');
      setSaveStatus('synced');
      toast.success('Saved successfully!');
    } catch (error) {
      console.error('Submit error:', error);
      setSaveStatus('error');
      toast.error('Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreDraft = async () => {
    if (savedDraft) {
      setContent(savedDraft.content);
      toast.success('Draft restored');
    }
  };

  const handleDiscardDraft = async () => {
    await discard();
    toast('Draft discarded');
  };

  return (
    <div className="draft-aware-form">
      <DraftRestorePrompt
        open={!!savedDraft && !promptShown}
        title="Restore unsaved draft?"
        message={`You have an unsaved draft from ${new Date(savedDraft?.lastModified || 0).toLocaleString()}`}
        draftTime={savedDraft?.lastModified}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />

      <div className="draft-aware-form__header">
        {title && <h2>{title}</h2>}
        <DraftStatus
          status={saveStatus}
          isOnline={isOnline}
          lastSaved={lastSaved}
        />
      </div>

      <textarea
        className="draft-aware-form__input"
        value={content}
        onChange={handleContentChange}
        placeholder="Start typing... Your work is automatically saved."
        rows={8}
      />

      <div className="draft-aware-form__actions">
        <button
          className="draft-aware-form__btn draft-aware-form__btn--submit"
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? 'Saving...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
