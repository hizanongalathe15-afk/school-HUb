import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enErrors from './locales/en/errors.json';
import enNavigation from './locales/en/navigation.json';
import enSchool from './locales/en/school.json';
import enParent from './locales/en/parent.json';
import enStorekeeper from './locales/en/storekeeper.json';

import swCommon from './locales/sw/common.json';
import swDashboard from './locales/sw/dashboard.json';
import swErrors from './locales/sw/errors.json';
import swNavigation from './locales/sw/navigation.json';
import swSchool from './locales/sw/school.json';
import swParent from './locales/sw/parent.json';
import swStorekeeper from './locales/sw/storekeeper.json';

import frCommon from './locales/fr/common.json';
import frDashboard from './locales/fr/dashboard.json';
import frErrors from './locales/fr/errors.json';
import frNavigation from './locales/fr/navigation.json';
import frSchool from './locales/fr/school.json';
import frParent from './locales/fr/parent.json';
import frStorekeeper from './locales/fr/storekeeper.json';

import deCommon from './locales/de/common.json';
import deDashboard from './locales/de/dashboard.json';
import deErrors from './locales/de/errors.json';
import deNavigation from './locales/de/navigation.json';
import deSchool from './locales/de/school.json';
import deParent from './locales/de/parent.json';
import deStorekeeper from './locales/de/storekeeper.json';

import itCommon from './locales/it/common.json';
import itDashboard from './locales/it/dashboard.json';
import itErrors from './locales/it/errors.json';
import itNavigation from './locales/it/navigation.json';
import itSchool from './locales/it/school.json';
import itParent from './locales/it/parent.json';
import itStorekeeper from './locales/it/storekeeper.json';

import arCommon from './locales/ar/common.json';
import arDashboard from './locales/ar/dashboard.json';
import arErrors from './locales/ar/errors.json';
import arNavigation from './locales/ar/navigation.json';
import arSchool from './locales/ar/school.json';
import arParent from './locales/ar/parent.json';
import arStorekeeper from './locales/ar/storekeeper.json';

import { defaultLocale, supportedLocales, SupportedLocale, isRTL } from './settings';

const STORAGE_KEY = 'school-hub-language';
const initialLanguage: SupportedLocale = (typeof window !== 'undefined'
  ? (window.localStorage.getItem(STORAGE_KEY) as SupportedLocale | null) ?? defaultLocale
  : defaultLocale) as SupportedLocale;

const resources: Record<string, any> = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    errors: enErrors,
    navigation: enNavigation,
    school: enSchool,
    parent: enParent,
    storekeeper: enStorekeeper,
  },
  sw: {
    common: swCommon,
    dashboard: swDashboard,
    errors: swErrors,
    navigation: swNavigation,
    school: swSchool,
    parent: swParent,
    storekeeper: swStorekeeper,
  },
  fr: {
    common: frCommon,
    dashboard: frDashboard,
    errors: frErrors,
    navigation: frNavigation,
    school: frSchool,
    parent: frParent,
    storekeeper: frStorekeeper,
  },
  de: {
    common: deCommon,
    dashboard: deDashboard,
    errors: deErrors,
    navigation: deNavigation,
    school: deSchool,
    parent: deParent,
    storekeeper: deStorekeeper,
  },
  it: {
    common: itCommon,
    dashboard: itDashboard,
    errors: itErrors,
    navigation: itNavigation,
    school: itSchool,
    parent: itParent,
    storekeeper: itStorekeeper,
  },
  ar: {
    common: arCommon,
    dashboard: arDashboard,
    errors: arErrors,
    navigation: arNavigation,
    school: arSchool,
    parent: arParent,
    storekeeper: arStorekeeper,
  },
};

// Ensure every supported locale exists (even if only copied from English for now)
// so runtime switching never fails.
for (const locale of supportedLocales) {
  if (!resources[locale]) {
    resources[locale] = resources.en;
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: [...supportedLocales],
    fallbackLng: defaultLocale,
    lng: supportedLocales.includes(initialLanguage) ? initialLanguage : defaultLocale,
    ns: ['common', 'dashboard', 'errors', 'navigation', 'school', 'parent', 'storekeeper'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;