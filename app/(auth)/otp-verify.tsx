import { useEffect, useState } from 'react'
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
import { useRouter, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const OTP_RESEND_SECONDS = 60

type OtpType = 'phone' | 'email'

export default function OtpVerifyScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { type, target } = useLocalSearchParams<{ type: OtpType; target: string }>()

  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(OTP_RESEND_SECONDS)

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  async function handleVerify() {
    const trimmed = otp.trim()
    if (trimmed.length !== 6) {
      setError(t('auth.otpInvalid'))
      return
    }
    setError('')
    setIsLoading(true)
    try {
      let supabaseError

      if (type === 'phone') {
        const { error: err } = await supabase.auth.verifyOtp({
          phone: target,
          token: trimmed,
          type: 'sms',
        })
        supabaseError = err
      } else {
        const { error: err } = await supabase.auth.verifyOtp({
          email: target,
          token: trimmed,
          type: 'email',
        })
        supabaseError = err
      }

      if (supabaseError) throw supabaseError
      // useSession in _layout will handle redirect to (tabs)
    } catch (e: any) {
      setError(t('auth.otpInvalid'))
      console.error('[OtpVerify] error:', e.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    if (countdown > 0) return
    try {
      if (type === 'phone') {
        await supabase.auth.signInWithOtp({ phone: target })
      } else {
        await supabase.auth.signInWithOtp({ email: target, options: { shouldCreateUser: false } })
      }
      setCountdown(OTP_RESEND_SECONDS)
      setOtp('')
      setError('')
    } catch (e: any) {
      Alert.alert(t('auth.loginError'), e.message)
    }
  }

  const displayTarget = type === 'phone' ? target : target

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
        <Text style={styles.title}>{t('auth.otpVerifyTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.otpVerifySubtitle', { target: displayTarget })}
        </Text>
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
              label={t('auth.otpPlaceholder')}
              placeholder="• • • • • •"
              value={otp}
              onChangeText={(v) => {
                setOtp(v.replace(/\D/g, '').slice(0, 6))
                if (error) setError('')
              }}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              error={error}
              onSubmitEditing={handleVerify}
              returnKeyType="done"
            />

            <Button
              label={t('auth.verifyOtp')}
              onPress={handleVerify}
              loading={isLoading}
              disabled={otp.length !== 6}
            />

            {/* Resend */}
            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <Text style={styles.resendCountdown}>
                  {t('auth.otpResendIn', { seconds: countdown })}
                </Text>
              ) : (
                <Pressable onPress={handleResend} hitSlop={8}>
                  <Text style={styles.resendLink}>{t('auth.otpResend')}</Text>
                </Pressable>
              )}
            </View>
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
  resendRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  resendCountdown: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#9CA3AF',
  },
  resendLink: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#D4001A',
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
