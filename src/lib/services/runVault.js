const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

const parseEncryptionKeyFromDotenvKey = require('./../helpers/parseEncryptionKeyFromDotenvKey')
const parseEnvironmentFromDotenvKey = require('./../helpers/parseEnvironmentFromDotenvKey')
const DotenvVault = require('./../helpers/dotenvVault')

const ENCODING = 'utf8'

class RunVault {
  constructor(envVaultFile = '.env.vault', DOTENV_KEY = '') {
    this.envVaultFile = envVaultFile
    this.DOTENV_KEY = DOTENV_KEY
  }

  run () {
    const filepath = path.resolve(this.envVaultFile)
    if (!fs.existsSync(filepath)) {
      const code = 'MISSING_ENV_VAULT_FILE'
      const message = `you set DOTENV_KEY but your .env.vault file is missing: ${filepath}`
      const error = new Error(message)
      error.code = code
      throw error
    }

    if (this.DOTENV_KEY.length < 1) {
      const code = 'MISSING_DOTENV_KEY'
      const message = `your DOTENV_KEY appears to be blank: '${this.DOTENV_KEY}'`
      const error = new Error(message)
      error.code = code
      throw error
    }

    const uniqueInjectedKeys = new Set()

    const parsedVault = this._parsedVault(filepath) // { "DOTENV_VAULT_DEVELOPMENT": "<ciphertext>" }

    // handle scenario for comma separated keys - for use with key rotation
    // example: DOTENV_KEY="dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenvx.com/vault/.env.vault?environment=prod"
    const dotenvKeys = this._dotenvKeys()
    const length = dotenvKeys.length

    let decrypted
    for (let i = 0; i < length; i++) {
      try {
        const dotenvKey = dotenvKeys[i].trim() // dotenv://key_1234@...?environment=prod

        decrypted = this._decrypted(dotenvKey, parsedVault)

        break
      } catch (error) {
        // last key
        if (i + 1 >= length) {
          throw error
        }
        // try next key
      }
    }

    // parse this. it's the equivalent of the .env file
    const parsed = this._parseExpand(decrypted)
    const { injected, preExisted } = this._inject(process.env, parsed)

    for (const key of Object.keys(injected)) {
      uniqueInjectedKeys.add(key) // track uniqueInjectedKeys across multiple files
    }

    return {
      envVaultFile: this.envVaultFile, // filepath
      dotenvKeys: dotenvKeys,
      uniqueInjectedKeys: [...uniqueInjectedKeys]
    }
  }

  _dotenvKeys () {
    return this.DOTENV_KEY.split(',')
  }

  _decrypted (dotenvKey, parsedVault) {
    const key = parseEncryptionKeyFromDotenvKey(dotenvKey)
    const environment = parseEnvironmentFromDotenvKey(dotenvKey)

    // DOTENV_KEY_PRODUCTION
    const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`
    const ciphertext = parsedVault[environmentKey]
    if (!ciphertext) {
      const error = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: cannot locate environment ${environmentKey} in your .env.vault file`)
      error.code = 'NOT_FOUND_DOTENV_ENVIRONMENT'

      throw error
    }

    const dotenvVault = new DotenvVault()
    return dotenvVault._decrypt(dotenvKey, ciphertext)
  }

  _parsedVault (filepath) {
    const src = fs.readFileSync(filepath, { encoding: ENCODING })
    return dotenv.parse(src)
  }

  _parseExpand (src) {
    const parsed = dotenv.parse(src)

    // consider moving this logic straight into dotenv-expand
    let inputParsed = {}
    if (this.overload) {
      inputParsed = { ...process.env, ...parsed }
    } else {
      inputParsed = { ...parsed, ...process.env }
    }

    const expandPlease = {
      processEnv: {},
      parsed: inputParsed
    }
    const expanded = dotenvExpand.expand(expandPlease).parsed

    // but then for logging only log the original keys existing in parsed. this feels unnecessarily complex - like dotenv-expand should support the ability to inject additional `process.env` or objects as it sees fit to the object it wants to expand
    const result = {}
    for (const key in parsed) {
      result[key] = expanded[key]
    }

    return result
  }

  _inject (processEnv = {}, parsed = {}) {
    const injected = {}
    const preExisted = {}

    // set processEnv
    for (const key of Object.keys(parsed)) {
      if (processEnv[key]) {
        if (this.overload === true) {
          processEnv[key] = parsed[key]

          injected[key] = parsed[key] // track injected key/value
        } else {
          preExisted[key] = processEnv[key] // track preExisted key/value
        }
      } else {
        processEnv[key] = parsed[key]
        injected[key] = parsed[key] // track injected key/value
      }
    }

    return {
      injected,
      preExisted
    }
  }
}

module.exports = RunVault
