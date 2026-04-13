import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const SWIPE_THRESHOLD = 120

interface BaseBottomSheetProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  maxHeight?: number
}

/**
 * BaseBottomSheet — A premium, high-performance bottom sheet with swipe-to-dismiss.
 * Uses PanResponder for gesture capture and Reanimated 3 for UI thread animations.
 */
export function BaseBottomSheet({ visible, onClose, children, maxHeight }: BaseBottomSheetProps) {
  const [showModal, setShowModal] = useState(visible)

  const translateY = useSharedValue(SCREEN_HEIGHT)
  const backdropOpacity = useSharedValue(0)
  const hapticTriggered = useRef(false)

  const finalizeClose = useCallback(() => {
    setShowModal(false)
    onClose()
  }, [onClose])

  const handleClose = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(finalizeClose)()
    })
    backdropOpacity.value = withTiming(0, { duration: 250 })
  }, [translateY, backdropOpacity, finalizeClose])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.value = gestureState.dy
          const progress = Math.max(0, 1 - gestureState.dy / (SCREEN_HEIGHT * 0.5))
          backdropOpacity.value = progress

          if (gestureState.dy > SWIPE_THRESHOLD && !hapticTriggered.current) {
            Haptics.selectionAsync()
            hapticTriggered.current = true
          } else if (gestureState.dy <= SWIPE_THRESHOLD) {
            hapticTriggered.current = false
          }
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const shouldDismiss = gestureState.dy > SWIPE_THRESHOLD || gestureState.vy > 0.5
        if (shouldDismiss) {
          handleClose()
        } else {
          translateY.value = withSpring(0, { damping: 18, stiffness: 150 })
          backdropOpacity.value = withTiming(1)
        }
        hapticTriggered.current = false
      },
    }),
  ).current

  useEffect(() => {
    if (visible) {
      setShowModal(true)
      translateY.value = withSpring(0, { damping: 20, stiffness: 120 })
      backdropOpacity.value = withTiming(1, { duration: 300 })
    } else if (showModal) {
      handleClose()
    }
  }, [visible, showModal, translateY, backdropOpacity, handleClose])

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  if (!showModal && !visible) return null

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Reanimated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Reanimated.View>

        <Reanimated.View
          style={[styles.sheet, animatedSheetStyle, maxHeight ? { maxHeight } : undefined]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          <View style={styles.content}>{children}</View>
        </Reanimated.View>
      </View>
    </Modal>
  )
}

/**
 * Explicit ViewStyle type annotation to prevent StyleSheet.create's union inference
 * (ViewStyle | ImageStyle | TextStyle) from conflicting with Reanimated Animated.View
 * style props, which expect StyleProp<ViewStyle>.
 */
const styles: Record<
  'container' | 'backdrop' | 'sheet' | 'handleContainer' | 'handle' | 'content',
  ViewStyle
> = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    width: '100%',
    alignSelf: 'center',
  },
  handleContainer: {
    width: '100%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E5E7EB',
  },
  content: {
    paddingHorizontal: 20,
  },
})
