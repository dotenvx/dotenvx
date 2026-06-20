const path = require('path')
const fs = require('fs')
const execa = require('execa')
const { scan } = require('@dotenvx/primitives')
const canonicalEnvFilename = require('./canonicalEnvFilename')
const environment = require('./envResolution/environment')
const sanitizeCommandForMetadata = require('./sanitizeCommandForMetadata')

function compact (object) {
  return Object.entries(object).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value
    }

    return acc
  }, {})
}

function commandFromMetadata (metadata) {
  try {
    const parsed = JSON.parse(metadata)
    return parsed && parsed.command ? sanitizeCommandForMetadata(parsed.command) : parsed && parsed.command
  } catch (_error) {
    return null
  }
}

function gitRoot () {
  try {
    return execa.sync('git', ['rev-parse', '--show-toplevel']).stdout.toString().trim()
  } catch (_error) {
    return null
  }
}

function normalizeFilepath (envFile) {
  const root = gitRoot()
  const filepath = path.resolve(envFile)

  if (root) {
    return path.relative(root, filepath).replace(/\\/g, '/')
  }

  return path.relative(process.cwd(), filepath).replace(/\\/g, '/')
}

function projectName () {
  return path.basename(gitRoot() || process.cwd())
}

function envKeys (envFile) {
  let src
  try {
    src = fs.readFileSync(envFile)
  } catch (_error) {
    return null
  }

  const { parsed } = scan(src)

  if (!parsed || Object.keys(parsed).length === 0) return null

  return Object.keys(parsed)
}

function keypairMetadata (envFile = '.env', metadata = undefined) {
  return compact({
    filepath: normalizeFilepath(envFile),
    filename: canonicalEnvFilename(envFile),
    environment: environment(envFile),
    project_name: projectName(),
    keys: envKeys(envFile),
    command: commandFromMetadata(metadata)
  })
}

module.exports = keypairMetadata
