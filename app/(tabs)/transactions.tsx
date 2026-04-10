import { useTranslation } from 'react-i18next'
import { SafeAreaView, Text, View } from 'react-native'

/**
 * Transaction history screen — shell placeholder for Sprint 1.
 * Full implementation in Sprint 6.
 */
export default function TransactionsScreen() {
  const { t } = useTranslation()

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900">{t('transaction.title')}</Text>
      </View>

      <View className="flex-1 items-center justify-center gap-3">
        <Text style={{ fontSize: 48 }}>📋</Text>
        <Text className="text-base text-gray-400">{t('transaction.empty')}</Text>
      </View>
    </SafeAreaView>
  )
}
