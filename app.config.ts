import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Vàng Heo Đất',
  slug: 'heodat',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'heodat',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-hero.jpg',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.heodat.app',
    usesAppleSignIn: true,
    infoPlist: {
      NSPhotoLibraryUsageDescription: 'Cho phép truy cập ảnh để chọn avatar cho heo đất',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#D4001A',
    },
    package: 'com.heodat.app',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#D4001A',
      },
    ],
    'expo-apple-authentication',
    'expo-localization',
    'expo-font',
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      ? [
          '@react-native-google-signin/google-signin',
          {
            iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
            iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.split('.')
              .reverse()
              .join('.'),
          },
        ]
      : null,
  ].filter(Boolean) as (string | [string, any])[],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    eas: {
      projectId: '4d5733ab-fec0-4ae5-be63-fdee2040b823',
    },
  },
})
