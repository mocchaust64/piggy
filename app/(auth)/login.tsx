import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/Button'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import LottieView from 'lottie-react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'

/**
 * Super App Standard Login Screen — Social-Only Flow.
 * Features: Linear Gradients, Reanimated entrance effects, Haptics.
 */
export default function LoginScreen() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const insets = useSafeAreaInsets()

  // ─── Auth Handlers ────────────────────────────────────────────────────────

  async function handleGoogleSignIn() {
    if (isLoading) return

    try {
      setIsLoading(true)
      await GoogleSignin.hasPlayServices()

      // Force Account Picker
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
      console.error('[handleGoogleSignIn] Exception:', error)
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert(t('auth.loginError'), error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAppleSignIn() {
    if (isLoading) return

    try {
      setIsLoading(true)
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
      console.error('[handleAppleSignIn] Exception:', e)
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(t('auth.loginError'), e.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-brand-red">
      <StatusBar style="light" />

      {/* Premium Background Gradient */}
      <LinearGradient colors={['#D4001A', '#A80014', '#80000F']} style={styles.gradient} />

      {/* Hero Section */}
      <View
        className="items-center justify-center"
        style={{ height: 340 + insets.top, paddingTop: insets.top }}
      >
        <Animated.View entering={FadeInDown.duration(800).delay(200)}>
          <LottieView
            source={require('../../assets/lottie/piggy-intro.json')}
            autoPlay
            loop
            style={styles.heroLottie}
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(800).delay(400)} className="items-center px-6">
          <Text className="text-center font-outfit-bold text-4xl tracking-tight text-white">
            {t('app.name')}
          </Text>
          <Text className="mt-1 text-center font-outfit-medium text-lg text-red-100 opacity-80">
            {t('app.tagline')}
          </Text>
        </Animated.View>
      </View>

      {/* Form Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Animated.View
          entering={FadeInUp.duration(800).springify().damping(15)}
          className="flex-1 rounded-t-[48px] bg-white px-8 pt-12 shadow-2xl"
        >
          <View className="flex-1">
            <View className="mb-12">
              <Text className="font-outfit-bold text-3xl text-gray-900">
                {t('auth.signInTitle')}
              </Text>
              <Text className="mt-1 font-outfit text-base text-gray-400">
                {t('auth.signInSubtitle')}
              </Text>
            </View>

            <View className="gap-5">
              {/* Google Sign In — Premium Variant */}
              <Animated.View entering={FadeInUp.duration(600).delay(600)}>
                <Button
                  label={t('auth.signInWithGoogle')}
                  variant="white"
                  onPress={handleGoogleSignIn}
                  loading={isLoading}
                  icon="google"
                  textClassName="font-outfit-semibold text-gray-800"
                />
              </Animated.View>

              {/* Apple Sign In */}
              {Platform.OS === 'ios' && (
                <Animated.View entering={FadeInUp.duration(600).delay(750)}>
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={16}
                    style={styles.appleButton}
                    onPress={handleAppleSignIn}
                  />
                </Animated.View>
              )}
            </View>

            {/* Separator Decor */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(900)}
              className="mt-12 flex-row items-center justify-center opacity-20"
            >
              <View className="h-[0.5px] flex-1 bg-gray-400" />
              <View className="mx-4 h-1.5 w-1.5 rounded-full bg-gray-400" />
              <View className="h-[0.5px] flex-1 bg-gray-400" />
            </Animated.View>
          </View>

          {/* Footer note */}
          <SafeAreaView className="mt-auto items-center pb-8">
            <Text className="text-center font-outfit text-[11px] leading-5 text-gray-400">
              {t('auth.termsNote')}
              {'\n'}
              <Text className="font-outfit-semibold text-gray-600">{t('auth.termsOfService')}</Text>
              {' & '}
              <Text className="font-outfit-semibold text-gray-600">{t('auth.privacyPolicy')}</Text>
            </Text>
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  heroLottie: {
    width: 240,
    height: 240,
  },
  appleButton: {
    width: '100%',
    height: 56,
  },
})
