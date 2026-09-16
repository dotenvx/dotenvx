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
  const minify = process.argv.includes('--minify')
  // clean build folder
  await emptyDir(outputDir)

  const outfile = `${outputDir}/index.js`
  // Embed a complete script, including its dependencies. Child Node processes
  // cannot load modules from the executable's virtual filesystem.
  const preload = await esbuild.build({
    entryPoints: ['src/lib/proxy/proxyPreload.js'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    minify,
    write: false
  })

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
    plugins: [{
      name: 'embed-proxy-preload',
      setup (build) {
        build.onLoad({ filter: /[/\\]proxyPreloadSource\.js$/ }, () => ({
          contents: `module.exports = ${JSON.stringify(preload.outputFiles[0].text)}`,
          loader: 'js'
        }))
      }
    }],
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
      entryPoints: ['src/lib/providers/provider-worker.js'],
      outfile: `${outputDir}/provider-worker.js`
    }),
    esbuild.build({
      ...config,
      entryPoints: ['src/lib/decryptors/decryptor-worker.js'],
      outfile: `${outputDir}/decryptor-worker.js`
    })
  ])

  console.log(`Build took ${Date.now() - start}ms`)
  await printSize(outfile)

  // create main patched package.json
  cleanPkgJson(pkgJson)

  pkgJson.scripts = {
    start: 'node index.js'
  }

  pkgJson.bin = 'index.js'
  pkgJson.pkg = {
    scripts: [
      'provider-worker.js',
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
