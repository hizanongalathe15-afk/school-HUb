import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { changeLanguage } from './Language';
import { supportedLocales } from './settings';
import type { SupportedLocale } from './settings';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'button' | 'dropdown' | 'flag';
}

const languageNames: Record<SupportedLocale, string> = {
  en: 'English',
  sw: 'Kiswahili',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  ar: 'العربية'
};

const languageCodes: Record<SupportedLocale, string> = {
  en: 'EN',
  sw: 'SW',
  fr: 'FR',
  de: 'DE',
  it: 'IT',
  ar: 'AR'
};

export default function LanguageSwitcher({ className = '', variant = 'dropdown' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as SupportedLocale;

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang);
  };

  if (variant === 'flag') {
    return (
      <div className={`language-switcher language-switcher--flag ${className}`}>
        {supportedLocales.map((lang) => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={`language-switcher__flag ${currentLanguage === lang ? 'language-switcher__flag--active' : ''}`}
            title={languageNames[lang]}
            aria-label={`Switch to ${languageNames[lang]}`}
          >
            {languageCodes[lang]}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={() => handleLanguageChange(currentLanguage === 'en' ? 'sw' : 'en')}
        className={`language-switcher language-switcher--button ${className}`}
        aria-label={`Switch language to ${currentLanguage === 'en' ? 'Kiswahili' : 'English'}`}
      >
        <Globe size={20} />
        <span>{languageCodes[currentLanguage]}</span>
      </button>
    );
  }

  // Default dropdown variant
  return (
    <div className={`language-switcher language-switcher--dropdown ${className}`}>
      <select
        value={currentLanguage}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="language-switcher__select"
        aria-label="Select language"
      >
        {supportedLocales.map((lang) => (
          <option key={lang} value={lang}>
            {languageNames[lang]}
          </option>
        ))}
      </select>
      <Globe size={16} className="language-switcher__icon" />
    </div>
  );
}
