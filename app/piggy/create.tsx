import { useTranslation } from 'react-i18next'
import { SafeAreaView, Text, View } from 'react-native'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/**
 * Create piggy bank screen — shell placeholder for Sprint 1.
 * Full form logic + usePiggies mutation implemented in Sprint 4.
 */
export default function CreatePiggyScreen() {
  const { t } = useTranslation()

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 gap-6 px-6 pt-6">
        {/* Title */}
        <Text className="text-2xl font-bold text-gray-900">{t('piggy.createTitle')}</Text>

        {/* Avatar selector placeholder */}
        <View className="items-center">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-piggy-pink">
            <Text style={{ fontSize: 48 }}>🐷</Text>
          </View>
          <Text className="mt-2 text-sm text-gray-400">Tap to choose avatar</Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <Input
            label="Child's Name"
            placeholder={t('piggy.namePlaceholder')}
            autoCapitalize="words"
          />
          <Input label="Savings Goal (optional)" placeholder={t('piggy.targetPlaceholder')} />
          <Input
            label="Target Amount (grams, optional)"
            placeholder={t('piggy.targetAmountPlaceholder')}
            keyboardType="decimal-pad"
            suffix={t('common.gram')}
          />
        </View>

        <Button label={t('piggy.createButton')} onPress={() => {}} />
      </View>
    </SafeAreaView>
  )
}
