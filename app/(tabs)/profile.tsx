import { useTranslation } from 'react-i18next'
import { Alert, SafeAreaView, Text, View } from 'react-native'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/Button'

/**
 * User profile screen — shell placeholder for Sprint 1.
 * Wallet address, language toggle, and notifications implemented in Sprint 6.
 */
export default function ProfileScreen() {
  const { t } = useTranslation()

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert('Error', error.message)
    }
    // useSession hook will detect the logout and redirect to /(auth)/login
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900">Profile</Text>
      </View>

      <View className="flex-1 items-center justify-center gap-6 px-6">
        <Text style={{ fontSize: 64 }}>👤</Text>
        <Text className="text-base text-gray-400">Profile features coming soon</Text>
      </View>

      <View className="px-6 pb-8">
        <Button
          label="Sign Out"
          variant="ghost"
          onPress={handleSignOut}
        />
      </View>
    </SafeAreaView>
  )
}
