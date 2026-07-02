const fsx = require('./../helpers/fsx')
const path = require('path')
const { encrypted, encrypt, scan, upsert, publickeys, keypair } = require('@dotenvx/primitives')

const TYPE_ENV_FILE = 'envFile'
const SAMPLE_ENV_KIT = require('../helpers/kits/sample')

const Errors = require('../helpers/errors')
const { determine } = require('./../helpers/envResolution')
const detectEncoding = require('./../helpers/detectEncoding')
const { isDotenvPublicKey, isPlainKey, mutateSrc, mutateKeysSrc } = require('../helpers/cryptography')
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

async function encryptTransform (options = {}) {
  const envs = options.envs || []
  const ik = options.ik
  const ek = options.ek
  const fk = options.fk || '.env.keys'
  let noArmor = options.noArmor // key storage selector below
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
          const mutated = mutateKeysSrc({ keysSrc, privateKeyName, privateKeyValue: privateKey, comment })
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
