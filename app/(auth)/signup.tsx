import { useTranslation } from 'react-i18next'
import { SafeAreaView, Text, View } from 'react-native'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/**
 * Signup / OTP verification screen — shell placeholder for Sprint 1.
 * Full OTP logic implemented in Sprint 3.
 */
export default function SignupScreen() {
  const { t } = useTranslation()

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 gap-6 px-6 pt-12">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-gray-900">{t('auth.signInWithEmail')}</Text>
          <Text className="text-base text-gray-400">{t('auth.otpSent')}</Text>
        </View>

        <View className="gap-4">
          <Input
            label="Email"
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Button label={t('auth.sendOtp')} onPress={() => {}} />
        </View>
      </View>
    </SafeAreaView>
  )
}
