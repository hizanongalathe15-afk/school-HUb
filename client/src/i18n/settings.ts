export const defaultLocale = 'en';
export const supportedLocales = ['en', 'sw', 'fr', 'de', 'it', 'ar'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

// RTL languages that need right-to-left text direction
export const rtlLanguages: SupportedLocale[] = ['ar'];

// Check if language is RTL
export const isRTL = (lang: SupportedLocale): boolean => rtlLanguages.includes(lang);

