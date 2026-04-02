const readline = require('readline')

const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const Sets = require('./../../lib/services/sets')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const localDisplayPath = require('../../lib/helpers/localDisplayPath')

function promptForValue (key) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr
    })

    const prompt = `Enter value for ${key}: `
    // mask value with '*'
    rl._writeToOutput = function () {
      process.stderr.write(`\r\x1b[K${prompt}${'*'.repeat(rl.line.length)}`)
    }

    rl.question(prompt, (answer) => {
      process.stderr.write('\n')
      rl.close()
      resolve(answer)
    })
  })
}

async function set (key, value) {
  logger.debug(`key: ${key}`)
  logger.debug(`value: ${value}`)

  if (value === undefined) {
    value = await promptForValue(key)
  }

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  // encrypt
  let encrypt = true
  if (options.plain) {
    encrypt = false
  }

  try {
    const envs = this.envs
    const envKeysFilepath = options.envKeysFile
    const opsOn = options.opsOff !== true
    const noCreate = options.create === false

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = new Sets(key, value, envs, encrypt, envKeysFilepath, opsOn, noCreate).run()

    let withEncryption = ''

    if (encrypt) {
      withEncryption = ' with encryption'
    }

    for (const processedEnv of processedEnvs) {
      logger.verbose(`setting for ${processedEnv.envFilepath}`)

      if (processedEnv.error) {
        logger.warn(processedEnv.error.messageWithHelp)
      } else {
        fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)

        logger.verbose(`${processedEnv.key} set${withEncryption} (${processedEnv.envFilepath})`)
        logger.debug(`${processedEnv.key} set${withEncryption} to ${processedEnv.value} (${processedEnv.envFilepath})`)
      }
    }

    const keyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.privateKeyAdded)
    const keyAddedSuffix = keyAddedEnv ? ` + key (${localDisplayPath(keyAddedEnv.envKeysFilepath)})` : ''

    if (changedFilepaths.length > 0) {
      if (encrypt) {
        logger.success(`◈ encrypted ${key} (${changedFilepaths.join(',')})${keyAddedSuffix}`)
      } else {
        logger.success(`◇ set ${key} (${changedFilepaths.join(',')})`)
      }
    } else if (encrypt && keyAddedEnv) {
      const keyAddedEnvFilepath = keyAddedEnv.envFilepath || changedFilepaths[0] || '.env'
      logger.success(`◈ encrypted ${key} (${keyAddedEnvFilepath})${keyAddedSuffix}`)
    } else if (unchangedFilepaths.length > 0) {
      logger.info(`○ no changes (${unchangedFilepaths})`)
    } else {
      // do nothing
    }

    // intentionally quiet: success line communicates key creation
  } catch (error) {
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = set
