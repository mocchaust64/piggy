const en = {
  app: {
    name: 'Gold Piggy Bank',
    tagline: 'Save real gold for your little ones',
  },

  auth: {
    signInTitle: 'Welcome Back',
    signInWithGoogle: 'Continue with Google',
    signInWithApple: 'Sign in with Apple',
    signInWithEmail: 'Sign in with Email',
    emailPlaceholder: 'Enter your email',
    sendOtp: 'Send verification code',
    otpPlaceholder: 'Enter 6-digit code',
    verifyOtp: 'Verify',
    otpSent: 'Verification code sent to your email',
    loginError: 'Sign in failed, please try again',
    signInSubtitle: 'Start your gold savings journey today',
    termsNote: 'By continuing, you agree to our',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
  },

  onboarding: {
    step1Title: 'Welcome to Gold Piggy Bank!',
    step1Body: 'Save real gold for your children in a fun and easy way',
    step2Title: 'We use USDC',
    step2Body: 'USDC is a stable digital currency, 1 USDC ≈ 1 USD',
    step3Title: 'Step 1: Get USDC',
    step3Body: 'Buy USDC on Binance, Bybit or Remitano and transfer to your in-app wallet',
    step4Title: 'Step 2: Buy gold for your piggy',
    step4Body: "Use USDC to buy GOLD for your piggy bank — it's that simple!",
    getStarted: 'Get Started',
    skip: 'Skip',
    next: 'Next',
  },

  piggy: {
    createTitle: 'Create a Piggy Bank',
    namePlaceholder: "Child's name (e.g. Baby An)",
    targetPlaceholder: 'Savings goal (e.g. Buy a bicycle)',
    targetAmountPlaceholder: 'Target gold amount (grams)',
    createButton: 'Create Piggy Bank',
    emptyState: 'You have no piggy banks yet\nCreate the first one for your child!',
    addPiggy: 'Add Piggy Bank',
    balance: 'Gold Balance',
    goldUnit: 'g',
    targetProgress: 'Goal Progress',
  },

  gift: {
    createTitle: 'Send Gold Gift',
    chooseTemplate: 'Choose a gift card',
    amountLabel: 'Gold amount (grams)',
    amountPlaceholder: '0.1',
    messagePlaceholder: 'Your personal message...',
    createButton: 'Create gift',
    shareButton: 'Share gift',
    copyLink: 'Copy link',
    claimTitle: 'You received a gift!',
    claimButton: 'Claim your gift',
    claimedSuccess: 'Gift claimed successfully! 🎉',
    expired: 'This gift has expired',
    alreadyClaimed: 'This gift has already been claimed',
    invalidCode: 'Invalid gift code',
    expireIn: 'Expires in',
    days: 'days',
  },

  giftTemplate: {
    tet: {
      name: 'Tết',
      description: 'Lunar New Year gift',
      defaultMessage: 'Happy New Year! Wishing you joy, health and prosperity 🧧',
    },
    sinhnhat: {
      name: 'Birthday',
      description: 'Birthday gift',
      defaultMessage: 'Happy Birthday! Wishing you health, happiness and great success 🎂',
    },
    cuoihoi: {
      name: 'Wedding',
      description: 'Wedding gift',
      defaultMessage:
        'Congratulations on your wedding! Wishing your family a lifetime of happiness 💍',
    },
    thoinhoi: {
      name: 'First Birthday',
      description: "Baby's first birthday",
      defaultMessage: 'Happy first birthday! Wishing the little one health and happiness 🍼',
    },
  },

  wallet: {
    title: 'My Wallet',
    usdcBalance: 'USDC Balance',
    depositUsdc: 'Deposit USDC',
    depositAddress: 'USDC Deposit Address',
    copyAddress: 'Copy address',
    addressCopied: 'Copied!',
    buyGold: 'Buy Gold',
    usdcAmount: 'USDC amount to exchange',
    insufficientBalance: 'Insufficient USDC balance, please deposit more',
  },

  transaction: {
    title: 'Transaction History',
    buyGold: 'Buy gold',
    giftSent: 'Gift sent',
    giftReceived: 'Gift received',
    empty: 'No transactions yet',
    pending: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
  },

  common: {
    loading: 'Loading...',
    initializing: 'Initializing...',
    error: 'Something went wrong, please try again',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    done: 'Done',
    back: 'Back',
    gram: 'g',
    usdc: 'USDC',
  },

  home: {
    greeting: 'Hello',
    appName: 'Piggy Bank',
    usdcBalance: 'USDC Balance',
    myPiggies: 'My Piggy Banks',
    goldPrice: 'Gold Price',
    perGram: '/g',
    emptyTitle: 'No piggy banks yet',
    emptySubtitle: 'Create the first one for your child!',
    createFirst: 'Create Piggy Bank',
  },

  piggyCard: {
    goldBalance: 'Gold balance',
    progress: 'Goal',
    buyGold: 'Buy Gold',
    sendGift: 'Send Gift',
    noTarget: 'No goal set',
  },

  createPiggy: {
    title: 'Create Piggy Bank',
    subtitle: 'A piggy bank for your little one',
    chooseAvatar: 'Choose an avatar',
    childName: "Child's name",
    childNamePlaceholder: 'e.g. Baby An',
    targetDescription: 'Savings goal (optional)',
    targetDescriptionPlaceholder: 'e.g. Buy a bicycle',
    targetAmount: 'Target gold amount (grams)',
    targetAmountPlaceholder: '5',
    createButton: 'Create Piggy Bank 🐷',
    nameRequired: "Please enter your child's name",
    success: 'Piggy bank created!',
  },

  piggyDetail: {
    goldBalance: 'Gold balance',
    equivalent: 'equivalent',
    goalProgress: 'Goal Progress',
    recentTx: 'Recent Transactions',
    noTx: 'No transactions yet',
    buyGold: 'Buy Gold',
    sendGift: 'Send Gift',
    achieved: 'Goal achieved! 🎉',
  },

  profile: {
    title: 'Profile',
    languageSection: 'Language',
    signOut: 'Sign Out',
  },

  language: {
    sectionTitle: 'Display Language',
    en: 'English',
    vi: 'Vietnamese',
    changed: 'Language changed',
  },
} as const

export default en

// DeepStringify converts all leaf string literals to `string`
// so vi.ts can assign Vietnamese strings while still enforcing key structure
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>
}

export type TranslationKeys = DeepStringify<typeof en>
