import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import LottieView from 'lottie-react-native'
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/Button'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const STEPS = [
  { lottie: true, titleKey: 'onboarding.step1Title', bodyKey: 'onboarding.step1Body' },
  { emoji: '💰', titleKey: 'onboarding.step2Title', bodyKey: 'onboarding.step2Body' },
  { emoji: '📱', titleKey: 'onboarding.step3Title', bodyKey: 'onboarding.step3Body' },
  { emoji: '🏆', titleKey: 'onboarding.step4Title', bodyKey: 'onboarding.step4Body' },
] as const

export default function OnboardingScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const scrollX = useSharedValue(0)
  const scrollRef = useAnimatedRef<Animated.ScrollView>()

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x
    },
  })

  async function handleFinish() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('user_profiles').update({ onboarding_completed: true }).eq('id', user.id)
    }
    router.replace('/(tabs)')
  }

  function scrollToNext(index: number) {
    if (index === STEPS.length - 1) {
      handleFinish()
    } else {
      scrollRef.current?.scrollTo({ x: (index + 1) * SCREEN_WIDTH, animated: true })
    }
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {STEPS.map((step, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.illustrationWrap}>
              {'lottie' in step ? (
                <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                  <LottieView
                    source={require('../assets/lottie/piggy-intro.json')}
                    autoPlay
                    loop
                    style={styles.lottie}
                  />
                </Animated.View>
              ) : (
                <Animated.Text entering={FadeInDown.delay(200).springify()} style={styles.emoji}>
                  {step.emoji}
                </Animated.Text>
              )}
            </View>

            <View style={styles.contentWrap}>
              <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={styles.title}>
                {t(step.titleKey)}
              </Animated.Text>
              <Animated.Text entering={FadeInDown.delay(500).duration(600)} style={styles.body}>
                {t(step.bodyKey)}
              </Animated.Text>
            </View>

            <View style={[styles.buttonWrap, { paddingBottom: insets.bottom + 20 }]}>
              <Button
                label={
                  index === STEPS.length - 1 ? t('onboarding.getStarted') : t('onboarding.next')
                }
                onPress={() => scrollToNext(index)}
                className="w-full"
              />
              {index < STEPS.length - 1 && (
                <Pressable onPress={handleFinish} style={styles.skipBtn}>
                  <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Persistent Step Indicators */}
      <View style={[styles.indicatorContainer, { top: insets.top + 20 }]}>
        {STEPS.map((_, index) => (
          <PaginationDot key={index} index={index} scrollX={scrollX} />
        ))}
      </View>
    </View>
  )
}

function PaginationDot({
  index,
  scrollX,
}: {
  index: number
  scrollX: Animated.SharedValue<number>
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const input = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH]
    const indicatorWidth = interpolate(scrollX.value, input, [8, 24, 8], 'clamp')
    const opacity = interpolate(scrollX.value, input, [0.3, 1, 0.3], 'clamp')
    return {
      width: indicatorWidth,
      opacity,
    }
  })

  return <Animated.View style={[styles.indicator, animatedStyle]} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  illustrationWrap: {
    alignItems: 'center',
    marginBottom: 48,
  },
  lottie: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
  },
  emoji: {
    fontSize: 96,
  },
  contentWrap: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  indicatorContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4001A',
  },
  buttonWrap: {
    position: 'absolute',
    bottom: 0,
    left: 32,
    right: 32,
    gap: 12,
  },
  skipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#9CA3AF',
  },
})
