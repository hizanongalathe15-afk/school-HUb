import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Globe, Check, ChevronDown } from 'lucide-react';
import i18n from '../../i18n/i18n';

type Language = {
  code: string;
  name: string;
  nativeName: string;
  dir?: 'ltr' | 'rtl';
};

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
];

interface LanguageSwitcherProps {
  currentLanguage?: string;
  onLanguageChange?: (languageCode: string) => void;
  className?: string;
  variant?: 'dropdown' | 'modal' | 'buttons';
  showNativeNames?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
  persistSelection?: boolean;
  storageKey?: string;
}

export default function LanguageSwitcher({
  currentLanguage: propLanguage,
  onLanguageChange,
  className,
  variant = 'dropdown',
  showNativeNames = false,
  position = 'bottom-right',
  size = 'md',
  persistSelection = true,
  storageKey = 'app-language',
}: LanguageSwitcherProps) {
  const { i18n: i18nInstance } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => {
    const currentLang = i18nInstance.language || 'en';
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLang) || SUPPORTED_LANGUAGES[0];
  });

  useEffect(() => {
    const handleLanguageChange = (nextLang: string) => {
      const lang = SUPPORTED_LANGUAGES.find(l => l.code === nextLang);
      if (lang) {
        setSelectedLanguage(lang);
      }
    };

    i18nInstance.on('languageChanged', handleLanguageChange);
    return () => {
      i18nInstance.off('languageChanged', handleLanguageChange);
    };
  }, [i18nInstance]);

  useEffect(() => {
    if (propLanguage) {
      const lang = SUPPORTED_LANGUAGES.find(l => l.code === propLanguage);
      if (lang) setSelectedLanguage(lang);
    }
  }, [propLanguage]);

  useEffect(() => {
    if (persistSelection) {
      localStorage.setItem(storageKey, selectedLanguage.code);
    }
    
    document.documentElement.dir = selectedLanguage.dir || 'ltr';
    document.documentElement.lang = selectedLanguage.code;
    
    onLanguageChange?.(selectedLanguage.code);
  }, [selectedLanguage, persistSelection, storageKey, onLanguageChange]);

  const handleLanguageChange = useCallback(async (language: Language) => {
    setSelectedLanguage(language);
    setIsOpen(false);
    // Change the language in i18next to trigger re-renders
    await i18nInstance.changeLanguage(language.code);
  }, [i18nInstance]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.language-switcher')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const positionClasses = {
    'top-right': 'bottom-full mb-2 right-0',
    'top-left': 'bottom-full mb-2 left-0',
    'bottom-right': 'top-full mt-2 right-0',
    'bottom-left': 'top-full mt-2 left-0',
  };

  const sizeClasses = {
    sm: 'px-2 py-1.5 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-2.5 text-lg',
  };

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Buttons variant
  if (variant === 'buttons') {
    return (
      <div className={clsx('flex flex-wrap gap-2', className)}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang)}
            className={clsx(
              'px-3 py-2 rounded-lg transition-all duration-200 font-medium',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              selectedLanguage.code === lang.code
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
              sizeClasses[size]
            )}
          >
            {showNativeNames ? lang.nativeName : lang.name}
          </button>
        ))}
      </div>
    );
  }

  // Modal variant
  if (variant === 'modal') {
    const [showModal, setShowModal] = useState(false);
    
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={clsx(
            'inline-flex items-center gap-2 rounded-lg transition-all duration-200',
            'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
            'text-gray-700 dark:text-gray-300 font-medium',
            sizeClasses[size],
            className
          )}
          aria-label="Select language"
        >
          <Globe className={iconSizeClasses[size]} />
          <span>{showNativeNames ? selectedLanguage.nativeName : selectedLanguage.name}</span>
          <ChevronDown className={iconSizeClasses[size]} />
        </button>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Select Language
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="grid gap-2">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        handleLanguageChange(lang);
                        setShowModal(false);
                      }}
                      className={clsx(
                        'flex items-center justify-between p-3 rounded-lg transition-all text-left',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        selectedLanguage.code === lang.code
                          ? 'bg-blue-50 dark:bg-blue-900/50 border border-blue-500'
                          : 'border border-transparent'
                      )}
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {lang.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {lang.nativeName}
                        </div>
                      </div>
                      {selectedLanguage.code === lang.code && (
                        <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Dropdown variant (default)
  return (
    <div className={clsx('language-switcher relative inline-block', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'inline-flex items-center gap-2 rounded-lg transition-all duration-200',
          'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
          'text-gray-700 dark:text-gray-300 font-medium',
          sizeClasses[size]
        )}
        aria-expanded={isOpen}
        aria-label="Select language"
      >
        <Globe className={iconSizeClasses[size]} />
        <span>{showNativeNames ? selectedLanguage.nativeName : selectedLanguage.name}</span>
        <ChevronDown className={clsx(iconSizeClasses[size], 'transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className={clsx(
          'absolute z-50 min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
          positionClasses[position]
        )}>
          <div className="py-1 max-h-[300px] overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang)}
                className={clsx(
                  'w-full text-left px-4 py-2 transition-colors flex items-center justify-between',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  selectedLanguage.code === lang.code
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300'
                )}
              >
                <span>{showNativeNames ? lang.nativeName : lang.name}</span>
                {selectedLanguage.code === lang.code && (
                  <Check className={iconSizeClasses[size]} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}