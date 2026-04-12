import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Haptics from 'expo-haptics'

import { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

interface UseLanguageReturn {
  /** Currently active language code */
  language: SupportedLanguage
  /** Change language, persist to AsyncStorage, trigger haptic */
  setLanguage: (lang: SupportedLanguage) => Promise<void>
}

/**
 * Hook that exposes the current UI language and a setter that:
 *  1. Calls i18n.changeLanguage()
 *  2. Persists the choice to AsyncStorage
 *  3. Fires a light haptic for tactile feedback
 */
export function useLanguage(): UseLanguageReturn {
  const { i18n } = useTranslation()

  // Derive the current language directly from i18n instance so this hook
  // stays in sync if changeLanguage() is called from anywhere else.
  const language = (
    SUPPORTED_LANGUAGES.includes(i18n.language as SupportedLanguage) ? i18n.language : 'vi'
  ) as SupportedLanguage

  const setLanguage = useCallback(
    async (lang: SupportedLanguage): Promise<void> => {
      if (lang === i18n.language) return
      await i18n.changeLanguage(lang)
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    },
    [i18n],
  )

  return { language, setLanguage }
}
