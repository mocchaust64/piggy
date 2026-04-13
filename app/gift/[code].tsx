import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ClaimGiftScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [isClaiming, setIsClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  // TODO: useQuery to load gift by code in Sprint 5
  // Mock gift data for now
  const mockGift = {
    amount: 0.1,
    message: 'Chúc mừng sinh nhật! Mong bé luôn khỏe mạnh 🎂',
    template_type: 'sinhnhat',
    from_user_id: 'someone',
  }

  const templateEmoji: Record<string, string> = {
    tet: '🧧',
    sinhnhat: '🎂',
    cuoihoi: '💍',
    thoinhoi: '🍼',
  }
  const emoji = templateEmoji[mockGift.template_type] ?? '🎁'

  async function handleClaim() {
    if (isClaiming || claimed) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsClaiming(true)

    // TODO: supabase.functions.invoke('claim-gift', { body: { claimCode: code } }) in Sprint 5
    await new Promise((r) => setTimeout(r, 1000))
    setIsClaiming(false)
    setClaimed(true)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  if (claimed) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInUp.springify().damping(14)} style={styles.successWrap}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>{t('gift.claimedSuccess')}</Text>
          <Text style={styles.successSubtitle}>
            +{mockGift.amount.toFixed(4)}g đã vào heo đất của bé
          </Text>
          <Pressable
            style={styles.doneBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.replace('/(tabs)')
            }}
          >
            <Text style={styles.doneBtnText}>{t('common.done')}</Text>
          </Pressable>
        </Animated.View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 12 }]}
        hitSlop={12}
      >
        <Text style={styles.backArrow}>←</Text>
      </Pressable>

      <View style={styles.content}>
        {/* Gift visual */}
        <Animated.View
          entering={FadeInDown.delay(80).springify().damping(14)}
          style={styles.giftVisual}
        >
          <View style={styles.giftCircle}>
            <Text style={styles.giftEmoji}>{emoji}</Text>
          </View>
          <Text style={styles.giftTitle}>{t('gift.claimTitle')}</Text>
        </Animated.View>

        {/* Card */}
        <Animated.View
          entering={FadeInDown.delay(160).springify().damping(18)}
          style={styles.giftCard}
        >
          <Text style={styles.giftAmount}>
            {mockGift.amount.toFixed(4)}
            <Text style={styles.giftAmountUnit}> {t('common.goldUnit')}</Text>
          </Text>
          <View style={styles.divider} />
          <Text style={styles.giftMessage}>"{mockGift.message}"</Text>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{code}</Text>
          </View>
        </Animated.View>

        {/* Expiry hint */}
        <Animated.View entering={FadeInDown.delay(220).springify()}>
          <Text style={styles.expiryHint}>
            {t('gift.expireIn')} 7 {t('gift.days')}
          </Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View
          entering={FadeInDown.delay(260).springify().damping(18)}
          style={styles.ctaWrap}
        >
          <Pressable
            onPress={handleClaim}
            disabled={isClaiming}
            style={[styles.claimBtn, isClaiming && styles.claimBtnLoading]}
          >
            <Text style={styles.claimBtnText}>
              {isClaiming ? t('common.loading') : t('gift.claimButton')}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backArrow: {
    fontSize: 22,
    color: '#D4001A',
    fontFamily: 'Outfit_400Regular',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  // Gift visual
  giftVisual: {
    alignItems: 'center',
    gap: 14,
  },
  giftCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFB3C6',
    shadowColor: '#D4001A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  giftEmoji: {
    fontSize: 64,
  },
  giftTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
  },
  // Card
  giftCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    gap: 14,
  },
  giftAmount: {
    fontSize: 48,
    fontFamily: 'Outfit_700Bold',
    color: '#D4001A',
  },
  giftAmountUnit: {
    fontSize: 20,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  giftMessage: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: '#374151',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  codeBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  codeText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#6B7280',
    letterSpacing: 1,
  },
  // Expiry
  expiryHint: {
    fontSize: 13,
    color: '#D97706',
    fontFamily: 'Outfit_400Regular',
  },
  // CTA
  ctaWrap: {
    width: '100%',
  },
  claimBtn: {
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
  claimBtnLoading: {
    opacity: 0.7,
  },
  claimBtnText: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  // Success
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  doneBtn: {
    height: 54,
    backgroundColor: '#059669',
    borderRadius: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  doneBtnText: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
})
