import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { tv } from 'tailwind-variants'
import type { PiggyWithBalance } from '@/types/database'

export const piggyCardStyles = tv({
  slots: {
    container: 'rounded-[32px] bg-white p-6 shadow-sm border border-gray-100',
    header: 'mb-5 flex-row items-center gap-4',
    avatarWrap:
      'h-16 w-16 items-center justify-center rounded-[24px] bg-red-50 border border-red-100',
    avatar: 'text-3xl',
    info: 'flex-1',
    name: 'mb-1 font-outfit-bold text-lg text-gray-900',
    balanceRow: 'flex-row items-baseline gap-1',
    balanceValue: 'font-outfit-bold text-2xl text-red-600',
    balanceUnit: 'font-outfit-regular text-sm text-gray-400',
    progressSection: 'mb-5',
    progressLabelRow: 'mb-2 flex-row justify-between items-center',
    progressLabel: 'font-outfit-medium text-[11px] text-gray-400 uppercase tracking-wider',
    progressPct: 'font-outfit-bold text-xs text-red-600',
    progressBarBg: 'h-2 overflow-hidden rounded-full bg-gray-100',
    progressBarFill: 'h-full rounded-full bg-red-600 shadow-sm',
    actionRow: 'flex-row gap-3',
    primaryBtn:
      'flex-1 h-[52px] flex-row items-center justify-center gap-2 rounded-2xl bg-red-600 shadow-sm active:opacity-90',
    primaryBtnText: 'font-outfit-bold text-sm text-white',
    heistBtn:
      'flex-1 h-[52px] flex-row items-center justify-center gap-2 rounded-2xl bg-slate-900 shadow-sm active:opacity-90',
    heistBtnText: 'font-outfit-bold text-sm text-white',
  },
})

export function PiggyCard({
  piggy,
  index,
  onAddGold,
  onHeist,
}: {
  piggy: PiggyWithBalance
  index: number
  onAddGold: (piggy: PiggyWithBalance) => void
  onHeist: (piggy: PiggyWithBalance) => void
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const goldAmount = piggy.piggy_balances?.gold_amount ?? 0
  const target = piggy.target_amount ?? 0
  const progress = target > 0 ? Math.min(goldAmount / target, 1) : 0
  const progressPct = Math.round(progress * 100)

  const classes = piggyCardStyles()

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 120)
        .springify()
        .damping(20)}
    >
      <Pressable
        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        onPress={() => router.push(`/piggy/${piggy.id}`)}
        className={classes.container()}
      >
        <View className={classes.header()}>
          <View className={classes.avatarWrap()}>
            <Text className={classes.avatar()}>{piggy.avatar_url ?? '🐷'}</Text>
          </View>
          <View className={classes.info()}>
            <Text className={classes.name()}>{piggy.child_name}</Text>
            <View className={classes.balanceRow()}>
              <Text className={classes.balanceValue()}>{goldAmount.toFixed(4)}</Text>
              <Text className={classes.balanceUnit()}>g</Text>
            </View>
          </View>
        </View>

        {target > 0 && (
          <View className={classes.progressSection()}>
            <View className={classes.progressLabelRow()}>
              <Text className={classes.progressLabel()}>
                {piggy.target_description || t('piggyCard.progress')}
              </Text>
              <Text className={classes.progressPct()}>{progressPct}%</Text>
            </View>
            <View className={classes.progressBarBg()}>
              <View className={classes.progressBarFill()} style={{ width: `${progressPct}%` }} />
            </View>
          </View>
        )}

        <View className={classes.actionRow()}>
          <Pressable
            className={classes.primaryBtn()}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            onPress={(e) => {
              e.stopPropagation?.()
              onAddGold(piggy)
            }}
          >
            <Ionicons name="add-circle" size={18} color="#FFF" />
            <Text className={classes.primaryBtnText()}>{t('piggyCard.addGold')}</Text>
          </Pressable>
          <Pressable
            className={classes.heistBtn()}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
            onPress={(e) => {
              e.stopPropagation?.()
              onHeist(piggy)
            }}
          >
            <MaterialCommunityIcons name="incognito" size={18} color="#FFF" />
            <Text className={classes.heistBtnText()}>{t('allocateGold.heistConfirm')}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  )
}
