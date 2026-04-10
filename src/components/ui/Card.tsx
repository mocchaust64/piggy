import { type ReactNode } from 'react'
import { View } from 'react-native'

type CardElevation = 'flat' | 'raised' | 'elevated'

interface CardProps {
  children: ReactNode
  /** Shadow depth */
  elevation?: CardElevation
  /** Extra NativeWind className for the container */
  className?: string
}

const ELEVATION_STYLE: Record<CardElevation, object> = {
  flat: {},
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
}

/**
 * Surface container with consistent border radius and optional shadow.
 *
 * @example
 * <Card elevation="raised" className="p-4">
 *   <Text>Content</Text>
 * </Card>
 */
export function Card({ children, elevation = 'raised', className = '' }: CardProps) {
  return (
    <View style={ELEVATION_STYLE[elevation]} className={`rounded-3xl bg-white ${className}`}>
      {children}
    </View>
  )
}
