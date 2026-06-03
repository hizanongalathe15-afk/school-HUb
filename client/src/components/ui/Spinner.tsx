import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white' | 'muted';
  className?: string;
  label?: string;
  showLabel?: boolean;
  fullPage?: boolean;
  overlay?: boolean;
  thickness?: 'thin' | 'normal' | 'thick';
  speed?: 'slow' | 'normal' | 'fast';
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  label = 'Loading...',
  showLabel = false,
  fullPage = false,
  overlay = false,
  thickness = 'normal',
  speed = 'normal',
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const variantClasses = {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-gray-600 dark:text-gray-400',
    white: 'text-white',
    muted: 'text-gray-400 dark:text-gray-600',
  };

  const thicknessClasses = {
    thin: 'stroke-[1.5]',
    normal: 'stroke-2',
    thick: 'stroke-[2.5]',
  };

  const speedClasses = {
    slow: 'animate-spin-slow',
    normal: 'animate-spin',
    fast: 'animate-spin-fast',
  };

  const spinnerElement = (
    <Loader2
      className={clsx(
        'flex-shrink-0',
        sizeClasses[size],
        variantClasses[variant],
        thicknessClasses[thickness],
        speedClasses[speed],
        className
      )}
      aria-hidden={!showLabel}
    />
  );

  const content = showLabel ? (
    <div className="flex flex-col items-center gap-2">
      {spinnerElement}
      {label && (
        <span className={clsx(
          'text-sm font-medium',
          variant === 'white' ? 'text-white' : 'text-gray-600 dark:text-gray-400'
        )}>
          {label}
        </span>
      )}
    </div>
  ) : spinnerElement;

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className={clsx(
              'animate-spin',
              sizeClasses[size] || sizeClasses.lg,
              variantClasses[variant]
            )}
          />
          {label && showLabel && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          )}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg z-10">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton loading states
interface SkeletonProps {
  className?: string;
  count?: number;
  height?: number | string;
  width?: number | string;
  circle?: boolean;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  count = 1,
  height,
  width,
  circle = false,
  animate = true,
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {skeletons.map((i) => (
        <div
          key={i}
          className={clsx(
            'bg-gray-200 dark:bg-gray-700 rounded',
            animate && 'animate-pulse',
            circle ? 'rounded-full' : 'rounded-md',
            className
          )}
          style={{
            height: height || (circle ? width : '1rem'),
            width: width || (circle ? height : '100%'),
          }}
        />
      ))}
    </>
  );
};

// Button spinner component
interface ButtonSpinnerProps {
  text?: string;
  spinnerSize?: SpinnerProps['size'];
}

export const ButtonSpinner: React.FC<ButtonSpinnerProps> = ({
  text = 'Loading...',
  spinnerSize = 'sm',
}) => {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner size={spinnerSize} variant="secondary" />
      <span>{text}</span>
    </span>
  );
};

// Page spinner component
export const PageSpinner: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Spinner size="lg" showLabel label={label} />
    </div>
  );
};

// Add custom animations to your global CSS or tailwind config
// Add these to your tailwind.config.js extend section:
/*
extend: {
  animation: {
    'spin-slow': 'spin 1.5s linear infinite',
    'spin-fast': 'spin 0.5s linear infinite',
  }
}
*/