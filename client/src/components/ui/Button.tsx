import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  type = 'button',
  ...props
}) => {
  const isIconOnly = !children && (leftIcon || rightIcon || isLoading);
  
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500 active:bg-gray-100',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
  };

  const sizeClasses = {
    sm: clsx('text-sm', isIconOnly ? 'p-1.5' : 'px-3 py-1.5'),
    md: clsx('text-base', isIconOnly ? 'p-2' : 'px-4 py-2'),
    lg: clsx('text-lg', isIconOnly ? 'p-2.5' : 'px-6 py-3'),
  };

  const iconSpacing = {
    sm: 'mr-1.5',
    md: 'mr-2',
    lg: 'mr-2.5',
  };

  const iconSizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <button
      type={type}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        {
          'opacity-50 cursor-not-allowed': disabled || isLoading,
          'w-full': fullWidth,
        },
        className
      )}
      disabled={disabled || isLoading}
      aria-label={isIconOnly && !props['aria-label'] ? 'Button' : undefined}
      {...props}
    >
      {isLoading ? (
        <Loader2 
          className={clsx(
            iconSpacing[size], 
            iconSizeClasses[size], 
            'animate-spin'
          )} 
          aria-hidden="true" 
        />
      ) : leftIcon ? (
        <span className={clsx(iconSpacing[size], iconSizeClasses[size])}>
          {leftIcon}
        </span>
      ) : null}
      
      {children}
      
      {rightIcon && (
        <span className={clsx('ml-2', iconSizeClasses[size])}>
          {rightIcon}
        </span>
      )}
    </button>
  );
};