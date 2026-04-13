import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { tv } from 'tailwind-variants'
import { usePiggy } from '@/hooks/usePiggies'
import { useTransactions } from '@/hooks/useTransactions'

// ─── Variants ─────────────────────────────────────────────────────────────────

const piggyDetailVariants = tv({
  slots: {
    container: 'flex-1 bg-gray-50',
    header: 'flex-row items-center justify-between bg-gray-50 px-4 pb-3',
    backBtn: 'h-11 w-11 items-center justify-center',
    headerTitle: 'font-outfit-bold text-lg text-gray-900',
    hero: 'items-center justify-center bg-gray-50 pb-8',
    avatarContainer:
      'h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-red-50 shadow-xl elevation-8',
    avatarEmoji: 'text-[64px]',
    nameText: 'mt-4 font-outfit-bold text-2xl text-gray-900',
    goalText: 'mt-1 font-outfit-regular text-gray-500',
    balanceCard: 'mx-6 mb-8 rounded-[32px] bg-red-600 p-8 shadow-2xl elevation-6',
    balanceLabel: 'font-outfit-medium mb-1 text-sm text-white/80',
    balanceValue: 'font-outfit-bold text-[40px] text-white',
    progressSection: 'mx-6 mb-10',
    progressHeader: 'mb-3 flex-row items-center justify-between px-1',
    progressLabel: 'font-outfit-semibold text-sm text-gray-900',
    progressPercent: 'font-outfit-bold text-sm text-red-600',
    progressBarBg: 'h-4 w-full overflow-hidden rounded-full bg-gray-200',
    progressBarFill: 'h-full rounded-full bg-red-600',
    targetInfo: 'mt-3 flex-row items-center justify-between px-1',
    targetLabel: 'font-outfit-regular text-[13px] text-gray-400',
    targetValue: 'font-outfit-semibold text-[13px] text-gray-700',
  },
})

export default function PiggyDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const { data: piggy, refetch: refetchPiggy } = usePiggy(id as string)
  const { refetch: refetchTxs } = useTransactions(id as string)

  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setRefreshing(true)
    await Promise.all([refetchPiggy(), refetchTxs()])
    setRefreshing(false)
  }

  const {
    container,
    header,
    backBtn,
    headerTitle,
    hero,
    avatarContainer,
    avatarEmoji,
    nameText,
    goalText,
    balanceCard,
    balanceLabel,
    balanceValue,
    progressSection,
    progressHeader,
    progressLabel,
    progressPercent,
    progressBarBg,
    progressBarFill,
    targetInfo,
    targetLabel,
    targetValue,
  } = piggyDetailVariants()

  const currentBalance = piggy?.piggy_balances?.gold_amount ?? 0
  const progress = piggy?.target_amount ? (currentBalance / piggy.target_amount) * 100 : 0
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <View className={container()} style={{ paddingTop: insets.top }}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} className={header()}>
        <Pressable onPress={() => router.back()} className={backBtn()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#D4001A" />
        </Pressable>
        <Text className={headerTitle()} numberOfLines={1}>
          {piggy?.child_name ?? ''}
        </Text>
        <View className={backBtn()} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4001A" />
        }
      >
        {/* Hero Section */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} className={hero()}>
          <View className={avatarContainer()}>
            <Text className={avatarEmoji()}>{piggy?.avatar_url ?? '🐷'}</Text>
          </View>
          <Text className={nameText()}>{piggy?.child_name}</Text>
          {piggy?.target_description && (
            <Text className={goalText()}>{piggy.target_description}</Text>
          )}
        </Animated.View>

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className={balanceCard()}>
          <Text className={balanceLabel()}>{t('piggyDetail.goldBalance')}</Text>
          <View className="flex-row items-baseline gap-1">
            <Text className={balanceValue()}>{currentBalance.toFixed(4)}</Text>
            <Text className="font-outfit-bold text-xl text-white">g</Text>
          </View>
        </Animated.View>

        {/* Progress Section */}
        {piggy?.target_amount && (
          <Animated.View entering={FadeInUp.delay(300).springify()} className={progressSection()}>
            <View className={progressHeader()}>
              <Text className={progressLabel()}>{t('piggyDetail.goalProgress')}</Text>
              <Text className={progressPercent()}>{progress.toFixed(1)}%</Text>
            </View>
            <View className={progressBarBg()}>
              <View className={progressBarFill()} style={{ width: `${clampedProgress}%` }} />
            </View>
            <View className={targetInfo()}>
              <Text className={targetLabel()}>{t('createPiggy.targetAmount')}</Text>
              <Text className={targetValue()}>{piggy.target_amount.toFixed(2)} g</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  )
}

// Removed legacy StyleSheet. Using NativeWind v4 + tailwind-variants.
