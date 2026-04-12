import { Tabs } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { useTranslation } from 'react-i18next'

/** Tab icon using emoji — replace with SVG icons in Sprint 6 */
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={[styles.tabIcon, focused ? styles.tabIconFocused : styles.tabIconInactive]}>
      {emoji}
    </Text>
  )
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

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconFocused: {
    fontSize: 26,
    opacity: 1,
  },
  tabIconInactive: {
    fontSize: 22,
    opacity: 0.5,
  },
})
