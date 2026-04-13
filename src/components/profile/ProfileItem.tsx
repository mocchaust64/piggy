import { Pressable, Text, View, Switch } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { tv } from 'tailwind-variants'

const item = tv({
  base: 'flex-row items-center justify-between rounded-2xl bg-white px-4 py-4 mb-2 active:opacity-70',
  variants: {
    danger: {
      true: 'active:bg-red-50',
    },
  },
})

interface ProfileItemProps {
  label: string
  value?: string
  icon: keyof typeof Ionicons.glyphMap
  iconColor?: string
  onPress?: () => void
  showChevron?: boolean
  hasSwitch?: boolean
  switchValue?: boolean
  onSwitchChange?: (val: boolean) => void
  isDanger?: boolean
}

/**
 * Reusable list item for the Profile screen.
 * Follows the Senior Standard design with consistent spacing and interaction feedback.
 */
export function ProfileItem({
  label,
  value,
  icon,
  iconColor = '#6B7280',
  onPress,
  showChevron = true,
  hasSwitch = false,
  switchValue = false,
  onSwitchChange,
  isDanger = false,
}: ProfileItemProps) {
  return (
    <Pressable onPress={onPress} disabled={hasSwitch} className={item({ danger: isDanger })}>
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
          <Ionicons name={icon} size={22} color={isDanger ? '#DC2626' : iconColor} />
        </View>
        <View>
          <Text
            className={`text-base font-semibold ${isDanger ? 'text-red-600' : 'text-gray-900'}`}
          >
            {label}
          </Text>
          {value ? (
            <Text className="text-sm text-gray-500" numberOfLines={1}>
              {value}
            </Text>
          ) : null}
        </View>
      </View>

      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#E5E7EB', true: '#FFDCE1' }}
          thumbColor={switchValue ? '#D4001A' : '#F3F4F6'}
        />
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      ) : null}
    </Pressable>
  )
}

/**
 * Section Header for grouping Profile items.
 */
export function ProfileSectionHeader({ title }: { title: string }) {
  return (
    <Text className="mb-2 ml-2 mt-4 text-xs font-bold uppercase tracking-widest text-gray-400">
      {title}
    </Text>
  )
}
