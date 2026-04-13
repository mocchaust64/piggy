import { useTranslation } from 'react-i18next'
import { RefreshControl, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { tv } from 'tailwind-variants'
import { useTransactions } from '@/hooks/useTransactions'
import type { Transaction } from '@/types/database'

// ─── Transaction item styles ───────────────────────────────────────────────────

const txItemVariants = tv({
  slots: {
    item: 'flex-row items-center border-b border-gray-50 px-[18px] py-3.5',
    iconWrap: 'h-[46px] w-[46px] items-center justify-center rounded-full',
    icon: 'text-[22px]',
    body: 'flex-1 gap-0.5',
    label: 'font-outfit-semibold text-sm text-gray-900',
    date: 'font-outfit-regular text-[12px] text-gray-400',
    usdc: 'font-outfit-regular text-[11px] text-amber-600',
    right: 'items-end gap-1',
    amount: 'font-outfit-bold text-[15px]',
    badge: 'rounded-xl px-2 py-0.5',
    statusText: 'font-outfit-regular text-[11px]',
  },
  variants: {
    type: {
      buy_gold: {
        iconWrap: 'bg-red-50',
        amount: 'text-red-600',
      },
      gift_sent: {
        iconWrap: 'bg-red-50',
        amount: 'text-red-600',
      },
      gift_received: {
        iconWrap: 'bg-emerald-50',
        amount: 'text-emerald-600',
      },
      default: {
        iconWrap: 'bg-gray-50',
        amount: 'text-red-600',
      },
    },
    status: {
      completed: {
        badge: 'bg-gray-100',
        statusText: 'text-gray-400',
      },
      pending: {
        badge: 'bg-amber-100',
        statusText: 'text-amber-600',
      },
    },
  },
  defaultVariants: {
    type: 'default',
    status: 'pending',
  },
})

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

  const icon = iconMap[tx.type] ?? '💰'
  const label = labelMap[tx.type] ?? tx.type
  const isIncoming = tx.type === 'gift_received'
  const amountSign = isIncoming ? '+' : '-'

  const date = new Date(tx.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const {
    item,
    iconWrap,
    icon: iconClass,
    body,
    label: labelClass,
    date: dateClass,
    usdc,
    right,
    amount,
    badge,
    statusText,
  } = txItemVariants({
    type: tx.type as any,
    status: tx.status as any,
  })

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60)
        .springify()
        .damping(18)}
    >
      <View className={item()}>
        <View className={iconWrap()}>
          <Text className={iconClass()}>{icon}</Text>
        </View>

        <View className={body()}>
          <Text className={labelClass()}>{label}</Text>
          <Text className={dateClass()}>{date}</Text>
          {tx.usdc_amount != null && (
            <Text className={usdc()}>≈ {tx.usdc_amount.toFixed(2)} USDC</Text>
          )}
        </View>

        <View className={right()}>
          <Text className={amount()}>
            {amountSign}
            {tx.amount.toFixed(4)}g
          </Text>
          <View className={badge()}>
            <Text className={statusText()}>
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
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} className="px-6 pb-2 pt-3">
        <Text className="font-outfit-bold text-[22px] text-gray-900">{t('transaction.title')}</Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-2"
        className="mb-0"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#D4001A" />
        }
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center pt-20">
            <Text className="font-outfit-regular text-sm text-gray-400">{t('common.loading')}</Text>
          </View>
        ) : groups.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="items-center gap-2 pt-20"
          >
            <Text className="mb-2 text-[64px]">📋</Text>
            <Text className="font-outfit-bold text-lg text-gray-900">{t('transaction.empty')}</Text>
            <Text className="font-outfit-regular text-sm text-gray-400">{t('home.myPiggies')}</Text>
          </Animated.View>
        ) : (
          groups.map(({ date, items }) => (
            <View key={date} className="mb-6">
              <Text className="mb-2.5 ml-1 font-outfit-semibold text-[13px] text-gray-500">
                {date}
              </Text>
              <View className="elevation-2 overflow-hidden rounded-[24px] bg-white shadow-sm">
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

// Removed legacy StyleSheet. Using NativeWind v4 + tailwind-variants.
