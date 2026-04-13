import { TouchableOpacity, Text, View, StyleSheet } from 'react-native'
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.option}>
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
    </TouchableOpacity>
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
    marginBottom: 12,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#9CA3AF',
  },
  container: {
    flexDirection: 'row',
    gap: 4,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    padding: 6,
  },
  option: {
    flex: 1,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  innerActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  flag: {
    fontSize: 22,
  },
  textWrap: {
    flex: 1,
  },
  native: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: '#9CA3AF',
  },
  nativeActive: {
    color: '#111827',
  },
  sub: {
    marginTop: 2,
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#D1D5DB',
  },
  subActive: {
    color: '#6B7280',
  },
  check: {
    height: 20,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#DC2626',
  },
  checkMark: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
})
