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
import { Sparkline } from '@/components/ui/Sparkline'
import { SkeletonPiggyCard } from '@/components/ui/Skeleton'
import { BuyGoldSheet } from '@/components/wallet/BuyGoldSheet'
import { DepositUsdcSheet } from '@/components/wallet/DepositUsdcSheet'
import { AllocateGoldSheet } from '@/components/piggy/AllocateGoldSheet'
import { tv } from 'tailwind-variants'
import type { PiggyWithBalance } from '@/types/database'

// ─── PiggyCard ────────────────────────────────────────────────────────────────

function PiggyCard({
  piggy,
  index,
  onAddGold,
}: {
  piggy: PiggyWithBalance
  index: number
  onAddGold: (piggy: PiggyWithBalance) => void
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const goldAmount = piggy.piggy_balances?.gold_amount ?? 0
  const target = piggy.target_amount ?? 0
  const progress = target > 0 ? Math.min(goldAmount / target, 1) : 0
  const progressPct = Math.round(progress * 100)

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 120)
        .springify()
        .damping(20)}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          router.push(`/piggy/${piggy.id}`)
        }}
        className="rounded-[24px] bg-white p-5 shadow-sm"
      >
        {/* Top row */}
        <View className="mb-4 flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-3xl border-2 border-red-200 bg-red-50">
            <Text className="text-3xl">{piggy.avatar_url ?? '🐷'}</Text>
          </View>
          <View className="flex-1">
            <Text className="mb-1 font-outfit-bold text-lg text-gray-900">{piggy.child_name}</Text>
            <Text className="font-outfit-regular text-[11px] text-gray-400">
              {t('piggyCard.goldBalance')}
            </Text>
            <View className="flex-row items-baseline gap-1">
              <Text className="font-outfit-bold text-[22px] text-red-600">
                {goldAmount.toFixed(4)}
              </Text>
              <Text className="font-outfit-regular text-sm text-gray-500">g</Text>
            </View>
          </View>
        </View>

        {/* Progress bar */}
        {target > 0 && (
          <View className="mb-4">
            <View className="mb-2 flex-row justify-between">
              <Text className="font-outfit-regular flex-1 text-xs text-gray-500">
                {piggy.target_description
                  ? `${t('piggyCard.progress')}: ${piggy.target_description}`
                  : t('piggyCard.progress')}
              </Text>
              <Text className="font-outfit-semibold text-xs text-red-600">{progressPct}%</Text>
            </View>
            <View className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <View
                className="h-full rounded-full bg-red-600"
                style={{ width: `${progressPct}%` }}
              />
            </View>
            <Text className="font-outfit-regular text-right text-[11px] text-gray-400">
              {goldAmount.toFixed(2)}g / {target}g
            </Text>
          </View>
        )}

        {/* Actions */}
        <View className="flex-row gap-2.5">
          <Pressable
            className="flex-1 items-center rounded-2xl bg-red-600 py-3 active:opacity-80"
            onPress={(e) => {
              e.stopPropagation?.()
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              onAddGold(piggy)
            }}
          >
            <Text className="font-outfit-semibold text-sm text-white">
              {t('piggyCard.addGold')}
            </Text>
          </Pressable>
          <Pressable
            className="flex-1 items-center rounded-2xl border border-red-200 bg-red-50 py-3 active:opacity-80"
            onPress={(e) => {
              e.stopPropagation?.()
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.push('/gift/create')
            }}
          >
            <Text className="font-outfit-semibold text-sm text-red-600">
              {t('piggyCard.sendGift')}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  )
}

// ─── Gold Price Banner ────────────────────────────────────────────────────────

const pricePill = tv({
  base: 'flex-row items-center self-start rounded-xl px-2 py-1',
  variants: { trend: { up: 'bg-emerald-100', down: 'bg-red-100' } },
})

const priceText = tv({
  base: 'text-[11px] font-bold',
  variants: { trend: { up: 'text-emerald-800', down: 'text-red-800' } },
})

function GoldPriceBanner() {
  const { t } = useTranslation()
  const { formattedPrice, priceChangePercent, historyPoints, isLoading } = useGoldPrice()

  const isPositive = priceChangePercent >= 0
  const trend = isPositive ? 'up' : 'down'
  const sparklineColor = isPositive ? '#10B981' : '#EF4444'

  return (
    <LinearGradient
      colors={['rgba(255, 251, 235, 0.9)', 'rgba(255, 247, 212, 0.7)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.priceBanner}
    >
      <View className="flex-1">
        <Text className="font-outfit-regular mb-0.5 text-xs text-amber-800">
          {t('home.goldPrice')}
        </Text>
        <View className="mb-2 flex-row items-baseline gap-1">
          <Text className="font-outfit-bold text-2xl text-amber-900">
            {isLoading ? '---' : formattedPrice}
          </Text>
          <Text className="font-outfit-regular text-sm text-amber-800">{t('home.perGram')}</Text>
        </View>
        <View className={pricePill({ trend })}>
          <Text className={priceText({ trend })}>
            {isPositive ? '▲' : '▼'} {Math.abs(priceChangePercent).toFixed(2)}%
          </Text>
        </View>
      </View>
      <View style={styles.sparklineWrap}>
        {historyPoints.length > 0 && (
          <Sparkline data={historyPoints} width={120} height={60} color={sparklineColor} />
        )}
      </View>
    </LinearGradient>
  )
}

// ─── Wallet Cards ─────────────────────────────────────────────────────────────

function WalletCards({
  onBuyGold,
  onDeposit,
  onWithdraw,
}: {
  onBuyGold: () => void
  onDeposit: () => void
  onWithdraw: () => void
}) {
  const { t } = useTranslation()
  const { goldBalance, usdcBalance } = useWalletBalance()

  return (
    <View className="mb-5 flex-row gap-3">
      {/* Gold card */}
      <View style={styles.walletCard}>
        <View style={styles.walletCardIconRow}>
          <View style={styles.goldIconBg}>
            <Text style={styles.goldIcon}>✦</Text>
          </View>
        </View>
        <Text style={styles.walletCardLabel}>{t('home.goldBalance')}</Text>
        <View style={styles.walletCardValueRow}>
          <Text style={styles.walletCardValue}>{goldBalance.toFixed(4)}</Text>
          <Text style={styles.walletCardUnit}>g</Text>
        </View>
        <View style={styles.walletCardActions}>
          <Pressable
            style={[styles.walletBtn, styles.walletBtnPrimary]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              onBuyGold()
            }}
          >
            <Text style={styles.walletBtnPrimaryText}>{t('home.buyGold')}</Text>
          </Pressable>
          <Pressable
            style={[styles.walletBtn, styles.walletBtnGhost]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onWithdraw()
            }}
          >
            <Ionicons name="arrow-up-outline" size={14} color="#6B7280" />
          </Pressable>
        </View>
      </View>

      {/* USDC card */}
      <View style={[styles.walletCard, styles.walletCardUsdc]}>
        <View style={styles.walletCardIconRow}>
          <View style={styles.usdcIconBg}>
            <Text style={styles.usdcIcon}>$</Text>
          </View>
        </View>
        <Text style={[styles.walletCardLabel, styles.walletCardLabelUsdc]}>
          {t('home.usdcBalance')}
        </Text>
        <View style={styles.walletCardValueRow}>
          <Text style={[styles.walletCardValue, styles.walletCardValueUsdc]}>
            {usdcBalance.toFixed(2)}
          </Text>
          <Text style={[styles.walletCardUnit, styles.walletCardUnitUsdc]}>USDC</Text>
        </View>
        <View style={styles.walletCardActions}>
          <Pressable
            style={[styles.walletBtn, styles.walletBtnUsdc]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              onDeposit()
            }}
          >
            <Ionicons name="arrow-down-outline" size={14} color="#065F46" />
            <Text style={styles.walletBtnUsdcText}>{t('home.depositUsdc')}</Text>
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

  const [buyGoldVisible, setBuyGoldVisible] = useState(false)
  const [depositVisible, setDepositVisible] = useState(false)
  const [allocatePiggy, setAllocatePiggy] = useState<PiggyWithBalance | null>(null)

  const displayName = profile?.display_name?.split(' ')[0] ?? ''

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
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
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 160,
        }}
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
            onBuyGold={() => setBuyGoldVisible(true)}
            onDeposit={() => setDepositVisible(true)}
            onWithdraw={() => {
              // TODO: withdraw sheet
            }}
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
              />
            ))}
          </View>
        ) : (
          <EmptyState />
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          router.push('/piggy/create')
        }}
        className="absolute right-6 h-[60px] w-[60px] items-center justify-center rounded-full bg-red-600 shadow-xl"
        style={{ bottom: insets.bottom + 90 }}
        accessibilityLabel={t('piggy.addPiggy')}
        accessibilityRole="button"
      >
        <Text className="font-outfit-regular text-[28px] leading-[32px] text-white">+</Text>
      </Pressable>

      {/* Sheets */}
      <BuyGoldSheet visible={buyGoldVisible} onClose={() => setBuyGoldVisible(false)} />
      <DepositUsdcSheet visible={depositVisible} onClose={() => setDepositVisible(false)} />
      {allocatePiggy && (
        <AllocateGoldSheet
          visible={!!allocatePiggy}
          piggyId={allocatePiggy.id}
          piggyName={allocatePiggy.child_name}
          onClose={() => setAllocatePiggy(null)}
          onSuccess={() => refetch()}
        />
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  priceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 16,
  },
  sparklineWrap: {
    height: 60,
    width: 120,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  walletCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  walletCardUsdc: {
    backgroundColor: '#F0FDF4',
  },
  walletCardIconRow: {
    marginBottom: 10,
  },
  goldIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldIcon: {
    fontSize: 16,
    color: '#D97706',
  },
  usdcIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usdcIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  walletCardLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  walletCardLabelUsdc: {
    color: '#6EE7B7',
  },
  walletCardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginBottom: 12,
  },
  walletCardValue: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#111827',
  },
  walletCardValueUsdc: {
    fontSize: 20,
    color: '#065F46',
  },
  walletCardUnit: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  walletCardUnitUsdc: {
    color: '#059669',
  },
  walletCardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  walletBtn: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  walletBtnPrimary: {
    flex: 1,
    backgroundColor: '#DC2626',
  },
  walletBtnPrimaryText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  walletBtnGhost: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
  },
  walletBtnUsdc: {
    flex: 1,
    backgroundColor: '#D1FAE5',
  },
  walletBtnUsdcText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#065F46',
  },
})
