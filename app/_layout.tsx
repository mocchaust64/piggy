import { useEffect, useState } from 'react'
import '../global.css'
import 'react-native-get-random-values'
import 'react-native-url-polyfill/auto'
import '../src/i18n' // initialize i18n before rendering

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native'
import LottieView from 'lottie-react-native'
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

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

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

/**
 * Handles auth-based navigation guards and hides splash when ready.
 * Must be rendered INSIDE the Stack navigator so useRouter() works correctly.
 */
function NavigationGuard() {
  useSession()
  return null
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  })
  const [langLoaded, setLangLoaded] = useState(false)

  useEffect(() => {
    loadPersistedLanguage().finally(() => setLangLoaded(true))
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

  const appReady = fontsLoaded && langLoaded

  useEffect(() => {
    if (appReady) {
      setTimeout(() => SplashScreen.hideAsync(), 500)
    }
  }, [appReady])

  if (!appReady) {
    return (
      <View style={StyleSheet.absoluteFill} className="flex-1 items-center justify-center bg-white">
        <LottieView
          source={require('../assets/lottie/piggy-intro.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
        <View className="mt-6 items-center gap-4">
          <Text className="text-sm font-semibold uppercase tracking-widest text-gray-300">
            Đang khởi tạo...
          </Text>
          <ActivityIndicator size="small" color="#D4001A" />
        </View>
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      {/* Stack must always render first — NavigationGuard lives inside so useRouter() is safe */}
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
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  lottie: {
    width: 220,
    height: 220,
  },
})
