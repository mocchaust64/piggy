import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { tv } from 'tailwind-variants'

/** Tab icon styles */
const tabIconVariants = tv({
  base: 'font-outfit-regular text-gray-400',
  variants: {
    focused: {
      true: 'text-[26px] text-gray-900 opacity-100',
      false: 'text-[22px] opacity-50',
    },
  },
})

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text className={tabIconVariants({ focused })}>{emoji}</Text>
}

/**
 * Bottom tab bar layout.
 * Tabs: Home (piggies) | Transactions | Profile
 */
export default function TabsLayout() {
  const { t } = useTranslation()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D4001A',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F3F4F6',
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Outfit_500Medium',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('piggy.balance'),
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="piggies"
        options={{
          title: t('home.myPiggies'),
          tabBarLabel: t('home.myPiggies'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🐷" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t('transaction.title'),
          tabBarLabel: t('transaction.title'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

// Removed legacy StyleSheet. Using NativeWind v4 + tailwind-variants.
