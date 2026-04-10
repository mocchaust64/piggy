import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useTranslation } from 'react-i18next'

/** Tab icon using emoji — replace with SVG icons in Sprint 6 */
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
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
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('piggy.balance'),
          tabBarLabel: 'Home',
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
