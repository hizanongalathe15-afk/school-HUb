import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  footerClassName?: string;
  padding?: boolean;
  hover?: boolean;
  variant?: 'default' | 'elevated' | 'flat';
  divider?: boolean;
  onClick?: () => void;
  clickable?: boolean;
  as?: 'div' | 'article' | 'section';
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  header,
  footer,
  children,
  className,
  headerClassName,
  footerClassName,
  padding = true,
  hover = false,
  variant = 'default',
  divider = false,
  onClick,
  clickable = false,
  as = 'div',
  ...props
}) => {
  const Comp = as;
  const isClickable = onClick || clickable;

  const variantClasses = {
    default: 'shadow-md',
    elevated: 'shadow-xl hover:shadow-2xl transition-shadow duration-300',
    flat: 'shadow-sm border border-gray-200 dark:border-gray-700',
  };

  const hasHeader = title || subtitle || header;

  return (
    <Comp
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg',
        variantClasses[variant],
        {
          'p-6': padding,
          'hover:shadow-lg transition-shadow duration-200 cursor-pointer': isClickable || hover,
          'cursor-pointer': isClickable,
        },
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      {...props}
    >
      {hasHeader && (
        <div className={clsx({ 'mb-4': children, 'px-6 pt-6': !padding && hasHeader }, headerClassName)}>
          {header}
          {title && (
            <h3 className={clsx(
              'font-semibold text-gray-900 dark:text-white',
              subtitle ? 'text-base' : 'text-lg'
            )}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      {divider && hasHeader && children && (
        <hr className={clsx(
          'border-gray-200 dark:border-gray-700',
          padding ? 'my-4' : 'my-0'
        )} />
      )}
      
      {children}
      
      {footer && (
        <>
          {divider && <hr className={clsx(
            'border-gray-200 dark:border-gray-700',
            padding ? 'my-4' : 'my-0'
          )} />}
          <div className={clsx({ 'mt-4': children }, footerClassName)}>
            {footer}
          </div>
        </>
      )}
    </Comp>
  );
};