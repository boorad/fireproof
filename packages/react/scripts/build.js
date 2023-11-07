/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { build } from 'esbuild'
// import { createBuildSettings } from './settings.js'

async function buildProject() {
  const buildConfigs = [
    {
      entryPoints: ['src/index.ts'],
      bundle: true,
      sourcemap: true,
      outfile: `dist/index.mjs`,
      format: 'esm',
    },
  ];

  for (const config of buildConfigs) {
    console.log('Building', config.outfile)
    build(config).catch((e) => {
      console.log('Error', config.outfile, e)
    })
  }
}

buildProject().catch((err) => {
  console.error(err)
  process.exit(1)
})
