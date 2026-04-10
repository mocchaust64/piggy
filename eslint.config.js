const { FlatCompat } = require('@eslint/eslintrc')
const js = require('@eslint/js')
const globals = require('globals')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

module.exports = [
  // 1. Extend expo and prettier (v9+ FlatCompat)
  ...compat.extends('expo', 'prettier'),

  // 2. Base Configuration
  {
    plugins: {
      prettier: require('eslint-plugin-prettier'),
      'react-native': require('eslint-plugin-react-native'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      react: require('eslint-plugin-react'),
    },
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.jest,
        __dirname: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/immutability': 'off', // Incompatible with Reanimated shared values
      'react/display-name': 'off',
      'react/prop-types': 'off',
      'react-native/no-unused-styles': 'error',
      'react-native/split-platform-components': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'off',
      'react-native/no-raw-text': 'off',
      'react-native/no-single-element-style-arrays': 'error',
    },
  },

  // 3. Ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/.expo/**',
      '**/web-build/**',
      '**/dist/**',
      '**/supabase/**',
    ],
  },
]
