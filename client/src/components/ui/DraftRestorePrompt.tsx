import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import './DraftRestorePrompt.css';

export interface DraftRestorePromptProps {
  open: boolean;
  title: string;
  message: string;
  draftTime?: number;
  onRestore: () => void;
  onDiscard: () => void;
  loading?: boolean;
}

export default function DraftRestorePrompt({
  open,
  title,
  message,
  draftTime,
  onRestore,
  onDiscard,
  loading = false,
}: DraftRestorePromptProps) {
  if (!open) return null;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="draft-restore-backdrop">
      <div className="draft-restore-prompt">
        <div className="draft-restore-prompt__header">
          <AlertTriangle size={24} className="draft-restore-prompt__icon" />
          <h2 className="draft-restore-prompt__title">{title}</h2>
          <button
            className="draft-restore-prompt__close"
            onClick={onDiscard}
            disabled={loading}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="draft-restore-prompt__content">
          <p className="draft-restore-prompt__message">{message}</p>
          {draftTime && (
            <p className="draft-restore-prompt__timestamp">
              Saved: {formatTime(draftTime)}
            </p>
          )}
        </div>

        <div className="draft-restore-prompt__actions">
          <button
            className="draft-restore-prompt__btn draft-restore-prompt__btn--discard"
            onClick={onDiscard}
            disabled={loading}
          >
            <X size={16} />
            Discard
          </button>
          <button
            className="draft-restore-prompt__btn draft-restore-prompt__btn--restore"
            onClick={onRestore}
            disabled={loading}
          >
            {loading ? (
              <>Loading...</>
            ) : (
              <>
                <Check size={16} />
                Restore Draft
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
