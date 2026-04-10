import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, SafeAreaView, Text, View } from 'react-native'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/Button'

const STEPS = [
  { emoji: '🐷', titleKey: 'onboarding.step1Title', bodyKey: 'onboarding.step1Body' },
  { emoji: '💵', titleKey: 'onboarding.step2Title', bodyKey: 'onboarding.step2Body' },
  { emoji: '📲', titleKey: 'onboarding.step3Title', bodyKey: 'onboarding.step3Body' },
  { emoji: '🥇', titleKey: 'onboarding.step4Title', bodyKey: 'onboarding.step4Body' },
] as const

import { useState } from 'react'

/**
 * Onboarding flow — shown once after first login.
 * Marks `onboarding_completed = true` in user_profiles on finish.
 */
export default function OnboardingScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [step, setStep] = useState(0)

  const currentStep = STEPS[step]
  const isLast = step === STEPS.length - 1

  async function handleFinish() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)
    }
    router.replace('/(tabs)')
  }

  function handleNext() {
    if (isLast) {
      handleFinish()
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center gap-8 px-8">
        {/* Illustration */}
        <Text style={{ fontSize: 88 }}>{currentStep.emoji}</Text>

        <View className="items-center gap-3">
          <Text className="text-center text-2xl font-bold text-gray-900">
            {t(currentStep.titleKey)}
          </Text>
          <Text className="text-center text-base leading-6 text-gray-500">
            {t(currentStep.bodyKey)}
          </Text>
        </View>

        {/* Step indicators */}
        <View className="flex-row gap-2">
          {STEPS.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === step ? 'w-6 bg-brand-red' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </View>
      </View>

      <View className="gap-3 px-6 pb-8">
        <Button
          label={isLast ? t('onboarding.getStarted') : t('onboarding.next')}
          onPress={handleNext}
        />
        {!isLast && (
          <Pressable onPress={handleFinish} className="items-center py-2">
            <Text className="text-base text-gray-400">{t('onboarding.skip')}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  )
}
