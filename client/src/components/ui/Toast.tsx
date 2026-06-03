import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { CheckCircle, XCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';

interface ToastProps {
  id?: string;
  message: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  position?: ToastPosition;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  showIcon?: boolean;
  showProgress?: boolean;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  icon?: React.ReactNode;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  description,
  type = 'info',
  duration = 5000,
  position = 'top-right',
  onClose,
  onMouseEnter,
  onMouseLeave,
  showIcon = true,
  showProgress = true,
  dismissible = true,
  action,
  className,
  icon,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-500',
      progressColor: 'bg-green-500',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-500',
      progressColor: 'bg-red-500',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-500',
      progressColor: 'bg-yellow-500',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-500',
      progressColor: 'bg-blue-500',
    },
  };

  const config = typeConfig[type];
  const IconComponent = icon ? () => <>{icon}</> : config.icon;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    if (!isPaused && isVisible) {
      startTimeRef.current = Date.now();
      
      // Progress interval
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, remainingTimeRef.current - elapsed);
        const newProgress = (remaining / duration) * 100;
        setProgress(newProgress);
        
        if (remaining <= 0) {
          clearInterval(progressIntervalRef.current);
        }
      }, 16); // ~60fps

      // Close timer
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, remainingTimeRef.current);
    }
  }, [duration, isPaused, isVisible, onClose]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [startTimer]);

  const handleMouseEnter = () => {
    if (!isPaused) {
      // Pause timer
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      setIsPaused(true);
    }
    onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    if (isPaused) {
      setIsPaused(false);
      startTimer();
    }
    onMouseLeave?.();
  };

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const animationClass = isVisible 
    ? 'animate-in slide-in-from-top-2 fade-in duration-300'
    : 'animate-out slide-out-to-top-2 fade-out duration-300';

  return createPortal(
    <div
      className={clsx(
        'fixed z-50 w-full max-w-sm',
        positionClasses[position],
        animationClass,
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live="polite"
    >
      <div className={clsx(
        'rounded-lg shadow-lg border overflow-hidden',
        config.bgColor,
        config.borderColor
      )}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            {showIcon && (
              <div className="flex-shrink-0">
                <IconComponent className={clsx('h-5 w-5', config.iconColor)} />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={clsx('text-sm font-medium', config.textColor)}>
                {message}
              </p>
              {description && (
                <p className={clsx('mt-1 text-sm opacity-90', config.textColor)}>
                  {description}
                </p>
              )}
              
              {/* Action Button */}
              {action && (
                <button
                  onClick={() => {
                    action.onClick();
                    handleClose();
                  }}
                  className={clsx(
                    'mt-2 text-sm font-medium transition-colors',
                    config.textColor,
                    'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent'
                  )}
                >
                  {action.label}
                </button>
              )}
            </div>

            {/* Close Button */}
            {dismissible && (
              <button
                onClick={handleClose}
                className={clsx(
                  'flex-shrink-0 rounded-md p-1 transition-colors',
                  config.textColor,
                  'hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2'
                )}
                aria-label="Close toast"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && duration !== Infinity && (
          <div 
            className={clsx('h-1 transition-all duration-75', config.progressColor)}
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </div>,
    document.body
  );
};

// Toast Container for managing multiple toasts
export interface ToastItem {
  id: string;
  message: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContainerProps {
  toasts: ToastItem[];
  position?: ToastPosition;
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
  onClose,
}) => {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          description={toast.description}
          type={toast.type}
          duration={toast.duration}
          position={position}
          onClose={() => onClose(toast.id)}
          action={toast.action}
        />
      ))}
    </>
  );
};

// Hook for using toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto remove if duration is set and not Infinity
    if (toast.duration !== Infinity) {
      const duration = toast.duration || 5000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message: string, options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) => {
    return addToast({ message, type: 'success', ...options });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) => {
    return addToast({ message, type: 'error', ...options });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) => {
    return addToast({ message, type: 'warning', ...options });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) => {
    return addToast({ message, type: 'info', ...options });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };
};

