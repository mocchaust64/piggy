import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

import { usePiggy } from '@/hooks/usePiggies'
import { useTransactions } from '@/hooks/useTransactions'
import type { Transaction } from '@/types/database'

// ─── Transaction row ───────────────────────────────────────────────────────────

function TxRow({ tx }: { tx: Transaction }) {
  const { t } = useTranslation()

  const iconMap: Record<string, string> = {
    buy_gold: '🪙',
    gift_sent: '🎁',
    gift_received: '🎀',
  }
  const labelMap: Record<string, string> = {
    buy_gold: t('transaction.buyGold'),
    gift_sent: t('transaction.giftSent'),
    gift_received: t('transaction.giftReceived'),
  }

  const icon = iconMap[tx.type] ?? '💰'
  const label = labelMap[tx.type] ?? tx.type
  const isIncoming = tx.type === 'gift_received'
  const date = new Date(tx.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <View style={styles.txRow}>
      <View style={styles.txIconWrap}>
        <Text style={styles.txIcon}>{icon}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txLabel}>{label}</Text>
        <Text style={styles.txDate}>{date}</Text>
      </View>
      <View style={styles.txAmountWrap}>
        <Text style={[styles.txAmount, isIncoming ? styles.txAmountIn : styles.txAmountOut]}>
          {isIncoming ? '+' : '-'}
          {tx.amount.toFixed(4)}g
        </Text>
        <Text
          style={[
            styles.txStatus,
            tx.status === 'completed' ? styles.txStatusDone : styles.txStatusPending,
          ]}
        >
          {tx.status === 'completed' ? t('transaction.completed') : t('transaction.pending')}
        </Text>
      </View>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PiggyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const { data: piggy, isLoading, refetch, isRefetching } = usePiggy(id ?? '')
  const { data: transactions, isLoading: txLoading } = useTransactions(id)

  const goldAmount = piggy?.piggy_balances?.gold_amount ?? 0
  const target = piggy?.target_amount ?? 0
  const progress = target > 0 ? Math.min(goldAmount / target, 1) : 0
  const progressPct = Math.round(progress * 100)
  const achieved = target > 0 && progress >= 1

  if (isLoading) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    )
  }

  if (!piggy) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>{t('common.error')}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityLabel={t('common.back')}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {piggy.child_name}
        </Text>
        <View style={styles.backBtn} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#D4001A" />
        }
      >
        {/* Avatar hero */}
        <Animated.View entering={FadeInDown.delay(60).springify().damping(18)} style={styles.hero}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroEmoji}>{piggy.avatar_url ?? '🐷'}</Text>
          </View>
          <Text style={styles.heroName}>{piggy.child_name}</Text>
          {piggy.target_description ? (
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>{piggy.target_description}</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Balance card */}
        <Animated.View
          entering={FadeInDown.delay(120).springify().damping(18)}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceCardLabel}>{t('piggyDetail.goldBalance')}</Text>
          <Text style={styles.balanceCardValue}>
            {goldAmount.toFixed(4)}
            <Text style={styles.balanceCardUnit}> g</Text>
          </Text>
          <Text style={styles.balanceCardEquiv}>
            {t('piggyDetail.equivalent')} ~${(goldAmount * 98.45).toFixed(2)} USD
          </Text>

          {/* Progress */}
          {target > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{t('piggyDetail.goalProgress')}</Text>
                <Text style={[styles.progressPct, achieved && styles.progressPctAchieved]}>
                  {achieved ? t('piggyDetail.achieved') : `${progressPct}%`}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPct}%` as `${number}%` },
                    achieved && styles.progressFillAchieved,
                  ]}
                />
              </View>
              <Text style={styles.progressTarget}>
                {goldAmount.toFixed(2)}g / {target}g
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Transactions */}
        <Animated.View entering={FadeInDown.delay(180).springify().damping(18)}>
          <Text style={styles.sectionTitle}>{t('piggyDetail.recentTx')}</Text>

          {txLoading ? (
            <View style={styles.txEmpty}>
              <Text style={styles.txEmptyText}>{t('common.loading')}</Text>
            </View>
          ) : transactions && transactions.length > 0 ? (
            <View style={styles.txList}>
              {transactions.map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </View>
          ) : (
            <View style={styles.txEmpty}>
              <Text style={styles.txEmptyEmoji}>📋</Text>
              <Text style={styles.txEmptyText}>{t('piggyDetail.noTx')}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Action buttons — pinned at bottom */}
      <Animated.View
        entering={FadeInUp.delay(200).springify().damping(18)}
        style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}
      >
        <Pressable
          style={styles.actionBtnSecondary}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            router.push('/gift/create')
          }}
        >
          <Text style={styles.actionBtnSecondaryText}>{t('piggyDetail.sendGift')}</Text>
        </Pressable>
        <Pressable
          style={styles.actionBtnPrimary}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            // TODO: open BuyGold bottom sheet
          }}
        >
          <Text style={styles.actionBtnPrimaryText}>{t('piggyDetail.buyGold')}</Text>
        </Pressable>
      </Animated.View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    color: '#D4001A',
    fontFamily: 'Outfit_400Regular',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  heroAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFB3C6',
    marginBottom: 12,
    shadowColor: '#D4001A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  heroEmoji: {
    fontSize: 56,
  },
  heroName: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginBottom: 8,
  },
  goalBadge: {
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  goalBadgeText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#92400E',
  },
  // Balance card
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
  },
  balanceCardLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
    marginBottom: 6,
  },
  balanceCardValue: {
    fontSize: 44,
    fontFamily: 'Outfit_700Bold',
    color: '#D4001A',
    lineHeight: 52,
  },
  balanceCardUnit: {
    fontSize: 20,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  balanceCardEquiv: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
    marginTop: 4,
    marginBottom: 16,
  },
  progressSection: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Outfit_400Regular',
  },
  progressPct: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#D4001A',
  },
  progressPctAchieved: {
    color: '#059669',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4001A',
    borderRadius: 4,
  },
  progressFillAchieved: {
    backgroundColor: '#059669',
  },
  progressTarget: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
    textAlign: 'right',
  },
  // Transactions
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginBottom: 12,
  },
  txList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    gap: 14,
  },
  txIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIcon: {
    fontSize: 22,
  },
  txInfo: {
    flex: 1,
  },
  txLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
  },
  txAmountWrap: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 2,
  },
  txAmountIn: {
    color: '#059669',
  },
  txAmountOut: {
    color: '#D4001A',
  },
  txStatus: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
  },
  txStatusDone: {
    color: '#9CA3AF',
  },
  txStatusPending: {
    color: '#D97706',
  },
  txEmpty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  txEmptyEmoji: {
    fontSize: 40,
  },
  txEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
  },
  // Action bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  actionBtnPrimary: {
    flex: 2,
    backgroundColor: '#D4001A',
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4001A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  actionBtnPrimaryText: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: '#FFF0F3',
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFB3C6',
  },
  actionBtnSecondaryText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: '#D4001A',
  },
})
