import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/** Email validation regex — RFC 5322 subset */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type LoginStep = 'email' | 'otp'

/**
 * Login screen — Email OTP flow (Step 1: request OTP, Step 2: verify OTP).
 *
 * Apple Sign In will be added in Sprint 3b.
 * Navigation redirect is handled by `useSession` in `_layout.tsx`.
 */
export default function LoginScreen() {
  const { t } = useTranslation()

  const [step, setStep] = useState<LoginStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [otpError, setOtpError] = useState('')

  // ─── Step 1: Request OTP ──────────────────────────────────────────────────

  function validateEmail(): boolean {
    if (!email.trim()) {
      setEmailError('Email is required')
      return false
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError('Enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  async function handleSendOtp() {
    if (!validateEmail()) return

    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        // If user doesn't have an account, create one automatically
        shouldCreateUser: true,
      },
    })
    setIsLoading(false)

    if (error) {
      // Rate limit is the most common error here
      if (error.message.toLowerCase().includes('rate limit')) {
        setEmailError('Too many requests, please try again in a minute')
      } else {
        Alert.alert(t('auth.loginError'), error.message)
      }
      return
    }

    setStep('otp')
  }

  // ─── Step 2: Verify OTP ───────────────────────────────────────────────────

  function validateOtp(): boolean {
    if (!otp.trim()) {
      setOtpError('Verification code is required')
      return false
    }
    if (otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim())) {
      setOtpError('Code must be exactly 6 digits')
      return false
    }
    setOtpError('')
    return true
  }

  async function handleVerifyOtp() {
    if (!validateOtp()) return

    setIsLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email',
    })
    setIsLoading(false)

    if (error) {
      setOtpError('Invalid or expired code, please try again')
      return
    }

    // ✅ On success, `useSession` in _layout.tsx will automatically
    // detect the new session and redirect to /(tabs)
  }

  function handleBackToEmail() {
    setStep('email')
    setOtp('')
    setOtpError('')
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Logo */}
          <View className="mb-10 items-center gap-3">
            <Text style={{ fontSize: 72 }}>🐷</Text>
            <Text className="text-3xl font-bold text-gray-900">{t('app.name')}</Text>
            <Text className="text-center text-base text-gray-400">{t('app.tagline')}</Text>
          </View>

          {step === 'email' ? (
            // ── Step 1: Email Input ──────────────────────────────────────────
            <View className="gap-4">
              <Input
                label="Email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  if (emailError) setEmailError('')
                }}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={handleSendOtp}
              />

              <Button
                label={isLoading ? t('common.loading') : t('auth.sendOtp')}
                onPress={handleSendOtp}
                loading={isLoading}
              />
            </View>
          ) : (
            // ── Step 2: OTP Input ────────────────────────────────────────────
            <View className="gap-4">
              <View className="gap-1">
                <Text className="text-center text-base text-gray-500">{t('auth.otpSent')}</Text>
                <Text className="text-center text-base font-semibold text-gray-900">{email}</Text>
              </View>

              <Input
                label="Verification Code"
                placeholder={t('auth.otpPlaceholder')}
                value={otp}
                onChangeText={(text) => {
                  setOtp(text)
                  if (otpError) setOtpError('')
                }}
                error={otpError}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleVerifyOtp}
              />

              <Button
                label={isLoading ? t('common.loading') : t('auth.verifyOtp')}
                onPress={handleVerifyOtp}
                loading={isLoading}
              />

              {/* Back link */}
              <Pressable
                onPress={handleBackToEmail}
                hitSlop={8}
                className="items-center py-2"
                accessibilityRole="button"
                accessibilityLabel="Change email address"
              >
                <Text className="text-sm text-brand-red">← Change email address</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
