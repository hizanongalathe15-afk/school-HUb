import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAfterOpen?: () => void;
  onAfterClose?: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  className?: string;
  backdropClassName?: string;
  contentClassName?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventScroll?: boolean;
  initialFocus?: React.MutableRefObject<HTMLElement | null>;
  footer?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onAfterOpen,
  onAfterClose,
  title,
  children,
  size = 'md',
  position = 'center',
  className,
  backdropClassName,
  contentClassName,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  preventScroll = true,
  initialFocus,
  footer,
  isLoading = false,
  loadingText = 'Loading...',
}) => {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle focus management
  useEffect(() => {
    if (!isOpen || !mounted) return;

    // Save previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus on modal or specified element
    const timeoutId = setTimeout(() => {
      if (initialFocus?.current) {
        initialFocus.current.focus();
      } else if (modalRef.current) {
        modalRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isOpen, mounted, initialFocus]);

  // Handle body scroll prevention
  useEffect(() => {
    if (!mounted) return;

    if (isOpen && preventScroll) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Adjust for scrollbar width if needed
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, mounted, preventScroll]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      onAfterOpen?.();
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    } else {
      onAfterClose?.();
    }
  }, [isOpen, onAfterOpen, onAfterClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  // Restore focus on unmount
  useEffect(() => {
    return () => {
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  if (!mounted) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[90vw] h-[90vh]',
  };

  const positionClasses = {
    center: 'items-center',
    top: 'items-start pt-10',
    bottom: 'items-end pb-10',
  };

  const animationClasses = isOpen && !isAnimating
    ? 'opacity-100 scale-100'
    : 'opacity-0 scale-95';

  return createPortal(
    <div
      className={clsx(
        'fixed inset-0 z-50 overflow-y-auto',
        positionClasses[position],
        {
          'pointer-events-none': !isOpen,
        }
      )}
      aria-modal="true"
      aria-hidden={!isOpen}
      role="dialog"
      aria-label={title || 'Modal'}
    >
      <div
        className={clsx(
          'fixed inset-0 transition-all duration-300',
          {
            'bg-black/50 backdrop-blur-sm': isOpen,
            'bg-black/0 backdrop-blur-none pointer-events-none': !isOpen,
          },
          backdropClassName
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          tabIndex={-1}
          className={clsx(
            'relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl transition-all duration-300 w-full',
            sizeClasses[size],
            animationClasses,
            {
              'pointer-events-auto': isOpen,
              'pointer-events-none': !isOpen,
            },
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-xl flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{loadingText}</p>
              </div>
            </div>
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <div className={clsx(
              'flex items-center justify-between',
              'px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700',
              !title && showCloseButton && 'justify-end'
            )}>
              {title && (
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={clsx(
                    'rounded-lg p-1 transition-colors',
                    'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={clsx(
            'px-6 py-4',
            {
              'opacity-50 pointer-events-none': isLoading,
            },
            contentClassName
          )}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Confirmation Modal helper
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}) => {
  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
              variantClasses[variant],
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      }
    >
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </Modal>
  );
};