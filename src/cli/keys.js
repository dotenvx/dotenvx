const fs = require('fs')
const crypto = require('crypto')

const dotenv = require('dotenv')

const logger = require('./../shared/logger')

const RESERVED_ENV_FILES = ['.env.vault', '.env.projects', '.env.keys', '.env.me', '.env.x']

const filename = function () {
  return '.env.keys'
}

const data = function () {
  let data = `#/!!!!!!!!!!!!!!!!!!!.env.keys!!!!!!!!!!!!!!!!!!!!!!/
#/   DOTENV_KEYs. DO NOT commit to source control   /
#/   [how it works](https://dotenv.org/env-keys)    /
#/--------------------------------------------------/\n`

  const keys = this.keys()

  logger.debug(keys)

  for (const key in keys) {
    if (Object.prototype.hasOwnProperty.call(keys, key)) {
      const value = keys[key]
      data += `${key}="${value}"\n`
    }
  }

  return data
}

const keys = function () {
  const keys = {}
  // grab current .env.keys
  const parsed = (dotenv.configDotenv({ path: '.env.keys' }).parsed || {})
  const envLookups = this.envLookups()

  for (const file in envLookups) {
    if (Object.prototype.hasOwnProperty.call(envLookups, file)) {
      const environment = envLookups[file]
      const key = `DOTENV_KEY_${environment.toUpperCase()}`

      let value = parsed[key]

      // prevent overwriting current .env.keys data
      if (!value || value.length === 0) {
        value = this._generateDotenvKey(environment)
      }

      keys[key] = value
    }
  }

  return keys
}

const envLookups = function () {
  const _this = this
  const dir = './'
  const lookups = {}

  const files = fs.readdirSync(dir)
  for (const file of files) {
    // must be a .env* file
    if (!file.startsWith('.env')) {
      continue
    }

    // must not be .env.vault.something, or .env.me.something, etc.
    if (_this._reservedEnvFilePath(file)) {
      continue
    }

    // must not end with .previous
    if (file.endsWith('.previous')) {
      continue
    }

    const environment = _this._determineLikelyEnvironment(file)

    lookups[file] = environment
  }

  return lookups
}

const _reservedEnvFilePath = function (file) {
  let result = false

  for (const reservedFile of RESERVED_ENV_FILES) {
    if (file.startsWith(reservedFile)) {
      result = true
    }
  }

  return result
}

const _determineLikelyEnvironment = function (file) {
  const splitFile = file.split('.')
  const possibleEnvironment = splitFile[2] // ['', 'env', environment']

  if (!possibleEnvironment || possibleEnvironment.length === 0) {
    return 'development'
  }

  return possibleEnvironment
}

const _generateDotenvKey = function (environment) {
  const rand = crypto.randomBytes(32).toString('hex')

  return `dotenv://:key_${rand}@dotenvx.com/vault/.env.vault?environment=${environment}`
}

module.exports = {
  filename,
  data,
  keys,
  envLookups,
  _reservedEnvFilePath,
  _determineLikelyEnvironment,
  _generateDotenvKey
}
