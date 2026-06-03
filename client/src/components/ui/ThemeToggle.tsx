import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { Sun, Moon, Laptop, Monitor, Settings } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';
type SystemTheme = 'light' | 'dark';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'switch' | 'dropdown' | 'buttons';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  storageKey?: string;
  onThemeChange?: (theme: Theme, systemTheme?: SystemTheme) => void;
}

export default function ThemeToggle({
  className,
  variant = 'icon',
  size = 'md',
  showLabel = false,
  position = 'bottom-right',
  storageKey = 'app-theme',
  onThemeChange,
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('system');
  const [systemTheme, setSystemTheme] = useState<SystemTheme>('light');
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Detect system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateSystemTheme = () => {
      const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
      
      if (theme === 'system') {
        applyTheme(newSystemTheme);
      }
    };
    
    updateSystemTheme();
    mediaQuery.addEventListener('change', updateSystemTheme);
    
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, [theme]);

  // Load saved theme
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem(storageKey) as Theme | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, [storageKey]);

  // Apply theme to document
  const applyTheme = useCallback((newTheme: SystemTheme) => {
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (!mounted) return;
    
    let activeTheme: SystemTheme;
    
    if (theme === 'system') {
      activeTheme = systemTheme;
    } else {
      activeTheme = theme as SystemTheme;
    }
    
    applyTheme(activeTheme);
    localStorage.setItem(storageKey, theme);
    onThemeChange?.(theme, theme === 'system' ? systemTheme : undefined);
  }, [theme, systemTheme, mounted, storageKey, applyTheme, onThemeChange]);

  const getCurrentDisplayTheme = (): 'light' | 'dark' => {
    if (theme === 'system') return systemTheme;
    return theme as 'light' | 'dark';
  };

  const getThemeLabel = (): string => {
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark';
    return 'System';
  };

  const sizeClasses = {
    sm: {
      icon: 'h-4 w-4',
      button: 'p-1.5 text-sm',
      text: 'text-sm',
    },
    md: {
      icon: 'h-5 w-5',
      button: 'p-2 text-base',
      text: 'text-base',
    },
    lg: {
      icon: 'h-6 w-6',
      button: 'p-2.5 text-lg',
      text: 'text-lg',
    },
  };

  const positionClasses = {
    'top-right': 'bottom-full mb-2 right-0',
    'top-left': 'bottom-full mb-2 left-0',
    'top-bottom': 'top-full mt-2 right-0',
    'bottom-right': 'top-full mt-2 right-0',
    'bottom-left': 'top-full mt-2 left-0',
  };

  // Icon Button Variant
  if (variant === 'icon') {
    const currentIcon = getCurrentDisplayTheme() === 'dark' ? <Moon /> : <Sun />;
    
    return (
      <button
        onClick={() => {
          const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
          setTheme(nextTheme);
        }}
        className={clsx(
          'rounded-lg transition-all duration-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          sizeClasses[size].button,
          className
        )}
        aria-label={`Current theme: ${getThemeLabel()}. Click to change`}
        title={`Theme: ${getThemeLabel()}`}
      >
        <div className="relative">
          {currentIcon}
          {theme === 'system' && (
            <div className={clsx(
              'absolute -bottom-1 -right-1 rounded-full bg-blue-500 text-white flex items-center justify-center',
              size === 'sm' ? 'h-2 w-2 text-[8px]' : 'h-3 w-3 text-[10px]'
            )}>
              <Laptop className={sizeClasses[size].icon} style={{ transform: 'scale(0.6)' }} />
            </div>
          )}
        </div>
        {showLabel && <span className={clsx('ml-2', sizeClasses[size].text)}>{getThemeLabel()}</span>}
      </button>
    );
  }

  // Switch Variant
  if (variant === 'switch') {
    return (
      <div className={clsx('inline-flex items-center gap-3', className)}>
        <Sun className={clsx(sizeClasses[size].icon, theme === 'light' ? 'text-yellow-500' : 'text-gray-400')} />
        <button
          onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          className={clsx(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            getCurrentDisplayTheme() === 'dark' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          )}
          role="switch"
          aria-checked={getCurrentDisplayTheme() === 'dark'}
        >
          <span
            className={clsx(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              getCurrentDisplayTheme() === 'dark' ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
        <Moon className={clsx(sizeClasses[size].icon, theme === 'dark' ? 'text-blue-400' : 'text-gray-400')} />
        {showLabel && <span className={clsx('ml-2', sizeClasses[size].text)}>{getThemeLabel()}</span>}
      </div>
    );
  }

  // Dropdown Variant
  if (variant === 'dropdown') {
    return (
      <div className={clsx('relative inline-block', className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            'inline-flex items-center gap-2 rounded-lg transition-all duration-200',
            'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
            'text-gray-700 dark:text-gray-300',
            sizeClasses[size].button
          )}
          aria-expanded={isOpen}
        >
          {getCurrentDisplayTheme() === 'dark' ? (
            <Moon className={sizeClasses[size].icon} />
          ) : (
            <Sun className={sizeClasses[size].icon} />
          )}
          {showLabel && <span>{getThemeLabel()}</span>}
          <Settings className={clsx(sizeClasses[size].icon, 'opacity-50')} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className={clsx(
              'absolute z-50 min-w-[160px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
              positionClasses[position]
            )}>
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Laptop },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value as Theme);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    'w-full text-left px-4 py-2 transition-colors flex items-center gap-3',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    theme === option.value
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  <option.icon className={sizeClasses[size].icon} />
                  <span className="flex-1">{option.label}</span>
                  {theme === option.value && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Buttons Variant
  return (
    <div className={clsx('inline-flex gap-2', className)}>
      {[
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'system', label: 'System', icon: Laptop },
      ].map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value as Theme)}
          className={clsx(
            'inline-flex items-center gap-2 rounded-lg transition-all duration-200 font-medium',
            theme === option.value
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
            sizeClasses[size].button
          )}
        >
          <option.icon className={sizeClasses[size].icon} />
          {showLabel && <span>{option.label}</span>}
        </button>
      ))}
    </div>
  );
}

// Hook for using theme in components
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('system');
  const [systemTheme, setSystemTheme] = useState<SystemTheme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as Theme | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };
    updateSystemTheme();
    mediaQuery.addEventListener('change', updateSystemTheme);
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light');
  }, []);

  return { theme, systemTheme, currentTheme, setTheme, toggleTheme, isDark: currentTheme === 'dark' };
};