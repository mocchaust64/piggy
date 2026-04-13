import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Clipboard, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { tv } from 'tailwind-variants'
import { useWalletBalance } from '@/hooks/useWalletBalance'
import { useTransactions } from '@/hooks/useTransactions'
import { DepositUsdcSheet } from '@/components/wallet/DepositUsdcSheet'

// ─── Variants ─────────────────────────────────────────────────────────────────

const walletVariants = tv({
  slots: {
    container: 'flex-1 bg-gray-50',
    header: 'px-6 pb-2 pt-3',
    scroll: 'px-5 pt-4',
    card: 'mb-5 rounded-[28px] p-6 shadow-lg elevation-4',
    cardLabel: 'font-outfit-medium mb-1 text-[13px] opacity-80',
    cardValue: 'font-outfit-bold mb-4 text-[32px]',
    cardFooter: 'flex-row items-center justify-between border-t border-white/20 pt-4',
    addressLabel: 'font-outfit-regular text-[11px] opacity-70',
    addressValue: 'font-outfit-medium text-[13px]',
    copyBtn: 'rounded-full bg-white/20 p-2 active:bg-white/30',
    sectionTitle: 'mb-3 ml-1 font-outfit-bold text-lg text-gray-900',
    txList: 'mb-8 elevation-2 overflow-hidden rounded-[24px] bg-white shadow-sm',
    emptyText: 'py-12 text-center font-outfit-regular text-gray-400',
  },
  variants: {
    type: {
      gold: {
        card: 'bg-red-600',
        cardLabel: 'text-white',
        cardValue: 'text-white',
        addressLabel: 'text-white',
        addressValue: 'text-white',
      },
      usdc: {
        card: 'bg-amber-400',
        cardLabel: 'text-amber-900',
        cardValue: 'text-amber-900',
        addressLabel: 'text-amber-900',
        addressValue: 'text-amber-900',
      },
    },
  },
})

export default function WalletScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { goldBalance, usdcBalance, depositAddress, refetch: refetchBalance } = useWalletBalance()
  const { refetch: refetchTxs } = useTransactions()

  const [refreshing, setRefreshing] = useState(false)
  const [depositVisible, setDepositVisible] = useState(false)

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setRefreshing(true)
    await Promise.all([refetchBalance(), refetchTxs()])
    setRefreshing(false)
  }

  const handleCopy = (address: string) => {
    if (!address) return
    Clipboard.setString(address)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const {
    container,
    header,
    scroll,
    card,
    cardLabel,
    cardValue,
    cardFooter,
    addressLabel,
    addressValue,
    copyBtn,
  } = walletVariants()

  return (
    <View className={container()} style={{ paddingTop: insets.top }}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} className={header()}>
        <Text className="font-outfit-bold text-[22px] text-gray-900">
          {t('walletScreen.title')}
        </Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        className={scroll()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4001A" />
        }
      >
        {/* Gold Card */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          className={card({ type: 'gold' })}
        >
          <Text className={cardLabel()}>{t('walletScreen.goldBalance')}</Text>
          <Text className={cardValue()}>{goldBalance.toFixed(4)} g</Text>
          <View className={cardFooter()}>
            <View className="flex-1">
              <Text className={addressLabel()}>{t('walletScreen.depositAddress')}</Text>
              <Text className={addressValue()} numberOfLines={1}>
                {depositAddress
                  ? `${depositAddress.slice(0, 8)}...${depositAddress.slice(-8)}`
                  : '---'}
              </Text>
            </View>
            <Pressable className={copyBtn()} onPress={() => handleCopy(depositAddress ?? '')}>
              <Text className="text-white">📋</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* USDC Card */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          className={card({ type: 'usdc' })}
        >
          <Text className={cardLabel()}>{t('walletScreen.usdcBalance')}</Text>
          <Text className={cardValue()}>${usdcBalance.toFixed(2)}</Text>
          <View className={cardFooter()}>
            <View className="flex-1">
              <Text className={addressLabel()}>{t('walletScreen.depositAddress')}</Text>
              <Text className={addressValue()} numberOfLines={1}>
                {depositAddress
                  ? `${depositAddress.slice(0, 8)}...${depositAddress.slice(-8)}`
                  : '---'}
              </Text>
            </View>
            <Pressable className={copyBtn()} onPress={() => handleCopy(depositAddress ?? '')}>
              <Text className="text-amber-900">📋</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Deposit USDC button */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Pressable
            className="mt-2 flex-row items-center justify-center gap-2 rounded-[20px] bg-green-600 py-4 shadow-lg active:opacity-85"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              setDepositVisible(true)
            }}
          >
            <Text className="font-outfit-bold text-base text-white">
              {t('walletScreen.depositUsdc')}
            </Text>
            <Text className="text-base text-white">↓</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <DepositUsdcSheet
        visible={depositVisible}
        onClose={() => setDepositVisible(false)}
        onSuccess={(amount) => {
          Alert.alert('', t('walletScreen.depositSuccess', { amount: amount.toFixed(2) }))
        }}
      />
    </View>
  )
}

// Removed legacy StyleSheet. Using NativeWind v4 + tailwind-variants.
