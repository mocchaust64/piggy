/**
 * BuyGoldSheet — Modal bottom sheet for purchasing gold into the parent wallet.
 *
 * Gold purchased here goes to user_profiles.gold_balance (parent wallet),
 * NOT directly into a piggy. Use AllocateGoldSheet to move gold into a piggy.
 *
 * Senior Standards: NativeWind v4, Reanimated 4, tailwind-variants, Biometrics.
 */

import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import Reanimated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { tv } from 'tailwind-variants'

import { useBuyGold } from '@/hooks/useBuyGold'
import { useGoldPrice } from '@/hooks/useGoldPrice'
import { useWalletBalance } from '@/hooks/useWalletBalance'
import { useBiometrics } from '@/hooks/useBiometrics'
import { BaseBottomSheet } from '../ui/BaseBottomSheet'

// ─── Variants Definition ─────────────────────────────────────────────────────

const sheetStyles = tv({
  slots: {
    content: 'pb-4',
    title: 'text-2xl font-bold text-gray-900 mb-1',
    subtitle: 'text-sm text-gray-500 mb-6',
    infoRow: 'flex-row items-center justify-between bg-gray-50 rounded-2xl px-4 py-3.5 mb-2',
    infoLabel: 'text-sm text-gray-500 font-medium',
    infoValue: 'text-base font-bold text-gray-900',
    priceValue: 'text-base font-bold text-red-600',
    inputLabel: 'text-[13px] font-semibold text-gray-700 mb-2 ml-1',
    inputWrap: 'flex-row items-center bg-gray-50 rounded-2xl border-2 border-gray-100 px-4 mb-3',
    input: 'flex-1 h-[60px] text-2xl font-bold text-gray-900',
    inputUnit: 'text-base font-semibold text-gray-400',
    costRow: 'flex-row justify-between items-center px-1 mb-4',
    costLabel: 'text-[13px] text-gray-500',
    costValue: 'text-sm font-bold text-gray-700',
    errorText: 'text-sm text-red-600 text-center mb-4 font-medium',
    button: 'h-[58px] rounded-2xl items-center justify-center shadow-md bg-red-600',
    buttonText: 'text-base font-bold text-white',
    cancelButton: 'items-center pt-4',
    cancelText: 'text-base text-gray-400 font-medium',
    // Success slots
    successIcon: 'w-20 h-20 rounded-full bg-green-50 items-center justify-center self-center mb-4',
    successTitle: 'text-2xl font-bold text-gray-900 text-center mb-2',
    successSubtitle: 'text-base text-gray-500 text-center mb-6',
    receiptCard: 'bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100',
    receiptRow: 'flex-row justify-between items-center mb-3',
    receiptLabel: 'text-sm text-gray-500',
    receiptValue: 'text-sm font-semibold text-gray-900',
  },
  variants: {
    hasError: {
      true: {
        inputWrap: 'border-red-200 bg-red-50/30',
      },
    },
    disabled: {
      true: {
        button: 'bg-red-200 shadow-none',
      },
    },
  },
})

// ─── Component ───────────────────────────────────────────────────────────────

interface BuyGoldSheetProps {
  visible: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'input' | 'success'

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable)

const SLIPPAGE = 0.01 // 1% buffer

export function BuyGoldSheet({ visible, onClose, onSuccess }: BuyGoldSheetProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('input')
  const [grams, setGrams] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: priceData, formattedPrice, isLoading: priceLoading } = useGoldPrice()
  const { usdcBalance } = useWalletBalance()
  const { mutate: buy, isPending, reset } = useBuyGold()
  const { challenge } = useBiometrics()

  const inputRef = useRef<TextInput>(null)
  const scale = useSharedValue(1)

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 15, stiffness: 200 }) }],
  }))

  const gramsNum = parseFloat(grams)
  const isValidGrams = !isNaN(gramsNum) && gramsNum >= 0.01
  const priceUsd = priceData?.pricePerGramUsd ?? 0
  const estimatedUsdc = isValidGrams
    ? parseFloat((gramsNum * priceUsd * (1 + SLIPPAGE)).toFixed(4))
    : 0

  const hasError = !!errorMsg || (!!grams && !isValidGrams)
  const classes = sheetStyles({ hasError, disabled: !isValidGrams || isPending })

  const handlePressIn = () => {
    if (isValidGrams && !isPending) {
      scale.value = 0.96
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  }

  const handlePressOut = () => {
    scale.value = 1
  }

  function validate(): boolean {
    if (!isValidGrams) {
      setErrorMsg(t('buyGold.errorMinAmount'))
      return false
    }
    if (estimatedUsdc > usdcBalance) {
      setErrorMsg(t('buyGold.errorInsufficientUsdc'))
      return false
    }
    return true
  }

  async function handleConfirm() {
    if (!validate()) return

    const authenticated = await challenge(t('buyGold.authReason'))
    if (!authenticated) return

    buy(
      { goldAmountGrams: gramsNum, maxUsdcAmount: estimatedUsdc },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          setStep('success')
          onSuccess?.()
        },
        onError: (err) => {
          setErrorMsg(err.message ?? t('common.error'))
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        },
      },
    )
  }

  const handleSheetClose = () => {
    onClose()
    // Reset internal state after a delay to allow animation to complete
    setTimeout(() => {
      setStep('input')
      setGrams('')
      setErrorMsg('')
      reset()
    }, 300)
  }

  return (
    <BaseBottomSheet visible={visible} onClose={handleSheetClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View className={classes.content()}>
          {step === 'success' ? (
            <Reanimated.View entering={FadeIn.delay(200)}>
              <View className={classes.successIcon()}>
                <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
              </View>
              <Text className={classes.successTitle()}>{t('buyGold.buySuccessTitle')}</Text>
              <Text className={classes.successSubtitle()}>
                {t('buyGold.buySuccessSubtitle', { amount: grams })}
              </Text>

              <View className={classes.receiptCard()}>
                <View className={classes.receiptRow()}>
                  <Text className={classes.receiptLabel()}>{t('buyGold.goldAmountLabel')}</Text>
                  <Text className={classes.receiptValue()}>{grams}g GOLD</Text>
                </View>
                <View className={classes.receiptRow()}>
                  <Text className={classes.receiptLabel()}>{t('buyGold.estimatedCost')}</Text>
                  <Text className={classes.receiptValue()}>{estimatedUsdc.toFixed(2)} USDC</Text>
                </View>
                <View className={classes.receiptRow()}>
                  <Text className={classes.receiptLabel()}>{t('transaction.completed')}</Text>
                  <Text className="text-xs font-bold text-green-600">SUCCESS</Text>
                </View>
              </View>

              <AnimatedPressable
                className={classes.button()}
                style={animatedButtonStyle}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleSheetClose}
              >
                <Text className={classes.buttonText()}>{t('common.done')}</Text>
              </AnimatedPressable>
            </Reanimated.View>
          ) : (
            <>
              <Text className={classes.title()}>{t('buyGold.title')}</Text>
              <Text className={classes.subtitle()}>{t('buyGold.subtitle')}</Text>

              {/* Price Row */}
              <View className={classes.infoRow()}>
                <Text className={classes.infoLabel()}>{t('buyGold.currentPrice')}</Text>
                {priceLoading ? (
                  <ActivityIndicator size="small" color="#D4001A" />
                ) : (
                  <View className="flex-row items-baseline gap-0.5">
                    <Text className={classes.priceValue()}>{formattedPrice}</Text>
                    <Text className="text-xs font-medium text-gray-400">/g</Text>
                  </View>
                )}
              </View>

              {/* Balance Row */}
              <View className={classes.infoRow()}>
                <Text className={classes.infoLabel()}>{t('buyGold.usdcBalance')}</Text>
                <Text className={classes.infoValue()}>{usdcBalance.toFixed(2)} USDC</Text>
              </View>

              {/* Input Section */}
              <View className="mt-4">
                <Text className={classes.inputLabel()}>{t('buyGold.goldAmountLabel')}</Text>
                <View className={classes.inputWrap()}>
                  <TextInput
                    ref={inputRef}
                    className={classes.input()}
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
                  <Text className={classes.inputUnit()}>g</Text>
                </View>
              </View>

              {isValidGrams && (
                <Reanimated.View entering={FadeIn} className={classes.costRow()}>
                  <Text className={classes.costLabel()}>{t('buyGold.estimatedCost')}</Text>
                  <Text className={classes.costValue()}>≈ {estimatedUsdc.toFixed(2)} USDC</Text>
                </Reanimated.View>
              )}

              {!!errorMsg && (
                <Reanimated.Text entering={FadeIn} className={classes.errorText()}>
                  {errorMsg}
                </Reanimated.Text>
              )}

              <AnimatedPressable
                className={classes.button()}
                disabled={!isValidGrams || isPending}
                style={animatedButtonStyle}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleConfirm}
              >
                {isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className={classes.buttonText()}>{t('buyGold.confirm')}</Text>
                )}
              </AnimatedPressable>

              <Pressable
                className={classes.cancelButton()}
                onPress={handleSheetClose}
                disabled={isPending}
              >
                <Text className={classes.cancelText()}>{t('common.cancel')}</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </BaseBottomSheet>
  )
}
