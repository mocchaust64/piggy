import { useTranslation } from 'react-i18next'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { useTransactions } from '@/hooks/useTransactions'
import type { Transaction } from '@/types/database'

// ─── Transaction item ─────────────────────────────────────────────────────────

function TxItem({ tx, index }: { tx: Transaction; index: number }) {
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
  const colorMap: Record<string, string> = {
    buy_gold: '#D4001A',
    gift_sent: '#D4001A',
    gift_received: '#059669',
  }

  const icon = iconMap[tx.type] ?? '💰'
  const label = labelMap[tx.type] ?? tx.type
  const amountColor = colorMap[tx.type] ?? '#D4001A'
  const isIncoming = tx.type === 'gift_received'
  const amountSign = isIncoming ? '+' : '-'
  const iconBg = isIncoming ? '#ECFDF5' : '#FFF0F3'

  const date = new Date(tx.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60)
        .springify()
        .damping(18)}
    >
      <View style={styles.txItem}>
        <View style={[styles.txIconWrap, { backgroundColor: iconBg }]}>
          <Text style={styles.txIcon}>{icon}</Text>
        </View>

        <View style={styles.txBody}>
          <Text style={styles.txLabel}>{label}</Text>
          <Text style={styles.txDate}>{date}</Text>
          {tx.usdc_amount != null && (
            <Text style={styles.txUsdc}>≈ {tx.usdc_amount.toFixed(2)} USDC</Text>
          )}
        </View>

        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: amountColor }]}>
            {amountSign}
            {tx.amount.toFixed(4)}g
          </Text>
          <View
            style={[
              styles.txStatusBadge,
              tx.status === 'completed' ? styles.txStatusBadgeDone : styles.txStatusBadgePending,
            ]}
          >
            <Text
              style={[
                styles.txStatusText,
                tx.status === 'completed' ? styles.txStatusTextDone : styles.txStatusTextPending,
              ]}
            >
              {tx.status === 'completed' ? t('transaction.completed') : t('transaction.pending')}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}

// ─── Group helper ─────────────────────────────────────────────────────────────

function groupByDate(txs: Transaction[]): { date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>()
  for (const tx of txs) {
    const d = new Date(tx.created_at).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(tx)
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { data: transactions, isLoading, refetch, isRefetching } = useTransactions()

  const groups = transactions ? groupByDate(transactions) : []
  let globalIndex = 0

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.headerTitle}>{t('transaction.title')}</Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#D4001A" />
        }
      >
        {isLoading ? (
          <View style={styles.centeredWrap}>
            <Text style={styles.placeholderText}>{t('common.loading')}</Text>
          </View>
        ) : groups.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>{t('transaction.empty')}</Text>
            <Text style={styles.emptySubtitle}>{t('home.myPiggies')}</Text>
          </Animated.View>
        ) : (
          groups.map(({ date, items }) => (
            <View key={date} style={styles.group}>
              <Text style={styles.groupDate}>{date}</Text>
              <View style={styles.groupList}>
                {items.map((tx) => {
                  const idx = globalIndex++
                  return <TxItem key={tx.id} tx={tx} index={idx} />
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  centeredWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 32,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
  // Groups
  group: {
    marginBottom: 24,
  },
  groupDate: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#6B7280',
    marginBottom: 10,
    marginLeft: 4,
  },
  groupList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  // Tx item
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  txIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIcon: {
    fontSize: 22,
  },
  txBody: {
    flex: 1,
    gap: 2,
  },
  txLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  txDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
  },
  txUsdc: {
    fontSize: 11,
    color: '#D97706',
    fontFamily: 'Outfit_400Regular',
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
  txStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  txStatusBadgeDone: {
    backgroundColor: '#F3F4F6',
  },
  txStatusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  txStatusText: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
  },
  txStatusTextDone: {
    color: '#9CA3AF',
  },
  txStatusTextPending: {
    color: '#D97706',
  },
})
