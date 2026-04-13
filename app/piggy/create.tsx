import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { tv } from 'tailwind-variants'

import { useCreatePiggy } from '@/hooks/usePiggies'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const createVariants = tv({
  slots: {
    root: 'flex-1 bg-gray-50',
    header: 'flex-row items-center justify-between bg-gray-50 px-4 pb-3',
    backBtn: 'h-11 w-11 items-center justify-center',
    headerTitle: 'font-outfit-bold text-lg text-gray-900',
    avatarSection: 'items-center py-4',
    selectedAvatar:
      'mb-3 h-[100px] w-[100px] items-center justify-center rounded-full border-[3px] border-red-600 bg-red-50 shadow-md elevation-4',
    selectedAvatarEmoji: 'text-[54px]',
    avatarHint: 'mb-5 font-outfit-regular text-sm text-gray-400',
    avatarGrid: 'flex-row flex-wrap justify-center gap-3',
    avatarOption:
      'h-14 w-14 items-center justify-center rounded-full border-2 border-gray-100 bg-white shadow-sm elevation-2 active:scale-95',
    avatarOptionEmoji: 'text-[28px]',
    divider: 'my-6 h-[1px] bg-gray-100',
    form: 'gap-5 mb-8',
    previewCard:
      'mb-8 rounded-[24px] border-[1.5px] border-pink-200 bg-white p-5 shadow-lg elevation-5',
    previewTop: 'mb-4 flex-row items-center gap-4',
    previewAvatar:
      'h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-pink-200 bg-pink-50',
    previewAvatarEmoji: 'text-[32px]',
    previewInfo: 'flex-1',
    previewName: 'mb-0.5 font-outfit-bold text-xl text-gray-900',
    previewGoal: 'font-outfit-regular text-sm text-gray-500',
    previewBalance: 'border-t border-gray-100 pt-3.5',
    previewBalanceLabel: 'mb-1 font-outfit-regular text-[11px] text-gray-400',
    previewBalanceValue: 'font-outfit-bold text-2xl text-red-600',
    previewBalanceUnit: 'font-outfit-regular text-[15px] text-gray-500',
  },
  variants: {
    active: {
      true: {
        avatarOption: 'border-red-600 bg-red-50',
      },
    },
  },
})

// ─── Avatar options ────────────────────────────────────────────────────────────

const AVATARS = ['🐷', '🐼', '🐨', '🦊', '🐰', '🐻', '🦁', '🐯', '🐸', '🐙', '🦄', '🐧']

export default function CreatePiggyScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { mutate: createPiggy, isPending } = useCreatePiggy()

  const [avatar, setAvatar] = useState('🐷')
  const [childName, setChildName] = useState('')
  const [targetDescription, setTargetDescription] = useState('')
  const [targetAmount, setTargetAmount] = useState('')

  const canSubmit = childName.trim().length > 0 && !isPending

  function handleCreate() {
    if (!canSubmit) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    const parsedAmount = parseFloat(targetAmount)

    createPiggy(
      {
        child_name: childName.trim(),
        avatar_url: avatar,
        target_description: targetDescription.trim() || null,
        target_amount: !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : null,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          router.back()
        },
        onError: (err) => {
          console.error('[CreatePiggy] error:', err)
          Alert.alert('', t('common.error'))
        },
      },
    )
  }

  const {
    root,
    header,
    backBtn,
    headerTitle,
    avatarSection,
    selectedAvatar,
    selectedAvatarEmoji,
    avatarHint,
    avatarGrid,
    avatarOption,
    avatarOptionEmoji,
    divider,
    form,
    previewCard,
    previewTop,
    previewAvatar,
    previewAvatarEmoji,
    previewInfo,
    previewName,
    previewGoal,
    previewBalance,
    previewBalanceLabel,
    previewBalanceValue,
    previewBalanceUnit,
  } = createVariants()

  return (
    <KeyboardAvoidingView
      className={root()}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        className={header()}
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable onPress={() => router.back()} className={backBtn()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#D4001A" />
        </Pressable>
        <Text className={headerTitle()}>{t('createPiggy.title')}</Text>
        <View className={backBtn()} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-6 pt-2"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Avatar section */}
        <Animated.View
          entering={FadeInDown.delay(80).springify().damping(18)}
          className={avatarSection()}
        >
          <View className={selectedAvatar()}>
            <Text className={selectedAvatarEmoji()}>{avatar}</Text>
          </View>
          <Text className={avatarHint()}>{t('createPiggy.chooseAvatar')}</Text>

          {/* Avatar grid */}
          <View className={avatarGrid()}>
            {AVATARS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setAvatar(emoji)
                }}
                className={avatarOption({ active: avatar === emoji })}
              >
                <Text className={avatarOptionEmoji()}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <View className={divider()} />

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(160).springify().damping(18)} className={form()}>
          <Input
            label={t('createPiggy.childName')}
            placeholder={t('createPiggy.childNamePlaceholder')}
            value={childName}
            onChangeText={setChildName}
            autoCapitalize="words"
          />

          <Input
            label={t('createPiggy.targetDescription')}
            placeholder={t('createPiggy.targetDescriptionPlaceholder')}
            value={targetDescription}
            onChangeText={setTargetDescription}
          />

          <Input
            label={t('createPiggy.targetAmount')}
            placeholder={t('createPiggy.targetAmountPlaceholder')}
            value={targetAmount}
            onChangeText={setTargetAmount}
            keyboardType="decimal-pad"
            suffix="g"
            onSubmitEditing={handleCreate}
          />
        </Animated.View>

        {/* Preview card */}
        {childName.trim().length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(50).springify().damping(20)}
            className={previewCard()}
          >
            <View className={previewTop()}>
              <View className={previewAvatar()}>
                <Text className={previewAvatarEmoji()}>{avatar}</Text>
              </View>
              <View className={previewInfo()}>
                <Text className={previewName()}>{childName}</Text>
                {targetDescription ? (
                  <Text className={previewGoal()} numberOfLines={1}>
                    {targetDescription}
                  </Text>
                ) : null}
              </View>
            </View>
            <View className={previewBalance()}>
              <Text className={previewBalanceLabel()}>{t('piggyDetail.goldBalance')}</Text>
              <Text className={previewBalanceValue()}>
                0.0000<Text className={previewBalanceUnit()}> g</Text>
              </Text>
            </View>
          </Animated.View>
        )}

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(240).springify().damping(18)}>
          <Button
            label={t('createPiggy.createButton')}
            onPress={handleCreate}
            disabled={!canSubmit}
            loading={isPending}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// Removed legacy StyleSheet. Using NativeWind v4 + tailwind-variants.
