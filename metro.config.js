const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = config.resolver;

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...sourceExts, 'svg'];

// In some restricted Windows environments, spawning worker processes can fail (EPERM).\r\n// Enable worker threads; optionally set METRO_MAX_WORKERS=1 if needed.\r\nconfig.transformer.unstable_workerThreads = true;\r\nif (process.env.METRO_MAX_WORKERS) {\r\n  config.maxWorkers = Number(process.env.METRO_MAX_WORKERS);\r\n}\r\n\r\n
module.exports = config;
