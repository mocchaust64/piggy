import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, Text, View } from 'react-native'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

/**
 * Gift claim screen — accessible via deep link: heodat://gift/[code]
 * Shell placeholder for Sprint 1.
 * Atomic claim logic (useClaimGift hook) and confetti animation implemented in Sprint 5.
 */
export default function ClaimGiftScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center gap-6 px-6">
        {/* Gift visual */}
        <Text style={{ fontSize: 80 }}>🎁</Text>

        <Card className="w-full items-center gap-3 p-6">
          <Text className="text-xl font-bold text-gray-900">{t('gift.claimTitle')}</Text>

          {/* Amount placeholder */}
          <View className="items-center gap-1">
            <Text className="text-4xl font-bold text-brand-gold">0.00</Text>
            <Text className="text-base text-gray-400">{t('common.gram')} GOLD</Text>
          </View>

          {/* Message placeholder */}
          <Text className="text-center text-base italic text-gray-600">
            "Loading gift message..."
          </Text>

          <Text className="text-xs text-gray-400">Code: {code}</Text>
        </Card>

        <View className="w-full gap-3">
          <Button label={t('gift.claimButton')} onPress={() => {}} />
          <Button label={t('common.back')} variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    </SafeAreaView>
  )
}
