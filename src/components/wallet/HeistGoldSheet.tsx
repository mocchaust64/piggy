/**
 * HeistGoldSheet — "Thief mode" flow for withdrawing gold from a specific piggy bank.
 *
 * Senior Standards: NativeWind v4, Reanimated 4, Biometrics, tailwind-variants.
 * Theme: Playful Heist / Thief.
 */

import { useRef, useState, useEffect } from 'react'
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
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tv } from 'tailwind-variants'

import { useWithdrawFromPiggy } from '@/hooks/useWithdrawFromPiggy'
import { useBiometrics } from '@/hooks/useBiometrics'
import { BaseBottomSheet } from '../ui/BaseBottomSheet'

// ─── Variants Definition ─────────────────────────────────────────────────────

const heistStyles = tv({
  slots: {
    content: 'pb-4',
    title: 'text-2xl font-bold text-slate-900 mb-1 text-center',
    subtitle: 'text-sm text-slate-500 mb-8 text-center px-4',
    piggyInfo:
      'flex-row items-center bg-slate-50 rounded-3xl px-5 py-4 mb-6 border border-slate-100',
    piggyAvatar: 'w-12 h-12 rounded-2xl bg-slate-200 items-center justify-center mr-4',
    piggyName: 'text-base font-bold text-slate-900',
    piggyBalance: 'text-xs text-slate-500',
    inputWrap: 'flex-row items-center bg-slate-50 rounded-2xl border-2 border-slate-100 px-5 mb-2',
    input: 'flex-1 h-[70px] text-3xl font-bold text-slate-900',
    inputUnit: 'text-lg font-bold text-slate-400',
    helperText: 'text-[11px] text-slate-400 mb-8 ml-1',
    errorText: 'text-sm text-red-600 text-center mb-6 font-semibold',
    button: 'h-[64px] rounded-2xl items-center justify-center shadow-lg bg-slate-900',
    buttonText: 'text-base font-bold text-white uppercase tracking-widest',
    cancelButton: 'items-center pt-5',
    cancelText: 'text-base text-slate-400 font-medium',
    // Success slots
    successIcon:
      'w-24 h-24 rounded-full bg-slate-900 items-center justify-center self-center mb-6 shadow-xl',
    successTitle: 'text-2xl font-bold text-slate-900 text-center mb-2',
    successSubtitle: 'text-base text-slate-500 text-center mb-8 px-6',
    receiptCard: 'bg-slate-50 rounded-3xl p-5 mb-8 border border-slate-100',
    receiptRow: 'flex-row justify-between items-center mb-4',
    receiptLabel: 'text-sm text-slate-500 font-medium',
    receiptValue: 'text-sm font-bold text-slate-900',
  },
  variants: {
    hasError: {
      true: {
        inputWrap: 'border-red-200 bg-red-50/30',
      },
    },
    disabled: {
      true: {
        button: 'bg-slate-300 shadow-none',
      },
    },
  },
})

// ─── Component ───────────────────────────────────────────────────────────────

interface HeistGoldSheetProps {
  visible: boolean
  piggyId: string
  piggyName: string
  availableGold: number
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'input' | 'success'

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable)

export function HeistGoldSheet({
  visible,
  piggyId,
  piggyName,
  availableGold,
  onClose,
  onSuccess,
}: HeistGoldSheetProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('input')
  const [amount, setAmount] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { mutate: heist, isPending, reset } = useWithdrawFromPiggy()
  const { challenge } = useBiometrics()

  const inputRef = useRef<TextInput>(null)
  const scale = useSharedValue(1)

  const amountNum = parseFloat(amount)
  const isValidAmount = !isNaN(amountNum) && amountNum > 0 && amountNum <= availableGold

  const hasError = !!errorMsg || (!!amount && !isValidAmount)
  const classes = heistStyles({ hasError, disabled: !isValidAmount || isPending })

  useEffect(() => {
    // Reset mutations on mount
    reset()
    // Auto-focus amount input
    const timer = setTimeout(() => inputRef.current?.focus(), 600)
    return () => clearTimeout(timer)
  }, [reset])

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 15, stiffness: 200 }) }],
  }))

  const handlePressIn = () => {
    if (isValidAmount && !isPending) {
      scale.value = 0.96
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    }
  }

  const handlePressOut = () => {
    scale.value = 1
  }

  function validate(): boolean {
    if (!amountNum || amountNum <= 0) {
      setErrorMsg(t('common.errorInvalidAmount'))
      return false
    }
    if (amountNum > availableGold) {
      setErrorMsg(t('allocateGold.errorInsufficientGold'))
      return false
    }
    return true
  }

  async function handleConfirm() {
    if (!validate()) return

    // Biometric challenge before "Heist"
    const authenticated = await challenge(t('allocateGold.heistConfirm'))
    if (!authenticated) return

    heist(
      { piggyId, goldAmountGrams: amountNum },
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
    setTimeout(() => {
      setStep('input')
      setAmount('')
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
                <MaterialCommunityIcons name="incognito" size={56} color="#FFFFFF" />
              </View>
              <Text className={classes.successTitle()}>
                {t('allocateGold.heistSuccess', { amount })}
              </Text>
              <Text className={classes.successSubtitle()}>
                The gold has been moved back to your primary vault.
              </Text>

              <View className={classes.receiptCard()}>
                <View className={classes.receiptRow()}>
                  <Text className={classes.receiptLabel()}>Target</Text>
                  <Text className={classes.receiptValue()}>Main Wallet</Text>
                </View>
                <View className={classes.receiptRow()}>
                  <Text className={classes.receiptLabel()}>Amount</Text>
                  <Text className={classes.receiptValue()}>{amount}g GOLD</Text>
                </View>
                <View className={classes.receiptRow()}>
                  <Text className={classes.receiptLabel()}>Status</Text>
                  <Text className="text-xs font-bold italic text-slate-900 underline">
                    BYPASSED SECURITY
                  </Text>
                </View>
              </View>

              <AnimatedPressable
                className={classes.button()}
                style={animatedButtonStyle}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleSheetClose}
              >
                <Text className={classes.buttonText()}>Mission Complete</Text>
              </AnimatedPressable>
            </Reanimated.View>
          ) : (
            <>
              <Text className={classes.title()}>{t('allocateGold.heistTitle')}</Text>
              <Text className={classes.subtitle()}>{t('allocateGold.heistSubtitle')}</Text>

              {/* Piggy Info Row */}
              <View className={classes.piggyInfo()}>
                <View className={classes.piggyAvatar()}>
                  <MaterialCommunityIcons name="piggy-bank" size={28} color="#64748b" />
                </View>
                <View className="flex-1">
                  <Text className={classes.piggyName()}>{piggyName}</Text>
                  <Text className={classes.piggyBalance()}>
                    Current: {availableGold.toFixed(4)}g
                  </Text>
                </View>
              </View>

              {/* Input Section */}
              <View className={classes.inputWrap()}>
                <TextInput
                  ref={inputRef}
                  className={classes.input()}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#cbd5e1"
                  value={amount}
                  onChangeText={(v) => {
                    setAmount(v)
                    setErrorMsg('')
                  }}
                  maxLength={10}
                  editable={!isPending}
                />
                <Text className={classes.inputUnit()}>g GOLD</Text>
              </View>
              <Text className={classes.helperText()}>
                Minimum: 0.0001g • Max: {availableGold.toFixed(4)}g
              </Text>

              {!!errorMsg && (
                <Reanimated.Text entering={FadeIn} className={classes.errorText()}>
                  {errorMsg}
                </Reanimated.Text>
              )}

              <AnimatedPressable
                className={classes.button()}
                disabled={!isValidAmount || isPending}
                style={animatedButtonStyle}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleConfirm}
              >
                {isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View className="flex-row items-center gap-3">
                    <MaterialCommunityIcons name="incognito" size={24} color="#FFFFFF" />
                    <Text className={classes.buttonText()}>{t('allocateGold.heistConfirm')}</Text>
                  </View>
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
