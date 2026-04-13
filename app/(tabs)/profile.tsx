import {
  Alert,
  ScrollView,
  Text,
  View,
  RefreshControl,
  Modal,
  Share,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useCallback, useState, useEffect } from 'react'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { profileKeys, useUserProfile, useUpdateProfile } from '@/hooks/useUserProfile'
import { ProfileItem, ProfileSectionHeader } from '@/components/profile/ProfileItem'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { solanaService } from '@/services/solanaService'
import { storageService } from '@/services/storageService'
import { useBiometrics } from '@/hooks/useBiometrics'
import { useQueryClient } from '@tanstack/react-query'
import * as Linking from 'expo-linking'

// ─── Wallet Detail Modal ──────────────────────────────────────────────────────

function WalletDetailModal({
  address,
  visible,
  onClose,
  onDisconnect,
}: {
  address: string
  visible: boolean
  onClose: () => void
  onDisconnect: () => void
}) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [solBalance, setSolBalance] = useState<number | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!visible || !address) return
    solanaService.getBalance(address).then(setSolBalance)
    solanaService.getUSDCBalance(address).then(setUsdcBalance)
  }, [visible, address])

  const handleCopy = () => {
    // Use Share sheet as clipboard fallback — no native module needed
    Share.share({ message: address })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDisconnect = () => {
    Alert.alert(t('profile.walletDisconnect'), t('profile.walletDisconnectConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.walletDisconnect'),
        style: 'destructive',
        onPress: () => {
          onDisconnect()
          onClose()
        },
      },
    ])
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.phantomIcon}>
            <Text style={styles.phantomEmoji}>👻</Text>
          </View>
          <Text style={styles.sheetTitle}>{t('profile.walletDetailTitle')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Address */}
        <View style={styles.addressCard}>
          <Text style={styles.addressLabel}>{t('profile.address')}</Text>
          <TouchableOpacity style={styles.addressRow} onPress={handleCopy} activeOpacity={0.7}>
            <Text style={styles.addressText} numberOfLines={1}>
              {address.slice(0, 16)}...{address.slice(-8)}
            </Text>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={18}
              color={copied ? '#10B981' : '#9CA3AF'}
            />
          </TouchableOpacity>
          {copied && <Text style={styles.copiedText}>{t('profile.walletCopied')}</Text>}
        </View>

        {/* SOL Balance */}
        <View style={styles.balanceCard}>
          <Ionicons name="logo-usd" size={20} color="#9945FF" />
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>{t('profile.walletSolBalance')}</Text>
            <Text style={styles.balanceValue}>
              {solBalance === null ? '...' : `${solBalance.toFixed(4)} SOL`}
            </Text>
          </View>
        </View>

        {/* USDC Balance */}
        <View style={[styles.balanceCard, styles.balanceCardUsdc]}>
          <Ionicons name="card-outline" size={20} color="#2563EB" />
          <View style={styles.balanceInfo}>
            <Text style={[styles.balanceLabel, styles.balanceLabelUsdc]}>
              {t('profile.walletUsdcBalance')}
            </Text>
            <Text style={[styles.balanceValue, styles.balanceValueUsdc]}>
              {usdcBalance === null ? '...' : `${usdcBalance.toFixed(2)} USDC`}
            </Text>
          </View>
        </View>

        {/* Disconnect */}
        <TouchableOpacity
          style={styles.disconnectBtn}
          onPress={handleDisconnect}
          activeOpacity={0.8}
        >
          <Ionicons name="unlink-outline" size={18} color="#DC2626" />
          <Text style={styles.disconnectText}>{t('profile.walletDisconnect')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: profile, isLoading, isRefetching } = useUserProfile()
  const updateProfile = useUpdateProfile()
  const { isEnabled: isBioEnabled, toggle: toggleBio, biometryType } = useBiometrics()
  const [walletModalVisible, setWalletModalVisible] = useState(false)

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: profileKeys.me })
  }, [queryClient])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert(t('common.error'), error.message)
  }

  const handleConnectWallet = async () => {
    try {
      const wallet = await solanaService.connectWallet()
      await updateProfile.mutateAsync({ solana_wallet_address: wallet.address })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (e: any) {
      if (e.name !== 'UserRejectionError') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        Alert.alert(t('common.error'), t('profile.walletError'))
      }
    }
  }

  const handleDisconnectWallet = async () => {
    await updateProfile.mutateAsync({ solana_wallet_address: null })
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const handleWalletPress = () => {
    if (profile?.solana_wallet_address) {
      setWalletModalVisible(true)
    } else {
      handleConnectWallet()
    }
  }

  const handleChangeAvatar = async () => {
    try {
      const uri = await storageService.pickAndCropImage()
      if (!uri) return
      const publicUrl = await storageService.uploadAvatar(profile!.id, uri)
      if (publicUrl) {
        await updateProfile.mutateAsync({ avatar_url: publicUrl })
      }
    } catch {
      Alert.alert(t('common.error'), t('profile.avatarError'))
    }
  }

  if (isLoading) return <View className="flex-1 bg-white" />

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#D4001A" />
        }
      >
        {/* Header Section */}
        <View className="items-center bg-white pb-8 pt-12 shadow-sm">
          <View className="relative">
            <Avatar value={profile?.avatar_url || '🐷'} size="lg" />
            <Button
              className="absolute -bottom-2 -right-2 h-10 w-10 min-w-0 rounded-full p-0"
              onPress={handleChangeAvatar}
              label=""
              icon="camera"
            />
          </View>
          <Text className="mt-4 font-outfit-bold text-xl text-gray-900">
            {profile?.display_name || t('profile.anonymous')}
          </Text>
          {profile?.grail_deposit_address && (
            <Text className="text-sm text-gray-500">
              {profile.grail_deposit_address.slice(0, 6)}...
              {profile.grail_deposit_address.slice(-4)}
            </Text>
          )}
        </View>

        <View className="px-5">
          {/* Wallet Section */}
          <ProfileSectionHeader title={t('profile.walletSection')} />
          <ProfileItem
            label={
              profile?.solana_wallet_address
                ? t('profile.walletLinked')
                : t('profile.connectWallet')
            }
            value={
              profile?.solana_wallet_address
                ? `${profile.solana_wallet_address.slice(0, 12)}...`
                : t('profile.walletStatusEmpty')
            }
            icon="wallet-outline"
            iconColor="#6366F1"
            onPress={handleWalletPress}
          />

          {/* Language + Settings Section */}
          <ProfileSectionHeader title={t('profile.settingsSection')} />
          <View className="mb-2">
            <LanguageSwitcher />
          </View>
          <ProfileItem
            label={t('profile.biometrics', { type: biometryType })}
            icon="finger-print-outline"
            iconColor="#10B981"
            hasSwitch
            switchValue={isBioEnabled}
            onSwitchChange={(val: boolean) => toggleBio(val)}
          />
          <ProfileItem
            label={t('profile.notifications')}
            icon="notifications-outline"
            iconColor="#F59E0B"
            hasSwitch
            switchValue={true}
          />

          <ProfileSectionHeader title={t('profile.accountSection')} />
          <ProfileItem
            label={t('profile.support')}
            icon="help-circle-outline"
            onPress={() => Linking.openURL('https://t.me/heodat_support')}
          />
          <ProfileItem
            label={t('profile.privacy')}
            icon="shield-checkmark-outline"
            onPress={() => Linking.openURL('https://heodat.app/privacy')}
          />
          <ProfileItem
            label={t('profile.signOut')}
            icon="log-out-outline"
            isDanger
            onPress={() => {
              Alert.alert(t('profile.signOutConfirmTitle'), t('profile.signOutConfirmText'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('profile.signOut'), style: 'destructive', onPress: handleSignOut },
              ])
            }}
          />
        </View>

        <View className="mt-8 items-center">
          <Text className="text-xs text-gray-400">
            {t('profile.version', { version: '1.0.0 (Alpha)' })}
          </Text>
          <Text className="mt-1 text-xs text-gray-300">{t('profile.copyright')}</Text>
        </View>
      </ScrollView>

      {/* Wallet Detail Modal */}
      {profile?.solana_wallet_address && (
        <WalletDetailModal
          address={profile.solana_wallet_address}
          visible={walletModalVisible}
          onClose={() => setWalletModalVisible(false)}
          onDisconnect={handleDisconnectWallet}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  phantomIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  phantomEmoji: {
    fontSize: 22,
  },
  sheetTitle: {
    flex: 1,
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  addressCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  addressLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#374151',
  },
  copiedText: {
    marginTop: 6,
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#10B981',
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  balanceCardUsdc: {
    backgroundColor: '#EFF6FF',
    marginBottom: 24,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#7C3AED',
    marginBottom: 2,
  },
  balanceLabelUsdc: {
    color: '#2563EB',
  },
  balanceValue: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    color: '#4C1D95',
  },
  balanceValueUsdc: {
    color: '#1E40AF',
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF5F5',
  },
  disconnectText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#DC2626',
  },
})
