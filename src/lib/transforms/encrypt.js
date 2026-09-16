const fsx = require('./../helpers/fsx')
const path = require('path')
const { encrypted, encrypt, scan, upsert, publickeys, keypair } = require('@dotenvx/primitives')

const TYPE_ENV_FILE = 'envFile'
const SAMPLE_ENV_KIT = require('../helpers/kits/sample')

const Errors = require('../helpers/errors')
const { determine } = require('./../helpers/envResolution')
const detectEncoding = require('./../helpers/detectEncoding')
const { isDotenvPublicKey, isPlainKey, mutateSrc } = require('../helpers/cryptography')
const keynames = require('../conventions/keynames')

const selectKeyStorage = require('../helpers/selectKeyStorage')
const custodians = require('../custodians')

async function encryptTransform (options = {}) {
  const envs = options.envs || []
  const ik = options.ik
  const ek = options.ek
  const fk = options.fk || '.env.keys'
  let storage
  const custodyContext = {}
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

  for (const env of determine(envs, process.env)) {
    if (env.type !== TYPE_ENV_FILE) {
      continue
    }

    const envFilepath = env.envFilepath || env.value
    const filepath = env.filepath || path.resolve(envFilepath)
    const row = { keys: [], type: TYPE_ENV_FILE, filepath, envFilepath, changed: false }

    try {
      const fileExists = await fsx.exists(filepath)
      if (!fileExists && !noCreate) {
        row.envSrc = SAMPLE_ENV_KIT
        row.changed = true
      } else {
        const encoding = await detectEncoding(filepath)
        row.envSrc = await fsx.readFileX(filepath, { encoding })
      }

      if (row.envSrc.trim().length === 0) {
        row.envSrc = SAMPLE_ENV_KIT
        row.changed = true
      }

      let publicKey = publickeys(row.envSrc)[0]

      if (!publicKey) {
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

      const { parsed } = scan(row.envSrc, { ik, ek })

      for (const [key, values] of Object.entries(parsed)) {
        if (isDotenvPublicKey(key) || isPlainKey(key)) {
          continue
        }

        const transformedValues = []
        for (const value of values) {
          if (encrypted(value)) {
            transformedValues.push(value) // unchanged
          } else {
            const encryptedValue = encrypt(publicKey, value)
            transformedValues.push(encryptedValue)
          }
        }

        const before = row.envSrc
        row.envSrc = upsert(row.envSrc, key, transformedValues)
        if (row.envSrc !== before) {
          row.changed = true
          row.keys.push(key)
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

module.exports = encryptTransform
