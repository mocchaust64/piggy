import { useState } from 'react'
import { Pressable, Text, TextInput, type TextInputProps, View } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated'

interface InputProps extends Omit<TextInputProps, 'className'> {
  /** Field label shown above the input */
  label?: string
  /** Error message displayed below the input in red */
  error?: string
  /** Helper text displayed below the input */
  hint?: string
  /** Suffix element (e.g., "USDC" unit label) shown inside the input on the right */
  suffix?: string
  /** Extra NativeWind className for the outer container */
  className?: string
}

const AnimatedView = Animated.createAnimatedComponent(View)

/**
 * Controlled text input with label, error and hint support.
 *
 * @example
 * <Input label="Email" value={email} onChangeText={setEmail} error={errors.email} />
 * <Input label="Amount" suffix="USDC" keyboardType="decimal-pad" ... />
 */
export function Input({
  label,
  error,
  hint,
  suffix,
  secureTextEntry,
  className = '',
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isSecureVisible, setIsSecureVisible] = useState(false)

  // Smooth color transition for focus/error states
  const transition = useDerivedValue(() => {
    return withTiming(error ? 1 : isFocused ? 0.5 : 0, { duration: 250 })
  })

  const inputStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      transition.value,
      [0, 0.5, 1],
      ['#E5E7EB', '#D4001A', '#EF4444'], // gray-200, brand-red, red-500
    )
    return { borderColor }
  })

  const isPassword = secureTextEntry

  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? <Text className="text-sm font-semibold text-gray-700">{label}</Text> : null}

      <AnimatedView
        style={inputStyle}
        className="flex-row items-center rounded-2xl border bg-gray-50 px-4"
      >
        <TextInput
          {...textInputProps}
          secureTextEntry={isPassword && !isSecureVisible}
          onFocus={(e) => {
            setIsFocused(true)
            textInputProps.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            textInputProps.onBlur?.(e)
          }}
          placeholderTextColor="#9CA3AF"
          className="h-14 flex-1 text-base font-medium text-gray-900"
        />

        {isPassword ? (
          <Pressable
            onPress={() => setIsSecureVisible((v) => !v)}
            hitSlop={8}
            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
          >
            <Text className="text-sm font-semibold text-brand-red">
              {isSecureVisible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        ) : suffix ? (
          <Text className="text-sm font-semibold text-gray-400">{suffix}</Text>
        ) : null}
      </AnimatedView>

      {error ? (
        <Animated.Text
          entering={FadeInDown.duration(300)}
          className="text-sm font-medium text-red-500"
        >
          {error}
        </Animated.Text>
      ) : hint ? (
        <Text className="text-sm text-gray-400">{hint}</Text>
      ) : null}
    </View>
  )
}
