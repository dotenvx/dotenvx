// @ts-check
const fs = require('fs')
const path = require('path')

const dotenvx = require('./main')
const { DotenvxNextWebpackPlugin } = require('./next/webpack-plugin')
const { activateTurbopackInjection } = require('./next/turbopack-inject')

const DEFAULT_ENV_FILES = ['.env']

function debugLog (...args) {
  if (!process.env.DEBUG_DOTENVX_NEXT) return
  console.log('[dotenvx-next]', ...args)
}

function resolveExistingFiles (files, envDir) {
  return files
    .map(file => path.resolve(envDir, file))
    .filter(file => fs.existsSync(file))
}

function filesFromOptions (options) {
  if (options.files) return options.files
  if (options.path) return Array.isArray(options.path) ? options.path : [options.path]
  return DEFAULT_ENV_FILES
}

async function dotenvxNextConfigFn (nextConfig, options, phase, defaults) {
  let resolvedNextConfig
  if (typeof nextConfig === 'function') {
    resolvedNextConfig = { ...(await nextConfig(phase, defaults)) }
  } else {
    resolvedNextConfig = { ...nextConfig }
  }

  const envDir = options.envDir || process.cwd()
  const resolvedFiles = resolveExistingFiles(filesFromOptions(options), envDir)
  const isTurbopack = !!(
    process.env.TURBOPACK ||
    process.env.TURBOPACK_DEV ||
    process.env.TURBOPACK_BUILD ||
    process.env.npm_config_turbopack
  )

  const dotenvxOptions = {
    overload: true,
    quiet: true,
    ...(options.dotenvx || {})
  }

  const { parsed: env = {} } = resolvedFiles.length
    ? dotenvx.config({ ...dotenvxOptions, path: resolvedFiles })
    : { parsed: {} }

  debugLog(
    `phase=${phase}, isTurbopack=${isTurbopack}, resolvedFiles=${JSON.stringify(resolvedFiles)}, envKeys=${Object.keys(env).join(',')}`
  )

  if (isTurbopack) {
    activateTurbopackInjection(env)
  }

  const prevWebpack = resolvedNextConfig.webpack
  resolvedNextConfig.webpack = (webpackConfig, webpackOptions) => {
    const config = prevWebpack
      ? (prevWebpack(webpackConfig, webpackOptions) || webpackConfig)
      : webpackConfig

    if (!isTurbopack) {
      config.plugins = config.plugins || []
      config.plugins.push(new DotenvxNextWebpackPlugin({ env }))
    }

    config.resolve = config.resolve || {}
    config.resolve.alias = config.resolve.alias || {}
    config.resolve.alias['@next/env'] = require.resolve('./next/env')

    return config
  }

  return resolvedNextConfig
}

function withDotenvx (nextConfig = {}, options = {}) {
  return (phase, defaults) => dotenvxNextConfigFn(nextConfig, options, phase, defaults)
}

module.exports = {
  withDotenvx
}
