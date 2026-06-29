const fsx = require('./../helpers/fsx')
const path = require('path')
const { encrypted, encrypt, scan, upsert, publickeys, keyring, keypair } = require('@dotenvx/primitives')

const TYPE_ENV_FILE = 'envFile'

const Errors = require('../helpers/errors')
const { determine } = require('./../helpers/envResolution')
const detectEncoding = require('./../helpers/detectEncoding')
// const providers = require('./../providers')
const { isPublicKey, mutateSrc, mutateKeysSrc2 } = require('../helpers/cryptography')
const SAMPLE_ENV_KIT = require('../helpers/kits/sample')
const keynames = require('../conventions/keynames')

async function encryptTransform (options = {}) {
  const envs = options.envs || []
  const ik = options.ik
  const ek = options.ek
  const fk = options.fk || '.env.keys'
  const noArmor = options.noArmor
  const noCreate = options.noCreate
  // const provider = options.noArmor ? null : await providers(options)

  const processedEnvs = []
  const changedFilepaths = []
  const unchangedFilepaths = []

  // set up keysSrc
  let keysSrc
  if (await fsx.exists(fk)) {
    const encoding = await detectEncoding(fk)
    keysSrc = await fsx.readFileX(fk, { encoding })
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
        // upsert public key to .env file
        const kp = keypair() // local
        publicKey = kp.publicKey
        const privateKey = kp.privateKey
        const { publicKeyName, privateKeyName } = keynames(envFilepath)
        const { envSrc } = mutateSrc({ envSrc: row.envSrc, envFilepath, keysFilepath: fk, publicKeyName, publicKeyValue: publicKey })
        row.envSrc = envSrc

        const comment = path.basename(envFilepath)
        if (noArmor) {
          const mutated = mutateKeysSrc2({ keysSrc, privateKeyName, privateKeyValue: privateKey, comment })
          keysSrc = mutated.keysSrc
        } else {
          const mutated = mutateKeysSrc2({ keysSrc, privateKeyName, privateKeyValue: privateKey, comment })
          keysSrc = mutated.keysSrc
          console.error('coming soon: armor')
          // throw new Error('implement!')
        }
      }

      const { parsed } = scan(row.envSrc, { ik, ek })

      for (const [key, values] of Object.entries(parsed)) {
        // skip if public key
        if (isPublicKey(key)) {
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
