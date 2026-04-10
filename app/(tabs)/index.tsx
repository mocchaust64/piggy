import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, SafeAreaView, Text, View } from 'react-native'
import { SkeletonPiggyCard } from '@/components/ui/Skeleton'

/**
 * Home screen — shell placeholder for Sprint 1.
 * Data fetching (usePiggies hook) implemented in Sprint 4.
 */
export default function HomeScreen() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-sm text-gray-400">Xin chào 👋</Text>
          <Text className="text-xl font-bold text-gray-900">Gold Piggy Bank</Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-gray-400">{t('wallet.usdcBalance')}</Text>
          <Text className="text-lg font-bold text-brand-red">— USDC</Text>
        </View>
      </View>

      {/* Loading skeleton preview (will be driven by data in Sprint 4) */}
      <View className="gap-4 px-6">
        <SkeletonPiggyCard />
        <SkeletonPiggyCard />
      </View>

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/piggy/create')}
        className="absolute bottom-8 right-6 h-16 w-16 items-center justify-center rounded-full bg-brand-red"
        style={{
          shadowColor: '#D4001A',
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
        accessibilityLabel={t('piggy.addPiggy')}
        accessibilityRole="button"
      >
        <Text className="text-3xl text-white">+</Text>
      </Pressable>
    </SafeAreaView>
  )
}
