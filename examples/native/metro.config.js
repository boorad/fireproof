const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const extraNodeModules = path.resolve(path.join(__dirname, '../../node_modules'));
const fireproofCore = path.resolve(path.join(__dirname, '../../packages/fireproof'));
const useFireproof = path.resolve(path.join(__dirname, '../../packages/react'));

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  projectRoot: __dirname,
  resolver: {
    modules: extraNodeModules,
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json', 'd.ts', 'esm.js', 'iife.js'],
    unstable_enableSymlinks: true,
    unstable_enablePackageExports: true,
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: true,
        inlineRequires: true,
      },
    }),
  },
  watchFolders: [
    extraNodeModules,
    fireproofCore,
    useFireproof,
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
