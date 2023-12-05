/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { build } from 'esbuild'
import alias from 'esbuild-plugin-alias';
// import fs from 'fs'
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function buildProject() {
  const baseConfig = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    sourcemap: true,
    plugins: [
      alias(
        {
          'crypto': join(__dirname, '../node_modules/react-native-quick-crypto/lib/module/index.js'),
          'stream': join(__dirname, '../node_modules/readable-stream/lib/_stream_readable.js'),
          'buffer': join(__dirname, '../node_modules/@craftzdog/react-native-buffer/index.js'),
          './buffer-reader.js': join(__dirname, '../node_modules/@ipld/car/src/buffer-reader-browser.js'),
          './reader.js': join(__dirname, '../node_modules/@ipld/car/src/reader-browser.js'),
          './writer.js': join(__dirname, '../node_modules/@ipld/car/src/writer-browser.js'),
          './store-browser': join(__dirname, '../src/store-native.ts'),
      }),
    ],
    external: [
      'react',
      'react/jsx-runtime',
      'react-dom',
      'react-native',
      'react-native-fs',
      'react-native-quick-base64',
      'react-native-quick-crypto',
      'react-native-mmkv-storage',
      "@craftzdog/react-native-buffer",
    ],
  };

  const buildConfigs = [
    {
      ...baseConfig,
      outfile: `dist/index.esm.js`,
      format: 'esm',
      bundle: true,
      minify: false, // TODO: dev flag?
      sourcemap: true,
     },
  ];

  for (const config of buildConfigs) {
    console.log('Building', config.outfile)
    build(config).catch((e) => {
      console.log('Error', config.outfile, e)
    })
  }
}

// const getEntrypoints = () => {

//   // Obtain all .ts files in the @fireproof/core src directory
//   const FIREPROOF_SRC = join(__dirname, '../../fireproof/src');
//   const entryPoints = fs
//     .readdirSync(FIREPROOF_SRC)
//     .filter(file => path.extname(file) === '.ts')
//     .filter(file => !(file.includes('-browser') || file.includes('-fs') || file.includes('-node') || file.includes('-web')))
//     .map(file => path.join(FIREPROOF_SRC, file))

//   return [
//     join(__dirname, 'src/index.ts'),
//     ...entryPoints,
//   ];
// };

buildProject().catch((err) => {
  console.error(err)
  process.exit(1)
})
