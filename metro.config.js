const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const config = getDefaultConfig(__dirname)

// bs58 has a nested base-x@3 that Metro can't resolve through nested node_modules.
// Force Metro to always use the top-level base-x.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'base-x': path.resolve(__dirname, 'node_modules/base-x'),
}

module.exports = withNativeWind(config, { input: './global.css' })
