import { useEffect, useState } from 'react'
import '../global.css'
import 'react-native-get-random-values'
import 'react-native-url-polyfill/auto'
import '../src/i18n' // initialize i18n before rendering

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Animated, Image, StyleSheet, Text, View } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import Constants from 'expo-constants'
import { useSession } from '@/hooks/useSession'
import { loadPersistedLanguage } from '@/i18n'
import { useTranslation } from 'react-i18next'

// Must be called as early as possible — keeps native splash visible while JS loads
SplashScreen.preventAutoHideAsync()

// Minimum time to show JS splash (ms) — prevents jarring flash
const SPLASH_MIN_DURATION = 2000

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    },
    mutations: {
      retry: 0,
    },
  },
})

function NavigationGuard() {
  useSession()
  return null
}

export default function RootLayout() {
  const { t } = useTranslation()
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  })
  const [langLoaded, setLangLoaded] = useState(false)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const [splashHidden, setSplashHidden] = useState(false)
  const [fadeAnim] = useState(() => new Animated.Value(1))

  useEffect(() => {
    loadPersistedLanguage().finally(() => setLangLoaded(true))
  }, [])

  // Minimum splash duration — prevents sub-100ms flash
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), SPLASH_MIN_DURATION)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId
    const googleIosClientId = Constants.expoConfig?.extra?.googleIosClientId
    if (googleWebClientId) {
      GoogleSignin.configure({
        webClientId: googleWebClientId,
        iosClientId: googleIosClientId,
        offlineAccess: true,
      })
    }
  }, [])

  const assetsReady = fontsLoaded && langLoaded
  const readyToReveal = assetsReady && minTimeElapsed

  // Step 1: hide native splash as soon as JS is ready to render
  useEffect(() => {
    if (assetsReady) {
      SplashScreen.hideAsync()
    }
  }, [assetsReady])

  // Step 2: once min duration elapsed, fade out JS splash
  useEffect(() => {
    if (!readyToReveal) return
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => setSplashHidden(true))
  }, [readyToReveal, fadeAnim])

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="piggy/[id]" />
        <Stack.Screen name="piggy/create" />
        <Stack.Screen name="gift/[code]" />
        <Stack.Screen name="gift/create" />
      </Stack>
      <NavigationGuard />

      {/* JS Splash overlay — fades out after assets loaded + min duration */}
      {!splashHidden && (
        <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
          <Image
            source={require('../assets/splash-hero.jpg')}
            style={styles.splashImage}
            resizeMode="cover"
          />
          {/* Gradient footer with app name + tagline */}
          <View style={styles.footer}>
            <Text style={styles.appName}>{t('app.name')}</Text>
            <Text style={styles.tagline}>{t('app.tagline')}</Text>
          </View>
        </Animated.View>
      )}
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 56,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 8,
    // Dark gradient effect using semi-transparent overlay
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingTop: 40,
  },
  appName: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
})
