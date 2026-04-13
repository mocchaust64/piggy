/**
 * DepositUsdcSheet — Deposit flow with real Phantom signing.
 *
 * Flow:
 *   1. User enters USDC amount
 *   2. Tap confirm → MWA opens Phantom with a human-readable deposit message
 *   3. User approves in Phantom → returns Ed25519 signed payload (base58)
 *   4. Sheet shows the signature, then credits grail_usdc_balance in DB
 *   5. Success screen shows detailed receipt with Explorer link.
 *
 * Senior Standards: NativeWind v4, Reanimated 4, tailwind-variants.
 */

import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  Linking,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import * as Clipboard from 'expo-clipboard'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { tv } from 'tailwind-variants'

import { solanaService } from '@/services/solanaService'
import { useDepositUsdc } from '@/hooks/useDepositUsdc'

// ─── Variants Definition ─────────────────────────────────────────────────────

const sheetStyles = tv({
  slots: {
    overlay: 'flex-1 justify-end',
    backdrop: 'absolute inset-0 bg-black/40',
    content: 'bg-white rounded-t-[32px] px-5 pt-3 pb-10 shadow-2xl',
    handle: 'self-center w-10 h-1.5 rounded-full bg-gray-200 mb-5',
    headerRow: 'flex-row items-center gap-3 mb-6',
    phantomBadge: 'w-12 h-12 rounded-2xl bg-indigo-50 items-center justify-center',
    phantomEmoji: 'text-2xl',
    title: 'text-lg font-bold text-gray-900',
    subtitle: 'text-sm text-gray-500',
    inputWrap: 'flex-row items-center bg-gray-50 rounded-2xl border-2 border-gray-100 px-4 mb-3',
    input: 'flex-1 h-[68px] text-3xl font-bold text-gray-900',
    inputUnit: 'text-base font-semibold text-gray-400',
    errorText: 'text-sm text-red-600 text-center mb-3 font-medium',
    button: 'h-[58px] rounded-2xl items-center justify-center shadow-md',
    buttonText: 'text-base font-bold text-white',
    cancelButton: 'items-center pt-4',
    cancelText: 'text-base text-gray-400 font-medium',
    successIcon: 'w-20 h-20 rounded-full bg-green-50 items-center justify-center self-center mb-4',
    successTitle: 'text-2xl font-bold text-gray-900 text-center mb-2',
    successSubtitle: 'text-base text-gray-500 text-center mb-6',
    receiptCard: 'bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100',
    receiptRow: 'flex-row justify-between items-center mb-3',
    receiptLabel: 'text-sm text-gray-500',
    receiptValue: 'text-sm font-semibold text-gray-900',
    sigBox: 'bg-white rounded-xl p-3 border border-gray-200 mt-2',
    sigText: 'text-[11px] text-gray-400 font-mono mb-2',
    actionRow: 'flex-row gap-2',
    actionButton: 'flex-1 h-10 rounded-lg flex-row items-center justify-center gap-1.5 bg-gray-100',
    actionText: 'text-xs font-semibold text-gray-600',
  },
  variants: {
    step: {
      input: {},
      signing: {},
      confirmed: {},
      success: {},
    },
    disabled: {
      true: {
        button: 'bg-green-200 shadow-none',
      },
      false: {
        button: 'bg-brand-red',
      },
    },
    withMargin: {
      true: {
        receiptLabel: 'mt-1',
      },
    },
  },
  defaultVariants: {
    disabled: false,
  },
})

// ─── Component ───────────────────────────────────────────────────────────────

interface DepositUsdcSheetProps {
  visible: boolean
  onClose: () => void
  onSuccess?: (amount: number) => void
}

type Step = 'input' | 'signing' | 'confirmed' | 'success'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function DepositUsdcSheet({ visible, onClose, onSuccess }: DepositUsdcSheetProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('input')
  const [amountText, setAmountText] = useState('')
  const [signature, setSignature] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { mutate: deposit, isPending, reset } = useDepositUsdc()
  const inputRef = useRef<TextInput>(null)

  const scale = useSharedValue(1)
  const amountNum = parseFloat(amountText)
  const isValidAmount = !isNaN(amountNum) && amountNum >= 1
  const isLoading = step === 'signing' || isPending

  const classes = sheetStyles({ step, disabled: !isValidAmount || isLoading })

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep('input')
      setAmountText('')
      setSignature('')
      setErrorMsg('')
      reset()
      setTimeout(() => inputRef.current?.focus(), 500)
    }
  }, [visible, reset])

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 15, stiffness: 200 }) }],
  }))

  const handlePressIn = () => {
    if (isValidAmount && !isLoading) {
      scale.value = 0.96
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  }

  const handlePressOut = () => {
    scale.value = 1
  }

  async function handleConfirm() {
    if (!isValidAmount) return
    setErrorMsg('')
    setStep('signing')

    try {
      const result = await solanaService.signDepositMessage(amountNum)
      setSignature(result.signature)
      setStep('confirmed')

      deposit(amountNum, {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          setStep('success')
          onSuccess?.(amountNum)
        },
        onError: (err) => {
          setErrorMsg(err.message || t('common.error'))
          setStep('input')
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        },
      })
    } catch (e: unknown) {
      const name = (e as { name?: string })?.name
      if (name !== 'UserRejectionError') {
        setErrorMsg(t('walletScreen.depositSignError'))
      }
      setStep('input')
    }
  }

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(signature)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const openExplorer = () => {
    const url = `https://explorer.solana.com/address/${signature}?cluster=devnet`
    Linking.openURL(url)
  }

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={isLoading ? undefined : onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className={classes.overlay()}>
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className={classes.backdrop()}
          >
            <Pressable className="flex-1" onPress={isLoading ? undefined : onClose} />
          </Animated.View>

          <Animated.View
            entering={SlideInUp.springify().damping(20).stiffness(150)}
            exiting={SlideOutDown.duration(200)}
            className={classes.content()}
          >
            <View className={classes.handle()} />

            {step === 'success' ? (
              <Animated.View entering={FadeIn.delay(200)}>
                <View className={classes.successIcon()}>
                  <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
                </View>
                <Text className={classes.successTitle()}>
                  {t('walletScreen.depositSuccessTitle')}
                </Text>
                <Text className={classes.successSubtitle()}>
                  {t('walletScreen.depositSuccess', { amount: amountText })}
                </Text>

                <View className={classes.receiptCard()}>
                  <View className={classes.receiptRow()}>
                    <Text className={classes.receiptLabel()}>
                      {t('walletScreen.depositAmountLabel')}
                    </Text>
                    <Text className={classes.receiptValue()}>+{amountText} USDC</Text>
                  </View>
                  <View className={classes.receiptRow()}>
                    <Text className={classes.receiptLabel()}>{t('transaction.completed')}</Text>
                    <Text className="text-xs font-bold text-green-600">SUCCESS</Text>
                  </View>

                  <Text className={classes.receiptLabel({ withMargin: true })}>
                    {t('walletScreen.depositSignatureLabel')}
                  </Text>
                  <View className={classes.sigBox()}>
                    <Text className={classes.sigText()}>{signature}</Text>
                    <View className={classes.actionRow()}>
                      <Pressable className={classes.actionButton()} onPress={copyToClipboard}>
                        <Ionicons name="copy-outline" size={14} color="#4B5563" />
                        <Text className={classes.actionText()}>
                          {t('walletScreen.copySignature')}
                        </Text>
                      </Pressable>
                      <Pressable className={classes.actionButton()} onPress={openExplorer}>
                        <Ionicons name="open-outline" size={14} color="#4B5563" />
                        <Text className={classes.actionText()}>
                          {t('walletScreen.viewOnExplorer')}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <AnimatedPressable
                  className={classes.button({ disabled: false })}
                  style={animatedButtonStyle}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={onClose}
                >
                  <Text className={classes.buttonText()}>{t('common.done')}</Text>
                </AnimatedPressable>
              </Animated.View>
            ) : (
              <>
                <View className={classes.headerRow()}>
                  <View className={classes.phantomBadge()}>
                    <Text className={classes.phantomEmoji()}>👻</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={classes.title()}>{t('walletScreen.depositSheetTitle')}</Text>
                    <Text className={classes.subtitle()}>
                      {t('walletScreen.depositSheetSubtitle')}
                    </Text>
                  </View>
                </View>

                <View className={classes.inputWrap()}>
                  <TextInput
                    ref={inputRef}
                    className={classes.input()}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    value={amountText}
                    onChangeText={(v) => {
                      setAmountText(v)
                      setErrorMsg('')
                    }}
                    editable={!isLoading}
                    maxLength={10}
                  />
                  <Text className={classes.inputUnit()}>USDC</Text>
                </View>

                {!!errorMsg && (
                  <Animated.Text entering={FadeIn} className={classes.errorText()}>
                    {errorMsg}
                  </Animated.Text>
                )}

                <AnimatedPressable
                  className={classes.button()}
                  disabled={!isValidAmount || isLoading}
                  style={animatedButtonStyle}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleConfirm}
                >
                  {isLoading ? (
                    <View className="flex-row items-center gap-3">
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text className={classes.buttonText()}>
                        {step === 'signing'
                          ? t('walletScreen.depositProcessing')
                          : t('walletScreen.depositUpdating')}
                      </Text>
                    </View>
                  ) : (
                    <Text className={classes.buttonText()}>{t('walletScreen.depositConfirm')}</Text>
                  )}
                </AnimatedPressable>

                <Pressable
                  className={classes.cancelButton()}
                  onPress={onClose}
                  disabled={isLoading}
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
