const fsx = require('./../../lib/helpers/fsx')
const path = require('path')
const { logger } = require('./../../shared/logger')

const encryptTransform = require('./../../lib/transforms/encrypt')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const prompts = require('../../lib/helpers/prompts')
const Session = require('../../db/session')
const normalizeArmorAliases = require('./normalizeArmorAliases')
const detectEncoding = require('../../lib/helpers/detectEncoding')
const Errors = require('../../lib/helpers/errors')
const keynames = require('../../lib/conventions/keynames')
const { determine } = require('../../lib/helpers/envResolution')
const { keyValues } = require('../../lib/helpers/keyResolution')
const { provision, provisionWithPrivateKey } = require('../../lib/helpers/cryptography')
const SAMPLE_ENV_KIT = require('../../lib/helpers/kits/sample')

const TYPE_ENV_FILE = 'envFile'

function keyStorageSelector () {
  let selected

  return async function selectKeyStorage () {
    if (selected) return selected

    selected = await prompts.select({
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
}

function encryptOptions (noArmor) {
  const options = {}

  if (!noArmor) {
    options.selectKeyStorage = keyStorageSelector()
  }

  return options
}

async function encrypt (envs = [], key = [], excludeKey = [], envKeysFilepath = null, noArmor = false, noCreate = false, token = undefined, options = {}) {
  const inputs = []

  for (const env of determine(envs, process.env)) {
    if (env.type !== TYPE_ENV_FILE) {
      continue
    }

    const envFilepath = env.value
    const filepath = path.resolve(envFilepath)
    const row = {
      keys: [],
      type: TYPE_ENV_FILE,
      filepath,
      envFilepath,
      changed: false
    }

    try {
      const fileExists = await fsx.exists(filepath)
      if (!fileExists && !noCreate) {
        row.envSrc = SAMPLE_ENV_KIT
        row.kitCreated = 'sample'
        row.changed = true
      } else {
        const encoding = await detectEncoding(filepath)
        row.envSrc = await fsx.readFileX(filepath, { encoding })
      }

      if (row.envSrc.trim().length === 0) {
        row.envSrc = SAMPLE_ENV_KIT
        row.kitCreated = 'sample'
        row.changed = true
      }

      const { publicKeyName, privateKeyName } = keynames(envFilepath)
      const { publicKeyValue, privateKeyValue } = await keyValues(envFilepath, {
        keysFilepath: envKeysFilepath,
        noArmor,
        command: options.command
      })

      let publicKey
      let privateKey

      if (!privateKeyValue && !publicKeyValue) {
        const prov = await provision({
          envSrc: row.envSrc,
          envFilepath,
          keysFilepath: envKeysFilepath,
          noArmor,
          token,
          selectKeyStorage: options.selectKeyStorage,
          command: options.command
        })
        row.envSrc = prov.envSrc
        publicKey = prov.publicKey
        privateKey = prov.privateKey
        row.localPrivateKeyAdded = prov.localPrivateKeyAdded
        row.remotePrivateKeyAdded = prov.remotePrivateKeyAdded
        row.envKeysFilepath = prov.envKeysFilepath
        row.changed = true
      } else if (privateKeyValue) {
        const prov = provisionWithPrivateKey({
          envSrc: row.envSrc,
          envFilepath,
          keysFilepath: envKeysFilepath,
          privateKeyValue,
          publicKeyValue,
          publicKeyName
        })
        row.envSrc = prov.envSrc
        publicKey = prov.publicKey
        privateKey = prov.privateKey
      } else if (publicKeyValue) {
        publicKey = publicKeyValue
      }

      row.publicKeyName = publicKeyName
      row.publicKeyValue = publicKey
      row.privateKeyName = privateKeyName
      row.privateKeyValue = privateKey
    } catch (error) {
      if (error.code === 'ENOENT') {
        row.error = new Errors({ envFilepath, filepath }).missingEnvFile()
      } else {
        row.error = error
      }
    }

    inputs.push(row)
  }

  const ready = inputs.filter(input => !input.error)
  const result = await encryptTransform({
    envs: ready,
    key,
    excludeKey
  })

  return {
    processedEnvs: inputs.map(input => {
      if (input.error) {
        return {
          keys: [],
          type: input.type,
          filepath: input.filepath,
          envFilepath: input.envFilepath,
          error: input.error
        }
      }

      return result.processedEnvs.shift()
    }),
    changedFilepaths: result.changedFilepaths,
    unchangedFilepaths: result.unchangedFilepaths
  }
}

async function encryptAction () {
  const options = normalizeArmorAliases(this.opts())
  const spinner = await createSpinner({ ...options, text: 'encrypting' })

  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs
  const sesh = new Session()
  const noArmor = options.armor === false || (!options.token && (await sesh.noArmor()))
  const noCreate = options.create === false

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    if (spinner) spinner.stop()
    const {
      processedEnvs
    } = await encrypt(envs, options.key, options.excludeKey, options.envKeysFile, noArmor, noCreate, options.token, {
      ...encryptOptions(noArmor),
      command: process.argv.slice(2)
    })
    if (spinner) spinner.stop()
    for (const processedEnv of processedEnvs) {
      console.log(processedEnv.envSrc)
    }
    process.exit(0) // exit early
  } else {
    try {
      if (spinner) spinner.stop()
      const {
        processedEnvs,
        changedFilepaths,
        unchangedFilepaths
      } = await encrypt(envs, options.key, options.excludeKey, options.envKeysFile, noArmor, noCreate, options.token, {
        ...encryptOptions(noArmor),
        command: process.argv.slice(2)
      })

      for (const processedEnv of processedEnvs) {
        logger.verbose(`encrypting ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        if (processedEnv.error) {
          logger.warn(processedEnv.error.messageWithHelp)
        } else if (processedEnv.changed) {
          await fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)

          logger.verbose(`encrypted ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        } else {
          logger.verbose(`no change ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        }
      }

      if (spinner) spinner.stop()
      if (changedFilepaths.length > 0) {
        const remoteKeyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.remotePrivateKeyAdded)
        let msg = `◈ encrypted (${changedFilepaths.join(',')})`
        if (remoteKeyAddedEnv) {
          msg += ' · armored ⛨'
        }
        logger.success(msg)
      } else if (unchangedFilepaths.length > 0) {
        logger.info(`○ no change (${unchangedFilepaths})`)
      } else {
        // do nothing - scenario when no .env files found
      }
    } catch (error) {
      if (spinner) spinner.stop()
      catchAndLog(error)
      process.exit(1)
    }
  }
}

module.exports = encryptAction
