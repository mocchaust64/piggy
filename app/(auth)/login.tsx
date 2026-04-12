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
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import LottieView from 'lottie-react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'

export default function LoginScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoadingEmail, setIsLoadingEmail] = useState(false)
  const [isLoadingSocial, setIsLoadingSocial] = useState(false)

  // ─── Email / Password ────────────────────────────────────────────────────────

  async function handleEmailLogin() {
    const next: typeof errors = {}
    if (!email.trim() || !email.includes('@')) next.email = t('auth.emailPlaceholder')
    if (password.length < 8) next.password = t('auth.passwordTooShort')
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }
    setErrors({})
    setIsLoadingEmail(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) Alert.alert(t('auth.loginError'), error.message)
      // useSession in _layout handles redirect on success
    } catch (e: any) {
      Alert.alert(t('auth.loginError'), e.message)
    } finally {
      setIsLoadingEmail(false)
    }
  }

  // ─── Google ──────────────────────────────────────────────────────────────────

  async function handleGoogleSignIn() {
    if (isLoadingSocial) return
    try {
      setIsLoadingSocial(true)
      await GoogleSignin.hasPlayServices()
      try {
        await GoogleSignin.signOut()
      } catch {}
      const response = await GoogleSignin.signIn()
      const idToken = response.data?.idToken
      if (idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        })
        if (error) Alert.alert(t('auth.loginError'), error.message)
      } else {
        throw new Error('No ID token present!')
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert(t('auth.loginError'), error.message)
      }
    } finally {
      setIsLoadingSocial(false)
    }
  }

  // ─── Apple ───────────────────────────────────────────────────────────────────

  async function handleAppleSignIn() {
    if (isLoadingSocial) return
    try {
      setIsLoadingSocial(true)
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      if (credential.identityToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        })
        if (error) Alert.alert(t('auth.loginError'), error.message)
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(t('auth.loginError'), e.message)
      }
    } finally {
      setIsLoadingSocial(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={['#D4001A', '#A80014', '#80000F']} style={styles.gradient} />

      {/* Hero — compact */}
      <Animated.View
        entering={FadeInDown.duration(700).delay(100)}
        style={[styles.hero, { paddingTop: insets.top + 12 }]}
      >
        <LottieView
          source={require('../../assets/lottie/piggy-intro.json')}
          autoPlay
          loop
          style={styles.heroLottie}
        />
        <Text style={styles.heroTitle}>{t('app.name')}</Text>
        <Text style={styles.heroSubtitle}>{t('app.tagline')}</Text>
      </Animated.View>

      {/* Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <Animated.View
          entering={FadeInUp.duration(700).springify().damping(15)}
          style={styles.card}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Email + Password ── */}
            <View style={styles.section}>
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
                autoComplete="password"
                error={errors.password}
                onSubmitEditing={handleEmailLogin}
                returnKeyType="done"
              />
              <Button
                label={t('auth.signIn')}
                onPress={handleEmailLogin}
                loading={isLoadingEmail}
                disabled={!email.trim() || !password}
              />

              {/* Register link */}
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>{t('auth.noAccount')} </Text>
                <Pressable onPress={() => router.push('/(auth)/email-register')} hitSlop={8}>
                  <Text style={styles.registerLink}>{t('auth.signUp')}</Text>
                </Pressable>
              </View>
            </View>

            {/* ── Divider ── */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Social + Phone ── */}
            <View style={styles.section}>
              <Button
                label={t('auth.signInWithGoogle')}
                variant="white"
                onPress={handleGoogleSignIn}
                loading={isLoadingSocial}
                icon="google"
                textClassName="font-outfit-semibold text-gray-800"
              />

              {Platform.OS === 'ios' && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={16}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                />
              )}

              <Button
                label={t('auth.signInWithPhone')}
                variant="white"
                onPress={() => router.push('/(auth)/phone-login')}
                icon="call-outline"
                textClassName="font-outfit-semibold text-gray-800"
              />
            </View>

            {/* ── Terms ── */}
            <SafeAreaView style={styles.footer}>
              <Text style={styles.footerText}>
                {t('auth.termsNote')}
                {'\n'}
                <Text style={styles.footerLink}>{t('auth.termsOfService')}</Text>
                {' & '}
                <Text style={styles.footerLink}>{t('auth.privacyPolicy')}</Text>
              </Text>
            </SafeAreaView>
          </ScrollView>
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
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  hero: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  heroLottie: {
    width: 120,
    height: 120,
  },
  heroTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    marginTop: 4,
  },
  heroSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
  },
  section: {
    gap: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#D4001A',
  },
  appleButton: {
    width: '100%',
    height: 56,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
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
