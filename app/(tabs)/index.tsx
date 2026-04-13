import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import { usePiggies } from '@/hooks/usePiggies'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useGoldPrice } from '@/hooks/useGoldPrice'
import { useWalletBalance } from '@/hooks/useWalletBalance'
import { PiggyCard } from '@/components/piggy/PiggyCard'
import { PiggyEmptyState } from '@/components/piggy/PiggyEmptyState'
import { Sparkline } from '@/components/ui/Sparkline'
import { SkeletonPiggyCard } from '@/components/ui/Skeleton'
import { BuyGoldSheet } from '@/components/wallet/BuyGoldSheet'
import { DepositUsdcSheet } from '@/components/wallet/DepositUsdcSheet'
import { WithdrawUsdcSheet } from '@/components/wallet/WithdrawUsdcSheet'
import { HeistGoldSheet } from '@/components/wallet/HeistGoldSheet'
import { AllocateGoldSheet } from '@/components/piggy/AllocateGoldSheet'
import { tv } from 'tailwind-variants'
import type { PiggyWithBalance } from '@/types/database'

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

// EmptyState extracted to PiggyEmptyState

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
          <PiggyEmptyState />
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
})
