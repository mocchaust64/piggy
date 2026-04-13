import { Image, Text, View } from 'react-native'
import { tv, type VariantProps } from 'tailwind-variants'

/** Available preset piggy avatar emojis */
export const AVATAR_PRESETS = ['🐷', '🐖', '🐽', '🐣', '⭐', '🌟', '💛', '🎀'] as const
export type AvatarPreset = (typeof AVATAR_PRESETS)[number]

/**
 * Modern Variants Definition via tailwind-variants.
 */
const avatar = tv({
  base: 'items-center justify-center rounded-full bg-piggy-pink overflow-hidden',
  variants: {
    size: {
      sm: 'w-10 h-10',
      md: 'w-14 h-14',
      lg: 'w-20 h-20',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const emoji = tv({
  variants: {
    size: {
      sm: 'text-[20px]',
      md: 'text-[28px]',
      lg: 'text-[40px]',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

type AvatarVariants = VariantProps<typeof avatar>

interface AvatarProps extends AvatarVariants {
  /** Emoji string (from AVATAR_PRESETS) or remote image URL */
  value: string
  /** Extra NativeWind className */
  className?: string
}

/**
 * Displays a piggy bank avatar — supports emoji presets and remote URLs.
 * Refactored to NativeWind v4 Modern pattern using tailwind-variants.
 */
export function Avatar({ value, size = 'md', className = '' }: AvatarProps) {
  const isUrl = value.startsWith('http')

  const containerClasses = avatar({ size, className })
  const emojiClasses = emoji({ size })

  return (
    <View className={containerClasses}>
      {isUrl ? (
        <Image
          source={{ uri: value }}
          className="h-full w-full"
          resizeMode="cover"
          accessibilityLabel="Avatar"
        />
      ) : (
        <Text className={emojiClasses}>{value}</Text>
      )}
    </View>
  )
}
