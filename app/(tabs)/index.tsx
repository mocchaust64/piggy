import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'

import { usePiggies } from '@/hooks/usePiggies'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useGoldPrice } from '@/hooks/useGoldPrice'
import { useWalletBalance } from '@/hooks/useWalletBalance'
import { Sparkline } from '@/components/ui/Sparkline'
import { SkeletonPiggyCard } from '@/components/ui/Skeleton'
import { BuyGoldSheet } from '@/components/wallet/BuyGoldSheet'
import { DepositUsdcSheet } from '@/components/wallet/DepositUsdcSheet'
import { WithdrawUsdcSheet } from '@/components/wallet/WithdrawUsdcSheet'
import { HeistGoldSheet } from '@/components/wallet/HeistGoldSheet'
import { AllocateGoldSheet } from '@/components/piggy/AllocateGoldSheet'
import { tv } from 'tailwind-variants'
import type { PiggyWithBalance } from '@/types/database'

const piggyCardStyles = tv({
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

function PiggyCard({
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
              <View
                className={classes.progressBarFill()}
                style={[styles.progressWidth, { width: `${progressPct}%` }]}
              />
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

// ─── Gold Price Banner ────────────────────────────────────────────────────────

const bannerStyles = tv({
  slots: {
    container:
      'flex-row items-center justify-between rounded-[32px] px-6 py-5 mb-5 border border-amber-200/50',
    content: 'flex-1',
    label: 'font-outfit-medium text-[11px] text-amber-800 uppercase tracking-widest mb-1',
    priceRow: 'flex-row items-baseline gap-1 mb-2',
    price: 'font-outfit-bold text-3xl text-amber-900',
    unit: 'font-outfit-regular text-sm text-amber-800',
    pill: 'flex-row items-center self-start rounded-full px-2.5 py-1',
    pillText: 'text-[10px] font-bold uppercase',
    sparkline: 'h-16 w-32 items-end justify-center',
  },
  variants: {
    trend: {
      up: {
        pill: 'bg-emerald-100',
        pillText: 'text-emerald-800',
      },
      down: {
        pill: 'bg-red-100',
        pillText: 'text-red-800',
      },
    },
  },
})

function GoldPriceBanner() {
  const { t } = useTranslation()
  const { formattedPrice, priceChangePercent, historyPoints, isLoading } = useGoldPrice()

  const isPositive = priceChangePercent >= 0
  const trend = isPositive ? 'up' : 'down'
  const sparklineColor = isPositive ? '#10B981' : '#EF4444'
  const classes = bannerStyles({ trend })

  return (
    <LinearGradient
      colors={['#FFFBEB', '#FEF3C7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={classes.container()}
    >
      <View className={classes.content()}>
        <Text className={classes.label()}>{t('home.goldPrice')}</Text>
        <View className={classes.priceRow()}>
          <Text className={classes.price()}>{isLoading ? '---' : formattedPrice}</Text>
          <Text className={classes.unit()}>{t('home.perGram')}</Text>
        </View>
        <View className={classes.pill()}>
          <Text className={classes.pillText()}>
            {isPositive ? '▲' : '▼'} {Math.abs(priceChangePercent).toFixed(2)}%
          </Text>
        </View>
      </View>
      <View className={classes.sparkline()}>
        {historyPoints.length > 0 && (
          <Sparkline data={historyPoints} width={120} height={60} color={sparklineColor} />
        )}
      </View>
    </LinearGradient>
  )
}

// ─── Wallet Cards ─────────────────────────────────────────────────────────────

const walletCardStyles = tv({
  slots: {
    panel: 'rounded-[28px] bg-white mb-6 overflow-hidden border border-gray-100',
    row: 'px-5 pt-4 pb-4',
    topRow: 'flex-row items-center gap-4 mb-3',
    divider: 'h-[1px] bg-gray-100 mx-5',
    iconBg: 'w-11 h-11 rounded-2xl items-center justify-center',
    info: 'flex-1',
    label: 'font-outfit-medium text-[10px] uppercase tracking-wider mb-0.5',
    valueRow: 'flex-row items-baseline gap-1',
    value: 'font-outfit-bold text-[26px]',
    unit: 'font-outfit-regular text-sm opacity-60',
    actions: 'flex-row gap-3',
    primaryBtn: 'flex-1 h-11 rounded-xl items-center justify-center flex-row gap-2',
    secondaryBtn: 'flex-1 h-11 rounded-xl items-center justify-center flex-row gap-2',
    btnText: 'font-outfit-bold text-xs',
  },
  variants: {
    type: {
      gold: {
        iconBg: 'bg-amber-100',
        label: 'text-amber-700',
        value: 'text-gray-900',
        unit: 'text-gray-500',
        primaryBtn: 'bg-amber-500',
        secondaryBtn: 'bg-amber-50',
        btnText: 'text-white', // Base fallback
      },
      usdc: {
        iconBg: 'bg-emerald-100',
        label: 'text-emerald-700',
        value: 'text-gray-900',
        unit: 'text-gray-500',
        primaryBtn: 'bg-emerald-600',
        secondaryBtn: 'bg-emerald-50',
        btnText: 'text-white', // Base fallback
      },
    },
  },
})

function WalletCards({
  onBuyGold,
  onSendGift,
  onDepositUsdc,
  onWithdrawUsdc,
}: {
  onBuyGold: () => void
  onSendGift: () => void
  onDepositUsdc: () => void
  onWithdrawUsdc: () => void
}) {
  const { t } = useTranslation()
  const { goldBalance, usdcBalance } = useWalletBalance()
  const classes = walletCardStyles()

  return (
    <View className={classes.panel()}>
      {/* Gold Row */}
      <View className={classes.row()}>
        <View className={classes.topRow()}>
          <View className={classes.iconBg({ type: 'gold' })}>
            <Ionicons name="sparkles" size={20} color="#D97706" />
          </View>
          <View className={classes.info()}>
            <Text className={classes.label({ type: 'gold' })}>{t('home.goldBalance')}</Text>
            <View className={classes.valueRow()}>
              <Text className={classes.value({ type: 'gold' })}>{goldBalance.toFixed(4)}</Text>
              <Text className={classes.unit({ type: 'gold' })}>g</Text>
            </View>
          </View>
        </View>
        <View className={classes.actions()}>
          <Pressable
            className={classes.primaryBtn({ type: 'gold' })}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            onPress={onBuyGold}
          >
            <Ionicons name="add-circle" size={16} color="#FFF" />
            <Text className="font-outfit-bold text-xs text-white">{t('home.buyGold')}</Text>
          </Pressable>
          <Pressable
            className={classes.secondaryBtn({ type: 'gold' })}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            onPress={onSendGift}
          >
            <Ionicons name="gift" size={16} color="#D97706" />
            <Text className="font-outfit-bold text-xs text-amber-700">
              {t('piggyCard.sendGift')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Divider */}
      <View className={classes.divider()} />

      {/* USDC Row */}
      <View className={classes.row()}>
        <View className={classes.topRow()}>
          <View className={classes.iconBg({ type: 'usdc' })}>
            <Ionicons name="wallet-outline" size={20} color="#059669" />
          </View>
          <View className={classes.info()}>
            <Text className={classes.label({ type: 'usdc' })}>{t('home.usdcBalance')}</Text>
            <View className={classes.valueRow()}>
              <Text className={classes.value({ type: 'usdc' })}>{usdcBalance.toFixed(2)}</Text>
              <Text className={classes.unit({ type: 'usdc' })}>USDC</Text>
            </View>
          </View>
        </View>
        <View className={classes.actions()}>
          <Pressable
            className={classes.primaryBtn({ type: 'usdc' })}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            onPress={onDepositUsdc}
          >
            <Ionicons name="arrow-down-circle" size={16} color="#FFF" />
            <Text className="font-outfit-bold text-xs text-white">{t('home.depositUsdc')}</Text>
          </Pressable>
          <Pressable
            className={classes.secondaryBtn({ type: 'usdc' })}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            onPress={onWithdrawUsdc}
          >
            <Ionicons name="arrow-up-circle" size={16} color="#059669" />
            <Text className="font-outfit-bold text-xs text-emerald-700">{t('home.withdraw')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { data: profile } = useUserProfile()
  const { data: piggies, isLoading, refetch, isRefetching } = usePiggies()

  const [buyVisible, setBuyVisible] = useState(false)
  const [depositVisible, setDepositVisible] = useState(false)
  const [withdrawVisible, setWithdrawVisible] = useState(false)
  const [allocatePiggy, setAllocatePiggy] = useState<PiggyWithBalance | null>(null)
  const [heistPiggy, setHeistPiggy] = useState<PiggyWithBalance | null>(null)

  const displayName = profile?.display_name?.split(' ')[0] ?? ''

  const safeAreaStyle = [styles.screen, { paddingTop: insets.top }]
  const scrollContentStyle = [styles.scrollContent, { paddingBottom: insets.bottom + 160 }]
  const fabStyle = [styles.fab, { bottom: insets.bottom + 90 }]

  return (
    <View style={safeAreaStyle}>
      {/* Header */}
      <Animated.View
        entering={FadeInRight.duration(600).springify()}
        className="flex-row items-center justify-between pb-2 pl-6 pr-6 pt-3"
      >
        <View>
          <Text className="font-outfit-regular text-[13px] text-gray-400">
            {t('home.greeting')} {displayName ? `${displayName} 👋` : '👋'}
          </Text>
          <Text className="mt-0.5 font-outfit-bold text-[22px] text-gray-900">
            {t('home.appName')}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scrollContentStyle}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#D4001A" />
        }
      >
        {/* Gold price banner */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <GoldPriceBanner />
        </Animated.View>

        {/* Wallet cards */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <WalletCards
            onBuyGold={() => setBuyVisible(true)}
            onSendGift={() => router.push('/gift/create')}
            onDepositUsdc={() => setDepositVisible(true)}
            onWithdrawUsdc={() => setWithdrawVisible(true)}
          />
        </Animated.View>

        {/* Section title */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} className="mb-4">
          <Text className="font-outfit-bold text-lg text-gray-900">{t('home.myPiggies')}</Text>
        </Animated.View>

        {/* Piggies list */}
        {isLoading ? (
          <View className="gap-4">
            <SkeletonPiggyCard />
            <SkeletonPiggyCard />
          </View>
        ) : piggies && piggies.length > 0 ? (
          <View className="gap-4">
            {piggies.map((piggy, index) => (
              <PiggyCard
                key={piggy.id}
                piggy={piggy}
                index={index}
                onAddGold={(p) => setAllocatePiggy(p)}
                onHeist={(p) => setHeistPiggy(p)}
              />
            ))}
          </View>
        ) : (
          <EmptyState />
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        onPress={() => router.push('/piggy/create')}
        className="absolute right-6 h-[60px] w-[60px] items-center justify-center rounded-full bg-red-600 shadow-xl"
        style={fabStyle}
        accessibilityLabel={t('piggy.addPiggy')}
        accessibilityRole="button"
      >
        <Text className="font-outfit-regular text-[28px] leading-[32px] text-white">+</Text>
      </Pressable>

      {/* Sheets */}
      <BuyGoldSheet
        key={buyVisible ? 'buy-open' : 'buy-closed'}
        visible={buyVisible}
        onClose={() => setBuyVisible(false)}
      />
      <DepositUsdcSheet
        key={depositVisible ? 'deposit-open' : 'deposit-closed'}
        visible={depositVisible}
        onClose={() => setDepositVisible(false)}
      />
      <WithdrawUsdcSheet
        key={withdrawVisible ? 'withdraw-open' : 'withdraw-closed'}
        visible={withdrawVisible}
        onClose={() => setWithdrawVisible(false)}
      />

      {allocatePiggy && (
        <AllocateGoldSheet
          key={allocatePiggy.id}
          visible={!!allocatePiggy}
          piggyId={allocatePiggy.id}
          piggyName={allocatePiggy.child_name}
          onClose={() => setAllocatePiggy(null)}
          onSuccess={() => refetch()}
        />
      )}

      {heistPiggy && (
        <HeistGoldSheet
          key={heistPiggy.id + (heistPiggy ? '-open' : '-closed')}
          visible={!!heistPiggy}
          piggyId={heistPiggy.id}
          piggyName={heistPiggy.child_name}
          availableGold={heistPiggy.piggy_balances?.gold_amount ?? 0}
          onClose={() => setHeistPiggy(null)}
          onSuccess={() => refetch()}
        />
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  fab: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  progressWidth: {
    // Used for dynamic width in PiggyCard via Rule 215
  },
})
