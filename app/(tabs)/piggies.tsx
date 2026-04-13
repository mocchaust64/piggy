import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

import { usePiggies } from '@/hooks/usePiggies'
import { SkeletonPiggyCard } from '@/components/ui/Skeleton'
import { PiggyCard } from '@/components/piggy/PiggyCard'
import { PiggyEmptyState } from '@/components/piggy/PiggyEmptyState'
import { AllocateGoldSheet } from '@/components/piggy/AllocateGoldSheet'
import { HeistGoldSheet } from '@/components/wallet/HeistGoldSheet'
import type { PiggyWithBalance } from '@/types/database'

export default function PiggiesScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { data: piggies, isLoading, refetch, isRefetching } = usePiggies()

  const [allocatePiggy, setAllocatePiggy] = useState<PiggyWithBalance | null>(null)
  const [heistPiggy, setHeistPiggy] = useState<PiggyWithBalance | null>(null)

  const safeAreaStyle = [styles.screen, { paddingTop: insets.top }]
  const scrollContentStyle = [styles.scrollContent, { paddingBottom: insets.bottom + 160 }]
  const fabStyle = [styles.fab, { bottom: insets.bottom + 90 }]

  return (
    <View style={safeAreaStyle}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} className="px-6 pb-2 pt-3">
        <Text className="font-outfit-bold text-[22px] text-gray-900">{t('home.myPiggies')}</Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scrollContentStyle}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#D4001A" />
        }
      >
        {/* Piggies list */}
        {isLoading ? (
          <View className="gap-4">
            <SkeletonPiggyCard />
            <SkeletonPiggyCard />
          </View>
        ) : piggies && piggies.length > 0 ? (
          <View className="gap-4">
            {piggies.map((piggy, index) => (
              <PiggyCard
                key={piggy.id}
                piggy={piggy}
                index={index}
                onAddGold={(p) => setAllocatePiggy(p)}
                onHeist={(p) => setHeistPiggy(p)}
              />
            ))}
          </View>
        ) : (
          <PiggyEmptyState />
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        onPress={() => router.push('/piggy/create')}
        className="absolute right-6 h-[60px] w-[60px] items-center justify-center rounded-full bg-red-600 shadow-xl"
        style={fabStyle}
        accessibilityLabel={t('piggy.addPiggy')}
        accessibilityRole="button"
      >
        <Text className="font-outfit-regular text-[28px] leading-[32px] text-white">+</Text>
      </Pressable>

      {/* Sheets */}
      {allocatePiggy && (
        <AllocateGoldSheet
          key={allocatePiggy.id}
          visible={!!allocatePiggy}
          piggyId={allocatePiggy.id}
          piggyName={allocatePiggy.child_name}
          onClose={() => setAllocatePiggy(null)}
          onSuccess={() => refetch()}
        />
      )}

      {heistPiggy && (
        <HeistGoldSheet
          key={heistPiggy.id + (heistPiggy ? '-open' : '-closed')}
          visible={!!heistPiggy}
          piggyId={heistPiggy.id}
          piggyName={heistPiggy.child_name}
          availableGold={heistPiggy.piggy_balances?.gold_amount ?? 0}
          onClose={() => setHeistPiggy(null)}
          onSuccess={() => refetch()}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  fab: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
})
