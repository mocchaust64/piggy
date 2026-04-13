import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { tv, type VariantProps } from 'tailwind-variants'

const SHIMMER_DURATION_MS = 900

const skeleton = tv({
  base: 'bg-gray-200',
  variants: {
    circle: {
      true: 'rounded-full',
      false: 'rounded-xl',
    },
  },
  defaultVariants: {
    circle: false,
  },
})

type SkeletonVariants = VariantProps<typeof skeleton>

interface SkeletonProps extends SkeletonVariants {
  /** Width of the skeleton element (NativeWind class) */
  width?: string
  /** Height of the skeleton element (NativeWind class) */
  height?: string
  /** Extra NativeWind className */
  className?: string
}

/**
 * Shimmer placeholder for loading states.
 * uses NativeWind v4 Modern pattern with tailwind-variants.
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

  const classes = skeleton({ circle, className: `${width} ${height} ${className}` })

  return <Animated.View style={animatedStyle} className={classes} />
}

/**
 * Convenience row of skeletons for a piggy card loading state.
 */
export function SkeletonPiggyCard() {
  return (
    <View className="gap-3 rounded-3xl bg-white p-4" style={styles.cardShadow}>
      <View className="flex-row items-center gap-3">
        <Skeleton circle className="h-14 w-14" width="" height="" />
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
