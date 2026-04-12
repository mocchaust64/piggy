import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'

import en from './locales/en'
import vi from './locales/vi'

export const SUPPORTED_LANGUAGES = ['en', 'vi'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_STORAGE_KEY = '@heodat/language'

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en'
const deviceLanguage: SupportedLanguage = SUPPORTED_LANGUAGES.includes(
  deviceLocale as SupportedLanguage,
)
  ? (deviceLocale as SupportedLanguage)
  : 'en'

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  // Start with device locale; will be overridden by persisted value in useLanguage hook
  lng: deviceLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    // Disable Suspense: Expo Router has no Suspense boundary, and all translations
    // are bundled synchronously — Suspense causes a thrown Promise that gets
    // misreported as "navigation context not found".
    useSuspense: false,
  },
})

/**
 * Load the user's persisted language preference and apply it.
 * Called once during app initialisation (in useLanguage hook on mount).
 */
export async function loadPersistedLanguage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      await i18n.changeLanguage(stored)
    }
  } catch {
    // AsyncStorage failure is non-fatal; keep device default
  }
}

export default i18n
export { en, vi }
