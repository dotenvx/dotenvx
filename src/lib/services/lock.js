const fsx = require('../helpers/fsx')
const path = require('path')

const TYPE_ENV_FILE = 'envFile'

const Errors = require('../helpers/errors')
const guessPrivateKeyName = require('../helpers/guessPrivateKeyName')
const detectEncoding = require('../helpers/detectEncoding')
const determineEnvs = require('../helpers/determineEnvs')
const { findPrivateKey } = require('../helpers/findPrivateKey')
const encryptPrivateKeys = require('../helpers/encryptPrivateKeys')
const dotenvParse = require('../helpers/dotenvParse')
const { logger } = require('../../shared/logger')

class Lock {
  /**
   * Lock service constructor
   * @param {Array} envs - array of env objects
   * @param {string} envKeysFilepath - path to .env.keys file
   * @param {string} passphrase - passphrase to encrypt/decrypt private key
   * @param {string} salt - salt to use for encryption/decryption
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
        error: new Errors({ command: 'lock' }).invalidArguments()
      })
    }

    for (const env of this.envs) {
      if (env.type === TYPE_ENV_FILE) {
        this._lockEnvKey(env.value)
      }
    }

    return {
      processedEnvs: this.processedEnvs,
      changedFilepaths: [...this.changedFilepaths],
      unchangedFilepaths: [...this.unchangedFilepaths]
    }
  }

  _lockEnvKey (envFilepath) {
    logger.debug(`Locking env key for ${envFilepath}`)
    const row = {}
    row.type = TYPE_ENV_FILE

    const filepath = path.resolve(envFilepath)
    row.filepath = filepath
    row.changed = false
    row.locked = false

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
          logger.debug('No passphrase provided for locking; adding an error')
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

          // encrypt privateKey
          const encryptedPrivateKeyWithPrefix = encryptPrivateKeys(
            privateKeyName,
            existingPrivateKey,
            this.passphrase,
            this.salt
          )
          // record whether the value changed
          const valueChanged =
            encryptedPrivateKeyWithPrefix !== row.originalValue

          if (valueChanged) {
            logger.verbose(
              `${privateKeyName} encrypted; updating value in ${envKeysFilepath}`
            )
            // replace the line beginning with ${privateKeyName} with the encrypted value
            keysSrc = keysSrc.replace(
              new RegExp(`^${privateKeyName}=.+$`, 'm'),
              `${privateKeyName}=${encryptedPrivateKeyWithPrefix}`
            )

            fsx.writeFileX(envKeysFilepath, keysSrc)

            row.changed = true
            this.changedFilepaths.add(envFilepath)
            row.locked = true
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
        }).missingPrivateKeyForLock()
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
module.exports = Lock
