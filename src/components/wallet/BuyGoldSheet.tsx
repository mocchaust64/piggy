/**
 * BuyGoldSheet — Modal bottom sheet for purchasing gold into the parent wallet.
 *
 * Gold purchased here goes to user_profiles.gold_balance (parent wallet),
 * NOT directly into a piggy. Use AllocateGoldSheet to move gold into a piggy.
 */

import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'

import { tv } from 'tailwind-variants'
import { useBuyGold } from '@/hooks/useBuyGold'
import { useGoldPrice } from '@/hooks/useGoldPrice'
import { useWalletBalance } from '@/hooks/useWalletBalance'

interface BuyGoldSheetProps {
  visible: boolean
  onClose: () => void
  onSuccess?: () => void
}

const SLIPPAGE = 0.01 // 1% buffer

const sheetVariants = tv({
  slots: {
    overlay: 'flex-1 justify-end',
    backdrop: 'absolute inset-0 bg-black/45',
    sheet: 'bg-white rounded-t-[28px] px-6 pb-10 pt-3 shadow-2xl',
    handle: 'mb-5 h-1 w-10 self-center rounded-full bg-gray-200',
    title: 'mb-1 font-outfit-bold text-[22px] text-gray-900',
    subtitle: 'mb-5 font-outfit-regular text-sm text-gray-500',
    infoRow: 'mb-2 flex-row items-center justify-between rounded-xl bg-gray-50 px-4 py-3',
    inputWrap: 'flex-row items-center rounded-2xl border-2 border-gray-100 bg-gray-50 px-4',
    confirmBtn:
      'mt-2 flex h-[54px] items-center justify-center rounded-2xl bg-red-600 shadow-lg active:opacity-90',
  },
  variants: {
    error: {
      true: {
        inputWrap: 'border-red-300',
      },
    },
    disabled: {
      true: {
        confirmBtn: 'bg-red-300 shadow-none opacity-80',
      },
    },
  },
})

export function BuyGoldSheet({ visible, onClose, onSuccess }: BuyGoldSheetProps) {
  const { t } = useTranslation()
  const [slideAnim] = useState(() => new Animated.Value(400))

  const [grams, setGrams] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: priceData, formattedPrice, isLoading: priceLoading } = useGoldPrice()
  const { usdcBalance } = useWalletBalance()
  const { mutate: buy, isPending, reset } = useBuyGold()

  const gramsNum = parseFloat(grams)
  const isValidGrams = !isNaN(gramsNum) && gramsNum >= 0.01
  const priceUsd = priceData?.pricePerGramUsd ?? 0
  const estimatedUsdc = isValidGrams
    ? parseFloat((gramsNum * priceUsd * (1 + SLIPPAGE)).toFixed(4))
    : 0

  const hasError = !!errorMsg || (!!grams && !isValidGrams)

  const { overlay, backdrop, sheet, handle, title, subtitle, infoRow, inputWrap, confirmBtn } =
    sheetVariants({ error: hasError, disabled: !isValidGrams || isPending })

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        setGrams('')
        setErrorMsg('')
        reset()
      }, 0)

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 160,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start()
    }
  }, [visible, reset, slideAnim])

  function validate(): boolean {
    if (!isValidGrams) {
      setErrorMsg(t('buyGold.errorMinAmount'))
      return false
    }
    if (estimatedUsdc > usdcBalance) {
      setErrorMsg(t('buyGold.errorInsufficientUsdc'))
      return false
    }
    setErrorMsg('')
    return true
  }

  function handleConfirm() {
    if (!validate()) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    buy(
      { goldAmountGrams: gramsNum, maxUsdcAmount: estimatedUsdc },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          onSuccess?.()
          onClose()
        },
        onError: (err) => {
          setErrorMsg(err.message ?? t('common.error'))
        },
      },
    )
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        className={overlay()}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable className={backdrop()} onPress={onClose} />
        <Animated.View className={sheet()} style={{ transform: [{ translateY: slideAnim }] }}>
          <View className={handle()} />
          <Text className={title()}>{t('buyGold.title')}</Text>
          <Text className={subtitle()}>{t('buyGold.subtitle')}</Text>

          {/* Price row */}
          <View className={infoRow()}>
            <Text className="font-outfit-regular text-sm text-gray-500">
              {t('buyGold.currentPrice')}
            </Text>
            {priceLoading ? (
              <ActivityIndicator size="small" color="#D4001A" />
            ) : (
              <View className="flex-row items-baseline gap-0.5">
                <Text className="font-outfit-bold text-base text-red-600">{formattedPrice}</Text>
                <Text className="font-outfit-regular text-[13px] text-gray-500">/g</Text>
              </View>
            )}
          </View>

          {/* USDC balance row */}
          <View className={infoRow()}>
            <Text className="font-outfit-regular text-sm text-gray-500">
              {t('buyGold.usdcBalance')}
            </Text>
            <Text className="font-outfit-semibold text-[15px] text-gray-900">
              {usdcBalance.toFixed(2)} USDC
            </Text>
          </View>

          {/* Input */}
          <View className="mb-2 mt-2">
            <Text className="mb-2 font-outfit-semibold text-[13px] text-gray-700">
              {t('buyGold.goldAmountLabel')}
            </Text>
            <View className={inputWrap()}>
              <TextInput
                className="h-[52px] flex-1 font-outfit-semibold text-xl text-gray-900"
                keyboardType="decimal-pad"
                placeholder="0.1"
                placeholderTextColor="#9CA3AF"
                value={grams}
                onChangeText={(v) => {
                  setGrams(v)
                  setErrorMsg('')
                }}
                maxLength={8}
                editable={!isPending}
              />
              <Text className="font-outfit-regular ml-2 text-base text-gray-400">g</Text>
            </View>
          </View>

          {isValidGrams && (
            <View className="mb-3 flex-row items-center justify-between px-1">
              <Text className="font-outfit-regular text-[13px] text-gray-500">
                {t('buyGold.estimatedCost')}
              </Text>
              <Text className="font-outfit-semibold text-sm text-gray-700">
                ≈ {estimatedUsdc.toFixed(2)} USDC
              </Text>
            </View>
          )}

          {!!errorMsg && (
            <Text className="font-outfit-regular mb-3 text-center text-[13px] text-red-600">
              {errorMsg}
            </Text>
          )}

          <Pressable
            className={confirmBtn()}
            onPress={handleConfirm}
            disabled={!isValidGrams || isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="font-outfit-bold text-base text-white">{t('buyGold.confirm')}</Text>
            )}
          </Pressable>

          <Pressable
            className="items-center py-3 active:opacity-70"
            onPress={onClose}
            disabled={isPending}
          >
            <Text className="font-outfit-regular text-[15px] text-gray-400">
              {t('common.cancel')}
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// Removed legacy StyleSheet. Using NativeWind v4 + tailwind-variants.
