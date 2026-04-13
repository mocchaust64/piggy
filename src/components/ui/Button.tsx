import { ActivityIndicator, Text, View, Pressable } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { tv, type VariantProps } from 'tailwind-variants'

/**
 * Modern Variants Definition via tailwind-variants.
 * This pattern ensures static string selection, avoiding runtime crashes.
 */
const button = tv({
  base: 'h-[58px] flex-row items-center justify-center rounded-2xl px-6 shadow-sm active:opacity-90',
  variants: {
    variant: {
      primary: 'bg-brand-red',
      secondary: 'bg-piggy-pink',
      ghost: 'bg-transparent border border-brand-red',
      danger: 'bg-red-600',
      white: 'bg-white border border-gray-100',
    },
    disabled: {
      true: 'opacity-60',
    },
    loading: {
      true: 'opacity-80',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
})

const label = tv({
  base: 'text-base font-bold',
  variants: {
    variant: {
      primary: 'text-white',
      secondary: 'text-brand-red',
      ghost: 'text-brand-red',
      danger: 'text-white',
      white: 'text-gray-900',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
})

type ButtonVariants = VariantProps<typeof button>

interface ButtonProps extends ButtonVariants {
  /** Display label */
  label: string
  /** Handler called when the button is pressed */
  onPress: () => void
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/**
 * Premium Reusable button component.
 * Refactored to NativeWind v4 Modern pattern using tailwind-variants.
 */
export function Button({
  label: labelText,
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

  // Generate stable class names via tailwind-variants
  const containerClasses = button({ variant, disabled, loading, className })
  const labelClasses = label({ variant, className: textClassName })

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive }}
      className={containerClasses}
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
          <Text className={labelClasses}>{labelText}</Text>
        </View>
      )}
    </AnimatedPressable>
  )
}
