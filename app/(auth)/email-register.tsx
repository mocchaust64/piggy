import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
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

export default function EmailRegisterScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  function validate(): boolean {
    const next: typeof errors = {}
    if (!email.trim() || !email.includes('@')) next.email = t('auth.emailPlaceholder')
    if (password.length < 8) next.password = t('auth.passwordTooShort')
    if (password !== confirmPassword) next.confirmPassword = t('auth.passwordMismatch')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleRegister() {
    if (!validate()) return
    setIsLoading(true)
    try {
      // Create account via Edge Function (auto-confirmed, no email verify needed)
      const { data, error: fnError } = await supabase.functions.invoke('register-user', {
        body: { email: email.trim(), password },
      })
      if (fnError || data?.error) {
        const rawMsg: string = data?.error ?? fnError?.message ?? ''
        console.error('[Register] error:', rawMsg)
        const isAlreadyExists =
          rawMsg.toLowerCase().includes('already been registered') ||
          rawMsg.toLowerCase().includes('already registered')
        if (isAlreadyExists) {
          setErrors({ email: t('auth.emailAlreadyExists') })
        } else {
          Alert.alert(t('auth.loginError'), t('auth.registrationFailed'))
        }
        return
      }

      // Sign in immediately after registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signInError) {
        Alert.alert(t('auth.loginError'), signInError.message)
        return
      }
      // useSession in _layout will redirect to (tabs)
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
        <Text style={styles.title}>{t('auth.emailRegisterTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.emailRegisterSubtitle')}</Text>
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.form}>
              <Input
                label="Email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChangeText={(v) => {
                  setEmail(v)
                  if (errors.email) setErrors((e) => ({ ...e, email: undefined }))
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                returnKeyType="next"
              />

              <Input
                label={t('auth.password')}
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChangeText={(v) => {
                  setPassword(v)
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }))
                }}
                secureTextEntry
                autoComplete="new-password"
                error={errors.password}
                returnKeyType="next"
              />

              <Input
                label={t('auth.confirmPassword')}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v)
                  if (errors.confirmPassword)
                    setErrors((e) => ({ ...e, confirmPassword: undefined }))
                }}
                secureTextEntry
                autoComplete="new-password"
                error={errors.confirmPassword}
                onSubmitEditing={handleRegister}
                returnKeyType="done"
              />

              <Button
                label={t('auth.register')}
                onPress={handleRegister}
                loading={isLoading}
                disabled={!email.trim() || !password || !confirmPassword}
              />

              {/* Login link */}
              <View style={styles.loginRow}>
                <Text style={styles.loginText}>{t('auth.alreadyHaveAccount')} </Text>
                <Pressable onPress={() => router.back()} hitSlop={8}>
                  <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>

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
  },
  scroll: {
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 16,
  },
  form: {
    gap: 20,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  loginText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#D4001A',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: 32,
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
