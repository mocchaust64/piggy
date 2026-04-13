/**
 * WithdrawUsdcSheet — Premium flow for withdrawing USDC to an external wallet.
 *
 * Senior Standards: NativeWind v4, Reanimated 4, Biometrics, tailwind-variants.
 */

import { useEffect, useRef, useState } from 'react'
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

import { useWithdrawUsdc } from '@/hooks/useWithdrawUsdc'
import { useWalletBalance } from '@/hooks/useWalletBalance'
import { useBiometrics } from '@/hooks/useBiometrics'

// ─── Variants Definition ─────────────────────────────────────────────────────

const sheetStyles = tv({
  slots: {
    overlay: 'flex-1 justify-end',
    backdrop: 'absolute inset-0 bg-black/40',
    content: 'bg-white rounded-t-[32px] px-5 pt-3 pb-10 shadow-2xl',
    handle: 'self-center w-10 h-1.5 rounded-full bg-gray-200 mb-5',
    title: 'text-2xl font-bold text-gray-900 mb-1',
    subtitle: 'text-sm text-gray-500 mb-6',
    infoRow: 'flex-row items-center justify-between bg-gray-50 rounded-2xl px-4 py-3.5 mb-4',
    infoLabel: 'text-sm text-gray-500 font-medium',
    infoValue: 'text-base font-bold text-emerald-700',
    inputLabel: 'text-[13px] font-semibold text-gray-700 mb-2 ml-1',
    inputWrap: 'flex-row items-center bg-gray-50 rounded-2xl border-2 border-gray-100 px-4 mb-4',
    input: 'flex-1 h-[60px] text-2xl font-bold text-gray-900',
    inputUnit: 'text-base font-semibold text-gray-400',
    errorText: 'text-sm text-red-600 text-center mb-4 font-medium',
    button: 'h-[58px] rounded-2xl items-center justify-center shadow-md bg-emerald-600',
    buttonText: 'text-base font-bold text-white',
    cancelButton: 'items-center pt-4',
    cancelText: 'text-base text-gray-400 font-medium',
    // Success slots
    successIcon:
      'w-20 h-20 rounded-full bg-emerald-50 items-center justify-center self-center mb-4',
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
        button: 'bg-emerald-200 shadow-none',
      },
    },
  },
})

// ─── Component ───────────────────────────────────────────────────────────────

interface WithdrawUsdcSheetProps {
  visible: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'input' | 'success'

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable)

export function WithdrawUsdcSheet({ visible, onClose, onSuccess }: WithdrawUsdcSheetProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('input')
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { usdcBalance } = useWalletBalance()
  const { mutate: withdraw, isPending, reset } = useWithdrawUsdc()
  const { challenge } = useBiometrics()

  const inputRef = useRef<TextInput>(null)
  const scale = useSharedValue(1)

  const amountNum = parseFloat(amount)
  const isValidAmount = !isNaN(amountNum) && amountNum > 0 && amountNum <= usdcBalance

  const hasError = !!errorMsg || (!!amount && !isValidAmount)
  const classes = sheetStyles({ hasError, disabled: !isValidAmount || isPending })

  const [slideAnim] = useState(() => new Animated.Value(400))

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        setStep('input')
        setAmount('')
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

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 15, stiffness: 200 }) }],
  }))

  const handlePressIn = () => {
    if (isValidAmount && !isPending) {
      scale.value = 0.96
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
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
    if (amountNum > usdcBalance) {
      setErrorMsg(t('walletScreen.errorInsufficientUsdc'))
      return false
    }
    if (!address) {
      setErrorMsg(t('walletScreen.errorInvalidAddress'))
      return false
    }
    return true
  }

  async function handleConfirm() {
    if (!validate()) return

    // Biometric challenge before withdrawal
    const authenticated = await challenge(t('walletScreen.withdrawConfirm'))
    if (!authenticated) return

    withdraw(
      { amount: amountNum, destinationAddress: address },
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

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isPending ? undefined : onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className={classes.overlay()}>
          <Pressable className={classes.backdrop()} onPress={isPending ? undefined : onClose} />

          <Animated.View
            className={classes.content()}
            style={{ transform: [{ translateY: slideAnim }] }}
          >
            <View className={classes.handle()} />

            {step === 'success' ? (
              <Reanimated.View entering={FadeIn.delay(200)}>
                <View className={classes.successIcon()}>
                  <Ionicons name="checkmark-done" size={56} color="#059669" />
                </View>
                <Text className={classes.successTitle()}>
                  {t('walletScreen.withdrawSuccessTitle')}
                </Text>
                <Text className={classes.successSubtitle()}>
                  {t('walletScreen.withdrawSuccess', { amount })}
                </Text>

                <View className={classes.receiptCard()}>
                  <View className={classes.receiptRow()}>
                    <Text className={classes.receiptLabel()}>
                      {t('walletScreen.depositAmountLabel')}
                    </Text>
                    <Text className={classes.receiptValue()}>{amount} USDC</Text>
                  </View>
                  <View className={classes.receiptRow()}>
                    <Text className={classes.receiptLabel()}>{t('walletScreen.address')}</Text>
                    <Text
                      className="text-xs font-semibold text-gray-900"
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {address}
                    </Text>
                  </View>
                  <View className={classes.receiptRow()}>
                    <Text className={classes.receiptLabel()}>{t('transaction.status')}</Text>
                    <Text className="text-xs font-bold text-emerald-600">COMPLETED</Text>
                  </View>
                </View>

                <AnimatedPressable
                  className={classes.button()}
                  style={animatedButtonStyle}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={onClose}
                >
                  <Text className={classes.buttonText()}>{t('common.done')}</Text>
                </AnimatedPressable>
              </Reanimated.View>
            ) : (
              <>
                <Text className={classes.title()}>{t('walletScreen.withdrawSheetTitle')}</Text>
                <Text className={classes.subtitle()}>
                  {t('walletScreen.withdrawSheetSubtitle')}
                </Text>

                {/* Balance Row */}
                <View className={classes.infoRow()}>
                  <Text className={classes.infoLabel()}>{t('walletScreen.usdcBalance')}</Text>
                  <Text className={classes.infoValue()}>{usdcBalance.toFixed(2)} USDC</Text>
                </View>

                {/* Input Section */}
                <View>
                  <Text className={classes.inputLabel()}>
                    {t('walletScreen.withdrawAmountLabel')}
                  </Text>
                  <View className={classes.inputWrap()}>
                    <TextInput
                      ref={inputRef}
                      className={classes.input()}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor="#9CA3AF"
                      value={amount}
                      onChangeText={(v) => {
                        setAmount(v)
                        setErrorMsg('')
                      }}
                      maxLength={12}
                      editable={!isPending}
                    />
                    <Text className={classes.inputUnit()}>USDC</Text>
                  </View>
                </View>

                <View className="mb-6">
                  <Text className={classes.inputLabel()}>{t('walletScreen.depositAddress')}</Text>
                  <View className="flex-row items-center rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3.5">
                    <TextInput
                      className="flex-1 font-outfit-semibold text-sm text-gray-900"
                      placeholder="Solana Address"
                      value={address}
                      onChangeText={setAddress}
                      editable={!isPending}
                    />
                  </View>
                </View>

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
                    <Text className={classes.buttonText()}>
                      {t('walletScreen.withdrawConfirm')}
                    </Text>
                  )}
                </AnimatedPressable>

                <Pressable
                  className={classes.cancelButton()}
                  onPress={onClose}
                  disabled={isPending}
                >
                  <Text className={classes.cancelText()}>{t('common.cancel')}</Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
