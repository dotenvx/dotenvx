const esbuild = require('esbuild')
const { stat, writeFile, rm, mkdir } = require('fs/promises')
const pkgJson = require('./package.json')
const path = require('path')

const outputDir = 'build'

function cleanPkgJson (json) {
  delete json.devDependencies
  delete json.optionalDependencies
  delete json.dependencies
  delete json.workspaces
  return json
}

async function emptyDir (dir) {
  try {
    await rm(dir, { recursive: true })
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }
  await mkdir(dir)
}

async function printSize (fileNames) {
  const stats = await Promise.all(fileNames.map(fileName => stat(fileName)))
  const size = stats.reduce((total, file) => total + file.size, 0)

  // print size in MB
  console.log(`Total bundle size: ${Math.round(size / 10000) / 100}MB\n\n`)
}

async function main () {
  const start = Date.now()
  const minify = process.argv.includes('--minify')
  // clean build folder
  await emptyDir(outputDir)

  const outfile = `${outputDir}/index.js`
  /** @type { import('esbuild').BuildOptions } */
  const config = {
    entryPoints: [pkgJson.bin.dotenvx],
    bundle: true,
    platform: 'node',
    target: 'node18',
    sourcemap: !minify,
    minify,
    keepNames: minify,
    outfile,
    // Keep dependencies inside each entrypoint. Shared external bundles reduce
    // size but make packaged CLI startup slower, before the spinner can appear.
    // suppress direct-eval warning
    logOverride: {
      'direct-eval': 'silent',
      'require-resolve-not-external': 'silent'
    }
  }

  await esbuild.build(config)

  await Promise.all([
    esbuild.build({
      ...config,
      entryPoints: [path.join(path.dirname(require.resolve('@dotenvx/providers')), 'armorWorker.js')],
      outfile: `${outputDir}/armorWorker.js`
    }),
    esbuild.build({
      ...config,
      entryPoints: ['src/lib/decryptors/decryptor-worker.js'],
      outfile: `${outputDir}/decryptor-worker.js`
    })
  ])

  console.log(`Build took ${Date.now() - start}ms`)
  await printSize([outfile, `${outputDir}/armorWorker.js`, `${outputDir}/decryptor-worker.js`])

  // create main patched package.json
  cleanPkgJson(pkgJson)

  pkgJson.scripts = {
    start: 'node index.js'
  }

  pkgJson.bin = 'index.js'
  pkgJson.pkg = {
    scripts: [
      'armorWorker.js',
      'decryptor-worker.js'
    ]
  }
  if (!minify) {
    pkgJson.pkg.assets = [
      '*.map'
    ]
  }

  await writeFile(
    `${outputDir}/package.json`,
    JSON.stringify(pkgJson, null, 2)
  )
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
