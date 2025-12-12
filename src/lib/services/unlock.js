const fsx = require('../helpers/fsx')
const path = require('path')

const TYPE_ENV_FILE = 'envFile'

const Errors = require('../helpers/errors')
const guessPrivateKeyName = require('../helpers/guessPrivateKeyName')
const detectEncoding = require('../helpers/detectEncoding')
const determineEnvs = require('../helpers/determineEnvs')
const { findPrivateKey } = require('../helpers/findPrivateKey')
const decryptPrivateKeys = require('../helpers/decryptPrivateKeys')
const dotenvParse = require('../helpers/dotenvParse')
const { logger } = require('../../shared/logger')

class Unlock {
  /**
   * Unlock service constructor
   * @param {Array} envs - array of env objects
   * @param {string} envKeysFilepath - path to .env.keys file
   * @param {string} passphrase - passphrase to decrypt private key
   * @param {string} salt - salt to decrypt private key
   */
  constructor (
    envs = [],
    envKeysFilepath = null,
    passphrase = null,
    salt = null
  ) {
    this.envs = determineEnvs(envs, process.env)
    this.envKeysFilepath = envKeysFilepath
    this.passphrase = passphrase
    this.salt = salt

    this.processedEnvs = []
    this.changedFilepaths = new Set()
    this.unchangedFilepaths = new Set()
    this.readableFilepaths = new Set()
  }

  run () {
    // example
    // envs [
    //   { type: 'envFile', value: '.env' }
    // ]

    if (!this?.envs || this.envs.length === 0) {
      this.processedEnvs.push({
        error: new Errors({ command: 'unlock' }).invalidArguments()
      })
    }

    for (const env of this.envs) {
      if (env.type === TYPE_ENV_FILE) {
        this._unlockEnvKey(env.value)
      }
    }

    return {
      processedEnvs: this.processedEnvs,
      changedFilepaths: [...this.changedFilepaths],
      unchangedFilepaths: [...this.unchangedFilepaths]
    }
  }

  _unlockEnvKey (envFilepath) {
    logger.debug(`Unlocking env key for ${envFilepath}`)
    const row = {}
    row.type = TYPE_ENV_FILE

    const filepath = path.resolve(envFilepath)
    row.filepath = filepath
    row.changed = false
    row.unlocked = false

    try {
      this.readableFilepaths.add(envFilepath)

      const privateKeyName = guessPrivateKeyName(envFilepath)
      const existingPrivateKey = findPrivateKey(
        envFilepath,
        this.envKeysFilepath
      )

      let envKeysFilepath = path.join(path.dirname(filepath), '.env.keys')
      if (this.envKeysFilepath) {
        envKeysFilepath = path.resolve(this.envKeysFilepath)
      }

      logger.debug(
        `Using private key name: ${privateKeyName}; existingPrivateKey: ${existingPrivateKey}; envKeysFilepath: ${envKeysFilepath}`
      )
      if (existingPrivateKey) {
        logger.debug(`passphrase is set: ${!!this.passphrase}`)
        if (!this.passphrase) {
          logger.debug('No passphrase provided for unlocking; adding an error')
          row.error = new Errors({
            privateKeyName,
            privateKey: existingPrivateKey
          }).invalidPassPhrase()
        } else {
          // .env.keys
          let keysSrc = ''
          const encoding = this._detectEncoding(envKeysFilepath)
          keysSrc = fsx.readFileX(envKeysFilepath, { encoding })

          const envParsed = dotenvParse(keysSrc)
          row.originalValue = envParsed[privateKeyName]
          this.readableFilepaths.add(envFilepath)

          // decrypt privateKey
          const decryptedPrivateKey = decryptPrivateKeys(
            privateKeyName,
            existingPrivateKey,
            this.passphrase,
            this.salt
          )
          // record whether the value changed
          const valueChanged = decryptedPrivateKey !== row.originalValue

          if (valueChanged) {
            logger.verbose(
              `${privateKeyName} decrypted; updating value in ${envKeysFilepath}`
            )
            // replace the line beginning with ${privateKeyName} with the decrypted value
            keysSrc = keysSrc.replace(
              new RegExp(`^${privateKeyName}=.+$`, 'm'),
              `${privateKeyName}=${decryptedPrivateKey}`
            )

            fsx.writeFileX(envKeysFilepath, keysSrc)

            row.changed = true
            this.changedFilepaths.add(envFilepath)
            row.unlocked = true
          }

          row.envKeysFilepath =
            this.envKeysFilepath ||
            path.join(
              path.dirname(envFilepath),
              path.basename(envKeysFilepath)
            )
          row.privateKeyName = privateKeyName
          row.envFilepath = envFilepath
        }
      } else {
        logger.debug(
          `No existing private key found for ${privateKeyName}; adding an error`
        )
        row.error = new Errors({
          privateKeyName,
          privateKey: ''
        }).missingPrivateKeyForUnlock()
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

  _detectEncoding (filepath) {
    return detectEncoding(filepath)
  }
}
module.exports = Unlock
