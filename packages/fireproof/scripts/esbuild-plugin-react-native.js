// esbuild-plugin-react-native
import { dirname, join } from 'path';

import flowRemoveTypes from 'flow-remove-types';
import { readFile } from 'fs/promises';

const RN_FILTER =
  /.*\/(@react-native\/|react-native@|\/react-native\/).*\.([mc]js|[tj]sx?)$/;

export default (options = {}) => {
  let { filter, force } = options;
  if (!filter) {
    filter = RN_FILTER;
  }

  const rnImports = [
    '../Utilities/Platform',
    '../../Utilities/Platform',
    './RCTAlertManager',
    './NativeAlertManager',
    '../../Image/Image',
    '../../Stylesheet/PlatformColorValueTypes',
    './NativePlatformConstantsIOS',
    '../TurboModule/RCTExport',
    '../TurboModule/TurboModuleRegistry',
    '../BatchedBridge/NativeModules',
    './BatchedBridge',
    './MessageQueue',
  ];

  return {
    name: 'react-native',
    setup(build) {
      build.onLoad({ filter }, async (args) => {
        const source = await readFile(args.path, 'utf8');
        let output = source;

        // flow-remove-types
        if (force) {
          output = flowRemoveTypes('// @flow\n' + source, { pretty: true });
        } else {
          if (
            source.slice(0, 8) === '// @flow' ||
            source.match(/^\/\*.*@flow.*\*\//s) ||
            source.slice(0, 10) === '// @noflow' ||
            source.match(/^\/\*.*@noflow.*\*\//s)
          ) {
            output = flowRemoveTypes(source, { pretty: true });
          }
        }
        output = output.toString().replace(/static\s+\+/g, 'static ');

        if (args.path.endsWith('/UnimplementedView.js')) {
          console.log(output);
        }

        return {
          contents: output,
          loader: 'jsx',
        };
      });

      build.onResolve({ filter: /./ }, async (args) => {
        // if (rnImports.indexOf(args.path) >= 0) {

        if (
          args.importer.match(RN_FILTER) &&
          (args.path.includes('../') || args.path.includes('./'))
        ) {
          const target = join(dirname(args.importer), args.path);
          // console.log('rnImport', target);
          return {
            path: target,
          };
        }
        return null;
      });
    },
  };
};

// these are for RN bundling so we can test
const BITMAP_IMAGE_EXTENSIONS = [
  '.bmp',
  '.gif',
  '.jpg',
  '.jpeg',
  '.png',
  '.psd',
  '.svg',
  '.webp',
];
const NON_BITMAP_IMAGE_EXTENSIONS = [
  // Vector image formats
  '.svg',
  // Video formats
  '.m4v',
  '.mov',
  '.mp4',
  '.mpeg',
  '.mpg',
  '.webm',
  // Audio formats
  '.aac',
  '.aiff',
  '.caf',
  '.m4a',
  '.mp3',
  '.wav',
  // Document formats
  '.html',
  '.pdf',
  '.yaml',
  '.yml',
  // Font formats
  '.otf',
  '.ttf',
  // Archives (virtual files)
  '.zip',
];
const ASSET_EXTENSIONS = BITMAP_IMAGE_EXTENSIONS.concat(
  NON_BITMAP_IMAGE_EXTENSIONS,
);
const SOURCE_EXTENSIONS = [
  '.tsx',
  '.ts',
  '.jsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
];
const extensions = SOURCE_EXTENSIONS.concat(ASSET_EXTENSIONS);

const platforms = ['ios', 'native', 'react-native'];

export const rnResolveExtensions = platforms
  .map((p) => extensions.map((e) => `.${p}${e}`))
  .concat(extensions)
  .flat();

export const rnAssetLoader = Object.fromEntries(
  ASSET_EXTENSIONS.map((ext) => [ext, 'file']),
);
