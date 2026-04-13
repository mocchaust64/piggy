import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, Text } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

export function PiggyEmptyState() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} className="items-center pb-8 pt-12">
      <Text className="mb-4 text-[72px]">🐷</Text>
      <Text className="mb-2 font-outfit-bold text-xl text-gray-900">{t('home.emptyTitle')}</Text>
      <Text className="font-outfit-regular mb-7 text-center text-sm leading-[22px] text-gray-400">
        {t('home.emptySubtitle')}
      </Text>
      <Pressable
        className="rounded-[18px] bg-red-600 px-8 py-3.5 shadow-lg active:opacity-80"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          router.push('/piggy/create')
        }}
      >
        <Text className="font-outfit-semibold text-[15px] text-white">{t('home.createFirst')}</Text>
      </Pressable>
    </Animated.View>
  )
}
