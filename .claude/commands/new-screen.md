Scaffold a new Expo Router screen for the Gold Piggy Bank app.

Ask the developer:
1. Screen name (e.g. PiggyDetail, GiftCreate, TransactionHistory)
2. Route path in Expo Router (e.g. `app/(tabs)/piggy/[id].tsx`)
3. Purpose — what does this screen do? (1-2 sentences)
4. What Supabase data does it need? (if any)
5. Does it call the GRAIL API?

---

## File 1: Screen component at the route path

```typescript
// [route_path]
import { Stack, useLocalSearchParams } from 'expo-router'
import { View, Text, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { use[ScreenName] } from '@/hooks/use[ScreenName]'

interface [ScreenName]Params {
  // route params
}

export default function [ScreenName]Screen() {
  const { t } = useTranslation()
  const params = useLocalSearchParams<[ScreenName]Params>()
  const { data, isLoading, error } = use[ScreenName](params)

  if (isLoading) return <[ScreenName]Skeleton />
  if (error) return <ErrorView message={error.message} />

  return (
    <ScrollView className="flex-1 bg-white">
      <Stack.Screen options={{ title: t('[i18n.key]') }} />
      {/* Content */}
    </ScrollView>
  )
}

function [ScreenName]Skeleton() {
  return (
    <View className="flex-1 bg-white p-4">
      <View className="h-8 bg-gray-200 rounded-lg mb-4 animate-pulse" />
      <View className="h-32 bg-gray-200 rounded-xl animate-pulse" />
    </View>
  )
}
```

---

## File 2: Custom hook at `src/hooks/use[ScreenName].ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export function use[ScreenName](params: [ScreenName]Params) {
  return useQuery({
    queryKey: ['[screenName]', params.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('[table_name]')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      return data
    },
    staleTime: 30_000,
  })
}
```

---

## Rules

- Use NativeWind `className` — never `StyleSheet.create()`
- All UI strings via `useTranslation()` — add keys to both `src/i18n/locales/en.ts` and `src/i18n/locales/vi.ts`
- Loading state must use a skeleton (not a plain spinner)
- No `any` types — use types from `src/types/database.ts`
- If the screen calls GRAIL data → it MUST go through `supabase.functions.invoke()`, never direct GRAIL calls

## RLS reminder

After scaffolding, verify:
- Does the queried table have an RLS policy for `auth.uid() = user_id`?
- If the screen reads another user's data (e.g. gift claim) → needs a special policy or an Edge Function
