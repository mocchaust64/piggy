import { useTranslation } from 'react-i18next'
import { SafeAreaView, Text, View } from 'react-native'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/**
 * Create gift screen — shell placeholder for Sprint 1.
 * Full gift creation flow (template picker, QR, share) implemented in Sprint 5.
 */
export default function CreateGiftScreen() {
  const { t } = useTranslation()

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 gap-6 px-6 pt-6">
        <Text className="text-2xl font-bold text-gray-900">{t('gift.createTitle')}</Text>

        {/* Template selector placeholder */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-gray-600">{t('gift.chooseTemplate')}</Text>
          <View className="flex-row gap-2">
            {['🧧', '🎂', '💍', '🍼'].map((emoji, index) => (
              <View
                key={index}
                className="h-16 w-16 items-center justify-center rounded-2xl bg-gray-100"
              >
                <Text style={{ fontSize: 28 }}>{emoji}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-4">
          <Input
            label={t('gift.amountLabel')}
            placeholder={t('gift.amountPlaceholder')}
            keyboardType="decimal-pad"
            suffix={t('common.gram')}
          />
          <Input
            label="Message"
            placeholder={t('gift.messagePlaceholder')}
            multiline
            numberOfLines={3}
          />
        </View>

        <Button label={t('gift.createButton')} onPress={() => {}} />
      </View>
    </SafeAreaView>
  )
}
