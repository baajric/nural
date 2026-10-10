const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix Supabase realtime-js resolution in React Native (RealtimePresence, ws, etc.)
config.resolver.unstable_enablePackageExports = false;

// Allow .txt files as bundleable assets (for book content)
if (!config.resolver.assetExts.includes('txt')) {
  config.resolver.assetExts.push('txt');
}

module.exports = config;
