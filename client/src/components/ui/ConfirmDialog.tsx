import { AlertTriangle, AlertCircle, CheckCircle, Info, Loader, X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'default' | 'warning' | 'success';
  icon?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'default',
  icon,
  onConfirm,
  onCancel,
  loading = false
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return undefined;

    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', closeFromEscape, true);
    return () => document.removeEventListener('keydown', closeFromEscape, true);
  }, [onCancel, open, loading]);

  if (!open) return null;

  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'danger':
        return <AlertTriangle size={24} className="text-red-500" aria-hidden="true" />;
      case 'warning':
        return <AlertCircle size={24} className="text-amber-500" aria-hidden="true" />;
      case 'success':
        return <CheckCircle size={24} className="text-green-500" aria-hidden="true" />;
      default:
        return <Info size={24} className="text-blue-500" aria-hidden="true" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'bg-red-100 text-red-600',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          bg: 'bg-red-50 border-red-200',
        };
      case 'warning':
        return {
          icon: 'bg-amber-100 text-amber-600',
          button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
          bg: 'bg-amber-50 border-amber-200',
        };
      case 'success':
        return {
          icon: 'bg-green-100 text-green-600',
          button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          bg: 'bg-green-50 border-green-200',
        };
      default:
        return {
          icon: 'bg-blue-100 text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          bg: 'bg-blue-50 border-blue-200',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div
      className="confirm-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <section 
        className={`confirm-dialog confirm-dialog--${type}`}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="confirm-title" 
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="confirm-dialog__close" type="button" onClick={onCancel} disabled={loading} aria-label="Close dialog">
          <X size={17} />
        </button>

        <div className="confirm-dialog__hero">
          <div className={`confirm-dialog__icon ${colors.icon}`}>
            {loading ? <Loader size={28} className="animate-spin" /> : getIcon()}
          </div>
          <div>
            <h2 id="confirm-title">{title}</h2>
            <p>{message}</p>
          </div>
        </div>

        <div className="confirm-dialog__actions">
          <button type="button" onClick={onCancel} disabled={loading} className="confirm-dialog__cancel">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`confirm-dialog__confirm ${colors.button}`}>
            {loading && <Loader size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
