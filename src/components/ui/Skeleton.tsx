import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const SHIMMER_DURATION_MS = 900

interface SkeletonProps {
  /** Width of the skeleton element (NativeWind class or number) */
  width?: string
  /** Height of the skeleton element (NativeWind class or number) */
  height?: string
  /** Make the skeleton a full circle (for avatars) */
  circle?: boolean
  /** Extra NativeWind className */
  className?: string
}

/**
 * Shimmer placeholder for loading states.
 * Uses Reanimated opacity pulse — no external dependency.
 *
 * @example
 * <Skeleton width="w-32" height="h-4" />
 * <Skeleton circle className="w-12 h-12" />
 */
export function Skeleton({
  width = 'w-full',
  height = 'h-4',
  circle = false,
  className = '',
}: SkeletonProps) {
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: SHIMMER_DURATION_MS }),
        withTiming(1, { duration: SHIMMER_DURATION_MS }),
      ),
      -1, // infinite
    )
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  const shapeClass = circle ? 'rounded-full' : 'rounded-xl'

  return (
    <Animated.View
      style={animatedStyle}
      className={`bg-gray-200 ${shapeClass} ${width} ${height} ${className}`}
    />
  )
}

/**
 * Convenience row of skeletons for a piggy card loading state.
 */
export function SkeletonPiggyCard() {
  return (
    <View className="gap-3 rounded-3xl bg-white p-4" style={styles.cardShadow}>
      <View className="flex-row items-center gap-3">
        <Skeleton circle className="h-14 w-14" />
        <View className="flex-1 gap-2">
          <Skeleton width="w-2/3" height="h-4" />
          <Skeleton width="w-1/3" height="h-3" />
        </View>
      </View>
      <Skeleton width="w-full" height="h-2" />
    </View>
  )
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
})
