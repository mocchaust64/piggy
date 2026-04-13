/**
 * Polyfills for Solana and other Node-dependent libraries in React Native.
 * Must be imported at the very top of the app's entry point (_layout.tsx).
 */

import 'react-native-get-random-values'
import { Buffer } from 'buffer'

// Polyfill Process for libraries that expect it (like web3.js in some contexts)
// Use the process package instead of Node's built-in to avoid Metro errors
import process from 'process'

// Assign global Buffer
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer
}
if (typeof global.process === 'undefined') {
  global.process = process
} else {
  for (const p in process) {
    if (!(p in global.process)) {
      ;(global.process as any)[p] = (process as any)[p]
    }
  }
}

// Crypto is usually handled by react-native-get-random-values for @solana/web3.js 1.x
// However, ensure global.crypto exists for some newer web3 components
if (typeof global.crypto === 'undefined') {
  // @ts-ignore
  global.crypto = {
    getRandomValues: <T extends ArrayBufferView>(array: T): T => {
      // react-native-get-random-values already polyfills this on global
      return (global as any).crypto.getRandomValues(array)
    },
  }
}

console.log('[System] Polyfills initialized successfully')
