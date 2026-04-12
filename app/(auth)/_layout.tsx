import { Stack } from 'expo-router'

/**
 * Auth group layout — no header, clean background.
 * Screens: login, signup
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#D4001A' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="phone-login" />
      <Stack.Screen name="otp-verify" />
      <Stack.Screen name="email-login" />
      <Stack.Screen name="email-register" />
    </Stack>
  )
}
