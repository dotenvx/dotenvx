const fs = require('fs')
const crypto = require('crypto')

const dotenv = require('dotenv')

const logger = require('./../shared/logger')

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

const _generateDotenvKey = function (environment) {
  const rand = crypto.randomBytes(32).toString('hex')

  return `dotenv://:key_${rand}@dotenvx.com/vault/.env.vault?environment=${environment}`
}

module.exports = {
  filename,
  data,
  keys,
  _generateDotenvKey
}
