import { Alert, SafeAreaView, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export default function ProfileScreen() {
  const { t } = useTranslation()

  async function handleSignOut() {
    try {
      await GoogleSignin.signOut()
    } catch (e) {
      console.error('[handleSignOut] Google SignOut Error:', e)
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert(t('common.error'), error.message)
    }
    // useSession hook will detect the logout and redirect to /(auth)/login
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900">{t('profile.title')}</Text>
      </View>

      <View className="flex-1 px-6 pt-4">
        <LanguageSwitcher />
      </View>

      <View className="px-6 pb-8">
        <Button label={t('profile.signOut')} variant="ghost" onPress={handleSignOut} />
      </View>
    </SafeAreaView>
  )
}
