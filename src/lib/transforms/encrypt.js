const fsx = require('./../helpers/fsx')
const path = require('path')
const { encrypted, encrypt, scan, upsert, publickeys } = require('@dotenvx/primitives')

const TYPE_ENV_FILE = 'envFile'
const SAMPLE_ENV_KIT = require('../helpers/kits/sample')

const Errors = require('../helpers/errors')
const selectEnvfileEnvs = require('../helpers/selectEnvfileEnvs')
const detectEncoding = require('./../helpers/detectEncoding')
const readKeyFileSnapshot = require('../helpers/readKeyFileSnapshot')
const { isDotenvPublicKey, isPlainKey, mutateSrc } = require('../helpers/cryptography')
const keynames = require('../conventions/keynames')

const storeKeyStorage = require('../helpers/storeKeyStorage')
const readEnvfile = require('../envfile/parsing/readEnvfile')

async function encryptTransform (options = {}) {
  const envs = options.envs || []
  const ik = options.ik
  const ek = options.ek
  const fk = options.fk || '.env.keys'
  let storage
  const custodyContext = { token: options.token }
  const noCreate = options.noCreate

  const processedEnvs = []
  const changedFilepaths = []
  const unchangedFilepaths = []

  // Preserve the exact bytes used to prepare file-key updates. Do not treat
  // access errors as a missing file: public-key-only encryption may proceed,
  // but an unknown snapshot must never be overwritten.
  let keysSrc
  let initialKeyFileSnapshot
  if (options.with === undefined) {
    try {
      initialKeyFileSnapshot = await readKeyFileSnapshot(fk)
      if (initialKeyFileSnapshot.contents !== null) {
        const encoding = await detectEncoding(fk)
        keysSrc = initialKeyFileSnapshot.contents.toString(encoding)
      }
    } catch (err) {
      if (err.code === 'EACCES' || err.code === 'EPERM' || err.code === 'ENOTDIR') {
        initialKeyFileSnapshot = { error: err }
      } else {
        throw err
      }
    }
  }
  const initialKeysSrc = keysSrc

  for (const env of selectEnvfileEnvs(envs, options)) {
    if (env.type !== TYPE_ENV_FILE) {
      continue
    }

    const envFilepath = env.envFilepath || env.value
    const filepath = env.filepath || path.resolve(envFilepath)
    const row = { keys: [], type: TYPE_ENV_FILE, filepath, envFilepath, changed: false }

    try {
      const schema = readEnvfile(undefined, [filepath])
      const fileExists = await fsx.exists(filepath)
      if (!fileExists && !noCreate) {
        row.envSrc = SAMPLE_ENV_KIT
        row.changed = true
      } else {
        const encoding = await detectEncoding(filepath)
        row.envSrc = await fsx.readFileX(filepath, { encoding })
      }

      if (!schema.exists && row.envSrc.trim().length === 0) {
        row.envSrc = SAMPLE_ENV_KIT
        row.changed = true
      }

      if (options.with !== undefined) {
        // Inspect every assignment before selection or schema rules can hide it.
        const { parsed: existing } = scan(row.envSrc)
        const declaredKeys = Object.entries(existing).filter(([key]) => isDotenvPublicKey(key)).flatMap(([, values]) => values)
        const matchingKey = declaredKeys.length > 0 && declaredKeys.every(value => value.toLowerCase() === options.with.toLowerCase())
        if (!matchingKey && (declaredKeys.length > 0 || Object.values(existing).some(values => values.some(encrypted)))) {
          throw new Errors({ envFilepath }).alreadyEncrypted()
        }
        const { publicKeyName } = keynames(envFilepath)
        try {
          if (!/^(?:0[23][0-9a-f]{64}|04[0-9a-f]{128})$/i.test(options.with)) throw new Error('Invalid public key format')
          encrypt(options.with, '') // Validate the curve point even if no values need encryption.
        } catch {
          throw new Errors({ publicKeyName, publicKey: options.with }).invalidPublicKey()
        }
        if (!matchingKey) {
          row.envSrc = mutateSrc({ envSrc: row.envSrc, envFilepath, publicKeyName, publicKeyValue: options.with }).envSrc
          row.changed = true
        }
      }

      const { parsed } = scan(row.envSrc, { ik, ek })
      const selected = Object.entries(parsed).filter(([key]) => {
        if (isDotenvPublicKey(key)) return false
        return schema.exists ? (schema.keys[key]?.fs.encrypted ?? true) : !isPlainKey(key)
      })
      if (schema.exists && !selected.some(([, values]) => values.some(value => !encrypted(value)))) {
        // A missing file still needs writing even when its initial values are
        // exempt from encryption. Avoid generating keys, but preserve creation.
        if (row.changed) changedFilepaths.push(envFilepath)
        else unchangedFilepaths.push(envFilepath)
        processedEnvs.push(row)
        continue
      }

      let publicKey = publickeys(row.envSrc)[0]

      if (!publicKey) {
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

      for (const [key, values] of selected) {
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
      if (error?.code === 'ENOENT') {
        row.error = new Errors({ envFilepath, filepath }).missingEnvFile()
      } else {
        row.error = error instanceof Error ? error : new Error('Encryption aborted before private key storage completed')
      }
    }

    processedEnvs.push(row)
  }

  return {
    keysSrc,
    initialKeyFileSnapshot,
    keysChanged: keysSrc !== initialKeysSrc,
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  }
}

module.exports = encryptTransform
