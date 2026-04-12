import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'
import { useLanguage } from '@/hooks/useLanguage'

const LANG_META: Record<SupportedLanguage, { native: string; flag: string; sub: string }> = {
  vi: { native: 'Tiếng Việt', flag: '🇻🇳', sub: 'Vietnamese' },
  en: { native: 'English', flag: '🇬🇧', sub: 'Tiếng Anh' },
}

interface OptionProps {
  lang: SupportedLanguage
  isActive: boolean
  onPress: () => void
}

function LanguageOption({ lang, isActive, onPress }: OptionProps) {
  const { flag, native, sub } = LANG_META[lang]

  return (
    <Pressable onPress={onPress} style={styles.option}>
      <View style={[styles.inner, isActive && styles.innerActive]}>
        <Text style={styles.flag}>{flag}</Text>
        <View style={styles.textWrap}>
          <Text style={[styles.native, isActive && styles.nativeActive]}>{native}</Text>
          <Text style={[styles.sub, isActive && styles.subActive]}>{sub}</Text>
        </View>
        {isActive && (
          <View style={styles.check}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </View>
    </Pressable>
  )
}

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguage()

  return (
    <View>
      <Text style={styles.sectionLabel}>{t('language.sectionTitle')}</Text>
      <View style={styles.container}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <LanguageOption
            key={lang}
            lang={lang}
            isActive={language === lang}
            onPress={() => setLanguage(lang)}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 6,
    gap: 4,
  },
  option: {
    flex: 1,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  innerActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  flag: {
    fontSize: 22,
  },
  textWrap: {
    flex: 1,
  },
  native: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  nativeActive: {
    color: '#111827',
  },
  sub: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 1,
  },
  subActive: {
    color: '#6B7280',
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D4001A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
