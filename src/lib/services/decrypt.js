const fsx = require('./../helpers/fsx')
const path = require('path')
const picomatch = require('picomatch')
const { encrypted, scan } = require('@dotenvx/primitives')

const TYPE_ENV_FILE = 'envFile'

const Errors = require('./../helpers/errors')

const {
  determine
} = require('./../helpers/envResolution')

const {
  keyNamesForEnvFile,
  keyValues
} = require('./../helpers/keyResolution')

const {
  decryptKeyValue
} = require('./../helpers/cryptography')

const replace = require('./../helpers/replace')
const detectEncoding = require('./../helpers/detectEncoding')

class Decrypt {
  constructor (envs = [], key = [], excludeKey = [], envKeysFilepath = null, noArmor = false, options = {}) {
    this.envs = determine(envs, process.env)
    this.key = key
    this.excludeKey = excludeKey
    this.envKeysFilepath = envKeysFilepath
    this.noArmor = noArmor
    this.command = options.command

    this.processedEnvs = []
    this.changedFilepaths = new Set()
    this.unchangedFilepaths = new Set()
  }

  async run () {
    // example
    // envs [
    //   { type: 'envFile', value: '.env' }
    // ]

    this.keys = this._keys()
    const excludeKeys = this._excludeKeys()

    this.exclude = picomatch(excludeKeys)
    this.include = picomatch(this.keys, { ignore: excludeKeys })

    for (const env of this.envs) {
      if (env.type === TYPE_ENV_FILE) {
        await this._decryptEnvFile(env.value)
      }
    }

    return {
      processedEnvs: this.processedEnvs,
      changedFilepaths: [...this.changedFilepaths],
      unchangedFilepaths: [...this.unchangedFilepaths]
    }
  }

  async _decryptEnvFile (envFilepath) {
    const row = {}
    row.keys = []
    row.type = TYPE_ENV_FILE

    const filepath = path.resolve(envFilepath)
    row.filepath = filepath
    row.envFilepath = envFilepath

    try {
      const encoding = await detectEncoding(filepath)
      let envSrc = await fsx.readFileX(filepath, { encoding })
      const envParsed = scan(envSrc).parsed

      const { privateKeyName } = keyNamesForEnvFile(envFilepath)
      const { privateKeyValue, privateKeySource } = await keyValues(envFilepath, {
        keysFilepath: this.envKeysFilepath,
        noArmor: this.noArmor,
        command: this.command
      })

      row.privateKey = privateKeyValue
      row.privateKeySource = privateKeySource
      row.armoredPrivateKeyUsed = privateKeySource === 'armor'
      row.privateKeyName = privateKeyName
      row.changed = false // track possible changes

      for (const [key, values] of Object.entries(envParsed)) {
        // key excluded - don't decrypt it
        if (this.exclude(key)) {
          continue
        }

        // key effectively excluded (by not being in the list of includes) - don't decrypt it
        if (this.keys.length > 0 && !this.include(key)) {
          continue
        }

        const hasEncrypted = values.some(value => encrypted(value))
        if (hasEncrypted) {
          row.keys.push(key) // track key(s)

          const decryptedValues = values.map(value => {
            if (!encrypted(value)) {
              return value
            }

            return decryptKeyValue(key, value, privateKeyName, privateKeyValue)
          })

          // once newSrc is built write it out
          envSrc = replace(envSrc, key, decryptedValues)

          row.changed = true // track change
        }
      }

      row.envSrc = envSrc
      if (row.changed) {
        this.changedFilepaths.add(envFilepath)
      } else {
        this.unchangedFilepaths.add(envFilepath)
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        row.error = new Errors({ envFilepath, filepath }).missingEnvFile()
      } else {
        row.error = e
      }
    }

    this.processedEnvs.push(row)
  }

  _keys () {
    if (!Array.isArray(this.key)) {
      return [this.key]
    }

    return this.key
  }

  _excludeKeys () {
    if (!Array.isArray(this.excludeKey)) {
      return [this.excludeKey]
    }

    return this.excludeKey
  }
}

module.exports = Decrypt
