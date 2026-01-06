import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import jaTranslations from './locales/ja.json';
import enTranslations from './locales/en.json';

const resources = {
  ja: {
    translation: jaTranslations,
  },
  en: {
    translation: enTranslations,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      // Convert browser language to our language codes
      convertDetectedLanguage: (lng: string) => {
        // Convert 'en-US' to 'en', 'ja-JP' to 'ja'
        if (lng.startsWith('en')) return 'en';
        if (lng.startsWith('ja')) return 'ja';
        return 'en'; // Default to English
      },
    },
  });

export default i18n;
