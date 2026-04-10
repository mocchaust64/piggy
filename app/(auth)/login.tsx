import { useTranslation } from 'react-i18next'
import { SafeAreaView, Text, View } from 'react-native'
import { Button } from '@/components/ui/Button'

/**
 * Login screen — shell placeholder for Sprint 1.
 * Full Apple Sign In + OTP logic implemented in Sprint 3.
 */
export default function LoginScreen() {
  const { t } = useTranslation()

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center gap-6 px-6">
        {/* Logo / illustration placeholder */}
        <Text style={{ fontSize: 72 }}>🐷</Text>

        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-gray-900">{t('app.name')}</Text>
          <Text className="text-base text-gray-400">{t('app.tagline')}</Text>
        </View>

        <View className="w-full gap-3">
          <Button label={t('auth.signInWithApple')} onPress={() => {}} />
          <Button label={t('auth.signInWithEmail')} onPress={() => {}} variant="secondary" />
        </View>
      </View>
    </SafeAreaView>
  )
}
