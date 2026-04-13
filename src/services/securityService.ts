import * as LocalAuthentication from 'expo-local-authentication'
import * as Haptics from 'expo-haptics'

/**
 * SecurityService - Senior-level service for handling biometric authentication.
 */
class SecurityService {
  /**
   * Check if the device is capable of biometric authentication.
   */
  async isBiometricsSupported(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()
    return hasHardware && isEnrolled
  }

  /**
   * Challenge the user with a biometric prompt (FaceID/TouchID/Passcode).
   * returns true if authentication was successful.
   */
  async authenticate(reason: string = 'Xác thực để tiếp tục'): Promise<boolean> {
    try {
      const supported = await this.isBiometricsSupported()
      if (!supported) return true // Fallback for unsupported devices in MVP

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Sử dụng mật khẩu',
        disableDeviceFallback: false,
        cancelLabel: 'Hủy',
      })

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        return true
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return false
      }
    } catch (error) {
      console.error('[SecurityService] Authentication error:', error)
      return false
    }
  }

  /**
   * Get the type of biometrics supported (FaceID, Fingerprint, etc.)
   */
  async getBiometryType(): Promise<string> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'FaceID'
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Vân tay'
    return 'Mật khẩu'
  }
}

export const securityService = new SecurityService()
