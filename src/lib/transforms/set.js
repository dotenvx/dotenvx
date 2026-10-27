const fsx = require('./../helpers/fsx')
const path = require('path')
const { encrypt, upsert, publickeys } = require('@dotenvx/primitives')

const TYPE_ENV_FILE = 'envFile'

const getResolver = require('./../resolvers/get')
const selectEnvs = require('../helpers/selectEnvs')
const detectEncoding = require('./../helpers/detectEncoding')
const { isPlainKey, mutateSrc } = require('../helpers/cryptography')
const keynames = require('../conventions/keynames')
const Errors = require('../helpers/errors')

const storeKeyStorage = require('../helpers/storeKeyStorage')

async function setTransform (options = {}) {
  const envs = options.envs || []
  const key = options.key
  const value = options.value
  const fk = options.fk || '.env.keys'
  const noArmor = options.noArmor
  let storage
  const custodyContext = { token: options.token }
  const noNative = options.noNative
  const noCreate = options.noCreate

  const processedEnvs = []
  const changedFilepaths = []
  const unchangedFilepaths = []

  // set up keysSrc
  let keysSrc
  if (await fsx.exists(fk)) {
    try {
      const encoding = await detectEncoding(fk)
      keysSrc = await fsx.readFileX(fk, { encoding })
    } catch (err) {
      if (err.code === 'EACCES' || err.code === 'EPERM') {
        // do nothing (scenario: chmod a-r .env.keys)
      } else {
        throw err
      }
    }
  }

  for (const env of selectEnvs(envs, options)) {
    if (env.type !== TYPE_ENV_FILE) {
      continue
    }

    const envFilepath = env.envFilepath || env.value
    const filepath = env.filepath || path.resolve(envFilepath)
    const row = { key, value, type: TYPE_ENV_FILE, filepath, envFilepath, changed: false }

    try {
      const noEncrypt = !options.encrypt || isPlainKey(key)
      const fileExists = await fsx.exists(filepath)
      if (!fileExists && !noCreate) {
        row.envSrc = ''
        row.changed = true
      } else {
        const encoding = await detectEncoding(filepath)
        row.envSrc = await fsx.readFileX(filepath, { encoding })
      }

      if (row.envSrc.trim().length === 0) {
        row.envSrc = ''
        row.changed = true
      }

      let publicKey = publickeys(row.envSrc)[0]

      // only create if missing public key and encryption needed
      if (!publicKey && !noEncrypt) {
        const { publicKeyName, privateKeyName } = keynames(envFilepath)
        const comment = path.basename(envFilepath)

        const result = await storeKeyStorage(storage, undefined, undefined, options, Object.assign(custodyContext, { envFilepath: filepath, keysSrc, privateKeyName, comment, keysFilepath: fk }))
        storage = result.storage
        publicKey = result.publicKey
        row.envSrc = mutateSrc({ envSrc: row.envSrc, envFilepath, keysFilepath: fk, publicKeyName, publicKeyValue: publicKey }).envSrc
        row.keySources = { [publicKey]: Object.prototype.hasOwnProperty.call(result.stored, 'keysSrc') ? 'file' : (typeof storage === 'string' ? storage : storage.id) }
        const stored = result.stored
        if (Object.prototype.hasOwnProperty.call(stored, 'keysSrc')) keysSrc = stored.keysSrc
        if (stored.nativePrivateKeyAdded) row.nativePrivateKeyAdded = true
      }

      if (noEncrypt) {
        const before = row.envSrc
        row.envSrc = upsert(row.envSrc, key, value)
        if (row.envSrc !== before) {
          row.changed = true
        }
      } else {
        // Compare plaintext before rewriting ciphertext; surface any provider approval.
        const { parsed, keySources } = await getResolver({
          key,
          envs: [env],
          all: true,
          envKeysFile: fk,
          noArmor,
          noNative,
          no1Password: options.no1Password,
          noBitwarden: options.noBitwarden,
          onStatus: options.onStatus
        })

        row.keySources = row.keySources || keySources
        const before = parsed[key]
        if (value !== before) {
          const encryptedValue = encrypt(publicKey, value)
          row.envSrc = upsert(row.envSrc, key, encryptedValue)
          row.changed = true
        }
      }

      if (row.changed) {
        changedFilepaths.push(envFilepath)
      } else {
        unchangedFilepaths.push(envFilepath)
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        row.error = new Errors({ envFilepath, filepath }).missingEnvFile()
      } else {
        row.error = error
      }
    }

    processedEnvs.push(row)
  }

  return {
    keysSrc,
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  }
}

module.exports = setTransform
