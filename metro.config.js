const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = config.resolver;

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...sourceExts, 'svg'];

// Avoid scanning Expo export output / generated bundles (can cause EPERM on Windows).
const distDir = path.resolve(__dirname, 'dist');
const escapedDistDir = distDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const distBlockList = new RegExp(`${escapedDistDir}(?:\\|/).*`);
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = new RegExp(`${existingBlockList.source}|${distBlockList.source}`);

// In some restricted Windows environments, spawning worker processes can fail (EPERM).
// Enable worker threads; optionally set METRO_MAX_WORKERS=1 if needed.
config.transformer.unstable_workerThreads = true;
if (process.env.METRO_MAX_WORKERS) {
  const max = Number(process.env.METRO_MAX_WORKERS);
  if (!Number.isNaN(max) && max > 0) {
    config.maxWorkers = max;
  }
}

module.exports = config;
