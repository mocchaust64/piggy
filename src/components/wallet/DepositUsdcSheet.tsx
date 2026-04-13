/**
 * DepositUsdcSheet — Deposit flow with real Phantom signing.
 *
 * Flow:
 *   1. User enters USDC amount
 *   2. Tap confirm → MWA opens Phantom with a human-readable deposit message
 *   3. User approves in Phantom → returns Ed25519 signed payload (base58)
 *   4. Sheet shows the signature, then credits grail_usdc_balance in DB
 *
 * Production: replace signDepositMessage with a real SPL token transfer.
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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'

import { solanaService } from '@/services/solanaService'
import { useDepositUsdc } from '@/hooks/useDepositUsdc'

interface DepositUsdcSheetProps {
  visible: boolean
  onClose: () => void
  onSuccess?: (amount: number) => void
}

type Step = 'input' | 'signing' | 'confirmed'

export function DepositUsdcSheet({ visible, onClose, onSuccess }: DepositUsdcSheetProps) {
  const { t } = useTranslation()
  const [slideAnim] = useState(() => new Animated.Value(500))

  const [step, setStep] = useState<Step>('input')
  const [amountText, setAmountText] = useState('')
  const [signature, setSignature] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { mutate: deposit, isPending, reset } = useDepositUsdc()
  const inputRef = useRef<TextInput>(null)

  const amountNum = parseFloat(amountText)
  const isValidAmount = !isNaN(amountNum) && amountNum >= 1

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep('input')

      setAmountText('')

      setSignature('')

      setErrorMsg('')

      reset()
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 160,
      }).start(() => {
        setTimeout(() => inputRef.current?.focus(), 50)
      })
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start()
    }
  }, [visible, reset, slideAnim])

  async function handleConfirm() {
    if (!isValidAmount) return
    setErrorMsg('')
    setStep('signing')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    try {
      // Open Phantom — user sees deposit intent message and approves
      const result = await solanaService.signDepositMessage(amountNum)
      setSignature(result.signature)
      setStep('confirmed')

      // Credit DB after signature received
      deposit(amountNum, {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          onSuccess?.(amountNum)
          // Keep sheet open briefly so user sees the signature, then close
          setTimeout(onClose, 1800)
        },
        onError: () => {
          setErrorMsg(t('common.error'))
          setStep('input')
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        },
      })
    } catch (e: unknown) {
      // User rejected in Phantom or MWA error
      const name = (e as { name?: string })?.name
      if (name !== 'UserRejectionError') {
        setErrorMsg(t('walletScreen.depositSignError'))
      }
      setStep('input')
    }
  }

  const isLoading = step === 'signing' || isPending

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isLoading ? undefined : onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={isLoading ? undefined : onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.phantomBadge}>
              <Text style={styles.phantomEmoji}>👻</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t('walletScreen.depositSheetTitle')}</Text>
              <Text style={styles.subtitle}>{t('walletScreen.depositSheetSubtitle')}</Text>
            </View>
          </View>

          {/* Amount input */}
          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.input}
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
            <Text style={styles.inputUnit}>USDC</Text>
          </View>

          {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          {/* Signature card — visible after Phantom signs */}
          {step === 'confirmed' && !!signature && (
            <View style={styles.sigCard}>
              <View style={styles.sigHeader}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <Text style={styles.sigLabel}>{t('walletScreen.depositSignatureLabel')}</Text>
              </View>
              <Text style={styles.sigValue} numberOfLines={2}>
                {signature}
              </Text>
            </View>
          )}

          {/* Confirm button */}
          <Pressable
            style={[styles.confirmBtn, (!isValidAmount || isLoading) && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!isValidAmount || isLoading}
          >
            {step === 'signing' ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.confirmText}>{t('walletScreen.depositProcessing')}</Text>
              </View>
            ) : step === 'confirmed' && isPending ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.confirmText}>{t('walletScreen.depositUpdating')}</Text>
              </View>
            ) : (
              <Text style={styles.confirmText}>{t('walletScreen.depositConfirm')}</Text>
            )}
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={onClose} disabled={isLoading}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  phantomBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phantomEmoji: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#111827',
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 60,
    fontFamily: 'Outfit_700Bold',
    fontSize: 32,
    color: '#111827',
  },
  inputUnit: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  sigCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  sigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  sigLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#15803D',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sigValue: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
  },
  confirmBtn: {
    height: 54,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  confirmBtnDisabled: {
    backgroundColor: '#86EFAC',
    elevation: 0,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confirmText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingTop: 14,
  },
  cancelText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#9CA3AF',
  },
})
