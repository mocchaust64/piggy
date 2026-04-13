/**
 * AllocateGoldSheet — Modal bottom sheet for moving gold from parent wallet → piggy.
 *
 * No GRAIL call. Pure internal transfer via allocate-gold Edge Function.
 */

import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'

import { tv } from 'tailwind-variants'
import { useAllocateGold } from '@/hooks/useAllocateGold'
import { useWalletBalance } from '@/hooks/useWalletBalance'
import { BaseBottomSheet } from '../ui/BaseBottomSheet'

interface AllocateGoldSheetProps {
  visible: boolean
  piggyId: string
  piggyName: string
  onClose: () => void
  onSuccess?: () => void
}

const sheetVariants = tv({
  slots: {
    content: 'pb-4',
    title: 'mb-1 font-outfit-bold text-[22px] text-gray-900',
    subtitle: 'mb-5 font-outfit-regular text-sm text-gray-500',
    balanceCard:
      'mb-5 flex-row items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3.5',
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

export function AllocateGoldSheet({
  visible,
  piggyId,
  piggyName,
  onClose,
  onSuccess,
}: AllocateGoldSheetProps) {
  const { t } = useTranslation()
  const [grams, setGrams] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { goldBalance } = useWalletBalance()
  const { mutate: allocate, isPending, reset } = useAllocateGold()

  const gramsNum = parseFloat(grams)
  const isValidGrams = !isNaN(gramsNum) && gramsNum >= 0.0001 && gramsNum <= goldBalance
  const hasError = !isValidGrams && !!grams

  const { content, title, subtitle, balanceCard, inputWrap, confirmBtn } = sheetVariants({
    error: hasError,
    disabled: !isValidGrams || isPending,
  })

  function handleConfirm() {
    if (!isValidGrams) {
      if (gramsNum > goldBalance) {
        setErrorMsg(t('allocateGold.errorInsufficientGold'))
      } else {
        setErrorMsg(t('allocateGold.errorMinAmount'))
      }
      return
    }
    setErrorMsg('')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    allocate(
      { piggyId, goldAmountGrams: gramsNum },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          onSuccess?.()
          handleSheetClose()
        },
        onError: (err) => {
          setErrorMsg(err.message ?? t('common.error'))
        },
      },
    )
  }

  const handleSheetClose = () => {
    onClose()
    setTimeout(() => {
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
        <View className={content()}>
          <Text className={title()}>{t('allocateGold.title')}</Text>
          <Text className={subtitle()}>{t('allocateGold.subtitle', { name: piggyName })}</Text>

          {/* Wallet balance */}
          <View className={balanceCard()}>
            <Text className="font-outfit-regular text-sm text-amber-800">
              {t('allocateGold.walletBalance')}
            </Text>
            <View className="flex-row items-baseline">
              <Text className="font-outfit-bold text-[22px] text-red-600">
                {goldBalance.toFixed(4)}
              </Text>
              <Text className="font-outfit-regular ml-1 text-sm text-gray-400">g</Text>
            </View>
          </View>

          {/* Input */}
          <View className="mb-2">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-outfit-semibold text-[13px] text-gray-700">
                {t('allocateGold.goldAmountLabel')}
              </Text>
              <Pressable
                onPress={() => {
                  setGrams(goldBalance.toFixed(4))
                  setErrorMsg('')
                }}
              >
                <Text className="font-outfit-semibold text-[13px] text-red-600">
                  {t('allocateGold.addAll')}
                </Text>
              </Pressable>
            </View>
            <View className={inputWrap()}>
              <TextInput
                className="h-[52px] flex-1 font-outfit-semibold text-xl text-gray-900"
                keyboardType="decimal-pad"
                placeholder="0.01"
                placeholderTextColor="#9CA3AF"
                value={grams}
                onChangeText={(v) => {
                  setGrams(v)
                  setErrorMsg('')
                }}
                maxLength={10}
                editable={!isPending}
              />
              <Text className="font-outfit-regular ml-2 text-base text-gray-400">g</Text>
            </View>
            <Text className="font-outfit-regular mt-1.5 px-1 text-[12px] text-gray-400">
              {t('allocateGold.available', { amount: goldBalance.toFixed(4) })}
            </Text>
          </View>

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
              <Text className="font-outfit-bold text-base text-white">
                {t('allocateGold.confirm')}
              </Text>
            )}
          </Pressable>

          <Pressable
            className="items-center py-3 active:opacity-70"
            onPress={handleSheetClose}
            disabled={isPending}
          >
            <Text className="font-outfit-regular text-[15px] text-gray-400">
              {t('common.cancel')}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </BaseBottomSheet>
  )
}

// Removed legacy StyleSheet. Using NativeWind v4 + tailwind-variants.
