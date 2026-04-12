import { ActivityIndicator, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

/** Visual variants of the Button component */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'white'

interface ButtonProps {
  /** Display label */
  label: string
  /** Handler called when the button is pressed */
  onPress: () => void
  /** Visual style variant */
  variant?: ButtonVariant
  /** Disables interaction and dims the button */
  disabled?: boolean
  /** Shows a spinner and disables interaction */
  loading?: boolean
  /** Extra NativeWind className for the container */
  className?: string
  /** Text style override */
  textClassName?: string
  /** Optional icon name (Ionicons) or special 'google' icon */
  icon?: string
}

const VARIANT_CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-brand-red',
  secondary: 'bg-piggy-pink',
  ghost: 'border border-brand-red',
  danger: 'bg-red-600',
  white: 'bg-white border border-gray-100',
}

const VARIANT_LABEL: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-brand-red',
  ghost: 'text-brand-red',
  danger: 'text-white',
  white: 'text-gray-900',
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/**
 * Premium Reusable button component with Spring scale animation and Haptics.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  textClassName = '',
  icon,
}: ButtonProps) {
  const scale = useSharedValue(1)
  const isInteractive = !disabled && !loading
  const opacity = isInteractive ? 'opacity-100' : 'opacity-60'

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 12, stiffness: 200 }) }],
  }))

  const handlePressIn = () => {
    if (isInteractive) {
      scale.value = 0.95
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  }

  const handlePressOut = () => {
    if (isInteractive) {
      scale.value = 1
    }
  }

  const handlePress = () => {
    if (isInteractive) {
      onPress()
    }
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive }}
      className={`h-[58px] flex-row items-center justify-center rounded-2xl px-6 shadow-sm active:opacity-90 ${VARIANT_CONTAINER[variant]} ${opacity} ${className} `}
      style={animatedStyle}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'ghost' || variant === 'secondary' || variant === 'white'
              ? '#D4001A'
              : '#FFFFFF'
          }
        />
      ) : (
        <View className="flex-row items-center justify-center gap-3">
          {icon === 'google' && <Ionicons name="logo-google" size={20} color="#EA4335" />}
          {icon && icon !== 'google' && (
            <Ionicons
              name={icon as any}
              size={20}
              color={variant === 'primary' || variant === 'danger' ? 'white' : '#D4001A'}
            />
          )}
          <Text className={`text-base font-bold ${VARIANT_LABEL[variant]} ${textClassName}`}>
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  )
}
