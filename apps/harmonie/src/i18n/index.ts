import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { fr } from '@/i18n/locales/fr.ts';
import { en } from '@/i18n/locales/en.ts';

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: navigator.language.startsWith('fr') ? 'fr' : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
