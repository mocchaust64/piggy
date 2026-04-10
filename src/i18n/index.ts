import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'

import en from './locales/en'
import vi from './locales/vi'

export const SUPPORTED_LANGUAGES = ['en', 'vi'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'vi'
const defaultLanguage: SupportedLanguage =
  SUPPORTED_LANGUAGES.includes(deviceLocale as SupportedLanguage) ? (deviceLocale as SupportedLanguage) : 'vi'

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: defaultLanguage,
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
export { en, vi }
