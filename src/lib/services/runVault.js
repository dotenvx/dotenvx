const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const inject = require('./../helpers/inject')
const decrypt = require('./../helpers/decrypt')
const parseExpandAndEval = require('./../helpers/parseExpandAndEval')
const parseEnvironmentFromDotenvKey = require('./../helpers/parseEnvironmentFromDotenvKey')

const ENCODING = 'utf8'

class RunVault {
  constructor (envVaultFile = '.env.vault', env = [], DOTENV_KEY = '', overload = false) {
    this.DOTENV_KEY = DOTENV_KEY
    this.envVaultFile = envVaultFile
    this.env = env
    this.overload = overload
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

    const strings = []
    const uniqueInjectedKeys = new Set()

    const envs = this._envs()
    for (const env of envs) {
      const row = {}
      row.string = env

      const parsed = parseExpandAndEval(env, this.overload)
      row.parsed = parsed

      const { injected, preExisted } = inject(process.env, parsed, this.overload)
      row.injected = injected
      row.preExisted = preExisted

      for (const key of Object.keys(injected)) {
        uniqueInjectedKeys.add(key) // track uniqueInjectedKeys across multiple files
      }

      strings.push(row)
    }

    let decrypted
    const dotenvKeys = this._dotenvKeys()
    const parsedVault = this._parsedVault(filepath)
    for (let i = 0; i < dotenvKeys.length; i++) {
      try {
        const dotenvKey = dotenvKeys[i].trim() // dotenv://key_1234@...?environment=prod

        decrypted = this._decrypted(dotenvKey, parsedVault)

        break
      } catch (error) {
        // last key
        if (i + 1 >= dotenvKeys.length) {
          throw error
        }
        // try next key
      }
    }

    // parse this. it's the equivalent of the .env file
    const parsed = parseExpandAndEval(decrypted, this.overload)
    const { injected, preExisted } = inject(process.env, parsed, this.overload)

    for (const key of Object.keys(injected)) {
      uniqueInjectedKeys.add(key) // track uniqueInjectedKeys across multiple files
    }

    return {
      envVaultFile: this.envVaultFile, // filepath
      strings,
      dotenvKeys,
      decrypted,
      parsed,
      injected,
      preExisted,
      uniqueInjectedKeys: [...uniqueInjectedKeys]
    }
  }

  // handle scenario for comma separated keys - for use with key rotation
  // example: DOTENV_KEY="dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenvx.com/vault/.env.vault?environment=prod"
  _dotenvKeys () {
    return this.DOTENV_KEY.split(',')
  }

  _decrypted (dotenvKey, parsedVault) {
    const environment = parseEnvironmentFromDotenvKey(dotenvKey)

    // DOTENV_KEY_PRODUCTION
    const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`
    const ciphertext = parsedVault[environmentKey]
    if (!ciphertext) {
      const error = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: cannot locate environment ${environmentKey} in your .env.vault file`)
      error.code = 'NOT_FOUND_DOTENV_ENVIRONMENT'

      throw error
    }

    return decrypt(ciphertext, dotenvKey)
  }

  // { "DOTENV_VAULT_DEVELOPMENT": "<ciphertext>" }
  _parsedVault (filepath) {
    const src = fs.readFileSync(filepath, { encoding: ENCODING })
    return dotenv.parse(src)
  }

  _envs () {
    if (!Array.isArray(this.env)) {
      return [this.env]
    }

    return this.env
  }
}

module.exports = RunVault
