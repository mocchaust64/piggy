import '../global.css'
import 'react-native-get-random-values'
import 'react-native-url-polyfill/auto'
import '../src/i18n' // initialize i18n before rendering

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ActivityIndicator, View } from 'react-native'
import { useSession } from '@/hooks/useSession'

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

/** Renders a centered spinner while the session is being restored from SecureStore */
function SessionGuard() {
  const { isLoading } = useSession()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#D4001A" />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="piggy/[id]" />
      <Stack.Screen name="piggy/create" />
      <Stack.Screen name="gift/[code]" />
      <Stack.Screen name="gift/create" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <SessionGuard />
    </QueryClientProvider>
  )
}
