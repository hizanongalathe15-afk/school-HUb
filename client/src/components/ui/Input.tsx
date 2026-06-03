import React, { forwardRef, useId, useState } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  required?: boolean;
  optional?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled' | 'flushed';
  showPasswordToggle?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  required = false,
  optional = false,
  fullWidth = true,
  size = 'md',
  variant = 'outline',
  showPasswordToggle = false,
  clearable = false,
  onClear,
  className,
  containerClassName,
  labelClassName,
  errorClassName,
  id,
  type = 'text',
  disabled = false,
  value,
  defaultValue,
  onChange,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const [hasValue, setHasValue] = useState(!!(value || defaultValue));
  
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    onChange?.(e);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (ref && 'current' in ref && ref.current) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(ref.current, '');
      const event = new Event('input', { bubbles: true });
      ref.current.dispatchEvent(event);
      setHasValue(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  const variantClasses = {
    outline: 'border bg-white dark:bg-gray-900 hover:border-gray-400 focus:border-blue-500',
    filled: 'border-transparent bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-900 focus:border-blue-500',
    flushed: 'border-b border-l-0 border-r-0 border-t-0 rounded-none px-0 bg-transparent hover:border-gray-400 focus:border-blue-500',
  };

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const paddingClasses = {
    left: {
      sm: icon ? 'pl-8' : '',
      md: icon ? 'pl-9' : '',
      lg: icon ? 'pl-10' : '',
    },
    right: {
      sm: (clearable || showPasswordToggle) ? 'pr-8' : '',
      md: (clearable || showPasswordToggle) ? 'pr-9' : '',
      lg: (clearable || showPasswordToggle) ? 'pr-10' : '',
    },
  };

  return (
    <div className={clsx(fullWidth && 'w-full', containerClassName)}>
      {(label || optional || required) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <label
              htmlFor={inputId}
              className={clsx(
                'block text-sm font-medium text-gray-700 dark:text-gray-300',
                disabled && 'opacity-50 cursor-not-allowed',
                labelClassName
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}
          {optional && !required && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Optional</span>
          )}
        </div>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <span className={clsx(
            'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors',
            iconSizeClasses[size]
          )}>
            {icon}
          </span>
        )}
        
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={clsx(
            error && `${inputId}-error`,
            hint && `${inputId}-hint`
          )}
          className={clsx(
            'w-full rounded-lg transition-all duration-200 outline-none',
            'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800',
            'placeholder:text-gray-400 dark:placeholder:text-gray-600',
            variantClasses[variant],
            sizeClasses[size],
            paddingClasses.left[size],
            paddingClasses.right[size],
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            !error && variant === 'outline' && 'border-gray-300 dark:border-gray-700',
            iconPosition === 'right' && icon ? 'pr-9' : '',
            className
          )}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <span className={clsx(
            'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none',
            iconSizeClasses[size]
          )}>
            {icon}
          </span>
        )}
        
        {clearable && hasValue && !disabled && !isPassword && (
          <button
            type="button"
            onClick={handleClear}
            className={clsx(
              'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors',
              showPasswordToggle && 'right-9'
            )}
            aria-label="Clear input"
          >
            <svg className={clsx('w-4 h-4', iconSizeClasses[size])} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {showPasswordToggle && isPassword && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={clsx(
              'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors',
              clearable && hasValue && 'right-9'
            )}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className={iconSizeClasses[size]} />
            ) : (
              <Eye className={iconSizeClasses[size]} />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <p id={`${inputId}-error`} className={clsx('mt-1 text-sm text-red-600 dark:text-red-400', errorClassName)}>
          {error}
        </p>
      )}
      
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';