/**
 * GiftSuccessSheet — Bottom sheet shown after a gift is successfully created.
 *
 * Features:
 *  - Preview of the gift card
 *  - "Tạo thiệp chia sẻ" → captures card as image via view-shot → native share sheet
 *  - "Sao chép link" → copies claim URL to clipboard
 *  - "Xong" → dismisses and resets
 *
 * NOTE: react-native-view-shot is a native module and requires a full app rebuild
 * to be available. The captureRef API is used instead of the ViewShot component
 * to avoid top-level import crashes before the native module is registered.
 */
import React, { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { BaseBottomSheet } from '../ui/BaseBottomSheet'
import { GiftShareCard, type GiftTemplateType } from './GiftShareCard'
import type { CreateGiftResult } from '@/hooks/useCreateGift'

interface GiftSuccessSheetProps {
  visible: boolean
  onClose: () => void
  gift: CreateGiftResult | null
  templateType: GiftTemplateType
  message: string
  recipientIdentifier: string
}

export function GiftSuccessSheet({
  visible,
  onClose,
  gift,
  templateType,
  message,
  recipientIdentifier,
}: GiftSuccessSheetProps) {
  const { t } = useTranslation()
  const cardRef = useRef<View>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!gift) return null

  const shareUrl = gift.shareUrl ?? `https://heodat.app/gift/${gift.claimCode}`

  /** Capture card → share image via native sheet */
  async function handleShareCard() {
    if (isCapturing) return
    try {
      setIsCapturing(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      const { captureRef } = require('react-native-view-shot')
      const uri = await captureRef(cardRef.current, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      })

      await Share.share(
        {
          url: uri,
          message: Platform.OS === 'android' ? `${message}\n\n${shareUrl}` : shareUrl,
          title: t('gift.createTitle'),
        },
        { dialogTitle: t('gift.shareCard') },
      )
    } catch (err) {
      console.error('[handleShareCard] Error capturing or sharing:', err)
      // Don't show alert if user just cancelled share
      if (!(err instanceof Error) || !err.message.includes('dismissed')) {
        Alert.alert(t('common.error'), t('gift.shareError'))
      }
    } finally {
      setIsCapturing(false)
    }
  }

  /** Copy claim link to clipboard */
  async function handleCopyLink() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await Clipboard.setStringAsync(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <BaseBottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>{t('gift.successTitle')}</Text>
        <Text style={styles.subtitle}>{t('gift.successSubtitle')}</Text>

        {/* Card preview — ref attached for view-shot capture */}
        <View style={styles.cardWrapper}>
          <GiftShareCard
            ref={cardRef}
            templateType={templateType}
            amountGrams={gift.amountGrams}
            message={message}
            recipientIdentifier={recipientIdentifier}
            claimCode={gift.claimCode}
            goldUnit={t('common.goldUnit')}
            labels={{
              recipient: t('gift.cardSendTo'),
              claimCode: t('gift.cardGiftCode'),
            }}
          />
        </View>

        {/* Share image button */}
        <Pressable
          style={[styles.primaryBtn, isCapturing && styles.btnDisabled]}
          onPress={handleShareCard}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.btnRow}>
              <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>{t('gift.shareCard')}</Text>
            </View>
          )}
        </Pressable>

        {/* Copy link button */}
        <Pressable style={styles.secondaryBtn} onPress={handleCopyLink}>
          <View style={styles.btnRow}>
            <MaterialCommunityIcons
              name={copied ? 'check' : 'link-variant'}
              size={18}
              color="#D4001A"
            />
            <Text style={styles.secondaryBtnText}>
              {copied ? t('wallet.addressCopied') : t('gift.copyLink')}
            </Text>
          </View>
        </Pressable>

        {/* Done */}
        <Pressable style={styles.doneBtn} onPress={onClose}>
          <Text style={styles.doneBtnText}>{t('common.done')}</Text>
        </Pressable>
      </View>
    </BaseBottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  cardWrapper: {
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryBtn: {
    width: '100%',
    height: 58,
    backgroundColor: '#D4001A',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#D4001A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D4001A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#FFF0F3',
  },
  secondaryBtnText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#D4001A',
  },
  doneBtn: {
    paddingVertical: 12,
  },
  doneBtnText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#9CA3AF',
  },
})
