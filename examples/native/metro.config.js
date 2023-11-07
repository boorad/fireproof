const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const local = path.resolve(path.join(__dirname, './node_modules'));
const pnpm = path.resolve(path.join(__dirname, '../../node_modules/.pnpm'));
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
    nodeModulesPaths: [
      local,
      pnpm,
    ],
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json', 'd.ts', 'esm.js'],
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
    local,
    pnpm,
    fireproofCore,
    useFireproof,
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
