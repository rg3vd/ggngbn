import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import uk from './uk.json';

const resources = {
  en: { translation: en },
  uk: { translation: uk },
} as const;

export const initI18n = async (language: 'uk' | 'en' = 'uk'): Promise<typeof i18n> => {
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      compatibilityJSON: 'v4',
      fallbackLng: 'uk',
      lng: language,
      interpolation: {
        escapeValue: false,
      },
      resources,
    });
  } else if (i18n.language !== language) {
    await i18n.changeLanguage(language);
  }

  return i18n;
};

export default i18n;
