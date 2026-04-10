import { useState } from 'react'
import { Pressable, Text, TextInput, type TextInputProps, View } from 'react-native'

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

  const borderColor = error ? 'border-red-500' : isFocused ? 'border-brand-red' : 'border-gray-200'

  const isPassword = secureTextEntry

  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? <Text className="text-sm font-medium text-gray-600">{label}</Text> : null}

      <View className={`flex-row items-center rounded-2xl border bg-gray-50 px-4 ${borderColor} `}>
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
          className="h-14 flex-1 text-base text-gray-900"
        />

        {isPassword ? (
          <Pressable
            onPress={() => setIsSecureVisible((v) => !v)}
            hitSlop={8}
            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
          >
            <Text className="text-sm text-brand-red">{isSecureVisible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : suffix ? (
          <Text className="text-sm font-medium text-gray-400">{suffix}</Text>
        ) : null}
      </View>

      {error ? (
        <Text className="text-sm text-red-500">{error}</Text>
      ) : hint ? (
        <Text className="text-sm text-gray-400">{hint}</Text>
      ) : null}
    </View>
  )
}
