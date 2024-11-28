const esbuild = require('esbuild')
const { stat, writeFile, rm, mkdir } = require('fs/promises')
const pkgJson = require('./package.json')

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

async function printSize (fileName) {
  const stats = await stat(fileName)

  // print size in MB
  console.log(`Bundle size: ${Math.round(stats.size / 10000) / 100}MB\n\n`)
}

async function main () {
  const start = Date.now()
  // clean build folder
  await emptyDir(outputDir)

  const outfile = `${outputDir}/index.js`

  /** @type { import('esbuild').BuildOptions } */
  const config = {
    entryPoints: [pkgJson.bin.dotenvx],
    bundle: true,
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    outfile,
    // suppress direct-eval warning
    logOverride: {
      'direct-eval': 'silent'
    }
  }

  await esbuild.build(config)

  console.log(`Build took ${Date.now() - start}ms`)
  await printSize(outfile)

  if (process.argv.includes('--minify')) {
    // minify the file
    await esbuild.build({
      ...config,
      entryPoints: [outfile],
      minify: true,
      keepNames: true,
      allowOverwrite: true,
      outfile
    })

    console.log(`Minify took ${Date.now() - start}ms`)
    await printSize(outfile)
  }

  // create main patched packege.json
  cleanPkgJson(pkgJson)

  pkgJson.scripts = {
    start: 'node index.js'
  }

  pkgJson.bin = 'index.js'
  pkgJson.pkg = {
    assets: [
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
