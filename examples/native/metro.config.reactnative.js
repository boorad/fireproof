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
    // resolveRequest: (context, moduleName, platform) => {
    //   if (moduleName === 'react') {
    //     // Logic to resolve the module name to a file path...
    //     // NOTE: Throw an error if there is no resolution.
    //     return {
    //       filePath: `${local}/react/`,
    //       type: 'sourceFile',
    //     };
    //   }
    //   // Optionally, chain to the standard Metro resolver.
    //   return context.resolveRequest(context, moduleName, platform);
    // },
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
