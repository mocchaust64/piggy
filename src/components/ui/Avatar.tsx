import { Image, Text, View } from 'react-native'

/** Available preset piggy avatar emojis */
export const AVATAR_PRESETS = ['🐷', '🐖', '🐽', '🐣', '⭐', '🌟', '💛', '🎀'] as const
export type AvatarPreset = (typeof AVATAR_PRESETS)[number]

const SIZE_CLASS = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
} as const

const FONT_SIZE = {
  sm: 20,
  md: 28,
  lg: 40,
} as const

type AvatarSize = keyof typeof SIZE_CLASS

interface AvatarProps {
  /** Emoji string (from AVATAR_PRESETS) or remote image URL */
  value: string
  size?: AvatarSize
  /** Extra NativeWind className */
  className?: string
}

/**
 * Displays a piggy bank avatar — supports emoji presets and remote URLs.
 *
 * @example
 * <Avatar value="🐷" size="lg" />
 * <Avatar value="https://cdn.example.com/avatar.png" size="md" />
 */
export function Avatar({ value, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = SIZE_CLASS[size]
  const isUrl = value.startsWith('http')

  return (
    <View
      className={`items-center justify-center rounded-full bg-piggy-pink ${sizeClass} ${className}`}
    >
      {isUrl ? (
        <Image
          source={{ uri: value }}
          className={`rounded-full ${sizeClass}`}
          resizeMode="cover"
          accessibilityLabel="Avatar"
        />
      ) : (
        <Text style={{ fontSize: FONT_SIZE[size] }}>{value}</Text>
      )}
    </View>
  )
}
