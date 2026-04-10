/**
 * Brand colors — Gold Piggy Bank
 * Keep in sync with tailwind.config.js
 */
export const colors = {
  // Brand
  brandRed: '#D4001A',
  brandGold: '#FFD700',
  brandGoldDark: '#B8960C',

  // Piggy
  piggyPink: '#FFB3C6',
  piggyPinkDark: '#FF85A1',

  // Gift template themes
  template: {
    tet: { primary: '#D4001A', secondary: '#FFD700', background: '#FFF5F5', text: '#FFFFFF' },
    sinhnhat: { primary: '#7C3AED', secondary: '#EC4899', background: '#FDF4FF', text: '#FFFFFF' },
    cuoihoi: { primary: '#B91C1C', secondary: '#D97706', background: '#FFF7ED', text: '#FFFFFF' },
    thoinhoi: { primary: '#D97706', secondary: '#F59E0B', background: '#FFFBEB', text: '#FFFFFF' },
  },

  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    400: '#9CA3AF',
    600: '#4B5563',
    900: '#111827',
  },

  // Semantic
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
} as const
