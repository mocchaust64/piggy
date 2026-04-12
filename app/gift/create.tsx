import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

import { usePiggies } from '@/hooks/usePiggies'
import type { GiftTemplateType, PiggyWithBalance } from '@/types/database'

// ─── Template config ───────────────────────────────────────────────────────────

const TEMPLATES: {
  type: GiftTemplateType
  emoji: string
  labelKey: string
  defaultMsgKey: string
}[] = [
  {
    type: 'tet',
    emoji: '🧧',
    labelKey: 'giftTemplate.tet.name',
    defaultMsgKey: 'giftTemplate.tet.defaultMessage',
  },
  {
    type: 'sinhnhat',
    emoji: '🎂',
    labelKey: 'giftTemplate.sinhnhat.name',
    defaultMsgKey: 'giftTemplate.sinhnhat.defaultMessage',
  },
  {
    type: 'cuoihoi',
    emoji: '💍',
    labelKey: 'giftTemplate.cuoihoi.name',
    defaultMsgKey: 'giftTemplate.cuoihoi.defaultMessage',
  },
  {
    type: 'thoinhoi',
    emoji: '🍼',
    labelKey: 'giftTemplate.thoinhoi.name',
    defaultMsgKey: 'giftTemplate.thoinhoi.defaultMessage',
  },
]

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateGiftScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const { data: piggies } = usePiggies()

  const [template, setTemplate] = useState<GiftTemplateType>('sinhnhat')
  const [selectedPiggy, setSelectedPiggy] = useState<PiggyWithBalance | null>(null)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState(t('giftTemplate.sinhnhat.defaultMessage'))
  const [amountFocused, setAmountFocused] = useState(false)
  const [msgFocused, setMsgFocused] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const canCreate = selectedPiggy != null && parseFloat(amount) > 0 && !isCreating

  function handleTemplateChange(tmpl: (typeof TEMPLATES)[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setTemplate(tmpl.type)
    setMessage(t(tmpl.defaultMsgKey as Parameters<typeof t>[0]))
  }

  async function handleCreate() {
    if (!canCreate) {
      if (!selectedPiggy) Alert.alert('', 'Vui lòng chọn heo đất nhận quà')
      else if (!(parseFloat(amount) > 0)) Alert.alert('', 'Vui lòng nhập số vàng')
      return
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsCreating(true)

    // TODO: call supabase.functions.invoke('create-gift', ...) in Sprint 5
    // For now simulate and show share
    await new Promise((r) => setTimeout(r, 800))
    setIsCreating(false)

    const mockCode = 'GIFT-' + Math.random().toString(36).slice(2, 8).toUpperCase()
    await Share.share({
      message: `${message}\n\n${t('gift.shareButton')}: heodat://gift/${mockCode}`,
      title: t('gift.createTitle'),
    })
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
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t('gift.createTitle')}</Text>
        <View style={styles.backBtn} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Template picker */}
        <Animated.View
          entering={FadeInDown.delay(80).springify().damping(18)}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>{t('gift.chooseTemplate')}</Text>
          <View style={styles.templateRow}>
            {TEMPLATES.map((tmpl) => (
              <Pressable
                key={tmpl.type}
                onPress={() => handleTemplateChange(tmpl)}
                style={[styles.templateBtn, template === tmpl.type && styles.templateBtnActive]}
              >
                <Text style={styles.templateEmoji}>{tmpl.emoji}</Text>
                <Text
                  style={[styles.templateName, template === tmpl.type && styles.templateNameActive]}
                >
                  {t(tmpl.labelKey as Parameters<typeof t>[0])}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Piggy picker */}
        {piggies && piggies.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(120).springify().damping(18)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>Heo đất nhận quà</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.piggyScroll}
            >
              {piggies.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setSelectedPiggy(p)
                  }}
                  style={[
                    styles.piggyOption,
                    selectedPiggy?.id === p.id && styles.piggyOptionActive,
                  ]}
                >
                  <Text style={styles.piggyEmoji}>{p.avatar_url ?? '🐷'}</Text>
                  <Text
                    style={[styles.piggyName, selectedPiggy?.id === p.id && styles.piggyNameActive]}
                  >
                    {p.child_name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Amount */}
        <Animated.View
          entering={FadeInDown.delay(160).springify().damping(18)}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>{t('gift.amountLabel')}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.inputFlex, amountFocused && styles.inputFocused]}
              placeholder={t('gift.amountPlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              onFocus={() => setAmountFocused(true)}
              onBlur={() => setAmountFocused(false)}
            />
            <View style={styles.suffixBox}>
              <Text style={styles.suffixText}>g</Text>
            </View>
          </View>
        </Animated.View>

        {/* Message */}
        <Animated.View
          entering={FadeInDown.delay(200).springify().damping(18)}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>{t('gift.messagePlaceholder')}</Text>
          <TextInput
            style={[styles.messageInput, msgFocused && styles.inputFocused]}
            placeholder={t('gift.messagePlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => setMsgFocused(true)}
            onBlur={() => setMsgFocused(false)}
          />
        </Animated.View>

        {/* Preview */}
        <Animated.View
          entering={FadeInDown.delay(240).springify().damping(18)}
          style={styles.previewCard}
        >
          <View style={styles.previewEmojiBig}>
            <Text style={styles.previewEmoji}>
              {TEMPLATES.find((t) => t.type === template)?.emoji ?? '🎁'}
            </Text>
          </View>
          <Text style={styles.previewAmount}>
            {parseFloat(amount) > 0 ? parseFloat(amount).toFixed(4) : '0.0000'}
            <Text style={styles.previewUnit}> g vàng</Text>
          </Text>
          {selectedPiggy && (
            <Text style={styles.previewRecipient}>→ {selectedPiggy.child_name}</Text>
          )}
          {message ? (
            <Text style={styles.previewMessage} numberOfLines={3}>
              "{message}"
            </Text>
          ) : null}
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(280).springify().damping(18)}>
          <Pressable
            onPress={handleCreate}
            disabled={!canCreate}
            style={[styles.createBtn, !canCreate && styles.createBtnDisabled]}
          >
            <Text style={styles.createBtnText}>
              {isCreating ? t('common.loading') : t('gift.createButton')}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    color: '#D4001A',
    fontFamily: 'Outfit_400Regular',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#374151',
    marginBottom: 10,
  },
  // Template
  templateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  templateBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  templateBtnActive: {
    backgroundColor: '#FFF0F3',
    borderColor: '#D4001A',
  },
  templateEmoji: {
    fontSize: 28,
  },
  templateName: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  templateNameActive: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#D4001A',
  },
  // Piggy
  piggyScroll: {
    flexGrow: 0,
  },
  piggyOption: {
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
    minWidth: 72,
  },
  piggyOptionActive: {
    backgroundColor: '#FFF0F3',
    borderColor: '#D4001A',
  },
  piggyEmoji: {
    fontSize: 28,
  },
  piggyName: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  piggyNameActive: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#D4001A',
  },
  // Inputs
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: '#111827',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  inputFocused: {
    borderColor: '#D4001A',
    backgroundColor: '#FFFBFB',
  },
  suffixBox: {
    width: 52,
    height: 52,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  suffixText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: '#6B7280',
  },
  messageInput: {
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#111827',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    lineHeight: 22,
  },
  // Preview
  previewCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  previewEmojiBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewEmoji: {
    fontSize: 44,
  },
  previewAmount: {
    fontSize: 32,
    fontFamily: 'Outfit_700Bold',
    color: '#D4001A',
    marginBottom: 4,
  },
  previewUnit: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  previewRecipient: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#92400E',
    marginBottom: 10,
  },
  previewMessage: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#78350F',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  // CTA
  createBtn: {
    height: 58,
    backgroundColor: '#D4001A',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4001A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  createBtnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  createBtnText: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
})
