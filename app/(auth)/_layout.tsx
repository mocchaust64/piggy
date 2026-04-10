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
        contentStyle: { backgroundColor: '#FFFFFF' },
        animation: 'slide_from_right',
      }}
    />
  )
}
