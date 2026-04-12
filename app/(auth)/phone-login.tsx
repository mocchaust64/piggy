import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// Normalize VN phone → E.164 (+84xxxxxxxxx)
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0')) return '+84' + digits.slice(1)
  if (digits.startsWith('84')) return '+' + digits
  return '+84' + digits
}

function isValidVNPhone(raw: string): boolean {
  const normalized = normalizePhone(raw)
  return /^\+84[3-9]\d{8}$/.test(normalized)
}

export default function PhoneLoginScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOtp() {
    const trimmed = phone.trim()
    if (!isValidVNPhone(trimmed)) {
      setError(t('auth.phoneInvalid'))
      return
    }
    setError('')
    setIsLoading(true)
    try {
      const normalized = normalizePhone(trimmed)
      const { error: supabaseError } = await supabase.auth.signInWithOtp({
        phone: normalized,
      })
      if (supabaseError) throw supabaseError
      router.push({
        pathname: '/(auth)/otp-verify',
        params: { type: 'phone', target: normalized },
      })
    } catch (e: any) {
      Alert.alert(t('auth.loginError'), e.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Title */}
      <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.titleBlock}>
        <Text style={styles.title}>{t('auth.signInWithPhone')}</Text>
        <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>
      </Animated.View>

      {/* Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <Animated.View
          entering={FadeInUp.duration(600).springify().damping(15)}
          style={styles.card}
        >
          <View style={styles.form}>
            <Input
              label={t('auth.phoneNumber')}
              placeholder={t('auth.phonePlaceholder')}
              value={phone}
              onChangeText={(v) => {
                setPhone(v)
                if (error) setError('')
              }}
              keyboardType="phone-pad"
              autoComplete="tel"
              error={error}
              onSubmitEditing={handleSendOtp}
              returnKeyType="send"
            />

            <Button
              label={t('auth.sendOtpPhone')}
              onPress={handleSendOtp}
              loading={isLoading}
              disabled={phone.trim().length < 9}
            />
          </View>

          <SafeAreaView style={styles.footer}>
            <Text style={styles.footerText}>
              {t('auth.termsNote')}
              {'\n'}
              <Text style={styles.footerLink}>{t('auth.termsOfService')}</Text>
              {' & '}
              <Text style={styles.footerLink}>{t('auth.privacyPolicy')}</Text>
            </Text>
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#D4001A',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  form: {
    gap: 20,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 8,
  },
  footerText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLink: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#6B7280',
  },
})
