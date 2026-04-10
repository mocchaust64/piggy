/**
 * Gift templates — Gold Piggy Bank
 *
 * Display strings (name, description, defaultMessage) live in:
 *   src/i18n/locales/en.ts → giftTemplate.tet.name, etc.
 *   src/i18n/locales/vi.ts → giftTemplate.tet.name, etc.
 *
 * To add a new template, use the /gift-template skill.
 */

import type { GiftTemplateType } from '@/types/database'

export interface GiftTemplate {
  key: GiftTemplateType
  /** i18n key prefix: `giftTemplate.${key}` */
  i18nKey: string
  colorTheme: {
    primary: string
    secondary: string
    text: string
    background: string
  }
  lottieFile: unknown | null // result of require('@/assets/lottie/gift-xxx.json')
  emoji: string
  sortOrder: number
}

export const GIFT_TEMPLATES: Record<GiftTemplateType, GiftTemplate> = {
  tet: {
    key: 'tet',
    i18nKey: 'giftTemplate.tet',
    colorTheme: {
      primary: '#D4001A',
      secondary: '#FFD700',
      text: '#FFFFFF',
      background: '#FFF5F5',
    },
    lottieFile: null, // TODO: require('@/assets/lottie/gift-tet.json')
    emoji: '🧧',
    sortOrder: 1,
  },

  sinhnhat: {
    key: 'sinhnhat',
    i18nKey: 'giftTemplate.sinhnhat',
    colorTheme: {
      primary: '#7C3AED',
      secondary: '#EC4899',
      text: '#FFFFFF',
      background: '#FDF4FF',
    },
    lottieFile: null, // TODO: require('@/assets/lottie/gift-sinhnhat.json')
    emoji: '🎂',
    sortOrder: 2,
  },

  cuoihoi: {
    key: 'cuoihoi',
    i18nKey: 'giftTemplate.cuoihoi',
    colorTheme: {
      primary: '#B91C1C',
      secondary: '#D97706',
      text: '#FFFFFF',
      background: '#FFF7ED',
    },
    lottieFile: null, // TODO: require('@/assets/lottie/gift-cuoihoi.json')
    emoji: '💍',
    sortOrder: 3,
  },

  thoinhoi: {
    key: 'thoinhoi',
    i18nKey: 'giftTemplate.thoinhoi',
    colorTheme: {
      primary: '#D97706',
      secondary: '#F59E0B',
      text: '#FFFFFF',
      background: '#FFFBEB',
    },
    lottieFile: null, // TODO: require('@/assets/lottie/gift-thoinhoi.json')
    emoji: '🍼',
    sortOrder: 4,
  },
}

/** Sorted list for rendering the template selection grid */
export const GIFT_TEMPLATES_LIST: GiftTemplate[] = Object.values(GIFT_TEMPLATES).sort(
  (a, b) => a.sortOrder - b.sortOrder,
)

/** Get template by key, falls back to 'tet' if not found */
export function getGiftTemplate(key: string): GiftTemplate {
  return GIFT_TEMPLATES[key as GiftTemplateType] ?? GIFT_TEMPLATES.tet
}
