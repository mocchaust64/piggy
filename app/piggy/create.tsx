import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'

import { useCreatePiggy } from '@/hooks/usePiggies'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

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

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#D4001A" />
        </Pressable>
        <Text style={styles.headerTitle}>{t('createPiggy.title')}</Text>
        <View style={styles.backBtn} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Avatar section */}
        <Animated.View
          entering={FadeInDown.delay(80).springify().damping(18)}
          style={styles.avatarSection}
        >
          <View style={styles.selectedAvatar}>
            <Text style={styles.selectedAvatarEmoji}>{avatar}</Text>
          </View>
          <Text style={styles.avatarHint}>{t('createPiggy.chooseAvatar')}</Text>

          {/* Avatar grid */}
          <View style={styles.avatarGrid}>
            {AVATARS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setAvatar(emoji)
                }}
                style={[styles.avatarOption, avatar === emoji && styles.avatarOptionActive]}
              >
                <Text style={styles.avatarOptionEmoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <View style={styles.divider} />

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(160).springify().damping(18)} style={styles.form}>
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
            style={styles.previewCard}
          >
            <View style={styles.previewTop}>
              <View style={styles.previewAvatar}>
                <Text style={styles.previewAvatarEmoji}>{avatar}</Text>
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{childName}</Text>
                {targetDescription ? (
                  <Text style={styles.previewGoal} numberOfLines={1}>
                    {targetDescription}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.previewBalance}>
              <Text style={styles.previewBalanceLabel}>{t('piggyDetail.goldBalance')}</Text>
              <Text style={styles.previewBalanceValue}>
                0.0000<Text style={styles.previewBalanceUnit}> g</Text>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  selectedAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#D4001A',
    marginBottom: 12,
    shadowColor: '#D4001A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  selectedAvatarEmoji: {
    fontSize: 54,
  },
  avatarHint: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
    marginBottom: 20,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarOptionActive: {
    backgroundColor: '#FFF0F3',
    borderColor: '#D4001A',
  },
  avatarOptionEmoji: {
    fontSize: 28,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 24,
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1.5,
    borderColor: '#FFB3C6',
    shadowColor: '#D4001A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  previewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFB3C6',
  },
  previewAvatarEmoji: {
    fontSize: 32,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginBottom: 2,
  },
  previewGoal: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  previewBalance: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 14,
  },
  previewBalanceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
    marginBottom: 4,
  },
  previewBalanceValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#D4001A',
  },
  previewBalanceUnit: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
})
