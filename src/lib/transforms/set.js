const fsx = require('./../helpers/fsx')
const path = require('path')
const { encrypt, upsert, publickeys, keypair } = require('@dotenvx/primitives')

const TYPE_ENV_FILE = 'envFile'

const getResolver = require('./../resolvers/get')
const { determine } = require('./../helpers/envResolution')
const detectEncoding = require('./../helpers/detectEncoding')
const { isPlainKey, mutateSrc } = require('../helpers/cryptography')
const keynames = require('../conventions/keynames')
const Errors = require('../helpers/errors')

const selectKeyStorage = require('../helpers/selectKeyStorage')
const custodians = require('../custodians')

async function setTransform (options = {}) {
  const envs = options.envs || []
  const key = options.key
  const value = options.value
  const fk = options.fk || '.env.keys'
  const noArmor = options.noArmor
  let storage
  const custodyContext = {}
  const noNative = options.noNative
  const noCreate = options.noCreate
  const noEncrypt = !options.encrypt || isPlainKey(key)

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

  for (const env of determine(envs, process.env)) {
    if (env.type !== TYPE_ENV_FILE) {
      continue
    }

    const envFilepath = env.envFilepath || env.value
    const filepath = env.filepath || path.resolve(envFilepath)
    const row = { key, value, type: TYPE_ENV_FILE, filepath, envFilepath, changed: false }

    try {
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
        storage = storage || await selectKeyStorage(options)

        // upsert public key to .env file
        const kp = keypair() // local
        publicKey = kp.publicKey
        const privateKey = kp.privateKey
        const { publicKeyName, privateKeyName } = keynames(envFilepath)
        const { envSrc } = mutateSrc({ envSrc: row.envSrc, envFilepath, keysFilepath: fk, publicKeyName, publicKeyValue: publicKey })
        row.envSrc = envSrc

        const comment = path.basename(envFilepath)

        const stored = await custodians.store(storage, publicKey, privateKey, Object.assign(custodyContext, { keysSrc, privateKeyName, comment, keysFilepath: fk }))
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
        // expensive additional loop
        const { parsed } = await getResolver({
          key,
          envs: [env],
          all: true,
          envKeysFile: fk,
          noArmor,
          noNative,
          no1Password: options.no1Password,
          noBitwarden: options.noBitwarden
        })

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
