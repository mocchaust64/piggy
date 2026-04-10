import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, SafeAreaView, Text, View } from 'react-native'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

/**
 * Piggy bank detail screen — shell placeholder for Sprint 1.
 * Data fetching (usePiggyBalance, useGoldPrice) and Buy Gold sheet implemented in Sprint 4.
 */
export default function PiggyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 py-4">
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel={t('common.back')}>
          <Text className="text-base text-brand-red">← {t('common.back')}</Text>
        </Pressable>
      </View>

      <View className="gap-6 px-6">
        {/* Piggy avatar + name */}
        <View className="items-center gap-2">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-piggy-pink">
            <Text style={{ fontSize: 48 }}>🐷</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">Baby An</Text>
          <Text className="text-xs text-gray-400">Piggy ID: {id}</Text>
        </View>

        {/* Balance card */}
        <Card className="items-center gap-1 p-5">
          <Text className="text-sm text-gray-400">{t('piggy.balance')}</Text>
          <Text className="text-4xl font-bold text-brand-gold">0.00</Text>
          <Text className="text-base text-gray-400">{t('piggy.goldUnit')}</Text>
        </Card>

        {/* Actions */}
        <View className="gap-3">
          <Button label={t('wallet.buyGold')} onPress={() => {}} />
          <Button
            label={t('gift.createTitle')}
            onPress={() => router.push('/gift/create')}
            variant="secondary"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}
