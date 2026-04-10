import { ActivityIndicator, Pressable, Text } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/** Visual variants of the Button component */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

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
}

const VARIANT_CONTAINER: Record<ButtonVariant, string> = {
  primary:   'bg-brand-red',
  secondary: 'bg-piggy-pink',
  ghost:     'border border-brand-red',
  danger:    'bg-red-600',
}

const VARIANT_LABEL: Record<ButtonVariant, string> = {
  primary:   'text-white',
  secondary: 'text-brand-red',
  ghost:     'text-brand-red',
  danger:    'text-white',
}

/**
 * Reusable button component with spring press animation.
 *
 * @example
 * <Button label="Create Piggy" onPress={handleCreate} />
 * <Button label="Loading..." loading onPress={() => {}} />
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  function handlePressIn() {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 })
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 })
  }

  const isInteractive = !disabled && !loading
  const opacity = isInteractive ? 'opacity-100' : 'opacity-50'

  return (
    <AnimatedPressable
      style={animatedStyle}
      onPress={isInteractive ? onPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive }}
      className={`
        h-14 flex-row items-center justify-center rounded-2xl px-6
        ${VARIANT_CONTAINER[variant]}
        ${opacity}
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' || variant === 'secondary' ? '#D4001A' : '#FFFFFF'}
        />
      ) : (
        <Text className={`text-base font-semibold ${VARIANT_LABEL[variant]}`}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  )
}
