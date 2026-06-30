const fsx = require('./../helpers/fsx')
const path = require('path')
const { encrypted, encrypt, scan, upsert, publickeys, keypair } = require('@dotenvx/primitives')

const TYPE_ENV_FILE = 'envFile'

const Errors = require('../helpers/errors')
const getResolver = require('./../resolvers/get')
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

async function setTransform (options = {}) {
  const envs = options.envs || []
  const key = options.key
  const value = options.value
  const fk = options.fk || '.env.keys'
  let noArmor = options.noArmor // key storage selector below
  const noCreate = options.noCreate
  const noEncrypt = !options.encrypt

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
          noArmor
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
}

module.exports = setTransform
