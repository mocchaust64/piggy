import { useQuery, useMutation } from '@tanstack/react-query'
import { useUserProfile, useUpdateProfile } from './useUserProfile'
import { securityService } from '@/services/securityService'
import { useTranslation } from 'react-i18next'

/**
 * Hook to manage biometric settings and authentication.
 */
export function useBiometrics() {
  const { t } = useTranslation()
  const { data: profile } = useUserProfile()
  const updateProfile = useUpdateProfile()

  // Query to check if hardware supports biometrics
  const { data: isSupported = false } = useQuery({
    queryKey: ['biometrics', 'supported'],
    queryFn: () => securityService.isBiometricsSupported(),
  })

  // Query to get biometry type name
  const { data: biometryType = 'Biometrics' } = useQuery({
    queryKey: ['biometrics', 'type'],
    queryFn: () => securityService.getBiometryType(),
    enabled: isSupported,
  })

  /**
   * Toggle biometrics enable/disable in profile.
   * Requires a biometric challenge to enable.
   */
  const toggleBiometrics = useMutation({
    mutationFn: async (enable: boolean) => {
      if (enable) {
        // Must authenticate to enable
        const success = await securityService.authenticate(
          t('profile.biometricsReason'),
          t('profile.biometricsFallback'),
          t('profile.biometricsCancel'),
        )
        if (!success) throw new Error('Authentication failed')
      }

      return updateProfile.mutateAsync({ biometrics_enabled: enable })
    },
  })

  /**
   * Challenge the user (e.g. before sensitive actions).
   * returns boolean.
   */
  const challenge = async (reason?: string) => {
    if (!profile?.biometrics_enabled) return true
    return await securityService.authenticate(
      reason || t('common.authenticate'),
      t('profile.biometricsFallback'),
      t('profile.biometricsCancel'),
    )
  }

  return {
    isSupported,
    biometryType: t(`profile.${biometryType}`),
    rawType: biometryType,
    isEnabled: !!profile?.biometrics_enabled,
    toggle: toggleBiometrics.mutate,
    isToggling: toggleBiometrics.isPending,
    challenge,
  }
}
