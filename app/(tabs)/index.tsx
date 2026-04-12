import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'

import { usePiggies } from '@/hooks/usePiggies'
import { useUserProfile } from '@/hooks/useUserProfile'
import { SkeletonPiggyCard } from '@/components/ui/Skeleton'
import type { PiggyWithBalance } from '@/types/database'

// ─── PiggyCard ────────────────────────────────────────────────────────────────

function PiggyCard({ piggy, index }: { piggy: PiggyWithBalance; index: number }) {
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
        style={styles.card}
      >
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarEmoji}>{piggy.avatar_url ?? '🐷'}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.childName}>{piggy.child_name}</Text>
            <Text style={styles.balanceLabel}>{t('piggyCard.goldBalance')}</Text>
            <Text style={styles.balanceValue}>
              {goldAmount.toFixed(4)}
              <Text style={styles.balanceUnit}> g</Text>
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        {target > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {t('piggyCard.progress')}: {piggy.target_description ?? ''}
              </Text>
              <Text style={styles.progressPct}>{progressPct}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.progressTarget}>
              {goldAmount.toFixed(2)}g / {target}g
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.cardActions}>
          <Pressable
            style={styles.actionBtnPrimary}
            onPress={(e) => {
              e.stopPropagation?.()
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              router.push(`/piggy/${piggy.id}`)
            }}
          >
            <Text style={styles.actionBtnPrimaryText}>{t('piggyCard.buyGold')}</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtnSecondary}
            onPress={(e) => {
              e.stopPropagation?.()
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.push('/gift/create')
            }}
          >
            <Text style={styles.actionBtnSecondaryText}>{t('piggyCard.sendGift')}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  )
}

// ─── Gold Price Banner ────────────────────────────────────────────────────────

function GoldPriceBanner() {
  const { t } = useTranslation()
  const mockPrice = 98.45
  const mockChange = 1.23

  return (
    <LinearGradient
      colors={['rgba(255, 251, 235, 0.9)', 'rgba(255, 247, 212, 0.7)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.priceBanner}
    >
      <View>
        <Text style={styles.priceLabel}>{t('home.goldPrice')}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceValue}>${mockPrice.toFixed(2)}</Text>
          <Text style={styles.priceUnit}>{t('home.perGram')}</Text>
        </View>
      </View>
      <View style={styles.priceChangePill}>
        <Text style={styles.priceChangeText}>▲ {mockChange}%</Text>
      </View>
    </LinearGradient>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.emptyWrap}>
      <Text style={styles.emptyEmoji}>🐷</Text>
      <Text style={styles.emptyTitle}>{t('home.emptyTitle')}</Text>
      <Text style={styles.emptySubtitle}>{t('home.emptySubtitle')}</Text>
      <Pressable
        style={styles.emptyBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          router.push('/piggy/create')
        }}
      >
        <Text style={styles.emptyBtnText}>{t('home.createFirst')}</Text>
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

  const displayName = profile?.display_name?.split(' ')[0] ?? ''
  const usdcBalance = profile?.grail_usdc_balance ?? 0

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInRight.duration(600).springify()} style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {t('home.greeting')} {displayName ? `${displayName} 👋` : '👋'}
          </Text>
          <Text style={styles.appName}>{t('home.appName')}</Text>
        </View>
        <View style={styles.balancePill}>
          <Text style={styles.balancePillLabel}>{t('home.usdcBalance')}</Text>
          <Text style={styles.balancePillValue}>{usdcBalance.toFixed(2)} USDC</Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#D4001A" />
        }
      >
        {/* Gold price */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <GoldPriceBanner />
        </Animated.View>

        {/* Section title */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.myPiggies')}</Text>
        </Animated.View>

        {/* Piggies list */}
        {isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonPiggyCard />
            <SkeletonPiggyCard />
          </View>
        ) : piggies && piggies.length > 0 ? (
          <View style={styles.listWrap}>
            {piggies.map((piggy, index) => (
              <PiggyCard key={piggy.id} piggy={piggy} index={index} />
            ))}
          </View>
        ) : (
          <EmptyState />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          router.push('/piggy/create')
        }}
        style={[styles.fab, { bottom: insets.bottom + 90 }]}
        accessibilityLabel={t('piggy.addPiggy')}
        accessibilityRole="button"
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
  },
  appName: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginTop: 1,
  },
  balancePill: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  balancePillLabel: {
    fontSize: 10,
    color: '#D97706',
    fontFamily: 'Outfit_400Regular',
  },
  balancePillValue: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: '#B45309',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  priceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  priceLabel: {
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'Outfit_400Regular',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#78350F',
  },
  priceUnit: {
    fontSize: 13,
    color: '#92400E',
    fontFamily: 'Outfit_400Regular',
  },
  priceChangePill: {
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  priceChangeText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#065F46',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
  },
  skeletonWrap: {
    gap: 16,
  },
  listWrap: {
    gap: 16,
  },
  // PiggyCard
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFB3C6',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  cardInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
  },
  balanceValue: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    color: '#D4001A',
  },
  balanceUnit: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit_400Regular',
    flex: 1,
  },
  progressPct: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: '#D4001A',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4001A',
    borderRadius: 3,
  },
  progressTarget: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
    textAlign: 'right',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#D4001A',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: '#FFF0F3',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFB3C6',
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#D4001A',
  },
  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  emptyBtn: {
    backgroundColor: '#D4001A',
    borderRadius: 18,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: '#D4001A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyBtnText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D4001A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4001A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  fabIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: 'Outfit_400Regular',
    lineHeight: 32,
  },
  bottomSpacer: {
    height: 100,
  },
})
