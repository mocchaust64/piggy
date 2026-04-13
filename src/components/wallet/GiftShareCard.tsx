/**
 * GiftShareCard — A visually rich card component designed to be captured
 * as an image via react-native-view-shot and shared via the system share sheet.
 *
 * Must use StyleSheet (no NativeWind) since it will be rendered off-screen
 * for image capture — Tailwind classes may not apply correctly in that context.
 */
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

export type GiftTemplateType = 'tet' | 'sinhnhat' | 'cuoihoi' | 'thoinhoi'

interface GiftShareCardProps {
  templateType: GiftTemplateType
  amountGrams: number
  message: string
  recipientIdentifier: string
  claimCode: string
  goldUnit: string
  labels: {
    recipient: string
    claimCode: string
  }
}

const TEMPLATE_CONFIG: Record<GiftTemplateType, { emoji: string; bg: string; accent: string }> = {
  tet: { emoji: '🧧', bg: '#FFF0F3', accent: '#D4001A' },
  sinhnhat: { emoji: '🎂', bg: '#FFF7ED', accent: '#C2410C' },
  cuoihoi: { emoji: '💍', bg: '#FAF5FF', accent: '#7C3AED' },
  thoinhoi: { emoji: '🍼', bg: '#ECFDF5', accent: '#059669' },
}

/**
 * Renders a premium gift card for screenshot + share.
 * Wrap with a ref-attached View for react-native-view-shot capture.
 */
export const GiftShareCard = React.forwardRef<View, GiftShareCardProps>(
  (
    { templateType, amountGrams, message, recipientIdentifier, claimCode, goldUnit, labels },
    ref,
  ) => {
    const config = TEMPLATE_CONFIG[templateType] ?? TEMPLATE_CONFIG.sinhnhat

    return (
      <View ref={ref} style={[styles.card, { backgroundColor: config.bg }]}>
        {/* Top brand strip */}
        <View style={[styles.brandStrip, { backgroundColor: config.accent }]}>
          <Text style={styles.brandText}>🐷 Vàng Heo Đất</Text>
        </View>

        {/* Emoji focal point */}
        <View style={styles.emojiWrap}>
          <Text style={styles.emoji}>{config.emoji}</Text>
        </View>

        {/* Gold amount */}
        <Text style={[styles.amount, { color: config.accent }]}>
          {amountGrams.toFixed(4)}
          <Text style={styles.amountUnit}> {goldUnit}</Text>
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Message */}
        {!!message && (
          <Text style={styles.message} numberOfLines={4}>
            "{message}"
          </Text>
        )}

        {/* Recipient hint */}
        <Text style={styles.recipientHint}>
          {labels.recipient}: {recipientIdentifier}
        </Text>

        {/* Claim code badge */}
        <View style={[styles.codeBadge, { borderColor: config.accent }]}>
          <Text style={styles.codeLabel}>{labels.claimCode}</Text>
          <Text style={[styles.codeValue, { color: config.accent }]}>{claimCode}</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Nhận vàng tại heodat.app/gift/{claimCode}</Text>
      </View>
    )
  },
)

GiftShareCard.displayName = 'GiftShareCard'

const styles = StyleSheet.create({
  card: {
    width: 340,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
  },
  brandStrip: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  brandText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  emojiWrap: {
    marginTop: 32,
    marginBottom: 16,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 56,
  },
  amount: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 36,
    marginBottom: 4,
  },
  amountUnit: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#6B7280',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 20,
  },
  message: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  recipientHint: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  codeBadge: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
  },
  codeLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    color: '#9CA3AF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  codeValue: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    letterSpacing: 2,
  },
  footer: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
})
