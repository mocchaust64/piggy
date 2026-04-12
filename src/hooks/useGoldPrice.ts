import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from './useLanguage'

export interface GoldPriceData {
  pricePerGramUsd: number
  pricePerGramVnd: number
  vndRate: number
  currency: string
  unit: string
  fetchedAt: string
  history: {
    price_usd: number
    price_vnd: number
    recorded_at: string
  }[]
}

export interface UseGoldPriceReturn {
  data: GoldPriceData | undefined
  isLoading: boolean
  isError: boolean
  displayPrice: number
  displayCurrency: string
  formattedPrice: string
  historyPoints: number[]
  priceChangePercent: number
  refetch: () => void
}

/**
 * Senior Hook for fetching and managing Gold Price state.
 * Automatically handles USD/VND conversion based on app language.
 */
export function useGoldPrice(): UseGoldPriceReturn {
  const { language } = useLanguage()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['gold-price'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-gold-price')
      if (error) throw error
      return data.data as GoldPriceData
    },
    refetchInterval: 60 * 1000, // Background refresh every minute
    staleTime: 5 * 60 * 1000,
  })

  // Derived state for the UI
  const isVi = language === 'vi'
  const displayPrice = data ? (isVi ? data.pricePerGramVnd : data.pricePerGramUsd) : 0
  const displayCurrency = isVi ? 'VND' : 'USD'

  const formattedPrice = data
    ? isVi
      ? `${displayPrice.toLocaleString('vi-VN')}đ`
      : `$${displayPrice.toFixed(2)}`
    : '---'

  const historyPoints = data?.history
    ? data.history.map((h) => (isVi ? h.price_vnd : h.price_usd))
    : []

  // Calculate percentage change from first to last point in history
  let priceChangePercent = 0
  if (historyPoints.length >= 2) {
    const start = historyPoints[0]
    const end = historyPoints[historyPoints.length - 1]
    priceChangePercent = ((end - start) / start) * 100
  }

  return {
    data,
    isLoading,
    isError,
    displayPrice,
    displayCurrency,
    formattedPrice,
    historyPoints,
    priceChangePercent,
    refetch,
  }
}
