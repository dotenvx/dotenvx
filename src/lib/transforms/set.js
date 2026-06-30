const fsx = require('./../helpers/fsx')
const path = require('path')
const { encrypted, encrypt, scan, upsert, publickeys, keypair } = require('@dotenvx/primitives')

const TYPE_ENV_FILE = 'envFile'

const Errors = require('../helpers/errors')
const { determine } = require('./../helpers/envResolution')
const detectEncoding = require('./../helpers/detectEncoding')
const { isPublicKey, mutateSrc, mutateKeysSrc2 } = require('../helpers/cryptography')
const decryptKeyValue = require('../helpers/cryptography/decryptKeyValue')
const keynames = require('../conventions/keynames')
const PostArmorUp = require('../api/postArmorUp')
const prompts = require('../helpers/prompts')
const teamChoicesFromMeta = require('../helpers/teamChoicesFromMeta')
const Session = require('../../db/session')

async function selectKeyStorage () {
  const selected = await prompts.select({
    message: 'Choose private key storage',
    choices: [
      { name: '◫ File (.env.keys)', value: 'file' },
      { name: '⛨ Armor (armor.dotenvx.com)', value: 'armored' }
    ]
  }, {
    input: process.stdin,
    output: process.stderr
  })

  return selected
}

function allValuesForKey (envSrc, key) {
  return scan(envSrc).parsed[key] || []
}

function finalValueForKey (envSrc, key) {
  const values = allValuesForKey(envSrc, key)
  return values.length > 0 ? values[values.length - 1] : null
}

async function setTransform (options = {}) {
  const envs = options.envs || []
  const key = options.key
  const value = options.value
  const fk = options.fk || '.env.keys'
  let noArmor = options.noArmor // key storage selector below
  const noCreate = options.noCreate
  const noEncrypt = !options.encrypt

  // function setTransform ({ envs = [], key = null, value = null, encrypt: shouldEncrypt = true } = {}) {

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
        if (!noCreate && !noArmor && selectKeyStorage) {
          noArmor = await selectKeyStorage() !== 'armored'
        }

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
          const sesh = new Session()
          const hostname = sesh.hostname()
          const token = sesh.token()
          const devicePublicKey = sesh.devicePublicKey()

          try {
            await new PostArmorUp(hostname, token, devicePublicKey, publicKey, privateKey, undefined).run()
          } catch (error) {
            if (error.code !== 'DOTENVX_TEAM_REQUIRED') {
              throw error
            }

            const choices = teamChoicesFromMeta(error.meta)

            let team = choices[0].value
            if (choices.length > 1) {
              team = await prompts.select({
                message: 'Select team',
                choices
              }, {
                input: process.stdin,
                output: process.stderr
              })
            }

            await new PostArmorUp(hostname, token, devicePublicKey, publicKey, privateKey, team).run()
          }

          // don't set keysSrc (in armor)
        }
      }

      // TODO: encrypted value
      if (!!noEncrypt) {
        const before = row.envSrc
        row.envSrc = upsert(row.envSrc, key, value)
        if (row.envSrc !== before) {
          row.changed = true
        }
      } else {
        const encryptedValue = encrypt(publicKey, value)
        row.envSrc = upsert(row.envSrc, key, encryptedValue)
        row.changed = true
      }

      if (row.changed) {
        changedFilepaths.push(envFilepath)
      } else {
        unchangedFilepaths.push(envFilepath)
      }
    } catch (error) {
      row.error = error
    }

    processedEnvs.push(row)
  }

  return {
    keysSrc,
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  }

  //if (env.error) {
  //  row.error = env.error
  //  processedEnvs.push(row)
  //  continue
  //}

  //try {
  //  row.originalValue = finalValueForKey(row.envSrc, row.key)
  //  if (env.seededWithInitialKey) {
  //    row.originalValue = null
  //  }

  //  const wasPlainText = !encrypted(row.originalValue)

  //  if (shouldEncrypt) {
  //    if (env.privateKeyValue && row.originalValue) {
  //      row.originalValue = decryptKeyValue(row.key, row.originalValue, env.privateKeyName, env.privateKeyValue)
  //    }

  //    row.publicKey = env.publicKeyValue
  //    row.privateKey = env.privateKeyValue
  //    row.privateKeyName = env.privateKeyName

  //    try {
  //      row.encryptedValue = encrypt(row.publicKey, row.value)
  //    } catch {
  //      throw new Errors({ publicKeyName: env.publicKeyName, publicKey: row.publicKey }).invalidPublicKey()
  //    }
  //  }

  //  const goingFromPlainTextToEncrypted = wasPlainText && shouldEncrypt
  //  const valueChanged = row.value !== row.originalValue
  //  const duplicateKey = allValuesForKey(row.envSrc, row.key).length > 1
  //  const shouldPersistSeededPlainValue = env.seededWithInitialKey && !shouldEncrypt

  //  if (shouldPersistSeededPlainValue) {
  //    row.changed = true
  //    changedFilepaths.push(envFilepath)
  //  } else if (goingFromPlainTextToEncrypted || valueChanged || duplicateKey) {
  //    row.envSrc = upsert(row.envSrc, row.key, row.encryptedValue || row.value)
  //    row.changed = true
  //    changedFilepaths.push(envFilepath)
  //  } else {
  //    unchangedFilepaths.push(envFilepath)
  //  }
}

module.exports = setTransform
