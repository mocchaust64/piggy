/**
 * Gift Create Screen — Enhanced flow with recipient input and share card modal.
 *
 * Flow:
 *  1. Choose template
 *  2. Enter amount
 *  3. Enter recipient (email / phone / wallet)
 *  4. Write message
 *  5. Submit → create-gift Edge Function → GiftSuccessSheet
 */
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
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

import {
  useCreateGift,
  type CreateGiftResult,
  type GiftTemplateType,
  type RecipientType,
} from '@/hooks/useCreateGift'
import { useBiometrics } from '@/hooks/useBiometrics'
import { GiftSuccessSheet } from '@/components/wallet/GiftSuccessSheet'

// ─── Constants ────────────────────────────────────────────────────────────────

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

const RECIPIENT_TABS: { type: RecipientType; labelKey: string }[] = [
  { type: 'email', labelKey: 'gift.recipientEmail' },
  { type: 'phone', labelKey: 'gift.recipientPhone' },
  { type: 'wallet', labelKey: 'gift.recipientWallet' },
]

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateGiftScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const { mutate: createGift, isPending } = useCreateGift()
  const { challenge } = useBiometrics()

  const [template, setTemplate] = useState<GiftTemplateType>('sinhnhat')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState(t('giftTemplate.sinhnhat.defaultMessage'))
  const [recipientType, setRecipientType] = useState<RecipientType>('email')
  const [recipientIdentifier, setRecipientIdentifier] = useState('')

  // Focus states
  const [amountFocused, setAmountFocused] = useState(false)
  const [msgFocused, setMsgFocused] = useState(false)
  const [recipientFocused, setRecipientFocused] = useState(false)

  // Success sheet state
  const [successGift, setSuccessGift] = useState<CreateGiftResult | null>(null)
  const [successSheetVisible, setSuccessSheetVisible] = useState(false)

  const amountNum = parseFloat(amount)
  const canSend = amountNum > 0 && recipientIdentifier.trim().length > 0 && !isPending

  function handleTemplateChange(tmpl: (typeof TEMPLATES)[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setTemplate(tmpl.type)
    setMessage(t(tmpl.defaultMsgKey as Parameters<typeof t>[0]))
  }

  function handleRecipientTabChange(type: RecipientType) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setRecipientType(type)
    setRecipientIdentifier('')
  }

  function getRecipientPlaceholder(): string {
    const map: Record<RecipientType, string> = {
      email: t('gift.recipientPlaceholderEmail'),
      phone: t('gift.recipientPlaceholderPhone'),
      wallet: t('gift.recipientPlaceholderWallet'),
    }
    return map[recipientType]
  }

  function getKeyboardType(): 'email-address' | 'phone-pad' | 'default' {
    if (recipientType === 'email') return 'email-address'
    if (recipientType === 'phone') return 'phone-pad'
    return 'default'
  }

  async function handleSend() {
    if (!canSend) {
      if (!(amountNum > 0)) Alert.alert('', 'Vui lòng nhập số vàng')
      else if (!recipientIdentifier.trim()) Alert.alert('', t('gift.errorInvalidRecipient'))
      return
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    // Biometric challenge — skipped if user hasn't enabled biometrics
    const authenticated = await challenge(t('gift.authReason'))
    if (!authenticated) return

    createGift(
      {
        amountGrams: amountNum,
        templateType: template,
        message: message.trim(),
        recipientType,
        recipientIdentifier: recipientIdentifier.trim(),
      },
      {
        onSuccess: (result) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          setSuccessGift(result)
          setSuccessSheetVisible(true)
        },
        onError: (err) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          Alert.alert('Lỗi', err.message || t('common.error'))
        },
      },
    )
  }

  function handleSuccessClose() {
    setSuccessSheetVisible(false)
    setTimeout(() => {
      setSuccessGift(null)
      setAmount('')
      setRecipientIdentifier('')
      if (router.canGoBack()) {
        router.back()
      } else {
        router.replace('/(tabs)')
      }
    }, 350)
  }

  return (
    <>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            style={styles.backBtn}
            hitSlop={12}
          >
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
                    style={[
                      styles.templateName,
                      template === tmpl.type && styles.templateNameActive,
                    ]}
                  >
                    {t(tmpl.labelKey as Parameters<typeof t>[0])}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Amount */}
          <Animated.View
            entering={FadeInDown.delay(120).springify().damping(18)}
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

          {/* Recipient */}
          <Animated.View
            entering={FadeInDown.delay(160).springify().damping(18)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>{t('gift.recipientLabel')}</Text>

            {/* Tab switcher */}
            <View style={styles.tabRow}>
              {RECIPIENT_TABS.map((tab) => (
                <Pressable
                  key={tab.type}
                  onPress={() => handleRecipientTabChange(tab.type)}
                  style={[styles.tab, recipientType === tab.type && styles.tabActive]}
                >
                  <Text
                    style={[styles.tabText, recipientType === tab.type && styles.tabTextActive]}
                  >
                    {t(tab.labelKey as Parameters<typeof t>[0])}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[styles.input, recipientFocused && styles.inputFocused]}
              placeholder={getRecipientPlaceholder()}
              placeholderTextColor="#9CA3AF"
              value={recipientIdentifier}
              onChangeText={setRecipientIdentifier}
              keyboardType={getKeyboardType()}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setRecipientFocused(true)}
              onBlur={() => setRecipientFocused(false)}
            />
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
                {TEMPLATES.find((tmpl) => tmpl.type === template)?.emoji ?? '🎁'}
              </Text>
            </View>
            <Text style={styles.previewAmount}>
              {amountNum > 0 ? amountNum.toFixed(4) : '0.0000'}
              <Text style={styles.previewUnit}> {t('common.goldUnit')}</Text>
            </Text>
            {!!recipientIdentifier && (
              <Text style={styles.previewRecipient}>→ {recipientIdentifier}</Text>
            )}
            {!!message && (
              <Text style={styles.previewMessage} numberOfLines={3}>
                "{message}"
              </Text>
            )}
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInDown.delay(280).springify().damping(18)}>
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            >
              <Text style={styles.sendBtnText}>
                {isPending ? t('common.loading') : t('gift.sendGiftButton')}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Sheet */}
      <GiftSuccessSheet
        visible={successSheetVisible}
        onClose={handleSuccessClose}
        gift={successGift}
        templateType={template}
        message={message}
        recipientIdentifier={recipientIdentifier}
      />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: '#D4001A', fontFamily: 'Outfit_400Regular' },
  headerTitle: { fontSize: 17, fontFamily: 'Outfit_700Bold', color: '#111827' },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#374151',
    marginBottom: 10,
  },
  // Template
  templateRow: { flexDirection: 'row', gap: 10 },
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
  templateBtnActive: { backgroundColor: '#FFF0F3', borderColor: '#D4001A' },
  templateEmoji: { fontSize: 28 },
  templateName: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  templateNameActive: { fontFamily: 'Outfit_600SemiBold', color: '#D4001A' },
  // Inputs
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
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
  inputFocused: { borderColor: '#D4001A', backgroundColor: '#FFFBFB' },
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
  suffixText: { fontSize: 15, fontFamily: 'Outfit_600SemiBold', color: '#6B7280' },
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
  // Recipient tab switcher
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tabActive: { backgroundColor: '#FFF0F3', borderColor: '#D4001A' },
  tabText: { fontSize: 13, fontFamily: 'Outfit_500Medium', color: '#6B7280' },
  tabTextActive: { fontFamily: 'Outfit_600SemiBold', color: '#D4001A' },
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
  previewEmoji: { fontSize: 44 },
  previewAmount: { fontSize: 32, fontFamily: 'Outfit_700Bold', color: '#D4001A', marginBottom: 4 },
  previewUnit: { fontSize: 16, fontFamily: 'Outfit_400Regular', color: '#6B7280' },
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
  sendBtn: {
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
  sendBtnDisabled: { opacity: 0.45, shadowOpacity: 0, elevation: 0 },
  sendBtnText: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#FFFFFF', letterSpacing: 0.3 },
})
