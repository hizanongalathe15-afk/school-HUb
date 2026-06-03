import i18n from './i18n';
import { supportedLocales, type SupportedLocale, isRTL } from './settings';

const STORAGE_KEY = 'school-hub-language';

export function getInitialLanguage(): SupportedLocale {
  const saved = window.localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
  if (saved && supportedLocales.includes(saved)) return saved;
  return 'en';
}

export function changeLanguage(next: string) {
  const target = (supportedLocales as readonly string[]).includes(next) ? (next as SupportedLocale) : 'en';
  window.localStorage.setItem(STORAGE_KEY, target);
  
  // Set document direction for RTL languages
  if (typeof document !== 'undefined') {
    document.documentElement.dir = isRTL(target) ? 'rtl' : 'ltr';
    document.documentElement.lang = target;
  }
  
  void i18n.changeLanguage(target);
}

