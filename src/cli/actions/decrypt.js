const fsx = require('./../../lib/helpers/fsx')
const path = require('path')
const { logger } = require('./../../shared/logger')

const decryptTransform = require('./../../lib/transforms/decrypt')
const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')
const normalizeArmorAliases = require('./normalizeArmorAliases')
const detectEncoding = require('../../lib/helpers/detectEncoding')
const Errors = require('../../lib/helpers/errors')
const keynames = require('../../lib/conventions/keynames')
const { determine } = require('../../lib/helpers/envResolution')
const { keyValues } = require('../../lib/helpers/keyResolution')

const TYPE_ENV_FILE = 'envFile'

async function decrypt (envs = [], key = [], excludeKey = [], envKeysFilepath = null, noArmor = false, options = {}) {
  const inputs = []

  for (const env of determine(envs, process.env)) {
    if (env.type !== TYPE_ENV_FILE) {
      continue
    }

    const envFilepath = env.value
    const filepath = path.resolve(envFilepath)
    const row = {
      type: TYPE_ENV_FILE,
      filepath,
      envFilepath
    }

    try {
      const encoding = await detectEncoding(filepath)
      row.envSrc = await fsx.readFileX(filepath, { encoding })

      const { privateKeyName } = keynames(envFilepath)
      const { privateKeyValue } = await keyValues(envFilepath, {
        keysFilepath: envKeysFilepath,
        noArmor,
        command: options.command
      })

      row.privateKeyName = privateKeyName
      row.privateKeyValue = privateKeyValue
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
  const result = await decryptTransform({
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

async function decryptAction () {
  const options = normalizeArmorAliases(this.opts())
  const spinner = await createSpinner({ ...options, text: 'decrypting' })

  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs
  const sesh = new Session()
  const noArmor = options.armor === false || (await sesh.noArmor())

  let errorCount = 0

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    if (spinner) spinner.stop()
    const {
      processedEnvs
    } = await decrypt(envs, options.key, options.excludeKey, options.envKeysFile, noArmor, {
      command: process.argv.slice(2)
    })
    if (spinner) spinner.stop()
    for (const processedEnv of processedEnvs) {
      if (processedEnv.error) {
        errorCount += 1
        logger.error(processedEnv.error.messageWithHelp)
      } else {
        console.log(processedEnv.envSrc)
      }
    }

    if (errorCount > 0) {
      process.exit(1)
    } else {
      process.exit(0) // exit early
    }
  } else {
    try {
      if (spinner) spinner.stop()
      const {
        processedEnvs,
        changedFilepaths,
        unchangedFilepaths
      } = await decrypt(envs, options.key, options.excludeKey, options.envKeysFile, noArmor, {
        command: process.argv.slice(2)
      })

      for (const processedEnv of processedEnvs) {
        logger.verbose(`decrypting ${processedEnv.envFilepath} (${processedEnv.filepath})`)

        if (processedEnv.error) {
          errorCount += 1
          logger.error(processedEnv.error.messageWithHelp)
        } else if (processedEnv.changed) {
          await fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)

          logger.verbose(`decrypted ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        } else {
          logger.verbose(`no change ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        }
      }

      if (spinner) spinner.stop()
      if (changedFilepaths.length > 0) {
        logger.success(`◇ decrypted (${changedFilepaths.join(',')})`)
      } else if (unchangedFilepaths.length > 0) {
        logger.info(`○ no change (${unchangedFilepaths})`)
      } else {
        // do nothing - scenario when no .env files found
      }

      if (errorCount > 0) {
        process.exit(1)
      }
    } catch (error) {
      if (spinner) spinner.stop()
      catchAndLog(error)
      process.exit(1)
    }
  }
}

module.exports = decryptAction
