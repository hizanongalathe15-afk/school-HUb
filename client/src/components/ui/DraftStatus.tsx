import React from 'react';
import { Wifi, WifiOff, Save, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import './DraftStatus.css';

export interface DraftStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'offline' | 'synced';
  isOnline: boolean;
  message?: string;
  lastSaved?: number;
}

export default function DraftStatus({
  status,
  isOnline,
  message,
  lastSaved,
}: DraftStatusProps) {
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return <Save size={16} className="draft-status__icon draft-status__icon--saving" />;
      case 'saved':
      case 'synced':
        return <CheckCircle size={16} className="draft-status__icon draft-status__icon--success" />;
      case 'error':
        return <AlertCircle size={16} className="draft-status__icon draft-status__icon--error" />;
      case 'offline':
        return <WifiOff size={16} className="draft-status__icon draft-status__icon--offline" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (message) {
      return message;
    }
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaved ? `Saved ${getTimeAgo(lastSaved)}` : 'Saved';
      case 'synced':
        return 'Synced';
      case 'error':
        return 'Failed to save';
      case 'offline':
        return 'Offline - saving locally';
      default:
        return '';
    }
  };

  return (
    <div className={`draft-status draft-status--${status} ${!isOnline ? 'draft-status--offline-mode' : ''}`}>
      <div className="draft-status__content">
        {getStatusIcon()}
        <span className="draft-status__text">{getStatusText()}</span>
        {!isOnline && <WifiOff size={14} className="draft-status__connection-icon" />}
      </div>
    </div>
  );
}
