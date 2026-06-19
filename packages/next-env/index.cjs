const fs = require('fs')
const path = require('path')
const dotenvx = require('@dotenvx/dotenvx')

let initialEnv
let combinedEnv
let parsedEnv
let cachedLoadedEnvFiles = []
let previousLoadedEnvFiles = []

function updateInitialEnv (newEnv) {
  if (!initialEnv) {
    return
  }

  for (const [key, value] of Object.entries(newEnv)) {
    if (value === undefined) {
      delete initialEnv[key]
    } else {
      initialEnv[key] = value
    }
  }
}

function replaceProcessEnv (sourceEnv) {
  Object.keys(process.env).forEach((key) => {
    if (!key.startsWith('__NEXT_PRIVATE')) {
      if (sourceEnv[key] === undefined || sourceEnv[key] === '') {
        delete process.env[key]
      }
    }
  })

  Object.entries(sourceEnv).forEach(([key, value]) => {
    process.env[key] = value
  })
}

function processEnv (
  loadedEnvFiles,
  dir,
  log = console,
  forceReload = false,
  onReload
) {
  if (!initialEnv) {
    initialEnv = Object.assign({}, process.env)
  }

  if (
    !forceReload &&
    (process.env.__NEXT_PROCESSED_ENV || loadedEnvFiles.length === 0)
  ) {
    return [process.env]
  }

  process.env.__NEXT_PROCESSED_ENV = 'true'

  const origEnv = Object.assign({}, initialEnv)
  const parsed = {}

  try {
    const filepaths = loadedEnvFiles.map((envFile) =>
      path.join(dir || '', envFile.path)
    )

    const result = dotenvx.config({
      path: filepaths,
      processEnv: Object.assign({}, origEnv),
      quiet: false
    })

    for (const envFile of loadedEnvFiles) {
      if (
        !previousLoadedEnvFiles.some(
          (item) =>
            item.contents === envFile.contents && item.path === envFile.path
        )
      ) {
        if (onReload) onReload(envFile.path)
      }

      envFile.env = {}
    }

    for (const key of Object.keys(result.parsed || {})) {
      if (
        typeof parsed[key] === 'undefined' &&
        typeof origEnv[key] === 'undefined'
      ) {
        parsed[key] = result.parsed[key]
      }
    }
  } catch (err) {
    log.error(`Failed to load env from ${dir || ''}`, err)
  }

  return [Object.assign(process.env, parsed), parsed]
}

function resetEnv () {
  if (initialEnv) {
    replaceProcessEnv(initialEnv)
  }
}

function loadEnvConfig (
  dir,
  dev,
  log = console,
  forceReload = false,
  onReload
) {
  if (!initialEnv) {
    initialEnv = Object.assign({}, process.env)
  }

  if (combinedEnv && !forceReload) {
    return {
      combinedEnv,
      parsedEnv,
      loadedEnvFiles: cachedLoadedEnvFiles
    }
  }

  replaceProcessEnv(initialEnv)

  previousLoadedEnvFiles = cachedLoadedEnvFiles
  cachedLoadedEnvFiles = []

  const isTest = process.env.NODE_ENV === 'test'
  const mode = isTest ? 'test' : dev ? 'development' : 'production'

  const dotenvFiles = [
    `.env.${mode}.local`,
    mode !== 'test' && '.env.local',
    `.env.${mode}`,
    '.env'
  ].filter(Boolean)

  for (const envFile of dotenvFiles) {
    const dotEnvPath = path.join(dir, envFile)

    try {
      const stats = fs.statSync(dotEnvPath)

      if (!stats.isFile() && !stats.isFIFO()) {
        continue
      }

      const contents = fs.readFileSync(dotEnvPath, 'utf8')

      cachedLoadedEnvFiles.push({
        path: envFile,
        contents,
        env: {}
      })
    } catch (err) {
      if (err.code !== 'ENOENT') {
        log.error(`Failed to load env from ${envFile}`, err)
      }
    }
  }

  const result = processEnv(
    cachedLoadedEnvFiles,
    dir,
    log,
    forceReload,
    onReload
  )

  combinedEnv = result[0]
  parsedEnv = result[1]

  return {
    combinedEnv,
    parsedEnv,
    loadedEnvFiles: cachedLoadedEnvFiles
  }
}

module.exports = {
  get initialEnv () {
    return initialEnv
  },
  updateInitialEnv,
  processEnv,
  resetEnv,
  loadEnvConfig
}
